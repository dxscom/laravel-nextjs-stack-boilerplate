/**
 * Query Keys - Centralized key management for TanStack Query
 *
 * SSO keys imported from @famgia/omnify-react-sso
 * App-specific keys defined here
 */

import { ssoQueryKeys } from "@famgia/omnify-react-sso";
import type { UserListParams } from "@/services/users";

export const queryKeys = {
  // =========================================================================
  // Auth - current user (app-specific)
  // =========================================================================
  user: ["user"] as const,

  // =========================================================================
  // Users CRUD (app-specific)
  // =========================================================================
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: UserListParams) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // =========================================================================
  // SSO - Re-export from package (roles, permissions, branches, userRoles)
  // =========================================================================
  sso: ssoQueryKeys,
} as const;
