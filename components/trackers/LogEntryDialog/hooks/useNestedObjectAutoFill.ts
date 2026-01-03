import { useEffect, useRef } from "react";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { LogEntryFormData } from "../types";
import { getDefaultValue } from "../utils";

interface UseNestedObjectAutoFillProps {
  tracker: Tracker | null;
  formData: LogEntryFormData;
  allTrackers: Tracker[];
  onUpdateField: (key: string, value: unknown) => void;
}

/**
 * Автоматично заповнює вкладені об'єкти на основі dataMapping з createLinkedLog
 * Також ініціалізує вкладені об'єкти зі схемами зі зв'язаних трекерів
 */
export function useNestedObjectAutoFill({
  tracker,
  formData,
  allTrackers,
  onUpdateField,
}: UseNestedObjectAutoFillProps) {
  // Використовуємо ref для відстеження ініціалізованих об'єктів, щоб уникнути нескінченних циклів
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
      // Перевіряємо, чи це вкладений об'єкт з dependsOn
      if (prop.type === "object" && prop.dependsOn) {
        const dependsOnValue = formData[prop.dependsOn];
        const lastDependsOnValue = lastDependsOnValuesRef.current[key];

        // Якщо залежне поле активне
        if (
          dependsOnValue &&
          dependsOnValue !== false &&
          dependsOnValue !== ""
        ) {
          const parentProp = properties[prop.dependsOn];
          const currentObjectValue = (formData[key] as Record<string, unknown>) || {};
          let objectValue = { ...currentObjectValue };
          let shouldUpdateObject = false;

          // Перевіряємо, чи змінилося значення dependsOn поля
          const dependsOnChanged = lastDependsOnValue !== dependsOnValue;
          
          // Якщо properties порожній, спробуємо завантажити схему зі зв'язаного трекера
          if (!prop.properties || Object.keys(prop.properties).length === 0) {
            if (parentProp?.createLinkedLog?.trackerName) {
              // Ініціалізуємо тільки якщо ще не ініціалізували або dependsOn змінилося
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
                  // Ініціалізуємо об'єкт з дефолтними значеннями зі схеми зв'язаного трекера
                  const linkedProperties = linkedTracker.schema.properties;
                  const initializedObject: Record<string, unknown> = {};
                  
                  for (const [nestedKey, nestedProp] of Object.entries(linkedProperties)) {
                    // Якщо значення вже є, використовуємо його, інакше ініціалізуємо
                    if (objectValue[nestedKey] === undefined) {
                      initializedObject[nestedKey] = getDefaultValue(nestedProp);
                      shouldUpdateObject = true;
                    } else {
                      initializedObject[nestedKey] = objectValue[nestedKey];
                    }
                  }
                  
                  // Оновлюємо objectValue для подальшої обробки
                  if (shouldUpdateObject) {
                    objectValue = initializedObject;
                    initializedObjectsRef.current.add(key);
                  }
                }
              }
            }
          }

          // Перевіряємо, чи є createLinkedLog з dataMapping для автозаповнення
          if (parentProp?.createLinkedLog?.dataMapping) {
            const mapping = parentProp.createLinkedLog.dataMapping;

            for (const [targetField, sourceField] of Object.entries(mapping)) {
              const sourceValue = formData[sourceField];
              const currentTargetValue = objectValue[targetField];
              
              // Заповнюємо поле, якщо воно порожнє або не встановлене, і sourceValue існує
              if (
                sourceValue !== undefined &&
                sourceValue !== null &&
                sourceValue !== "" &&
                (currentTargetValue === undefined || currentTargetValue === null || currentTargetValue === "")
              ) {
                // Копіюємо значення як є (datetime-local формат)
                // Конвертація в ISO буде виконана при submit через convertFormDataToISO
                objectValue[targetField] = sourceValue;
                shouldUpdateObject = true;
              }
            }
          }

          // Оновлюємо поле один раз, якщо були зміни
          if (shouldUpdateObject) {
            onUpdateField(key, objectValue);
          }

          // Зберігаємо поточне значення dependsOn
          lastDependsOnValuesRef.current[key] = dependsOnValue;
        } else {
          // Якщо dependsOn стало false, очищаємо ініціалізацію
          initializedObjectsRef.current.delete(key);
          delete lastDependsOnValuesRef.current[key];
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, tracker?._id, allTrackers, onUpdateField]);
}
