"use client";

import { useState, useEffect, useMemo } from "react";
import { useCreateLogEntry, useTrackers } from "@/src/features/trackers/hooks";
import { useAdminMode } from "@/src/features/auth/hooks";
import { useCreateDraft, useDeleteDraft } from "@/src/features/drafts/hooks";
import { DialogLayout } from "../DialogLayout";
import { useLinkedDialog } from "../hooks";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { FieldError, Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { DraftEntry } from "@/src/api/drafts/drafts.api";
import { useLogEntryForm } from "./hooks/useLogEntryForm";
import { useLinkedTrackers } from "./hooks/useLinkedTrackers";
import { useNestedObjectAutoFill } from "./hooks/useNestedObjectAutoFill";
import { LinkedTrackerInfo } from "./components/LinkedTrackerInfo";
import { FormFieldRenderer } from "./components/FormFieldRenderer";
import { convertISOToDateTimeLocal } from "./utils";

interface LogEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: Tracker | null;
  draft?: DraftEntry | null;
}

export function LogEntryDialog({
  open,
  onOpenChange,
  tracker,
  draft,
}: LogEntryDialogProps) {
  const createLogEntryMutation = useCreateLogEntry();
  const createDraftMutation = useCreateDraft();
  const deleteDraftMutation = useDeleteDraft();
  const isAdminMode = useAdminMode();
  const { trackers } = useTrackers(false);
  
  // Default value for admin createdAt field
  const defaultAdminCreatedAt = useMemo(
    () => (open && isAdminMode ? convertISOToDateTimeLocal(new Date().toISOString()) : ""),
    [open, isAdminMode]
  );
  const [adminCreatedAt, setAdminCreatedAt] = useState<string>(defaultAdminCreatedAt);

  const {
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
  } = useLogEntryForm({ tracker, open, draft });

  const {
    linkedDialogOpen,
    selectedItem: selectedLinkedTracker,
    openLinkedDialog,
    handleOpenChange: handleLinkedDialogChange,
  } = useLinkedDialog<Tracker>();

  // Автоматичне заповнення вкладених об'єктів
  useNestedObjectAutoFill({
    tracker,
    formData,
    allTrackers: trackers,
    onUpdateField: updateField,
  });

  const linkedTrackerInfo = useLinkedTrackers({
    tracker,
    trackers,
    isAdminMode,
  });

  // Синхронізація значення за замовчуванням при відкритті/закритті
  useEffect(() => {
    if (open && isAdminMode) {
      setAdminCreatedAt(defaultAdminCreatedAt);
    } else if (!open) {
      setAdminCreatedAt("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tracker) return;

    setValidationError(null);
    setFieldErrors({});

    try {
      const finalData = prepareFormDataForSubmit();

      // Конвертуємо datetime-local в ISO, якщо адмін вказав createdAt
      let createdAt: string | undefined = undefined;
      if (isAdminMode && adminCreatedAt) {
        const date = new Date(adminCreatedAt);
        if (!isNaN(date.getTime())) {
          createdAt = date.toISOString();
        }
      }

      await createLogEntryMutation.mutateAsync({
        trackerId: tracker._id,
        data: finalData,
        customEnumValues: customEnumValues,
        createdAt: createdAt,
      });

      // Якщо форма була відкрита з драфтом, видаляємо його
      if (draft?._id) {
        try {
          await deleteDraftMutation.mutateAsync(draft._id);
        } catch (error) {
          console.error("Failed to delete draft:", error);
        }
      }

      resetForm();
      setAdminCreatedAt("");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to create log entry:", error);

      let errorMessage = "Failed to create log entry";
      let errors: Record<string, string[]> = {};

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { error?: string; fieldErrors?: Record<string, string[]> };
          };
        };
        errorMessage = axiosError.response?.data?.error || errorMessage;
        errors = axiosError.response?.data?.fieldErrors || {};
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setValidationError(errorMessage);
      setFieldErrors(errors);
    }
  };

  const handleLinkedTrackerClick = (linkedTracker: Tracker | null) => {
    if (linkedTracker) {
      openLinkedDialog(linkedTracker);
    }
  };

  const handleSaveDraft = async () => {
    if (!tracker) return;

    try {
      const finalData = prepareFormDataForSubmit();
      await createDraftMutation.mutateAsync({
        trackerId: tracker._id,
        data: finalData,
        customEnumValues: customEnumValues,
      });
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  const handleReset = () => {
    clearLocalStorage();
    resetForm();
    setAdminCreatedAt("");
  };

  if (!tracker) return null;

  const properties = tracker.schema.properties || {};
  const fields = Object.entries(properties);

  // Сортуємо поля: спочатку базові, потім залежні (які використовують dynamicCount)
  const sortedFields = fields.sort(([keyA, propA], [keyB, propB]) => {
    if (propB.dynamicCount === keyA) return -1;
    if (propA.dynamicCount === keyB) return 1;
    return 0;
  });

  const isLoading =
    createLogEntryMutation.isPending || createDraftMutation.isPending;

  const footer = (
    <>
      {validationError && <FieldError>{validationError}</FieldError>}
      <div className="flex items-center justify-between gap-2 flex-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="hue-rotate-180"
          >
            {createDraftMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="submit" form="log-entry-form" disabled={isLoading}>
            {createLogEntryMutation.isPending ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <DialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title={`Log Entry: ${tracker.name}`}
        description="Add a new entry to this tracker."
        headerContent={
          isAdminMode && (
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs font-medium mb-1 flex items-center gap-1">
                <Link2 className="size-3" />
                Tracker links:
              </div>
              <LinkedTrackerInfo
                linkedTrackerInfo={linkedTrackerInfo}
                onLinkedTrackerClick={handleLinkedTrackerClick}
              />
            </div>
          )
        }
        footer={footer}
        isLoading={isLoading}
      >
        <form id="log-entry-form" onSubmit={handleSubmit} className="space-y-4">
          {isAdminMode && (
            <Field>
              <FieldLabel>Created At (Admin)</FieldLabel>
              <FieldContent>
                <Input
                  type="datetime-local"
                  value={adminCreatedAt}
                  onChange={(e) => setAdminCreatedAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set custom creation date and time (admin only)
                </p>
              </FieldContent>
            </Field>
          )}
          {sortedFields.map(([key, prop]) => {
            const fieldElement = (
              <FormFieldRenderer
                key={key}
                fieldKey={key}
                prop={prop}
                value={formData[key]}
                formData={formData}
                fieldErrors={fieldErrors}
                customEnumValues={customEnumValues}
                customInputStates={customInputStates}
                tracker={tracker}
                allTrackers={trackers}
                onUpdateField={updateField}
                onSetCustomEnumValues={setCustomEnumValues}
                onSetCustomInputStates={setCustomInputStates}
              />
            );

            if (!fieldElement) {
              return null;
            }

            if (prop.dependsOn && formData[prop.dependsOn]) {
              return <div key={key}>{fieldElement}</div>;
            }

            return fieldElement;
          })}
        </form>
      </DialogLayout>

      {/* Linked Tracker Dialog */}
      {selectedLinkedTracker && (
        <LogEntryDialog
          open={linkedDialogOpen}
          onOpenChange={handleLinkedDialogChange}
          tracker={selectedLinkedTracker}
        />
      )}
    </>
  );
}
