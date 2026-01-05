import { FormFieldProps } from "../types";
import { shouldShowField, isFieldRequired } from "../utils";
import { InputField } from "./InputField";
import { inputRegistry } from "@/src/lib/input-registry";
import { NestedObjectField } from "./NestedObjectField";
import { DynamicArrayField } from "./DynamicArrayField";
import { EnumField } from "./EnumField";

export function FormFieldRenderer(props: FormFieldProps) {
  const {
    fieldKey,
    prop,
    value,
    formData,
    fieldErrors,
    customEnumValues,
    customInputStates,
    tracker,
    onUpdateField,
    onSetCustomEnumValues,
    onSetCustomInputStates,
  } = props;
  
  // Перевірка залежності поля від іншого поля
  if (!shouldShowField(prop, formData)) {
    return null;
  }

  const isRequired = isFieldRequired(fieldKey, prop, tracker);
  const errors = fieldErrors[fieldKey] || [];
  const inputType = prop.inputType;
  const fallbackType = prop.fallbackInputType || "text";

  // Перевіряємо inputType ПЕРЕД усіма перевірками типу поля
  // Для enum полів також перевіряємо inputType (наприклад emotion-slider)
  if (inputType && !prop.dynamicCount) {
    const customRenderer = inputRegistry.get(inputType, fallbackType);
    if (customRenderer) {
      return (
        <InputField
          key={fieldKey}
          fieldKey={fieldKey}
          prop={prop}
          value={value}
          errors={errors}
          isRequired={isRequired}
          renderCustomInput={() =>
            customRenderer({
              value,
              onChange: (val: unknown) => onUpdateField(fieldKey, val),
              schema: prop,
              label: prop.title || fieldKey,
            })
          }
        />
      );
    }
  }

  // Обробка динамічних полів (масиви, які залежать від іншого поля)
  if (prop.dynamicCount && prop.type === "array") {
    return (
      <DynamicArrayField
        key={fieldKey}
        fieldKey={fieldKey}
        prop={prop}
        value={value}
        formData={formData}
        errors={errors}
        isRequired={isRequired}
        tracker={tracker}
        onUpdateField={onUpdateField}
      />
    );
  }

  // Обробка enum полів (тільки якщо немає кастомного inputType)
  if (prop.enum && prop.type === "string" && !inputType) {
    return (
      <EnumField
        key={fieldKey}
        fieldKey={fieldKey}
        prop={prop}
        value={value}
        errors={errors}
        isRequired={isRequired}
        customEnumValues={customEnumValues[fieldKey] || []}
        customInputState={customInputStates[fieldKey] || { show: false, value: "" }}
        tracker={tracker}
        onUpdateField={onUpdateField}
        onSetCustomEnumValues={onSetCustomEnumValues}
        onSetCustomInputStates={onSetCustomInputStates}
      />
    );
  }

  // Обробка вкладених об'єктів
  if (prop.type === "object" && (prop.properties !== undefined || prop.dependsOn)) {
    return (
      <NestedObjectField
        key={fieldKey}
        fieldKey={fieldKey}
        prop={prop}
        value={value}
        formData={formData}
        errors={errors}
        isRequired={isRequired}
        tracker={tracker}
        allTrackers={props.allTrackers}
        fieldErrors={fieldErrors}
        customEnumValues={customEnumValues}
        customInputStates={customInputStates}
        onUpdateField={onUpdateField}
        onSetCustomEnumValues={onSetCustomEnumValues}
        onSetCustomInputStates={onSetCustomInputStates}
      />
    );
  }

  // Обробка стандартних типів полів
  return (
    <InputField
      key={fieldKey}
      fieldKey={fieldKey}
      prop={prop}
      value={value}
      errors={errors}
      isRequired={isRequired}
      onUpdateField={onUpdateField}
    />
  );
}
