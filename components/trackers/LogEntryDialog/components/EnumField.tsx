import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomInputState } from "../types";

interface EnumFieldProps {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  errors: string[];
  isRequired: boolean;
  customEnumValues: string[];
  customInputState: CustomInputState;
  onUpdateField: (key: string, value: unknown) => void;
  onSetCustomEnumValues: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  onSetCustomInputStates: React.Dispatch<
    React.SetStateAction<Record<string, CustomInputState>>
  >;
}

export function EnumField({
  fieldKey,
  prop,
  value,
  errors,
  isRequired,
  customEnumValues,
  customInputState,
  onUpdateField,
  onSetCustomEnumValues,
  onSetCustomInputStates,
}: EnumFieldProps) {
  const allOptions = [...(prop.enum || []), ...customEnumValues];
  const currentValue = String(value || "");

  const handleAddCustomValue = (newValue: string) => {
    if (newValue.trim() && !allOptions.includes(newValue.trim())) {
      onSetCustomEnumValues((prev) => ({
        ...prev,
        [fieldKey]: [...(prev[fieldKey] || []), newValue.trim()],
      }));
    }
    onUpdateField(fieldKey, newValue.trim());
    onSetCustomInputStates((prev) => ({
      ...prev,
      [fieldKey]: { show: false, value: "" },
    }));
  };

  return (
    <Field key={fieldKey}>
      <FieldLabel>
        {prop.title || fieldKey}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <FieldContent>
        <div className="space-y-2">
          <Select
            value={currentValue || ""}
            onValueChange={(val) => {
              if (val === "__custom__") {
                onSetCustomInputStates((prev) => ({
                  ...prev,
                  [fieldKey]: { show: true, value: "" },
                }));
              } else {
                onUpdateField(fieldKey, val);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${prop.title || fieldKey}`} />
            </SelectTrigger>
            <SelectContent>
              {allOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="__custom__">+ Додати нове значення</SelectItem>
            </SelectContent>
          </Select>
          {customInputState.show && (
            <div className="flex gap-2">
              <Input
                type="text"
                value={customInputState.value}
                onChange={(e) => {
                  onSetCustomInputStates((prev) => ({
                    ...prev,
                    [fieldKey]: { show: true, value: e.target.value },
                  }));
                }}
                placeholder="Введіть нове значення"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInputState.value.trim()) {
                    handleAddCustomValue(customInputState.value);
                  }
                  if (e.key === "Escape") {
                    onSetCustomInputStates((prev) => ({
                      ...prev,
                      [fieldKey]: { show: false, value: "" },
                    }));
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (customInputState.value.trim()) {
                    handleAddCustomValue(customInputState.value);
                  }
                }}
              >
                Додати
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSetCustomInputStates((prev) => ({
                    ...prev,
                    [fieldKey]: { show: false, value: "" },
                  }));
                }}
              >
                Скасувати
              </Button>
            </div>
          )}
        </div>
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
