/**
 * Permission Service - API client for permission management
 *
 * Endpoints from omnifyjp/omnify-client-laravel-sso v2.1
 */

import api from "@/lib/api";
import type { Permission } from "@famgia/omnify-react-sso";

// =============================================================================
// Types
// =============================================================================

export interface PermissionListResponse {
  data: Permission[];
}

export interface PermissionResponse {
  data: Permission;
  message?: string;
}

export interface PermissionCreateInput {
  slug: string;
  name: string;
  group?: string | null;
}

export interface PermissionUpdateInput {
  name?: string;
  slug?: string;
  group?: string | null;
}

export interface PermissionMatrixResponse {
  roles: Array<{ id: string; name: string; slug: string }>;
  permissions: Array<{ id: string; name: string; slug: string; group: string | null }>;
  matrix: Record<string, string[]>; // role_id -> [permission_id, ...]
}

// =============================================================================
// Service
// =============================================================================

export const permissionService = {
  /**
   * List all permissions
   */
  list: async (): Promise<Permission[]> => {
    const response = await api.get<PermissionListResponse>("/api/admin/sso/permissions");
    return response.data.data;
  },

  /**
   * Get permission details
   */
  get: async (id: string): Promise<Permission> => {
    const response = await api.get<{ data: Permission }>(`/api/admin/sso/permissions/${id}`);
    return response.data.data;
  },

  /**
   * Create a new permission
   */
  create: async (input: PermissionCreateInput): Promise<Permission> => {
    const response = await api.post<PermissionResponse>("/api/admin/sso/permissions", input);
    return response.data.data;
  },

  /**
   * Update a permission
   */
  update: async (id: string, input: PermissionUpdateInput): Promise<Permission> => {
    const response = await api.put<PermissionResponse>(`/api/admin/sso/permissions/${id}`, input);
    return response.data.data;
  },

  /**
   * Delete a permission
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/sso/permissions/${id}`);
  },

  /**
   * Get role-permission matrix
   */
  getMatrix: async (): Promise<PermissionMatrixResponse> => {
    const response = await api.get<PermissionMatrixResponse>("/api/admin/sso/permission-matrix");
    return response.data;
  },
};
