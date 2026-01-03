import { useQuery } from "@tanstack/react-query";
import { trackersApi, Tracker } from "@/src/api/trackers/trackers.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

export const useTrackers = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: trackers,
    isLoading,
    error,
    refetch,
  } = useQuery<Tracker[]>({
    queryKey: ["trackers"],
    queryFn: trackersApi.getTrackers,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    trackers: trackers || [],
    isLoading,
    error,
    refetch,
  };
};
