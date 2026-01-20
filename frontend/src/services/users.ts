/**
 * User Service - API client for user management
 */

import api from "@/lib/api";

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  console_user_id: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface UserCreateInput {
  name: string;
  email: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
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
  create: async (input: UserCreateInput): Promise<User> => {
    const response = await api.post<UserResponse>("/api/users", input);
    return response.data.data;
  },

  /**
   * Update a user
   */
  update: async (id: string, input: UserUpdateInput): Promise<User> => {
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
