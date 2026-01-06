import { useMemo } from "react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LinkedTrackerInfo } from "../types";

type UseLinkedTrackersProps = {
  tracker: Tracker | null;
  trackers: Tracker[];
  isAdminMode: boolean;
}

export const useLinkedTrackers = ({
  tracker,
  trackers,
  isAdminMode,
}: UseLinkedTrackersProps): LinkedTrackerInfo[] | null => {
  return useMemo(() => {
    if (!tracker || !isAdminMode) return null;

    const properties = tracker.schema.properties || {};
    const linkedFields: LinkedTrackerInfo[] = [];
    // Track which parent fields have nested objects to avoid duplicates
    const parentFieldsWithNestedObjects = new Set<string>();

    // First pass: identify nested objects (new way)
    for (const [, fieldSchema] of Object.entries(properties)) {
      if (fieldSchema.type === "object" && fieldSchema.dependsOn) {
        const dependsOnProp = properties[fieldSchema.dependsOn];
        
        // If dependsOn field has createLinkedLog, mark it as having a nested object
        if (dependsOnProp?.createLinkedLog) {
          parentFieldsWithNestedObjects.add(fieldSchema.dependsOn);
        }
      }
    }

    // Second pass: add linked tracker info
    for (const [fieldName, fieldSchema] of Object.entries(properties)) {
      // Old way: field with createLinkedLog (add only if there is no nested object)
      if (fieldSchema.createLinkedLog && !parentFieldsWithNestedObjects.has(fieldName)) {
        // Normalize tracker name from schema to match database format
        const normalizedTrackerName = fieldSchema.createLinkedLog.trackerName
          .toLowerCase()
          .replace(/\s+/g, "_");

        // Find linked tracker by exact name match (tracker names in DB are already normalized)
        const linkedTracker =
          trackers.find((t) => t.name === normalizedTrackerName) || null;

        linkedFields.push({
          fieldName,
          fieldTitle: fieldSchema.title || fieldName,
          linkedTrackerName: fieldSchema.createLinkedLog.trackerName,
          linkedTracker,
        });
      }

      // New way: nested object with dependsOn
      if (
        fieldSchema.type === "object" &&
        fieldSchema.dependsOn
      ) {
        const dependsOnProp = properties[fieldSchema.dependsOn];
        let linkedTracker: Tracker | null = null;
        let linkedTrackerName: string;

        // First try to find through createLinkedLog on the dependsOn field
        if (dependsOnProp?.createLinkedLog?.trackerName) {
          // Normalize tracker name from schema to match database format
          const trackerName = dependsOnProp.createLinkedLog.trackerName
            .toLowerCase()
            .replace(/\s+/g, "_");
          
          // Find tracker by exact name match (tracker names in DB are already normalized)
          linkedTracker = trackers.find((t) => t.name === trackerName) || null;
          
          linkedTrackerName = dependsOnProp.createLinkedLog.trackerName;
        } else {
          // Fallback: If createLinkedLog is not present, try to find tracker by field name (e.g., "peeLog" -> "pee")
          const normalizedFieldName = fieldName
            .toLowerCase()
            .replace(/log$/, "") // Remove "log" from the end
            .replace(/\s+/g, "_");

          // Find tracker by exact name match (tracker names in DB are already normalized)
          linkedTracker = trackers.find((t) => t.name === normalizedFieldName) || null;

          linkedTrackerName = normalizedFieldName.replace(/_/g, " ");
        }

        if (linkedTracker) {
          linkedFields.push({
            fieldName,
            fieldTitle: fieldSchema.title || fieldName,
            linkedTrackerName: linkedTracker.name.replace(/_/g, " "),
            linkedTracker,
          });
        } else if (dependsOnProp?.createLinkedLog) {
          // If tracker is not found, but there is createLinkedLog, still show the link
          linkedFields.push({
            fieldName,
            fieldTitle: fieldSchema.title || fieldName,
            linkedTrackerName: linkedTrackerName || dependsOnProp.createLinkedLog.trackerName,
            linkedTracker: null,
          });
        }
      }
    }

    return linkedFields.length > 0 ? linkedFields : null;
  }, [tracker, isAdminMode, trackers]);
}
