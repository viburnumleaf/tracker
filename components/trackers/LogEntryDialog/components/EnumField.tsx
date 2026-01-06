import { JsonSchemaProperty, Tracker } from "@/src/api/trackers/trackers.api";
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CustomInputState } from "../types";
import { useUpdateTracker } from "@/src/features/trackers/hooks";
import { useAdminMode } from "@/src/features/auth/hooks";

type EnumFieldProps = {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  errors: string[];
  isRequired: boolean;
  customEnumValues: string[];
  customInputState: CustomInputState;
  tracker: Tracker | null;
  onUpdateField: (key: string, value: unknown) => void;
  onSetCustomEnumValues: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  onSetCustomInputStates: React.Dispatch<
    React.SetStateAction<Record<string, CustomInputState>>
  >;
}

export const EnumField = ({
  fieldKey,
  prop,
  value,
  errors,
  isRequired,
  customEnumValues,
  customInputState,
  tracker,
  onUpdateField,
  onSetCustomEnumValues,
  onSetCustomInputStates,
}: EnumFieldProps) => {
  const isAdminMode = useAdminMode();
  const updateTrackerMutation = useUpdateTracker();
  const allOptions = [...(prop.enum || []), ...customEnumValues];
  const currentValue = String(value || "");
  const schemaEnumValues = prop.enum || [];

  const handleAddCustomValue = (newValue: string) => {
    if (newValue.trim() && !allOptions.includes(newValue.trim())) {
      onSetCustomEnumValues((prev) => ({
        ...prev,
        [fieldKey]: [...(prev[fieldKey] || []), newValue.trim()],
      }));
    }
    // Автоматично обираємо нове значення
    onUpdateField(fieldKey, newValue.trim());
    onSetCustomInputStates((prev) => ({
      ...prev,
      [fieldKey]: { show: false, value: "" },
    }));
  };

  const handleRemoveEnumValue = async (enumValue: string) => {
    if (!tracker || !isAdminMode) return;

    // Очищаємо значення поля, якщо воно дорівнює видаленому enum значенню
    if (currentValue === enumValue) {
      onUpdateField(fieldKey, "");
    }

    // Оновлюємо схему трекера, видаляючи enum значення
    const updatedSchema = {
      ...tracker.schema,
      properties: {
        ...tracker.schema.properties,
        [fieldKey]: {
          ...tracker.schema.properties[fieldKey],
          enum: schemaEnumValues.filter((v) => v !== enumValue),
        },
      },
    };

    try {
      await updateTrackerMutation.mutateAsync({
        trackerId: tracker._id,
        data: { schema: updatedSchema },
      });
    } catch (error) {
      console.error("Failed to remove enum value:", error);
    }
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
              <SelectItem value="__custom__">+ Add new value</SelectItem>
            </SelectContent>
          </Select>
          {isAdminMode && schemaEnumValues.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-muted-foreground">Enum values:</div>
              <div className="flex flex-wrap gap-1">
                {schemaEnumValues.map((enumValue) => (
                  <div
                    key={enumValue}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                  >
                    <span>{enumValue}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEnumValue(enumValue);
                      }}
                      className="hover:bg-destructive/20 rounded p-0.5"
                      disabled={updateTrackerMutation.isPending}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                placeholder="Enter new value"
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
                className="h-auto"
                onClick={() => {
                  if (customInputState.value.trim()) {
                    handleAddCustomValue(customInputState.value);
                  }
                }}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-auto"
                size="sm"
                onClick={() => {
                  onSetCustomInputStates((prev) => ({
                    ...prev,
                    [fieldKey]: { show: false, value: "" },
                  }));
                }}
              >
                Cancel
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
