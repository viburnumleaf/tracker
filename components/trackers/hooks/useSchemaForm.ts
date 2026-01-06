import { useState, useEffect } from "react";
import { JsonSchema } from "@/src/api/trackers/trackers.api";

interface UseSchemaFormOptions {
  initialSchema?: JsonSchema;
  open?: boolean;
}

interface UseSchemaFormReturn {
  schemaJson: string;
  setSchemaJson: (value: string) => void;
  schemaError: string | null;
  validateSchema: () => JsonSchema | null;
  reset: () => void;
}

const DEFAULT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {},
  required: [],
};

export function useSchemaForm({
  initialSchema,
  open,
}: UseSchemaFormOptions = {}): UseSchemaFormReturn {
  const [schemaJson, setSchemaJson] = useState(() =>
    JSON.stringify(initialSchema || DEFAULT_SCHEMA, null, 2)
  );
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSchema && open) {
      setSchemaJson(JSON.stringify(initialSchema, null, 2));
      setSchemaError(null);
    } else if (!open && !initialSchema) {
      setSchemaJson(JSON.stringify(DEFAULT_SCHEMA, null, 2));
      setSchemaError(null);
    }
  }, [initialSchema, open]);

  const validateSchema = (): JsonSchema | null => {
    setSchemaError(null);
    try {
      const parsed = JSON.parse(schemaJson);
      if (parsed.type !== "object" || !parsed.properties) {
        throw new Error(
          "Schema must have type 'object' and 'properties' field"
        );
      }
      return parsed as JsonSchema;
    } catch (error) {
      setSchemaError(
        error instanceof Error ? error.message : "Invalid JSON schema"
      );
      return null;
    }
  };

  const reset = () => {
    setSchemaJson(JSON.stringify(DEFAULT_SCHEMA, null, 2));
    setSchemaError(null);
  };

  return {
    schemaJson,
    setSchemaJson,
    schemaError,
    validateSchema,
    reset,
  };
}
