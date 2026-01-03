import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, RegisterCredentials } from "@/src/api/auth/auth.api";

export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      authApi.signUp(credentials),
    onSuccess: async (_, variables) => {
      // After successful registration, automatically sign in
      try {
        await authApi.signIn({
          email: variables.email,
          password: variables.password,
        });
        // Invalidate and refetch session
        queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
        queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
        router.push("/dashboard");
      } catch {
        // If auto-login fails, redirect to login page
        router.push("/login");
      }
    },
  });
};

