"use client";

import { Tracker } from "@/src/api/trackers/trackers.api";
import { TrackersList } from "./TrackersList";

type TrackersSectionProps = {
  trackers: (Tracker & { isDeleted?: boolean })[];
  isAdminMode: boolean;
  isLoading: boolean;
  searchQuery: string;
  onTrackerClick: (tracker: Tracker) => void;
  onViewLogsClick: (tracker: Tracker) => void;
  onEditClick: (tracker: Tracker) => void;
  onDeleteClick: (tracker: Tracker & { isDeleted?: boolean }) => void;
  isDeleting?: boolean;
  includeDeleted?: boolean;
}

export const TrackersSection = ({
  trackers,
  isAdminMode,
  isLoading,
  searchQuery,
  onTrackerClick,
  onViewLogsClick,
  onEditClick,
  onDeleteClick,
  isDeleting,
  includeDeleted = false,
}: TrackersSectionProps) => {
  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">Loading trackers...</div>
    );
  }

  if (trackers.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        {searchQuery
          ? "No trackers found matching your search"
          : "No trackers yet. Create your first tracker to get started!"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My trackers</h2>
        {isAdminMode && (
          <span className="text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
            Admin Mode (Caps Lock)
          </span>
        )}
      </div>
      <TrackersList
        trackers={trackers}
        isAdminMode={isAdminMode}
        onTrackerClick={onTrackerClick}
        onViewLogsClick={onViewLogsClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        isDeleting={isDeleting}
        includeDeleted={includeDeleted}
      />
    </div>
  );
}
