import { apiClient } from "../client";
import { AxiosResponse } from "axios";

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

export interface Session {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  session?: {
    id: string;
    expiresAt: string;
  };
}

export interface User {
  _id: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  email: string;
  activities?: string[];
}

// Auth API methods
export const authApi = {
  // Sign in with email and password
  signIn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/api/auth/sign-in/email",
      credentials
    );
    return response.data;
  },

  // Sign up with email and password
  signUp: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await apiClient.post(
      "/api/auth/sign-up/email",
      credentials
    );
    return response.data;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await apiClient.post("/api/auth/sign-out");
  },

  // Get current session
  getSession: async (): Promise<Session | null> => {
    try {
      const response: AxiosResponse<Session> = await apiClient.get(
        "/api/auth/get-session"
      );
      return response.data;
    } catch {
      return null;
    }
  },

  // Get current user data
  getUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.get("/api/auth/user");
    return response.data;
  },
};

