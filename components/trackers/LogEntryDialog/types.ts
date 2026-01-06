import { Tracker, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";

export type LogEntryFormData = {
  [key: string]: unknown;
}

export type CustomEnumValues = {
  [key: string]: string[];
}

export type CustomInputState = {
  show: boolean;
  value: string;
}

export type CustomInputStates = {
  [key: string]: CustomInputState;
}

export type FieldErrors = {
  [key: string]: string[];
}

export type LinkedTrackerInfo = {
  fieldName: string;
  fieldTitle: string;
  linkedTrackerName: string;
  linkedTracker: Tracker | null;
}

export type FormFieldProps = {
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
