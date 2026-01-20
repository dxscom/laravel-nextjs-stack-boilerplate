/**
 * Auth Service - API client for authentication
 *
 * Note: This boilerplate uses SSO authentication via @famgia/omnify-client-sso-react.
 * This service is for traditional email/password auth fallback.
 */

import api from "@/lib/api";
import type { User } from "@famgia/omnify-react-sso";

// =============================================================================
// Types
// =============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
}

// =============================================================================
// Service
// =============================================================================

export const authService = {
  /**
   * Get current authenticated user
   */
  me: async (): Promise<User> => {
    const response = await api.get<{ data: User }>("/api/user");
    return response.data.data;
  },

  /**
   * Login with email/password
   */
  login: async (input: LoginInput): Promise<void> => {
    await api.get("/sanctum/csrf-cookie");
    await api.post("/login", input);
  },

  /**
   * Register a new user
   */
  register: async (input: RegisterInput): Promise<void> => {
    await api.get("/sanctum/csrf-cookie");
    await api.post("/register", input);
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await api.post("/logout");
  },
};
