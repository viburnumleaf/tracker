"use client";

import { useState, useEffect } from "react";
import { useCreateTracker } from "@/src/features/trackers/hooks";
import { DialogLayout } from "./DialogLayout";
import { useSchemaForm } from "./hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface CreateTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrackerDialog({
  open,
  onOpenChange,
}: CreateTrackerDialogProps) {
  const [name, setName] = useState("");
  const createTrackerMutation = useCreateTracker();
  const { schemaJson, setSchemaJson, schemaError, validateSchema, reset } =
    useSchemaForm({ open });

  useEffect(() => {
    if (!open) {
      setName("");
      reset();
    }
  }, [open, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = validateSchema();
    if (!schema) return;

    try {
      await createTrackerMutation.mutateAsync({ name, schema });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create tracker:", error);
    }
  };

  const footer = (
    <>
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
        form="create-tracker-form"
        disabled={createTrackerMutation.isPending || !name.trim()}
      >
        {createTrackerMutation.isPending ? "Creating..." : "Create Tracker"}
      </Button>
    </>
  );

  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Tracker"
      description="Create a new tracker by providing a name and JSON schema for the data fields."
      footer={footer}
      isLoading={createTrackerMutation.isPending}
    >
      <form
        id="create-tracker-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
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
