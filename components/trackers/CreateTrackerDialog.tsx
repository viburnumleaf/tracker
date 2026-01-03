"use client";

import { useState } from "react";
import { useCreateTracker } from "@/src/features/trackers/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { JsonSchema } from "@/src/api/trackers/trackers.api";

interface CreateTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrackerDialog({
  open,
  onOpenChange,
}: CreateTrackerDialogProps) {
  const [name, setName] = useState("");
  const [schemaJson, setSchemaJson] = useState(
    JSON.stringify(
      {
        type: "object",
        properties: {},
        required: [],
      },
      null,
      2
    )
  );
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const createTrackerMutation = useCreateTracker();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(null);

    let schema: JsonSchema;
    try {
      const parsed = JSON.parse(schemaJson);
      // Basic validation
      if (parsed.type !== "object" || !parsed.properties) {
        throw new Error("Schema must have type 'object' and 'properties' field");
      }
      schema = parsed as JsonSchema;
    } catch (error) {
      setSchemaError(
        error instanceof Error ? error.message : "Invalid JSON schema"
      );
      return;
    }

    try {
      await createTrackerMutation.mutateAsync({
        name,
        schema,
      });
      setName("");
      setSchemaJson(
        JSON.stringify(
          {
            type: "object",
            properties: {},
            required: [],
          },
          null,
          2
        )
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create tracker:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tracker</DialogTitle>
          <DialogDescription>
            Create a new tracker by providing a name and JSON schema for the
            data fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field>
              <FieldLabel>Tracker Name</FieldLabel>
              <FieldContent>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Smoking, Masturbation, Shower"
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>JSON Schema</FieldLabel>
              <FieldContent>
                <Textarea
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  placeholder='{"type": "object", "properties": {}, "required": []}'
                  className="min-h-64 font-mono text-xs"
                  required
                />
                {schemaError && (
                  <FieldError>{schemaError}</FieldError>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Define the structure of your tracker data using JSON Schema
                  format.
                </p>
              </FieldContent>
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTrackerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTrackerMutation.isPending || !name.trim()}
            >
              {createTrackerMutation.isPending ? "Creating..." : "Create Tracker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
