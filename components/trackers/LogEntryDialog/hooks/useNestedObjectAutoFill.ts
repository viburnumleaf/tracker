import { useEffect, useRef } from "react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LogEntryFormData } from "../types";
import { getDefaultValue } from "../utils";

type UseNestedObjectAutoFillProps = {
  tracker: Tracker | null;
  formData: LogEntryFormData;
  allTrackers: Tracker[];
  onUpdateField: (key: string, value: unknown) => void;
}

/**
 * Automatically fills nested objects based on dataMapping from createLinkedLog
 * Also initializes nested objects with schemas from linked trackers
 */
export const useNestedObjectAutoFill = ({
  tracker,
  formData,
  allTrackers,
  onUpdateField,
}: UseNestedObjectAutoFillProps) => {
  // Use ref to track initialized objects to avoid infinite loops
  const initializedObjectsRef = useRef<Set<string>>(new Set());
  const lastDependsOnValuesRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!tracker) {
      initializedObjectsRef.current.clear();
      lastDependsOnValuesRef.current = {};
      return;
    }

    const properties = tracker.schema.properties || {};

    for (const [key, prop] of Object.entries(properties)) {
      // Check if this is a nested object with dependsOn
      if (prop.type === "object" && prop.dependsOn) {
        const dependsOnValue = formData[prop.dependsOn];
        const lastDependsOnValue = lastDependsOnValuesRef.current[key];

        // If the dependent field is active
        if (
          dependsOnValue &&
          dependsOnValue !== false &&
          dependsOnValue !== ""
        ) {
          const parentProp = properties[prop.dependsOn];
          const currentObjectValue = (formData[key] as Record<string, unknown>) || {};
          let objectValue = { ...currentObjectValue };
          let shouldUpdateObject = false;

          // Check if the value of the dependsOn field has changed
          const dependsOnChanged = lastDependsOnValue !== dependsOnValue;
          
          // If properties is empty, try to load the schema from the linked tracker
          if (!prop.properties || Object.keys(prop.properties).length === 0) {
            if (parentProp?.createLinkedLog?.trackerName) {
              // Initialize only if not initialized yet or dependsOn has changed
              const isInitialized = initializedObjectsRef.current.has(key);
              
              if (!isInitialized || dependsOnChanged) {
                // Normalize tracker name from schema to match database format
                const trackerName = parentProp.createLinkedLog.trackerName
                  .toLowerCase()
                  .replace(/\s+/g, "_");
                
                // Find tracker by exact name match (tracker names in DB are already normalized)
                const linkedTracker = allTrackers.find(
                  (t) => t.name === trackerName
                );
                
                if (linkedTracker?.schema?.properties) {
                  // Initialize object with default values from the schema of the linked tracker
                  const linkedProperties = linkedTracker.schema.properties;
                  const initializedObject: Record<string, unknown> = {};
                  
                  for (const [nestedKey, nestedProp] of Object.entries(linkedProperties)) {
                    // If the value already exists, use it, otherwise initialize it
                    if (objectValue[nestedKey] === undefined) {
                      initializedObject[nestedKey] = getDefaultValue(nestedProp);
                      shouldUpdateObject = true;
                    } else {
                      initializedObject[nestedKey] = objectValue[nestedKey];
                    }
                  }
                  
                  // Update objectValue for further processing
                  if (shouldUpdateObject) {
                    objectValue = initializedObject;
                    initializedObjectsRef.current.add(key);
                  }
                }
              }
            }
          }

          // Check if there is createLinkedLog with dataMapping for auto-filling
          if (parentProp?.createLinkedLog?.dataMapping) {
            const mapping = parentProp.createLinkedLog.dataMapping;

            for (const [targetField, sourceField] of Object.entries(mapping)) {
              const sourceValue = formData[sourceField];
              const currentTargetValue = objectValue[targetField];
              
              // Fill the field if it is empty or not set, and sourceValue exists
              if (
                sourceValue !== undefined &&
                sourceValue !== null &&
                sourceValue !== "" &&
                (currentTargetValue === undefined || currentTargetValue === null || currentTargetValue === "")
              ) {
                // Copy the value as is (datetime-local format)
                // Conversion to ISO will be done at submit through convertFormDataToISO
                objectValue[targetField] = sourceValue;
                shouldUpdateObject = true;
              }
            }
          }

          // Update the field once if there were changes
          if (shouldUpdateObject) {
            onUpdateField(key, objectValue);
          }

          // Save the current value of dependsOn
          lastDependsOnValuesRef.current[key] = dependsOnValue;
        } else {
          // If dependsOn became false, clear the initialization
          initializedObjectsRef.current.delete(key);
          delete lastDependsOnValuesRef.current[key];
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, tracker?._id, allTrackers, onUpdateField]);
}
