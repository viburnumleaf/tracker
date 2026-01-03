import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { convertISOToDateTimeLocal } from "../utils";

interface InputFieldProps {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  errors: string[];
  isRequired: boolean;
  onUpdateField?: (key: string, value: unknown) => void;
  renderCustomInput?: () => React.ReactNode;
}

export function InputField({
  fieldKey,
  prop,
  value,
  errors,
  isRequired,
  onUpdateField,
  renderCustomInput,
}: InputFieldProps) {
  const updateValue = (newValue: unknown) => {
    if (onUpdateField) {
      onUpdateField(fieldKey, newValue);
    }
  };

  // Якщо є кастомний рендерер, використовуємо його
  if (renderCustomInput) {
    return (
      <Field key={fieldKey}>
        <FieldLabel>
          {prop.title || fieldKey}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          {renderCustomInput()}
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
          {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
        </FieldContent>
      </Field>
    );
  }

  // Обробка різних форматів та типів
  if (prop.format === "date-time") {
    // Конвертуємо ISO значення в datetime-local формат для відображення
    const displayValue = convertISOToDateTimeLocal(value);
    
    return (
      <Field key={fieldKey}>
        <FieldLabel>
          {prop.title || fieldKey}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="datetime-local"
            value={displayValue}
            onChange={(e) => updateValue(e.target.value)}
            required={isRequired}
          />
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
          {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
        </FieldContent>
      </Field>
    );
  }

  if (prop.format === "date") {
    return (
      <Field key={fieldKey}>
        <FieldLabel>
          {prop.title || fieldKey}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="date"
            value={String(value || "")}
            onChange={(e) => updateValue(e.target.value)}
            required={isRequired}
          />
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
          {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
        </FieldContent>
      </Field>
    );
  }

  if (prop.format === "time") {
    return (
      <Field key={fieldKey}>
        <FieldLabel>
          {prop.title || fieldKey}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="time"
            value={String(value || "")}
            onChange={(e) => updateValue(e.target.value)}
            required={isRequired}
          />
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
          {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
        </FieldContent>
      </Field>
    );
  }

  if (prop.type === "number") {
    return (
      <Field key={fieldKey}>
        <FieldLabel>
          {prop.title || fieldKey}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="number"
            value={String(value ?? "")}
            onChange={(e) => {
              const numValue = e.target.value
                ? parseFloat(e.target.value)
                : undefined;
              updateValue(numValue);
            }}
            min={prop.minimum}
            max={prop.maximum}
            step="any"
            required={isRequired}
          />
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
          {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
        </FieldContent>
      </Field>
    );
  }

  if (prop.type === "boolean") {
    return (
      <Field key={fieldKey}>
        <div className="flex items-center space-x-2">
          <Switch
            id={fieldKey}
            checked={value === true}
            onCheckedChange={(checked: boolean) => updateValue(checked)}
          />
          <FieldLabel htmlFor={fieldKey} className="mb-0!">
            {prop.title || fieldKey}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
        </div>
        {prop.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {prop.description}
          </p>
        )}
        {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
      </Field>
    );
  }

  // Default: string input
  return (
    <Field key={fieldKey}>
      <FieldLabel>
        {prop.title || fieldKey}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <FieldContent>
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateValue(e.target.value)}
          required={isRequired}
          placeholder={prop.description}
        />
        {prop.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {prop.description}
          </p>
        )}
        {errors.length > 0 && <FieldError>{errors.join(", ")}</FieldError>}
      </FieldContent>
    </Field>
  );
}
