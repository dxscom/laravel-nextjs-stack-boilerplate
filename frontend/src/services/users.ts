/**
 * User Service - API client for local user management
 *
 * This manages users in the app's database (not SSO users).
 */

import api from "@/lib/api";
import type { User, UserCreate, UserUpdate } from "@famgia/omnify-react-sso";

// Re-export User type for convenience
export type { User };

// =============================================================================
// Types
// =============================================================================

export interface UserListParams {
  page?: number;
  per_page?: number;
  filter?: {
    search?: string;
  };
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
}

export interface UserListResponse {
  data: User[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UserResponse {
  data: User;
  message?: string;
}

// =============================================================================
// Service
// =============================================================================

export const userService = {
  /**
   * List users with pagination and filtering
   */
  list: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>("/api/users", { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  get: async (id: string): Promise<User> => {
    const response = await api.get<UserResponse>(`/api/users/${id}`);
    return response.data.data;
  },

  /**
   * Create a new user
   */
  create: async (input: UserCreate): Promise<User> => {
    const response = await api.post<UserResponse>("/api/users", input);
    return response.data.data;
  },

  /**
   * Update a user
   */
  update: async (id: string, input: UserUpdate): Promise<User> => {
    const response = await api.put<UserResponse>(`/api/users/${id}`, input);
    return response.data.data;
  },

  /**
   * Delete a user
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};
