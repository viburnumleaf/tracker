import { useQuery } from "@tanstack/react-query";
import { authApi, Session } from "@/src/api/auth/auth.api";

export const useAuth = () => {
  const {
    data: session,
    isLoading,
    error,
    refetch,
  } = useQuery<Session | null>({
    queryKey: ["auth", "session"],
    queryFn: authApi.getSession,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    error,
    refetch,
  };
};

