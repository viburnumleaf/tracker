import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LogEntryFormData } from "../types";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { InputField } from "./InputField";
import { inputRegistry } from "@/src/lib/input-registry";

type DynamicArrayFieldProps = {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  formData: LogEntryFormData;
  errors: string[];
  isRequired: boolean;
  tracker: Tracker | null;
  onUpdateField: (key: string, value: unknown) => void;
}

export const DynamicArrayField = ({
  fieldKey,
  prop,
  value,
  formData,
  errors,
  isRequired,
  tracker,
  onUpdateField,
}: DynamicArrayFieldProps) => {
  const countField = prop.dynamicCount!;
  const count =
    typeof formData[countField] === "number"
      ? (formData[countField] as number)
      : 0;

  const arrayValue = (value as unknown[]) || [];
  const itemSchema = prop.items;

  return (
    <Field key={fieldKey}>
      <FieldLabel>
        {prop.title || fieldKey}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <FieldContent>
        <div className="space-y-3">
          {count > 0 &&
            Array.from({ length: count }, (_, index) => {
              const itemValue =
                arrayValue[index] ??
                (itemSchema?.default !== undefined
                  ? itemSchema.default
                  : itemSchema?.type === "number"
                  ? 0
                  : itemSchema?.type === "boolean"
                  ? false
                  : "");

              const inputType = prop.inputType || itemSchema?.inputType;
              const fallbackType =
                prop.fallbackInputType ||
                itemSchema?.fallbackInputType ||
                "number";

              const customRenderer = inputType
                ? inputRegistry.get(inputType, fallbackType)
                : null;

              return (
                <div key={index} className="space-y-2">
                  <Label className="text-xs">
                    {prop.title || fieldKey} #{index + 1}
                  </Label>
                  {customRenderer ? (
                    <InputField
                      fieldKey={`${fieldKey}[${index}]`}
                      prop={itemSchema || prop}
                      value={itemValue}
                      errors={[]}
                      isRequired={false}
                      onUpdateField={(_, newValue) => {
                        const newArray = [...arrayValue];
                        newArray[index] = newValue;
                        onUpdateField(fieldKey, newArray);
                      }}
                      renderCustomInput={() =>
                        customRenderer({
                          value: itemValue,
                          onChange: (newValue: unknown) => {
                            const newArray = [...arrayValue];
                            newArray[index] = newValue;
                            onUpdateField(fieldKey, newArray);
                          },
                          schema: itemSchema || prop,
                          label: `${prop.title || fieldKey} #${index + 1}`,
                        })
                      }
                    />
                  ) : (
                    <InputField
                      fieldKey={`${fieldKey}[${index}]`}
                      prop={itemSchema || prop}
                      value={itemValue}
                      errors={[]}
                      isRequired={false}
                      onUpdateField={(_, newValue) => {
                        const newArray = [...arrayValue];
                        newArray[index] = newValue;
                        onUpdateField(fieldKey, newArray);
                      }}
                    />
                  )}
                </div>
              );
            })}
          {count === 0 && (
            <p className="text-xs text-muted-foreground">
              Встановіть значення поля &quot;
              {tracker?.schema.properties?.[countField]?.title || countField}
              &quot; для відображення полів
            </p>
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
