import { useQuery } from "@tanstack/react-query";
import { trackersApi, LogEntry, Tracker } from "@/src/api/trackers/trackers.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useTrackers } from "./useTrackers";

export type AllLogEntry = LogEntry & {
  isDeleted?: boolean;
  tracker?: Tracker;
};

export const useAllLogEntries = (includeDeleted: boolean = false) => {
  const { isAuthenticated } = useAuth();
  const { trackers, isLoading: trackersLoading } = useTrackers(includeDeleted);

  const {
    data: allEntries,
    isLoading: entriesLoading,
    error,
    refetch,
  } = useQuery<AllLogEntry[]>({
    queryKey: ["all-log-entries", includeDeleted, trackers.map((t) => t._id).join(",")],
    queryFn: async () => {
      if (trackers.length === 0) return [];

      // Fetch all log entries from all trackers in parallel
      const entriesPromises = trackers.map(async (tracker) => {
        try {
          const entries = await trackersApi.getLogEntries(tracker._id, includeDeleted);
          return entries.map((entry) => ({
            ...entry,
            tracker,
          }));
        } catch (error) {
          console.error(`Error fetching entries for tracker ${tracker._id}:`, error);
          return [];
        }
      });

      const entriesArrays = await Promise.all(entriesPromises);
      // Flatten the array of arrays into a single array
      return entriesArrays.flat();
    },
    enabled: isAuthenticated && !trackersLoading && trackers.length > 0,
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    entries: allEntries || [],
    isLoading: trackersLoading || entriesLoading,
    error,
    refetch,
  };
};
