import { Tracker, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";

export interface LogEntryFormData {
  [key: string]: unknown;
}

export interface CustomEnumValues {
  [key: string]: string[];
}

export interface CustomInputState {
  show: boolean;
  value: string;
}

export interface CustomInputStates {
  [key: string]: CustomInputState;
}

export interface FieldErrors {
  [key: string]: string[];
}

export interface LinkedTrackerInfo {
  fieldName: string;
  fieldTitle: string;
  linkedTrackerName: string;
  linkedTracker: Tracker | null;
}

export interface FormFieldProps {
  fieldKey: string;
  prop: JsonSchemaProperty;
  value: unknown;
  formData: LogEntryFormData;
  fieldErrors: FieldErrors;
  customEnumValues: CustomEnumValues;
  customInputStates: CustomInputStates;
  tracker: Tracker | null;
  allTrackers?: Tracker[];
  onUpdateField: (key: string, value: unknown) => void;
  onSetCustomEnumValues: React.Dispatch<React.SetStateAction<CustomEnumValues>>;
  onSetCustomInputStates: React.Dispatch<React.SetStateAction<CustomInputStates>>;
}
