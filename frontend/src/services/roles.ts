/**
 * Role Service - API client for role management
 *
 * Endpoints from omnifyjp/omnify-client-laravel-sso v2.1
 */

import api from "@/lib/api";
import type { Role } from "@famgia/omnify-react-sso";

// =============================================================================
// Types
// =============================================================================

export interface RoleListResponse {
  data: Role[];
}

export interface RoleResponse {
  data: Role;
  message?: string;
}

// Simplified permission type for role's permissions response
export interface RolePermission {
  id: string;
  name: string;
  slug: string;
  group: string | null;
}

export interface RoleWithPermissions extends Omit<Role, 'permissions'> {
  permissions: RolePermission[];
}

export interface RoleCreateInput {
  slug: string;
  name: string;
  level: number;
  description?: string | null;
}

export interface RoleUpdateInput {
  name?: string;
  level?: number;
  description?: string | null;
}

export interface SyncPermissionsInput {
  permissions: string[]; // Permission IDs or slugs
}

export interface SyncPermissionsResponse {
  message: string;
  attached: number;
  detached: number;
}

// =============================================================================
// Service
// =============================================================================

export const roleService = {
  /**
   * List all roles
   */
  list: async (): Promise<Role[]> => {
    const response = await api.get<RoleListResponse>("/api/admin/sso/roles");
    return response.data.data;
  },

  /**
   * Get role details with permissions
   */
  get: async (id: string): Promise<RoleWithPermissions> => {
    const response = await api.get<{ data: RoleWithPermissions }>(`/api/admin/sso/roles/${id}`);
    return response.data.data;
  },

  /**
   * Create a new role
   */
  create: async (input: RoleCreateInput): Promise<Role> => {
    const response = await api.post<RoleResponse>("/api/admin/sso/roles", input);
    return response.data.data;
  },

  /**
   * Update a role
   */
  update: async (id: string, input: RoleUpdateInput): Promise<Role> => {
    const response = await api.put<RoleResponse>(`/api/admin/sso/roles/${id}`, input);
    return response.data.data;
  },

  /**
   * Delete a role
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/sso/roles/${id}`);
  },

  /**
   * Get role's permissions
   */
  getPermissions: async (id: string): Promise<{ role: Role; permissions: any[] }> => {
    const response = await api.get(`/api/admin/sso/roles/${id}/permissions`);
    return response.data;
  },

  /**
   * Sync role's permissions
   */
  syncPermissions: async (id: string, input: SyncPermissionsInput): Promise<SyncPermissionsResponse> => {
    const response = await api.put<SyncPermissionsResponse>(`/api/admin/sso/roles/${id}/permissions`, input);
    return response.data;
  },
};
