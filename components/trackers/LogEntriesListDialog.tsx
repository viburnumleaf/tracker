"use client";

import { useState } from "react";
import { useLogEntries, useDeleteLogEntry } from "@/src/features/trackers/hooks";
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
  const { entries, isLoading } = useLogEntries(tracker?._id || null);
  const deleteLogEntryMutation = useDeleteLogEntry();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogEntry | null>(null);

  const handleDeleteClick = (entry: LogEntry) => {
    setEntryToDelete(entry);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete || !tracker) return;

    try {
      await deleteLogEntryMutation.mutateAsync({
        trackerId: tracker._id,
        logEntryId: entryToDelete._id,
      });
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
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
              View and manage all log entries for this tracker. Only you can
              delete your own entries.
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
              entries.map((entry) => (
                <Card key={entry._id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm">
                        {formatEntryData(entry.data)}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(entry)}
                      disabled={deleteLogEntryMutation.isPending}
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this log entry? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLogEntryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLogEntryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
