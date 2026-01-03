"use client";

import { useState, useEffect } from "react";
import { useUpdateTracker } from "@/src/features/trackers/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { JsonSchema, Tracker } from "@/src/api/trackers/trackers.api";

interface EditTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: Tracker | null;
}

export function EditTrackerDialog({
  open,
  onOpenChange,
  tracker,
}: EditTrackerDialogProps) {
  const [schemaJson, setSchemaJson] = useState("");
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const updateTrackerMutation = useUpdateTracker();

  // Initialize schema when tracker changes
  useEffect(() => {
    if (tracker && open) {
      setSchemaJson(JSON.stringify(tracker.schema, null, 2));
      setSchemaError(null);
    } else if (!open) {
      // Reset when dialog closes
      setSchemaJson("");
      setSchemaError(null);
    }
  }, [tracker?._id, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracker) return;

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
      await updateTrackerMutation.mutateAsync({
        trackerId: tracker._id,
        data: { schema },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update tracker:", error);
      setSchemaError(
        error instanceof Error
          ? error.message
          : "Failed to update tracker schema"
      );
    }
  };

  if (!tracker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tracker Schema: {tracker.name.replace(/_/g, " ")}</DialogTitle>
          <DialogDescription>
            Update the JSON schema for this tracker. Changes will affect all users of this tracker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                {schemaError && <FieldError>{schemaError}</FieldError>}
                <p className="text-xs text-muted-foreground mt-1">
                  Define the structure of your tracker data using JSON Schema format.
                </p>
              </FieldContent>
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateTrackerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTrackerMutation.isPending}
            >
              {updateTrackerMutation.isPending ? "Updating..." : "Update Schema"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
