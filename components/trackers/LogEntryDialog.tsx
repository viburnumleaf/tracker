"use client";

import { useState, useEffect } from "react";
import { useCreateLogEntry } from "@/src/features/trackers/hooks";
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
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tracker, JsonSchemaProperty } from "@/src/api/trackers/trackers.api";

interface LogEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: Tracker | null;
}

export function LogEntryDialog({
  open,
  onOpenChange,
  tracker,
}: LogEntryDialogProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const createLogEntryMutation = useCreateLogEntry();

  useEffect(() => {
    if (open && tracker) {
      // Initialize form data with defaults and auto-set values
      const initialData: Record<string, unknown> = {};
      const properties = tracker.schema.properties || {};

      for (const [key, prop] of Object.entries(properties)) {
        if (prop.format === "date-time" || prop.format === "date") {
          // Auto-set current date/time for date fields
          const now = new Date();
          if (prop.format === "date-time") {
            initialData[key] = now.toISOString().slice(0, 16); // datetime-local format
          } else if (prop.format === "date") {
            initialData[key] = now.toISOString().slice(0, 10); // date format
          }
        } else if (prop.default !== undefined) {
          initialData[key] = prop.default;
        } else if (prop.type === "array") {
          initialData[key] = [];
        } else if (prop.type === "object") {
          initialData[key] = {};
        }
      }

      setFormData(initialData);
    }
  }, [open, tracker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracker) return;

    try {
      await createLogEntryMutation.mutateAsync({
        trackerId: tracker._id,
        data: formData,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create log entry:", error);
    }
  };

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (
    key: string,
    prop: JsonSchemaProperty,
    value: unknown
  ) => {
    const isRequired =
      tracker?.schema.required?.includes(key) ||
      prop.required?.includes(key);

    if (prop.enum && prop.type === "string") {
      // Select dropdown for enum
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Select
              value={String(value || "")}
              onValueChange={(val) => updateField(key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${prop.title || key}`} />
              </SelectTrigger>
              <SelectContent>
                {prop.enum.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    if (prop.format === "date-time") {
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Input
              type="datetime-local"
              value={String(value || "")}
              onChange={(e) => updateField(key, e.target.value)}
              required={isRequired}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    if (prop.format === "date") {
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Input
              type="date"
              value={String(value || "")}
              onChange={(e) => updateField(key, e.target.value)}
              required={isRequired}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    if (prop.format === "time") {
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Input
              type="time"
              value={String(value || "")}
              onChange={(e) => updateField(key, e.target.value)}
              required={isRequired}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    if (prop.type === "number") {
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Input
              type="number"
              value={String(value ?? "")}
              onChange={(e) => {
                const numValue = e.target.value
                  ? parseFloat(e.target.value)
                  : undefined;
                updateField(key, numValue);
              }}
              min={prop.minimum}
              max={prop.maximum}
              step="any"
              required={isRequired}
            />
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    if (prop.type === "boolean") {
      return (
        <Field key={key}>
          <FieldLabel>
            {prop.title || key}
            {isRequired && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <FieldContent>
            <Select
              value={String(value ?? "false")}
              onValueChange={(val) => updateField(key, val === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
            {prop.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {prop.description}
              </p>
            )}
          </FieldContent>
        </Field>
      );
    }

    // Default: string input
    return (
      <Field key={key}>
        <FieldLabel>
          {prop.title || key}
          {isRequired && <span className="text-destructive"> *</span>}
        </FieldLabel>
        <FieldContent>
          <Input
            type="text"
            value={String(value ?? "")}
            onChange={(e) => updateField(key, e.target.value)}
            required={isRequired}
            placeholder={prop.description}
          />
          {prop.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {prop.description}
            </p>
          )}
        </FieldContent>
      </Field>
    );
  };

  if (!tracker) return null;

  const properties = tracker.schema.properties || {};
  const fields = Object.entries(properties);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Entry: {tracker.name}</DialogTitle>
          <DialogDescription>
            Add a new entry to this tracker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {fields.map(([key, prop]) => renderField(key, prop, formData[key]))}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createLogEntryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLogEntryMutation.isPending}
            >
              {createLogEntryMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
