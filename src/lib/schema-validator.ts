import Ajv from "ajv";
import addFormats from "ajv-formats";
import { JsonSchema, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Очищує JSON Schema від кастомних полів (dynamicCount, inputType, fallbackInputType)
 * перед валідацією, оскільки вони використовуються тільки для UI
 * Також об'єднує кастомні enum значення з оригінальними enum значеннями
 */
const cleanSchemaForValidation = (
  schema: JsonSchema,
  customEnumValues?: Record<string, string[]>
): JsonSchema => {
  const cleanProperty = (prop: JsonSchemaProperty, fieldKey?: string): JsonSchemaProperty => {
    const cleaned: JsonSchemaProperty = {
      type: prop.type,
    };

    // Стандартні JSON Schema поля
    if (prop.title !== undefined) cleaned.title = prop.title;
    if (prop.description !== undefined) cleaned.description = prop.description;
    if (prop.enum !== undefined) {
      // Об'єднуємо оригінальні enum значення з кастомними
      const originalEnum = prop.enum || [];
      const customEnum = (fieldKey && customEnumValues?.[fieldKey]) || [];
      // Об'єднуємо масиви, прибираючи дублікати
      const mergedEnum = Array.from(new Set([...originalEnum, ...customEnum]));
      cleaned.enum = mergedEnum;
    }
    if (prop.default !== undefined) cleaned.default = prop.default;
    // Пропускаємо валідацію формату time, оскільки HTML5 time input повертає HH:MM:SS
    // без timezone offset, а ajv-formats v3+ вимагає RFC 3339 формат з timezone
    if (prop.format !== undefined && prop.format !== "time") {
      cleaned.format = prop.format;
    }
    if (prop.required !== undefined) cleaned.required = prop.required;
    if (prop.minimum !== undefined) cleaned.minimum = prop.minimum;
    if (prop.maximum !== undefined) cleaned.maximum = prop.maximum;

    // Рекурсивно очищаємо вкладені структури
    if (prop.items) {
      cleaned.items = cleanProperty(prop.items);
    }
    if (prop.properties) {
      cleaned.properties = {};
      for (const [key, value] of Object.entries(prop.properties)) {
        // Для вкладених полів, перевіряємо кастомні enum значення для повного шляху
        const nestedFieldKey = fieldKey ? `${fieldKey}.${key}` : key;
        cleaned.properties[key] = cleanProperty(value, nestedFieldKey);
      }
    }

    return cleaned;
  };

  const cleaned: JsonSchema = {
    type: "object",
    properties: {},
  };

  if (schema.required) {
    cleaned.required = schema.required;
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    cleaned.properties[key] = cleanProperty(prop, key);
  }

  return cleaned;
}

/**
 * Валідує дані проти JSON Schema
 * @param schema - JSON Schema з трекера
 * @param data - Дані для валідації
 * @param customEnumValues - Кастомні enum значення, які потрібно додати до схеми
 * @returns Об'єкт з isValid та errors
 */
export const validateAgainstSchema = (
  schema: JsonSchema,
  data: Record<string, unknown>,
  customEnumValues?: Record<string, string[]>
): { isValid: boolean; errors: string[]; fieldErrors?: Record<string, string[]> } => {
  try {
    // Очищуємо схему від кастомних полів та об'єднуємо кастомні enum значення
    const cleanSchema = cleanSchemaForValidation(schema, customEnumValues);

    // Компілюємо валідатор
    const validate = ajv.compile(cleanSchema);

    // Валідуємо дані
    const valid = validate(data);

    if (!valid && validate.errors) {
      const errors = validate.errors.map((error) => {
        const path = error.instancePath || error.schemaPath;
        const field = error.params?.missingProperty 
          ? `${path}/${error.params.missingProperty}`
          : path || "root";
        
        return `${field}: ${error.message}`;
      });

      // Створюємо мапу помилок по полям для легкого доступу
      const fieldErrors: Record<string, string[]> = {};
      
      validate.errors.forEach((error) => {
        let fieldKey = "";
        let errorMessage = error.message || "Validation error";
        
        // Обробка помилок required
        if (error.keyword === "required" && error.params?.missingProperty) {
          const missingProperty = error.params.missingProperty;
          // Якщо помилка в вкладеному об'єкті, instancePath містить шлях до батьківського об'єкта
          if (error.instancePath) {
            // Для вкладених об'єктів: /peeLog -> peeLog.time
            const parentPath = error.instancePath.replace(/^\//, "");
            fieldKey = parentPath ? `${parentPath}.${missingProperty}` : missingProperty;
          } else {
            fieldKey = missingProperty;
          }
          errorMessage = "This field is required";
        } else if (error.instancePath) {
          // Помилка для конкретного поля: /time, /peeLog/time, /category, /satisfaction/0
          // Конвертуємо шлях у формат з крапкою для вкладених полів
          fieldKey = error.instancePath.replace(/^\//, "").replace(/\//g, ".");
        }
        
        if (fieldKey) {
          if (!fieldErrors[fieldKey]) {
            fieldErrors[fieldKey] = [];
          }
          // Додаємо помилку тільки якщо її ще немає
          if (!fieldErrors[fieldKey].includes(errorMessage)) {
            fieldErrors[fieldKey].push(errorMessage);
          }
        }
      });

      return {
        isValid: false,
        errors,
        fieldErrors,
      };
    }

    return {
      isValid: true,
      errors: [],
      fieldErrors: {},
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        error instanceof Error 
          ? `Validation error: ${error.message}` 
          : "Unknown validation error",
      ],
      fieldErrors: {},
    };
  }
}
