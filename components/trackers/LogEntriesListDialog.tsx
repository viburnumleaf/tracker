"use client";

import { useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useLogEntries,
  useDeleteLogEntry,
  usePermanentlyDeleteLogEntry,
} from "@/src/features/trackers/hooks";
import { useAdminMode } from "@/src/features/auth/hooks";
import { DialogLayout } from "./DialogLayout";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useDeleteConfirmation } from "./hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tracker, LogEntry } from "@/src/api/trackers/trackers.api";
import { Trash2 } from "lucide-react";

type LogEntriesListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracker: Tracker | null;
}

export const LogEntriesListDialog = ({
  open,
  onOpenChange,
  tracker,
}: LogEntriesListDialogProps) => {
  const isAdminMode = useAdminMode();
  const { entries, isLoading } = useLogEntries(
    tracker?._id || null,
    isAdminMode
  );
  const deleteLogEntryMutation = useDeleteLogEntry();
  const permanentlyDeleteLogEntryMutation = usePermanentlyDeleteLogEntry();

  const {
    deleteConfirmOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useDeleteConfirmation<LogEntry & { isDeleted?: boolean }>({
    onConfirm: async (entry) => {
      if (!tracker) return;
      const isPermanentDelete = entry.isDeleted || false;
      if (isPermanentDelete) {
        await permanentlyDeleteLogEntryMutation.mutateAsync({
          trackerId: tracker._id,
          logEntryId: entry._id,
        });
      } else {
        await deleteLogEntryMutation.mutateAsync({
          trackerId: tracker._id,
          logEntryId: entry._id,
        });
      }
    },
  });

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

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each entry card
    overscan: 5, // Render 5 extra items outside viewport
  });

  // Update virtualizer when entries change
  useEffect(() => {
    virtualizer.measure();
  }, [entries.length, virtualizer]);

  if (!tracker) return null;

  const isPermanentDelete = itemToDelete?.isDeleted || false;
  const isLoadingDelete =
    deleteLogEntryMutation.isPending ||
    permanentlyDeleteLogEntryMutation.isPending;

  return (
    <>
      <DialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title={`Log Entries: ${tracker.name.replace(/_/g, " ")}`}
        description={
          isAdminMode ? (
            <span className="flex items-center gap-2">
              <span>
                Admin Mode (Caps Lock) - Viewing all entries including deleted
                ones.
              </span>
              <span className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                Admin
              </span>
            </span>
          ) : (
            "View and manage all log entries for this tracker. Only you can delete your own entries."
          )
        }
      >
        <div className="flex flex-col h-full min-h-0">
          {isLoading ? (
            <div className="text-muted-foreground text-sm py-4">
              Loading entries...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-muted-foreground text-sm py-4">
              No log entries yet. Create your first entry to get started!
            </div>
          ) : (
            <div
              ref={parentRef}
              className="flex-1 overflow-auto min-h-[400px]"
              style={{
                contain: "strict",
              }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const entry = entries[virtualItem.index];
                  const isDeleted = entry.isDeleted || false;
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="p-1"
                    >
                      <Card
                        className={`p-4 h-full ${
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
                                <span className="text-xs text-destructive">
                                  (Deleted)
                                </span>
                              )}
                            </div>
                            <div className="text-sm">{formatEntryData(entry.data)}</div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(entry)}
                            disabled={isLoadingDelete}
                            className="shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogLayout>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel();
        }}
        title={
          isPermanentDelete
            ? "Permanently Delete Log Entry"
            : "Delete Log Entry"
        }
        description={
          isPermanentDelete
            ? "Are you sure you want to permanently delete this log entry? This will completely remove it from the database. This action cannot be undone."
            : "Are you sure you want to delete this log entry? This action cannot be undone."
        }
        confirmLabel={isPermanentDelete ? "Permanently Delete" : "Delete"}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoadingDelete}
        variant="destructive"
      />
    </>
  );
}
