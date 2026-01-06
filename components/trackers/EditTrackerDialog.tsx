"use client";

import { useUpdateTracker } from "@/src/features/trackers/hooks";
import { DialogLayout } from "./DialogLayout";
import { useSchemaForm } from "./hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Tracker } from "@/src/api/trackers/trackers.api";

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
  const updateTrackerMutation = useUpdateTracker();
  const { schemaJson, setSchemaJson, schemaError, validateSchema } =
    useSchemaForm({
      initialSchema: tracker?.schema,
      open: open && !!tracker,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracker) return;

    const schema = validateSchema();
    if (!schema) return;

    try {
      await updateTrackerMutation.mutateAsync({
        trackerId: tracker._id,
        data: { schema },
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update tracker:", error);
    }
  };

  if (!tracker) return null;

  const footer = (
    <>
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
        form="edit-tracker-form"
        disabled={updateTrackerMutation.isPending}
      >
        {updateTrackerMutation.isPending ? "Updating..." : "Update Schema"}
      </Button>
    </>
  );

  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Tracker Schema: ${tracker.name.replace(/_/g, " ")}`}
      description="Update the JSON schema for this tracker. Changes will affect all users of this tracker."
      footer={footer}
      isLoading={updateTrackerMutation.isPending}
    >
      <form id="edit-tracker-form" onSubmit={handleSubmit} className="space-y-4">
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
      </form>
    </DialogLayout>
  );
}
