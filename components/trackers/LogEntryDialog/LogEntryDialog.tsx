"use client";

import { useState, useEffect } from "react";
import { useCreateLogEntry, useTrackers } from "@/src/features/trackers/hooks";
import { useCapsLock } from "@/src/features/auth/hooks";
import { useCreateDraft, useDeleteDraft } from "@/src/features/drafts/hooks";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XIcon, Link2 } from "lucide-react";
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
  const isAdminMode = useCapsLock();
  const { trackers } = useTrackers(false);
  const [linkedTrackerDialogOpen, setLinkedTrackerDialogOpen] = useState(false);
  const [selectedLinkedTracker, setSelectedLinkedTracker] =
    useState<Tracker | null>(null);
  const [adminCreatedAt, setAdminCreatedAt] = useState<string>("");

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

  // Ініціалізація та очищення createdAt поля
  useEffect(() => {
    if (open && isAdminMode) {
      // Встановлюємо поточну дату та час за замовчуванням при відкритті
      const defaultDateTime = convertISOToDateTimeLocal(new Date().toISOString());
      setAdminCreatedAt(defaultDateTime);
    } else if (!open) {
      // Очищаємо поле при закритті діалогу
      setAdminCreatedAt("");
    }
  }, [open, isAdminMode]);

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
          // Не блокуємо закриття форми, якщо видалення драфту не вдалося
        }
      }
      
      // Очищаємо форму перед закриттям
      resetForm();
      setAdminCreatedAt("");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to create log entry:", error);

      // Extract error message and field errors from axios error
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
      setSelectedLinkedTracker(linkedTracker);
      setLinkedTrackerDialogOpen(true);
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
      // Optionally show a success message or close the dialog
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
    // Якщо поле B залежить від поля A, A має бути перед B
    if (propB.dynamicCount === keyA) return -1;
    if (propA.dynamicCount === keyB) return 1;
    return 0;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl h-dvh sm:h-auto sm:max-h-[90vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 shrink-0">
          <DialogTitle>Log Entry: {tracker.name}</DialogTitle>
          <DialogDescription>Add a new entry to this tracker.</DialogDescription>
          {isAdminMode && (
            <div className="mt-2 p-2 bg-muted rounded-md">
              <div className="text-xs font-medium mb-1 flex items-center gap-1">
                <Link2 className="size-3" />
                Tracker links:
              </div>
              <LinkedTrackerInfo
                linkedTrackerInfo={linkedTrackerInfo}
                onLinkedTrackerClick={handleLinkedTrackerClick}
              />
            </div>
          )}
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-3"
              disabled={createLogEntryMutation.isPending}
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {isAdminMode && (
                <Field>
                  <FieldLabel>
                    Created At (Admin)
                  </FieldLabel>
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

                // Якщо поле не має показуватися, не рендеримо його
                if (!fieldElement) {
                  return null;
                }

                // Якщо поле залежить від іншого поля і воно активне, обгортаємо в Card
                if (prop.dependsOn && formData[prop.dependsOn]) {
                  // const dependsOnProp = tracker?.schema.properties?.[prop.dependsOn];
                  return (
                    <div key={key} >
                      {/* <CardContent className=" space-y-4"> */}
                        {/* <div className="text-sm font-medium text-muted-foreground mb-2">
                          {dependsOnProp?.title || prop.dependsOn} - Settings
                        </div> */}
                      {/* </CardContent> */}
                        {fieldElement}
                    </div>
                  );
                }

                return fieldElement;
              })}
            </div>
          </div>

          <DialogFooter className="bottom-0 z-10 bg-background border-t border-border px-4 py-3 shrink-0 mt-0 relative">
            <div className="flex flex-col justify-between gap-4 flex-1">
              {validationError && <FieldError>{validationError}</FieldError>}
              <div className="flex items-center justify-between gap-2 flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createLogEntryMutation.isPending || createDraftMutation.isPending}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={createLogEntryMutation.isPending || createDraftMutation.isPending}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={createLogEntryMutation.isPending || createDraftMutation.isPending}
                    className="hue-rotate-180"
                  >
                    {createDraftMutation.isPending ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button type="submit" disabled={createLogEntryMutation.isPending || createDraftMutation.isPending}>
                    {createLogEntryMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Linked Tracker Dialog */}
      {selectedLinkedTracker && (
        <LogEntryDialog
          open={linkedTrackerDialogOpen}
          onOpenChange={(open) => {
            setLinkedTrackerDialogOpen(open);
            if (!open) {
              setSelectedLinkedTracker(null);
            }
          }}
          tracker={selectedLinkedTracker}
        />
      )}
    </Dialog>
  );
}
