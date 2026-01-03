import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { LogEntryFormData } from "./types";

/**
 * Конвертує ISO 8601 значення в datetime-local формат для відображення
 * datetime-local input працює з локальним часом, тому потрібно конвертувати UTC ISO назад
 */
export function convertISOToDateTimeLocal(value: unknown): string {
  if (typeof value === "string") {
    // Якщо це вже datetime-local формат (YYYY-MM-DDTHH:mm), повертаємо як є
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return value;
    }
    
    // Якщо це ISO формат, конвертуємо в локальний час
    const isISO =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(
        value
      );
    
    if (isISO) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Отримуємо локальний час у форматі YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }
  }
  return String(value || "");
}

/**
 * Конвертує datetime-local значення в ISO 8601 формат (UTC)
 * datetime-local input повертає локальний час, потрібно конвертувати в UTC
 */
export function convertDateTimeLocal(value: unknown): unknown {
  if (typeof value === "string") {
    const isDateTimeLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
    const isISO =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(
        value
      );

    // Якщо це datetime-local (без часової зони), конвертуємо в UTC ISO
    if (isDateTimeLocal && !isISO) {
      // new Date() інтерпретує datetime-local як локальний час і автоматично конвертує в UTC
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Якщо вже ISO, повертаємо як є
    if (isISO) {
      return value;
    }
  }
  return value;
}

/**
 * Конвертує time значення з формату HH:MM в HH:MM:SS
 * HTML5 time input повертає HH:MM, а JSON Schema очікує HH:MM:SS
 */
export function convertTime(value: unknown): unknown {
  if (typeof value === "string") {
    // Перевіряємо, чи це формат HH:MM (без секунд)
    const timePattern = /^(\d{2}):(\d{2})$/;
    const match = value.match(timePattern);
    if (match) {
      // Додаємо секунди: HH:MM -> HH:MM:00
      return `${value}:00`;
    }
  }
  return value;
}

/**
 * Конвертує всі datetime-local значення в формі в ISO формат
 */
export function convertFormDataToISO(
  formData: LogEntryFormData,
  properties: Record<string, JsonSchemaProperty>
): LogEntryFormData {
  const convertedData = { ...formData };

  // Конвертуємо поля верхнього рівня
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.format === "date-time" && convertedData[key]) {
      convertedData[key] = convertDateTimeLocal(convertedData[key]);
    } else if (prop.format === "time" && convertedData[key]) {
      convertedData[key] = convertTime(convertedData[key]);
    }

    // Конвертуємо поля в вкладених об'єктах
    if (prop.type === "object" && prop.properties) {
      const objectValue = convertedData[key] as
        | Record<string, unknown>
        | undefined;
      if (objectValue && typeof objectValue === "object") {
        const convertedObject: Record<string, unknown> = {};
        for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
          if (nestedProp.format === "date-time" && objectValue[nestedKey]) {
            convertedObject[nestedKey] = convertDateTimeLocal(
              objectValue[nestedKey]
            );
          } else if (nestedProp.format === "time" && objectValue[nestedKey]) {
            convertedObject[nestedKey] = convertTime(objectValue[nestedKey]);
          } else {
            convertedObject[nestedKey] = objectValue[nestedKey];
          }
        }
        convertedData[key] = convertedObject;
      }
    }
  }

  return convertedData;
}

/**
 * Видаляє вкладені об'єкти, якщо їх dependsOn поле вимкнено
 */
export function filterDisabledNestedObjects(
  formData: LogEntryFormData,
  properties: Record<string, JsonSchemaProperty>
): LogEntryFormData {
  const finalData = { ...formData };
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.type === "object" && prop.properties && prop.dependsOn) {
      const dependsOnValue = finalData[prop.dependsOn];
      if (
        !dependsOnValue ||
        dependsOnValue === false ||
        dependsOnValue === ""
      ) {
        delete finalData[key];
      }
    }
  }
  return finalData;
}

/**
 * Ініціалізує значення за замовчуванням для поля
 */
export function getDefaultValue(prop: JsonSchemaProperty): unknown {
  if (prop.default !== undefined) {
    return prop.default;
  }

  if (prop.format === "date-time" || prop.format === "date") {
    const now = new Date();
    if (prop.format === "date-time") {
      // datetime-local працює з локальним часом, тому конвертуємо поточний час в локальний формат
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } else if (prop.format === "date") {
      // date також працює з локальною датою
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  if (prop.type === "array") {
    return [];
  }

  if (prop.type === "object" && prop.properties) {
    const nestedObject: Record<string, unknown> = {};
    for (const [nestedKey, nestedProp] of Object.entries(prop.properties)) {
      nestedObject[nestedKey] = getDefaultValue(nestedProp);
    }
    return nestedObject;
  }

  if (prop.type === "boolean") {
    return false;
  }

  if (prop.type === "number") {
    return 0;
  }

  return "";
}

/**
 * Ініціалізує форму з дефолтними значеннями
 */
export function initializeFormData(
  properties: Record<string, JsonSchemaProperty>
): LogEntryFormData {
  const initialData: LogEntryFormData = {};

  for (const [key, prop] of Object.entries(properties)) {
    initialData[key] = getDefaultValue(prop);
  }

  // Ініціалізуємо динамічні масиви на основі значень полів
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.dynamicCount && prop.type === "array") {
      const countField = prop.dynamicCount;
      const count =
        typeof initialData[countField] === "number"
          ? (initialData[countField] as number)
          : 0;
      const itemSchema = prop.items;
      const defaultValue = itemSchema
        ? getDefaultValue(itemSchema)
        : "";

      initialData[key] = Array.from({ length: count }, () => defaultValue);
    }
  }

  return initialData;
}

/**
 * Перевіряє, чи поле має показуватися (перевірка dependsOn)
 */
export function shouldShowField(
  prop: JsonSchemaProperty,
  formData: LogEntryFormData
): boolean {
  if (prop.dependsOn) {
    const dependsOnValue = formData[prop.dependsOn];
    return !!(
      dependsOnValue &&
      dependsOnValue !== false &&
      dependsOnValue !== ""
    );
  }
  return true;
}

/**
 * Визначає, чи поле є обов'язковим
 */
export function isFieldRequired(
  key: string,
  prop: JsonSchemaProperty,
  tracker: { schema: { required?: string[]; properties?: Record<string, JsonSchemaProperty> } } | null
): boolean {
  if (key.includes(".")) {
    const [parentKey, nestedKey] = key.split(".");
    const parentProp = tracker?.schema.properties?.[parentKey];
    if (parentProp?.type === "object" && parentProp.required) {
      return parentProp.required.includes(nestedKey);
    }
  } else {
    return (
      (tracker?.schema.required?.includes(key) ?? false) ||
      (prop.required?.includes(key) ?? false)
    );
  }
  return false;
}
