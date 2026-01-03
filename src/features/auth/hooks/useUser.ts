import { useQuery } from "@tanstack/react-query";
import { authApi, User } from "@/src/api/auth/auth.api";
import { useAuth } from "./useAuth";

export const useUser = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: authApi.getUser,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    refetch,
  };
};

