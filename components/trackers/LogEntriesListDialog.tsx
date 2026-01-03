"use client";

import { useState } from "react";
import { useLogEntries, useDeleteLogEntry, usePermanentlyDeleteLogEntry } from "@/src/features/trackers/hooks";
import { useCapsLock } from "@/src/features/auth/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tracker, LogEntry } from "@/src/api/trackers/trackers.api";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LogEntriesListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: Tracker | null;
}

export function LogEntriesListDialog({
  open,
  onOpenChange,
  tracker,
}: LogEntriesListDialogProps) {
  const isAdminMode = useCapsLock();
  const { entries, isLoading } = useLogEntries(tracker?._id || null, isAdminMode);
  const deleteLogEntryMutation = useDeleteLogEntry();
  const permanentlyDeleteLogEntryMutation = usePermanentlyDeleteLogEntry();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<(LogEntry & { isDeleted?: boolean }) | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  const handleDeleteClick = (entry: LogEntry & { isDeleted?: boolean }) => {
    setEntryToDelete(entry);
    setIsPermanentDelete(entry.isDeleted || false);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || !tracker) return;

    try {
      if (isPermanentDelete) {
        await permanentlyDeleteLogEntryMutation.mutateAsync({
          trackerId: tracker._id,
          logEntryId: entryToDelete._id,
        });
      } else {
        await deleteLogEntryMutation.mutateAsync({
          trackerId: tracker._id,
          logEntryId: entryToDelete._id,
        });
      }
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      setIsPermanentDelete(false);
    } catch (error) {
      console.error("Failed to delete log entry:", error);
    }
  };

  const formatEntryData = (data: Record<string, unknown>) => {
    return Object.entries(data)
      .map(([key, value]) => {
        if (value === null || value === undefined) return null;
        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${String(value)}`;
      })
      .filter(Boolean)
      .join(", ");
  };

  if (!tracker) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Log Entries: {tracker.name.replace(/_/g, " ")}
            </DialogTitle>
            <DialogDescription>
              {isAdminMode ? (
                <span className="flex items-center gap-2">
                  <span>Admin Mode (Caps Lock) - Viewing all entries including deleted ones.</span>
                  <span className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                    Admin
                  </span>
                </span>
              ) : (
                "View and manage all log entries for this tracker. Only you can delete your own entries."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-muted-foreground text-sm">
                Loading entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No log entries yet. Create your first entry to get started!
              </div>
            ) : (
              entries.map((entry) => {
                const isDeleted = entry.isDeleted || false;
                return (
                  <Card
                    key={entry._id}
                    className={`p-4 ${
                      isDeleted
                        ? "opacity-50 border-dashed border-2 border-destructive"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                          {isDeleted && (
                            <span className="text-xs text-destructive">(Deleted)</span>
                          )}
                        </div>
                        <div className="text-sm">
                          {formatEntryData(entry.data)}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(entry)}
                        disabled={deleteLogEntryMutation.isPending || permanentlyDeleteLogEntryMutation.isPending}
                        className="shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPermanentDelete ? "Permanently Delete Log Entry" : "Delete Log Entry"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPermanentDelete
                ? "Are you sure you want to permanently delete this log entry? This will completely remove it from the database. This action cannot be undone."
                : "Are you sure you want to delete this log entry? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLogEntryMutation.isPending || permanentlyDeleteLogEntryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteLogEntryMutation.isPending || permanentlyDeleteLogEntryMutation.isPending)
                ? "Deleting..."
                : isPermanentDelete
                ? "Permanently Delete"
                : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
