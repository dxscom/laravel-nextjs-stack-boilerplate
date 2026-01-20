/**
 * SSO Services - Configured instances for this app
 *
 * Service factories from @famgia/omnify-react-sso, configured with app's apiUrl.
 *
 * Usage:
 *   import { roleService, permissionService } from "@/lib/ssoService";
 *   await roleService.list();
 *
 * For types, import from @/omnify/schemas or @famgia/omnify-react-sso directly.
 */

import {
  createAuthService,
  createTokenService,
  createRoleService,
  createPermissionService,
  createTeamService,
  createUserRoleService,
  createBranchService,
  getScopeLabel,
  getEffectivePermissions,
} from "@famgia/omnify-react-sso";

// =============================================================================
// Configuration
// =============================================================================

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

// =============================================================================
// Service Instances
// =============================================================================

export const authService = createAuthService({ apiUrl });
export const tokenService = createTokenService({ apiUrl });
export const roleService = createRoleService({ apiUrl });
export const permissionService = createPermissionService({ apiUrl });
export const teamService = createTeamService({ apiUrl });
export const userRoleService = createUserRoleService({ apiUrl });
export const branchService = createBranchService({ apiUrl });

// =============================================================================
// Helpers
// =============================================================================

export { getScopeLabel, getEffectivePermissions };
