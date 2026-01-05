import { useState, useEffect, useCallback, useMemo } from "react";
import { Tracker, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";
import {
  LogEntryFormData,
  CustomEnumValues,
  CustomInputStates,
  FieldErrors,
} from "../types";
import {
  initializeFormData,
  convertFormDataToISO,
  filterDisabledNestedObjects,
  convertISOToFormData,
} from "../utils";
import { DraftEntry } from "@/src/api/drafts/drafts.api";

interface UseLogEntryFormProps {
  tracker: Tracker | null;
  open: boolean;
  draft?: DraftEntry | null;
}

interface UseLogEntryFormReturn {
  formData: LogEntryFormData;
  customEnumValues: CustomEnumValues;
  customInputStates: CustomInputStates;
  validationError: string | null;
  fieldErrors: FieldErrors;
  updateField: (key: string, value: unknown) => void;
  setValidationError: (error: string | null) => void;
  setFieldErrors: (errors: FieldErrors) => void;
  setCustomEnumValues: React.Dispatch<React.SetStateAction<CustomEnumValues>>;
  setCustomInputStates: React.Dispatch<React.SetStateAction<CustomInputStates>>;
  prepareFormDataForSubmit: () => LogEntryFormData;
  resetForm: () => void;
  clearLocalStorage: () => void;
}

export function useLogEntryForm({
  tracker,
  open,
  draft,
}: UseLogEntryFormProps): UseLogEntryFormReturn {
  const [formData, setFormData] = useState<LogEntryFormData>({});
  const [customEnumValues, setCustomEnumValues] = useState<CustomEnumValues>(
    {}
  );
  const [customInputStates, setCustomInputStates] = useState<CustomInputStates>(
    {}
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Ключ для localStorage
  const getStorageKey = useCallback(() => {
    if (!tracker || !tracker._id) return null;
    return `log_entry_draft_${tracker._id}`;
  }, [tracker?._id]);

  // Збереження форми в localStorage при зміні
  useEffect(() => {
    if (!open || !tracker) return;
    const storageKey = getStorageKey();
    if (!storageKey) return;

    const draftData = {
      formData,
      customEnumValues,
      customInputStates,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (error) {
      console.error("Failed to save draft to localStorage:", error);
    }
  }, [formData, customEnumValues, customInputStates, open, tracker, getStorageKey]);

  // Очищення localStorage при закритті форми
  useEffect(() => {
    if (!open && tracker) {
      const storageKey = getStorageKey();
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch (error) {
          console.error("Failed to clear localStorage:", error);
        }
      }
    }
  }, [open, tracker, getStorageKey]);

  // Ініціалізація форми з чернетки, localStorage або defaults
  useEffect(() => {
    if (open && tracker) {
      const storageKey = getStorageKey();
      let loadedData: {
        formData: LogEntryFormData;
        customEnumValues: CustomEnumValues;
        customInputStates: CustomInputStates;
      } | null = null;

      // Спочатку перевіряємо, чи є чернетка з пропсів
      if (draft) {
        const properties = tracker.schema.properties || {};
        // Конвертуємо ISO дані назад в формат форми
        const draftFormData = convertISOToFormData(draft.data, properties);
        loadedData = {
          formData: draftFormData,
          customEnumValues: draft.customEnumValues || {},
          customInputStates: {},
        };
      } else {
        // Спробуємо завантажити з localStorage
        if (storageKey) {
          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              loadedData = JSON.parse(stored);
            }
          } catch (error) {
            console.error("Failed to load draft from localStorage:", error);
          }
        }
      }

      const properties = tracker.schema.properties || {};
      let initialData: LogEntryFormData;
      
      if (loadedData?.formData) {
        // Якщо є завантажені дані, об'єднуємо їх з defaults для полів, яких немає
        const defaultData = initializeFormData(properties);
        initialData = { ...defaultData, ...loadedData.formData };
      } else {
        // Якщо немає завантажених даних, використовуємо тільки defaults
        initialData = initializeFormData(properties);
      }
      
      setFormData(initialData);

      // Ініціалізуємо кастомні значення enum
      if (loadedData?.customEnumValues) {
        setCustomEnumValues(loadedData.customEnumValues);
      } else {
        const customValues: CustomEnumValues = {};
        for (const [key, prop] of Object.entries(properties)) {
          if (prop.enum && prop.type === "string") {
            customValues[key] = [];
          }
        }
        setCustomEnumValues(customValues);
      }

      setCustomInputStates(loadedData?.customInputStates || {});
      setValidationError(null);
      setFieldErrors({});
    }
  }, [open, tracker?._id, draft?._id, getStorageKey]);

  const resetForm = useCallback(() => {
    if (tracker) {
      const properties = tracker.schema.properties || {};
      const initialData = initializeFormData(properties);
      setFormData(initialData);
      setValidationError(null);
      setFieldErrors({});
      
      // Очищаємо кастомні значення enum
      const customValues: CustomEnumValues = {};
      for (const [key, prop] of Object.entries(properties)) {
        if (prop.enum && prop.type === "string") {
          customValues[key] = [];
        }
      }
      setCustomEnumValues(customValues);
      setCustomInputStates({});
    }
  }, [tracker]);

  const clearLocalStorage = useCallback(() => {
    if (tracker) {
      const storageKey = `log_entry_draft_${tracker._id}`;
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
      }
    }
  }, [tracker?._id, tracker]);

  // Оновлення поля з підтримкою вкладених ключів та dynamicCount
  const updateField = useCallback(
    (key: string, value: unknown) => {
      setFormData((prev) => {
        // Обробка вкладених ключів (наприклад, "metadata.source")
        if (key.includes(".")) {
          const [parentKey, ...nestedKeys] = key.split(".");
          const parentValue = (prev[parentKey] as Record<string, unknown>) || {};

          // Рекурсивно оновлюємо вкладений об'єкт
          const updateNested = (
            obj: Record<string, unknown>,
            path: string[],
            val: unknown
          ): Record<string, unknown> => {
            if (path.length === 1) {
              return { ...obj, [path[0]]: val };
            }
            const [first, ...rest] = path;
            return {
              ...obj,
              [first]: updateNested(
                (obj[first] as Record<string, unknown>) || {},
                rest,
                val
              ),
            };
          };

          const updatedParent = updateNested(parentValue, nestedKeys, value);
          const newData = { ...prev, [parentKey]: updatedParent };

          // Обробка dynamicCount для вкладених полів
          const properties = tracker?.schema.properties || {};
          for (const [fieldKey, prop] of Object.entries(properties)) {
            if (prop.dynamicCount === key && prop.type === "array") {
              const count = typeof value === "number" ? Math.max(0, value) : 0;
              const currentArray = (newData[fieldKey] as unknown[]) || [];
              const itemSchema = prop.items;
              const defaultValue = itemSchema
                ? initializeFormData({ temp: itemSchema }).temp
                : "";

              const newArray: unknown[] = [];
              for (let i = 0; i < count; i++) {
                newArray[i] =
                  currentArray[i] !== undefined ? currentArray[i] : defaultValue;
              }

              newData[fieldKey] = newArray;
            }
          }

          return newData;
        }

        const newData = { ...prev, [key]: value };

        // Якщо змінюється поле, яке використовується для dynamicCount, оновлюємо масив
        const properties = tracker?.schema.properties || {};
        for (const [fieldKey, prop] of Object.entries(properties)) {
          if (prop.dynamicCount === key && prop.type === "array") {
            const count = typeof value === "number" ? Math.max(0, value) : 0;
            const currentArray = (newData[fieldKey] as unknown[]) || [];
            const itemSchema = prop.items;
            const defaultValue = itemSchema
              ? initializeFormData({ temp: itemSchema }).temp
              : "";

            // Створюємо новий масив потрібного розміру
            const newArray: unknown[] = [];
            for (let i = 0; i < count; i++) {
              // Якщо є старе значення, використовуємо його, інакше - default
              newArray[i] =
                currentArray[i] !== undefined ? currentArray[i] : defaultValue;
            }

            newData[fieldKey] = newArray;
          }
        }

        return newData;
      });
    },
    [tracker]
  );

  // Підготовка даних для відправки
  const prepareFormDataForSubmit = useCallback((): LogEntryFormData => {
    if (!tracker) return {};

    const properties = tracker.schema.properties || {};
    const convertedData = convertFormDataToISO(formData, properties);
    return filterDisabledNestedObjects(convertedData, properties);
  }, [formData, tracker]);

  return {
    formData,
    customEnumValues,
    customInputStates,
    validationError,
    fieldErrors,
    updateField,
    setValidationError,
    setFieldErrors,
    setCustomEnumValues,
    setCustomInputStates,
    prepareFormDataForSubmit,
    resetForm,
    clearLocalStorage,
  };
}
