/**
 * SSO Service instance configured for this app
 *
 * Uses createSsoService from @famgia/omnify-client-sso-react
 */

import { createSsoService } from "@famgia/omnify-client-sso-react";

// Export types for convenience
export type {
  Role,
  Permission,
  RoleWithPermissions,
  PermissionMatrix,
  ApiToken,
  TeamWithPermissions,
  TeamPermissionDetail,
  OrphanedTeam,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePermissionInput,
  UpdatePermissionInput,
  SyncPermissionsInput,
  CleanupOrphanedInput,
} from "@famgia/omnify-client-sso-react";

// Branch types
export interface Branch {
  id: number;
  code: string;
  name: string;
  is_headquarters: boolean;
  is_primary: boolean;
  is_assigned: boolean;
  access_type: 'explicit' | 'implicit';
  timezone: string | null;
  currency: string | null;
  locale: string | null;
}

export interface BranchesResponse {
  all_branches_access: boolean;
  branches: Branch[];
  primary_branch_id: number | null;
  organization: {
    id: number;
    slug: string;
    name: string;
  };
}

// Create and export the service instance
export const ssoService = createSsoService({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
});

// Branch service - extends ssoService
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const branchService = {
  /**
   * Get branches for current user in organization
   */
  async getBranches(orgSlug?: string): Promise<BranchesResponse> {
    const params = orgSlug ? `?organization_slug=${orgSlug}` : '';
    const response = await fetch(`${apiUrl}/api/sso/branches${params}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch branches: ${response.status}`);
    }
    
    return response.json();
  },
};
