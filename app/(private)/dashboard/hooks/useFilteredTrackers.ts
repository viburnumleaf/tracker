import { useMemo } from "react";
import { Tracker } from "@/src/api/trackers/trackers.api";

export function useFilteredTrackers(
  trackers: (Tracker & { isDeleted?: boolean })[],
  searchQuery: string,
  isAdminMode: boolean
) {
  return useMemo(() => {
    // Filter out deleted trackers when not in admin mode
    const visibleTrackers = isAdminMode
      ? trackers
      : trackers.filter((tracker) => !tracker.isDeleted);

    // Apply search filter
    if (!searchQuery.trim()) return visibleTrackers;
    const query = searchQuery.toLowerCase();
    return visibleTrackers.filter((tracker) =>
      tracker.name.toLowerCase().includes(query)
    );
  }, [trackers, searchQuery, isAdminMode]);
}
