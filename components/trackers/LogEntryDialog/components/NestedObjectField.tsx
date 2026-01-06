import { JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LogEntryFormData, FieldErrors, CustomEnumValues, CustomInputStates } from "../types";
import { Field, FieldContent, FieldLabel, FieldError } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { shouldShowField } from "../utils";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { useMemo } from "react";

type NestedObjectFieldProps = {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  formData: LogEntryFormData;
  errors: string[];
  isRequired: boolean;
  tracker: Tracker | null;
  allTrackers?: Tracker[];
  fieldErrors: FieldErrors;
  customEnumValues: CustomEnumValues;
  customInputStates: CustomInputStates;
  onUpdateField: (key: string, value: unknown) => void;
  onSetCustomEnumValues: React.Dispatch<React.SetStateAction<CustomEnumValues>>;
  onSetCustomInputStates: React.Dispatch<React.SetStateAction<CustomInputStates>>;
}

export const NestedObjectField = ({
  fieldKey,
  prop,
  value,
  formData,
  errors,
  isRequired,
  tracker,
  allTrackers = [],
  fieldErrors,
  customEnumValues,
  customInputStates,
  onUpdateField,
  onSetCustomEnumValues,
  onSetCustomInputStates,
}: NestedObjectFieldProps) => {
  // If the schema is empty, try to load the schema from the tracker through createLinkedLog
  const nestedProperties = useMemo(() => {
    const propsFromSchema = prop.properties || {};
    
    // If properties is empty and there is dependsOn, look for createLinkedLog on the dependent field
    if (Object.keys(propsFromSchema).length === 0 && prop.dependsOn && tracker) {
      const dependsOnProp = tracker.schema.properties?.[prop.dependsOn];
      if (dependsOnProp?.createLinkedLog?.trackerName) {
        // Normalize tracker name from schema to match database format
        const trackerName = dependsOnProp.createLinkedLog.trackerName
          .toLowerCase()
          .replace(/\s+/g, "_");
        
        // Find tracker by exact name match (tracker names in DB are already normalized)
        const linkedTracker = allTrackers.find((t) => t.name === trackerName);
        
        if (linkedTracker?.schema?.properties) {
          return linkedTracker.schema.properties;
        }
      }
    }
    
    return propsFromSchema;
  }, [prop.properties, prop.dependsOn, tracker, allTrackers]);

  // Check if the nested object depends on another field
  if (prop.dependsOn && !shouldShowField(prop, formData)) {
    return null;
  }

  const objectValue = (value as Record<string, unknown>) || {};

  return (
    <Field key={fieldKey}>
      <FieldLabel>
        {prop.title || fieldKey}
        {isRequired && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <FieldContent>
        <Card>
          <CardContent className="space-y-4">
            {Object.entries(nestedProperties).map(([nestedKey, nestedProp]) => {
              const nestedValue = objectValue[nestedKey];
              const nestedFieldKey = `${fieldKey}.${nestedKey}`;

              return (
                <div key={nestedKey}>
                  <FormFieldRenderer
                    key={nestedFieldKey}
                    fieldKey={nestedFieldKey}
                    prop={nestedProp as JsonSchemaProperty}
                    value={nestedValue}
                    formData={formData}
                    fieldErrors={fieldErrors}
                    customEnumValues={customEnumValues}
                    customInputStates={customInputStates}
                    tracker={tracker}
                    allTrackers={allTrackers}
                    onUpdateField={onUpdateField}
                    onSetCustomEnumValues={onSetCustomEnumValues}
                    onSetCustomInputStates={onSetCustomInputStates}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
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
