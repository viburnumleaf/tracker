import { useMemo } from "react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LinkedTrackerInfo } from "../types";

interface UseLinkedTrackersProps {
  tracker: Tracker | null;
  trackers: Tracker[];
  isAdminMode: boolean;
}

export function useLinkedTrackers({
  tracker,
  trackers,
  isAdminMode,
}: UseLinkedTrackersProps): LinkedTrackerInfo[] | null {
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
      // Старий спосіб: поле з createLinkedLog (додаємо тільки якщо немає nested object)
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

      // Новий спосіб: вкладений об'єкт з dependsOn
      if (
        fieldSchema.type === "object" &&
        fieldSchema.dependsOn
      ) {
        const dependsOnProp = properties[fieldSchema.dependsOn];
        let linkedTracker: Tracker | null = null;
        let linkedTrackerName: string;

        // Спочатку спробуємо знайти через createLinkedLog на dependsOn полі
        if (dependsOnProp?.createLinkedLog?.trackerName) {
          // Normalize tracker name from schema to match database format
          const trackerName = dependsOnProp.createLinkedLog.trackerName
            .toLowerCase()
            .replace(/\s+/g, "_");
          
          // Find tracker by exact name match (tracker names in DB are already normalized)
          linkedTracker = trackers.find((t) => t.name === trackerName) || null;
          
          linkedTrackerName = dependsOnProp.createLinkedLog.trackerName;
        } else {
          // Fallback: Якщо createLinkedLog немає, спробуємо знайти трекер за назвою поля (наприклад, "peeLog" -> "pee")
          const normalizedFieldName = fieldName
            .toLowerCase()
            .replace(/log$/, "") // Видаляємо "log" з кінця
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
          // Якщо трекер не знайдено, але є createLinkedLog, все одно показуємо зв'язок
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
