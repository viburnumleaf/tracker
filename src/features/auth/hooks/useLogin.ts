import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, LoginCredentials } from "@/src/api/auth/auth.api";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.signIn(credentials),
    onSuccess: () => {
      // Invalidate and refetch session
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
      router.push("/dashboard");
    },
  });
};

