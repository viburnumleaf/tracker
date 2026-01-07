"use client";

import { useState, useMemo } from "react";
import {
  useAllLogEntries,
  useDeleteLogEntry,
  usePermanentlyDeleteLogEntry,
} from "@/src/features/trackers/hooks";
import { useAdminMode } from "@/src/features/auth/hooks";
import { DialogLayout } from "./DialogLayout";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useDeleteConfirmation } from "./hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AllLogEntry } from "@/src/features/trackers/hooks/useAllLogEntries";
import { Trash2, ArrowUpDown } from "lucide-react";

type SortOption = "newest" | "oldest" | "tracker";

type AllLogsListDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AllLogsListDialog = ({
  open,
  onOpenChange,
}: AllLogsListDialogProps) => {
  const isAdminMode = useAdminMode();
  const { entries, isLoading } = useAllLogEntries(isAdminMode);
  const deleteLogEntryMutation = useDeleteLogEntry();
  const permanentlyDeleteLogEntryMutation = usePermanentlyDeleteLogEntry();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  // Get unique trackers from entries
  const uniqueTrackers = useMemo(() => {
    const trackerMap = new Map<string, { id: string; name: string }>();
    entries.forEach((entry) => {
      if (entry.tracker && !trackerMap.has(entry.tracker._id)) {
        trackerMap.set(entry.tracker._id, {
          id: entry.tracker._id,
          name: entry.tracker.name.replace(/_/g, " "),
        });
      }
    });
    return Array.from(trackerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [entries]);

  // Initialize selected trackers with all trackers
  const initialTrackerIds = useMemo(() => {
    return new Set(uniqueTrackers.map((t) => t.id));
  }, [uniqueTrackers]);

  const [selectedTrackers, setSelectedTrackers] = useState<Set<string>>(
    initialTrackerIds
  );

  const {
    deleteConfirmOpen,
    itemToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useDeleteConfirmation<AllLogEntry>({
    onConfirm: async (entry) => {
      if (!entry.tracker) return;
      const isPermanentDelete = entry.isDeleted || false;
      if (isPermanentDelete) {
        await permanentlyDeleteLogEntryMutation.mutateAsync({
          trackerId: entry.tracker._id,
          logEntryId: entry._id,
        });
      } else {
        await deleteLogEntryMutation.mutateAsync({
          trackerId: entry.tracker._id,
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

  const sortOptions: SortOption[] = ["newest", "oldest", "tracker"];
  const sortLabels: Record<SortOption, string> = {
    newest: "Newest First",
    oldest: "Oldest First",
    tracker: "By Tracker",
  };

  const cycleSort = () => {
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };

  const toggleTracker = (trackerId: string) => {
    setSelectedTrackers((prev) => {
      const next = new Set(prev);
      if (next.has(trackerId)) {
        next.delete(trackerId);
      } else {
        next.add(trackerId);
      }
      return next;
    });
  };

  const toggleAllTrackers = () => {
    if (selectedTrackers.size === uniqueTrackers.length) {
      // Deselect all
      setSelectedTrackers(new Set());
    } else {
      // Select all
      setSelectedTrackers(new Set(uniqueTrackers.map((t) => t.id)));
    }
  };

  const isAllSelected = uniqueTrackers.length > 0 && selectedTrackers.size === uniqueTrackers.length;

  // Filter entries by selected trackers, then sort
  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(
      (entry) => entry.tracker && selectedTrackers.has(entry.tracker._id)
    );
    
    const sorted = [...filtered];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "tracker":
        return sorted.sort((a, b) => {
          const aName = a.tracker?.name || "";
          const bName = b.tracker?.name || "";
          if (aName === bName) {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          }
          return aName.localeCompare(bName);
        });
      default:
        return sorted;
    }
  }, [entries, sortBy, selectedTrackers]);

  const isPermanentDelete = itemToDelete?.isDeleted || false;
  const isLoadingDelete =
    deleteLogEntryMutation.isPending ||
    permanentlyDeleteLogEntryMutation.isPending;

  return (
    <>
      <DialogLayout
        open={open}
        onOpenChange={onOpenChange}
        title="All Log Entries"
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
            "View and manage all your log entries across all trackers. Only you can delete your own entries."
          )
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {sortOptions.map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className="text-xs"
                >
                  {sortLabels[option]}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleSort}
              className="shrink-0"
              aria-label="Cycle sort options"
            >
              <ArrowUpDown className="size-4" />
            </Button>
          </div>

          {/* Tracker filter buttons */}
          {uniqueTrackers.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="pb-2">
                <Button
                  variant={isAllSelected ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAllTrackers}
                  className="text-xs"
                >
                  {isAllSelected ? "Deselect All" : "Select All Trackers"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueTrackers.map((tracker) => (
                  <Button
                    key={tracker.id}
                    variant={selectedTrackers.has(tracker.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTracker(tracker.id)}
                    className="text-xs"
                  >
                    {tracker.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-muted-foreground text-sm">
              Loading entries...
            </div>
          ) : filteredAndSortedEntries.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              {selectedTrackers.size === 0
                ? "No trackers selected. Select at least one tracker to view entries."
                : "No log entries found for the selected trackers."}
            </div>
          ) : (
            filteredAndSortedEntries.map((entry) => {
              const isDeleted = entry.isDeleted || false;
              const trackerName = entry.tracker?.name.replace(/_/g, " ") || "Unknown";
              return (
                <Card
                  key={`${entry.trackerId}-${entry._id}`}
                  className={`p-4 ${
                    isDeleted
                      ? "opacity-50 border-dashed border-2 border-destructive"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium text-primary">
                          {trackerName}
                        </div>
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
              );
            })
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
};
