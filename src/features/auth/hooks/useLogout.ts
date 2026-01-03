import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/api/auth/auth.api";

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: ["auth"] });
      // Invalidate to ensure refetch doesn't happen
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear local state
      queryClient.removeQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.push("/login");
    },
  });
};

