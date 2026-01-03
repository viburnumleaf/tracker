import { useQuery } from "@tanstack/react-query";
import { trackersApi, LogEntry } from "@/src/api/trackers/trackers.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

export const useLogEntries = (trackerId: string | null) => {
  const { isAuthenticated } = useAuth();

  const {
    data: entries,
    isLoading,
    error,
    refetch,
  } = useQuery<LogEntry[]>({
    queryKey: ["trackers", trackerId, "entries"],
    queryFn: () => trackersApi.getLogEntries(trackerId!),
    enabled: isAuthenticated && !!trackerId,
    retry: false,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    entries: entries || [],
    isLoading,
    error,
    refetch,
  };
};
