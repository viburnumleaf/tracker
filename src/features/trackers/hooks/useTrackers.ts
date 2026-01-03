import { useQuery } from "@tanstack/react-query";
import { trackersApi, Tracker } from "@/src/api/trackers/trackers.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

export const useTrackers = (includeDeleted: boolean = false) => {
  const { isAuthenticated } = useAuth();

  const {
    data: trackers,
    isLoading,
    error,
    refetch,
  } = useQuery<(Tracker & { isDeleted?: boolean })[]>({
    queryKey: ["trackers", includeDeleted],
    queryFn: () => trackersApi.getTrackers(includeDeleted),
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
