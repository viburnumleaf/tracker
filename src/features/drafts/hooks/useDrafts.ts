import { useQuery } from "@tanstack/react-query";
import { draftsApi, DraftEntry } from "@/src/api/drafts/drafts.api";
import { useAuth } from "@/src/features/auth/hooks/useAuth";

export const useDrafts = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: drafts,
    isLoading,
    error,
    refetch,
  } = useQuery<DraftEntry[], Error>({
    queryKey: ["drafts"],
    queryFn: () => draftsApi.getDrafts(),
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    drafts: drafts || [],
    isLoading,
    error,
    refetch,
  };
};
