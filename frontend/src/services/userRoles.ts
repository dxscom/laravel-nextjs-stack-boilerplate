/**
 * User Role Service - API client for scoped role assignments
 *
 * Implements Branch-Level Permissions management:
 * - Global: org_id=null, branch_id=null → Role applies everywhere
 * - Org-wide: org_id=X, branch_id=null → Role applies to all branches in org
 * - Branch: org_id=X, branch_id=Y → Role applies only to specific branch
 */

import api from "@/lib/api";
import type { Role } from "@famgia/omnify-react-sso";

// =============================================================================
// Types
// =============================================================================

export type RoleScope = "global" | "org-wide" | "branch";

export interface RoleAssignment {
  id: string | null;
  role: {
    id: string;
    name: string;
    slug: string;
    level: number;
  };
  console_org_id: string | null;
  console_branch_id: string | null;
  scope: RoleScope;
  created_at: string | null;
}

export interface UserRoleListResponse {
  data: RoleAssignment[];
}

export interface AssignRoleInput {
  role_id: string;
  console_org_id?: string | null;
  console_branch_id?: string | null;
}

export interface AssignRoleResponse {
  message: string;
  data: {
    role: {
      id: string;
      name: string;
      slug: string;
      level: number;
    };
    console_org_id: string | null;
    console_branch_id: string | null;
    scope: RoleScope;
  };
}

export interface SyncRolesInput {
  roles: string[]; // Role IDs or slugs
  console_org_id?: string | null;
  console_branch_id?: string | null;
}

export interface SyncRolesResponse {
  message: string;
  attached: string[];
  detached: string[];
  scope: RoleScope;
}

export interface RemoveRoleResponse {
  message: string;
  removed: number;
}

// =============================================================================
// Service
// =============================================================================

export const userRoleService = {
  /**
   * List user's role assignments with scope information
   */
  list: async (userId: string): Promise<RoleAssignment[]> => {
    const response = await api.get<UserRoleListResponse>(
      `/api/admin/sso/users/${userId}/roles`
    );
    return response.data.data;
  },

  /**
   * List user's role assignments filtered by branch
   */
  listByBranch: async (
    userId: string,
    orgId: string,
    branchId: string | null
  ): Promise<RoleAssignment[]> => {
    const all = await userRoleService.list(userId);

    // Filter assignments that apply to this branch:
    // 1. Global assignments (org=null)
    // 2. Org-wide assignments (org=X, branch=null)
    // 3. Branch-specific assignments (org=X, branch=Y)
    return all.filter((a) => {
      // Global applies everywhere
      if (a.console_org_id === null) return true;

      // Must be same org
      if (a.console_org_id !== orgId) return false;

      // Org-wide applies to all branches
      if (a.console_branch_id === null) return true;

      // Branch-specific must match
      return a.console_branch_id === branchId;
    });
  },

  /**
   * Assign a role to user with scope
   */
  assign: async (
    userId: string,
    input: AssignRoleInput
  ): Promise<AssignRoleResponse> => {
    const response = await api.post<AssignRoleResponse>(
      `/api/admin/sso/users/${userId}/roles`,
      input
    );
    return response.data;
  },

  /**
   * Remove a role assignment from user
   */
  remove: async (
    userId: string,
    roleId: string,
    orgId?: string | null,
    branchId?: string | null
  ): Promise<RemoveRoleResponse> => {
    const response = await api.delete<RemoveRoleResponse>(
      `/api/admin/sso/users/${userId}/roles/${roleId}`,
      {
        data: {
          console_org_id: orgId ?? null,
          console_branch_id: branchId ?? null,
        },
      }
    );
    return response.data;
  },

  /**
   * Sync roles for user in a specific scope
   */
  sync: async (
    userId: string,
    input: SyncRolesInput
  ): Promise<SyncRolesResponse> => {
    const response = await api.put<SyncRolesResponse>(
      `/api/admin/sso/users/${userId}/roles/sync`,
      input
    );
    return response.data;
  },
};

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Get effective permissions for a user at a specific branch
 * based on their role assignments
 */
export const getEffectivePermissions = (
  roleAssignments: RoleAssignment[],
  allRoles: Role[],
  orgId: string,
  branchId: string | null
): string[] => {
  const permissions = new Set<string>();

  // Filter applicable assignments
  const applicableAssignments = roleAssignments.filter((a) => {
    if (a.console_org_id === null) return true;
    if (a.console_org_id !== orgId) return false;
    if (a.console_branch_id === null) return true;
    return a.console_branch_id === branchId;
  });

  // Collect permissions from all applicable roles
  for (const assignment of applicableAssignments) {
    const role = allRoles.find((r) => r.id === assignment.role.id);
    if (role?.permissions) {
      for (const perm of role.permissions) {
        if (typeof perm === "string") {
          permissions.add(perm);
        } else if (perm.slug) {
          permissions.add(perm.slug);
        }
      }
    }
  }

  return Array.from(permissions);
};

/**
 * Get scope label for display
 */
export const getScopeLabel = (
  scope: RoleScope,
  locale: "en" | "ja" | "vi" = "vi"
): string => {
  const labels: Record<RoleScope, Record<string, string>> = {
    global: { en: "Global", ja: "グローバル", vi: "Toàn hệ thống" },
    "org-wide": { en: "Organization", ja: "組織全体", vi: "Toàn tổ chức" },
    branch: { en: "Branch", ja: "支店限定", vi: "Chi nhánh" },
  };
  return labels[scope][locale] || labels[scope]["en"];
};
