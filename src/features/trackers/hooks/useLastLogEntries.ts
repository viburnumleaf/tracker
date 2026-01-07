import { useQueries } from "@tanstack/react-query";
import { trackersApi, LogEntry } from "@/src/api/trackers/trackers.api";
import { Tracker } from "@/src/api/trackers/trackers.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

/**
 * Hook to get last log entry for each tracker
 */
export const useLastLogEntries = (trackers: Tracker[]) => {
  const { isAuthenticated } = useAuth();

  const queries = useQueries({
    queries: trackers.map((tracker) => ({
      queryKey: ["trackers", tracker._id, "last-entry"],
      queryFn: () => trackersApi.getLogEntries(tracker._id, false, 1, 0),
      enabled: isAuthenticated && !!tracker._id,
      retry: false,
      staleTime: 30 * 1000, // 30 seconds
      select: (data: (LogEntry & { isDeleted?: boolean })[]): LogEntry | null => {
        return data.length > 0 ? data[0] : null;
      },
    })),
  });

  // Create a map of tracker ID to last log entry
  const lastLogEntriesMap = new Map<string, LogEntry | null>();
  trackers.forEach((tracker, index) => {
    const query = queries[index];
    lastLogEntriesMap.set(tracker._id, query.data ?? null);
  });

  const isLoading = queries.some((query) => query.isLoading);

  return {
    lastLogEntriesMap,
    isLoading,
  };
};
