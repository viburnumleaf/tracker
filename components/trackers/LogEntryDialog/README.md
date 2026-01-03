# LogEntryDialog Component Documentation

## Overview

The `LogEntryDialog` component is a complex form dialog for creating log entries in trackers. It supports dynamic form generation based on JSON Schema, nested objects, linked trackers, auto-fill functionality, and conditional field visibility.

## Architecture

### Component Structure

```
LogEntryDialog/
├── LogEntryDialog.tsx          # Main component
├── index.tsx                   # Exports
├── types.ts                    # TypeScript interfaces
├── utils.ts                    # Utility functions
├── hooks/
│   ├── useLogEntryForm.ts      # Form state management
│   ├── useLinkedTrackers.ts    # Linked tracker detection
│   └── useNestedObjectAutoFill.ts  # Auto-fill nested objects
└── components/
    ├── FormFieldRenderer.tsx   # Field type router
    ├── NestedObjectField.tsx   # Nested object renderer
    ├── LinkedTrackerInfo.tsx   # Linked tracker UI
    ├── InputField.tsx          # Basic input fields
    ├── DynamicArrayField.tsx   # Dynamic arrays
    └── EnumField.tsx           # Enum/select fields
```

## Key Features

### 1. Dynamic Form Generation

The component generates form fields dynamically based on the tracker's JSON Schema. It supports:

- **Primitive types**: `string`, `number`, `boolean`
- **Complex types**: `object`, `array`
- **Formats**: `date-time`, `date`, `time`
- **Custom input types**: checkbox, slider, and custom registered inputs
- **Enum fields**: Predefined options with custom value support
- **Dynamic arrays**: Arrays whose length is determined by another field (`dynamicCount`)

### 2. Linked Trackers

The component supports two ways of linking trackers:

#### Old Way (Direct Linking)
A field directly specifies `createLinkedLog`:

```json
{
  "createPeeLog": {
    "type": "boolean",
    "createLinkedLog": {
      "trackerName": "pee",
      "dataMapping": {
        "time": "endTime"
      }
    }
  }
}
```

When this field is `true`, a linked log entry is created in the "pee" tracker.

#### New Way (Nested Object Linking)
A nested object field with `dependsOn` references a parent field that has `createLinkedLog`:

```json
{
  "createPeeLog": {
    "type": "boolean",
    "createLinkedLog": {
      "trackerName": "pee",
      "dataMapping": {
        "time": "endTime"
      }
    }
  },
  "pee": {
    "type": "object",
    "dependsOn": "createPeeLog",
    "properties": {}
  }
}
```

The nested object (`pee`) appears when the parent field (`createPeeLog`) is enabled, and its schema is automatically loaded from the linked tracker.

### 3. Conditional Field Visibility

Fields can depend on other fields using `dependsOn`:

- Fields are hidden when the dependency field is `false`, empty, or undefined
- Nested objects are only rendered when their dependency is active
- Fields are automatically shown/hidden as dependencies change

### 4. Auto-fill Functionality

The `useNestedObjectAutoFill` hook automatically:

- Initializes nested objects with schemas from linked trackers when `properties` is empty
- Maps field values from parent form to nested objects using `dataMapping`
- Converts datetime-local values to ISO format
- Only updates fields when they are empty (doesn't overwrite user input)

### 5. Data Conversion

The component handles various data format conversions:

- **datetime-local → ISO 8601**: Converts HTML datetime-local input to ISO format
- **time (HH:MM → HH:MM:SS)**: Adds seconds to time inputs
- **Nested object filtering**: Removes nested objects when their dependency is disabled

## Data Flow

### Form Initialization

1. When dialog opens, `useLogEntryForm` initializes form data
2. `initializeFormData` sets default values for all fields
3. Dynamic arrays are initialized based on `dynamicCount` fields
4. `useNestedObjectAutoFill` initializes nested objects from linked tracker schemas

### Field Updates

1. User interacts with a field
2. `updateField` is called with the new value
3. Form data state is updated
4. If the field affects `dynamicCount`, arrays are resized
5. `useNestedObjectAutoFill` runs and may auto-fill nested objects
6. Fields with `dependsOn` are shown/hidden based on updated values

### Form Submission

1. User clicks "Save Entry"
2. `prepareFormDataForSubmit` is called:
   - Converts datetime-local to ISO format
   - Converts time formats
   - Filters out disabled nested objects
3. Data is sent to the API with `customEnumValues`
4. Backend creates the log entry and any linked log entries (old way only)

## Hooks

### useLogEntryForm

Manages form state and provides:
- `formData`: Current form values
- `updateField`: Function to update a field
- `prepareFormDataForSubmit`: Prepares data for API submission
- `resetForm`: Resets form to initial state
- Error handling state

### useLinkedTrackers

Detects and returns information about linked trackers:
- Scans schema properties for `createLinkedLog` configurations
- Finds nested objects with `dependsOn` that reference linked trackers
- Returns array of `LinkedTrackerInfo` objects (only in admin mode)

**Issues:**
- Currently adds both parent fields and nested object fields to the result, causing duplicates
- Only works in admin mode (`isAdminMode`)

### useNestedObjectAutoFill

Automatically fills nested objects:
- Runs on every `formData` change
- Loads schemas from linked trackers when `properties` is empty
- Maps field values using `dataMapping`
- Converts datetime values to ISO format

**Issues:**
- Runs on every change, which could cause performance issues
- May overwrite user input if logic is incorrect
- Only initializes empty fields, but logic could be more robust

## Components

### FormFieldRenderer

Routes fields to appropriate renderers based on:
1. `inputType` (custom inputs)
2. `dynamicCount` (dynamic arrays)
3. `enum` (enum fields)
4. `type === "object"` (nested objects)
5. Default input field

### NestedObjectField

Renders nested object fields:
- Loads schema from linked tracker if `properties` is empty
- Renders all nested properties recursively using `FormFieldRenderer`
- Handles field errors for nested fields
- Wraps content in a Card component

## Issues and Limitations

### 1. Multiple Linked Trackers Not Working Properly

**Problem:** When a tracker has multiple linked trackers, the system may not handle them correctly.

**Root Causes:**

1. **Backend Limitation**: The backend service (`log-entries.service.ts`) only processes the "old way" of linking (fields with direct `createLinkedLog`). It does NOT process nested object fields with `dependsOn`, even if they reference a linked tracker.

2. **Duplicate Detection in useLinkedTrackers**: The hook adds both:
   - Parent fields with `createLinkedLog` (e.g., `createPeeLog`)
   - Nested object fields with `dependsOn` (e.g., `pee`)
   
   This causes duplicate entries in the linked tracker info display.

3. **Backend Processing Gap**: When using the new way (nested objects), the nested object data is sent to the backend but:
   - The backend doesn't recognize it as a linked tracker field
   - It's stored as regular form data, not as a linked log entry
   - The linked log creation logic doesn't process nested objects

### 2. Nested Object Schema Loading

**Current Behavior:**
- `NestedObjectField` loads schema from linked tracker when `properties` is empty
- `useNestedObjectAutoFill` also tries to load and initialize the schema
- This duplication could cause race conditions or inconsistent state

**Issue:**
- Schema loading happens in two places, which could conflict
- No error handling if linked tracker is not found
- Schema is loaded on every render in `NestedObjectField` (useMemo dependency)

### 3. Auto-fill Logic Issues

**Potential Problems:**
- `useNestedObjectAutoFill` runs on every `formData` change
- Could cause infinite loops if not careful
- May overwrite user input if conditions are not strict enough
- DateTime conversion happens in the hook, but should probably be in `prepareFormDataForSubmit`

### 4. Missing Backend Support for New Way

The backend needs to be updated to:
- Process nested object fields that have `dependsOn` pointing to fields with `createLinkedLog`
- Create linked log entries from nested object data
- Handle the nested object submission properly

### 5. Linked Tracker Dialog Navigation

**Current Implementation:**
- Only one `selectedLinkedTracker` state
- Only one `linkedTrackerDialogOpen` state
- Cannot open multiple linked tracker dialogs simultaneously

**Impact:**
- If a tracker has multiple linked trackers, only one can be opened at a time
- No way to navigate between multiple linked trackers in a workflow

## Recommendations

### 1. Fix Backend to Support New Way

Update `log-entries.service.ts` to process nested objects:

```typescript
// In createLogEntry method, after processing old way:
// Also check for nested objects with dependsOn that reference createLinkedLog
for (const [fieldName, fieldSchema] of Object.entries(properties)) {
  if (fieldSchema.type === "object" && fieldSchema.dependsOn) {
    const dependsOnProp = properties[fieldSchema.dependsOn];
    if (dependsOnProp?.createLinkedLog) {
      const nestedObjectValue = data.data[fieldName];
      if (nestedObjectValue && typeof nestedObjectValue === "object") {
        // Process as linked log entry
        // Similar logic to old way but use nestedObjectValue as source data
      }
    }
  }
}
```

### 2. Fix useLinkedTrackers to Avoid Duplicates

Only add nested objects to the result, not parent fields:

```typescript
// Remove the old way addition for fields that are referenced by nested objects
// Or add a flag to track which fields have already been processed
```

### 3. Consolidate Schema Loading

Move schema loading to a single place, preferably in `useNestedObjectAutoFill`, and pass the loaded schema to `NestedObjectField` via props or context.

### 4. Improve Auto-fill Logic

- Add more strict conditions to prevent overwriting user input
- Consider using a ref to track initialization state
- Move datetime conversion to submission time

### 5. Support Multiple Linked Tracker Dialogs

Use a stack or array to manage multiple open dialogs:

```typescript
const [linkedTrackerDialogs, setLinkedTrackerDialogs] = useState<Array<{
  tracker: Tracker;
  open: boolean;
}>>([]);
```

## Type Definitions

### LogEntryFormData
```typescript
interface LogEntryFormData {
  [key: string]: unknown;
}
```

### LinkedTrackerInfo
```typescript
interface LinkedTrackerInfo {
  fieldName: string;
  fieldTitle: string;
  linkedTrackerName: string;
  linkedTracker: Tracker | null;
}
```

### JsonSchemaProperty
See `src/api/trackers/trackers.api.ts` for complete definition. Key properties:
- `createLinkedLog`: Configuration for linked log creation
- `dependsOn`: Field name this field depends on
- `dynamicCount`: Field name that determines array length
- `inputType`: Custom input type to render
- `properties`: Nested object properties

## Example Schema

```json
{
  "type": "object",
  "properties": {
    "startTime": {
      "type": "string",
      "format": "date-time",
      "title": "Start Time"
    },
    "endTime": {
      "type": "string",
      "format": "date-time",
      "title": "End Time"
    },
    "createPeeLog": {
      "type": "boolean",
      "title": "Pee",
      "inputType": "checkbox",
      "default": false,
      "createLinkedLog": {
        "trackerName": "pee",
        "dataMapping": {
          "time": "endTime"
        }
      }
    },
    "pee": {
      "type": "object",
      "title": "Pee Log",
      "properties": {},
      "dependsOn": "createPeeLog"
    }
  },
  "required": ["startTime", "endTime"]
}
```

This schema:
1. Has two time fields
2. Has a checkbox to enable pee log creation
3. Has a nested object that appears when checkbox is enabled
4. The nested object schema is loaded from the "pee" tracker
5. When submitted, should create a linked log in the "pee" tracker (currently only works if backend is updated)

## Testing Considerations

When testing the component:

1. **Test linked tracker detection**: Verify both old and new ways are detected
2. **Test nested object schema loading**: Verify schema loads from linked tracker
3. **Test auto-fill**: Verify data mapping works correctly
4. **Test conditional visibility**: Verify fields show/hide based on dependencies
5. **Test form submission**: Verify data is formatted correctly
6. **Test multiple linked trackers**: Verify all are detected and can be opened
7. **Test backend integration**: Verify linked logs are created correctly

## Future Improvements

1. **Schema validation**: Add runtime schema validation before submission
2. **Form state persistence**: Save draft form data to localStorage
3. **Undo/redo**: Add undo/redo functionality for form changes
4. **Field dependencies visualization**: Show dependency graph in admin mode
5. **Batch linked log creation**: Support creating multiple linked logs in one transaction
6. **Linked log preview**: Show preview of what will be created in linked trackers
7. **Error recovery**: Better error handling and recovery for failed linked log creation
