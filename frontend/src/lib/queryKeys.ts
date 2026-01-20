/**
 * Query Keys - Centralized key management for TanStack Query
 *
 * SSO keys imported from @famgia/omnify-client-sso-react
 * App-specific keys defined here
 */

import { ssoQueryKeys } from "@famgia/omnify-client-sso-react";
import type { UserListParams } from "@/services/users";

export const queryKeys = {
  // Auth - current user
  user: ["user"] as const,

  // Users CRUD (app-specific)
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: UserListParams) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // SSO Admin - roles, permissions, branches
  sso: {
    ...ssoQueryKeys,

    // Roles management
    roles: {
      all: ["sso", "roles"] as const,
      lists: () => [...queryKeys.sso.roles.all, "list"] as const,
      list: () => [...queryKeys.sso.roles.lists()] as const,
      details: () => [...queryKeys.sso.roles.all, "detail"] as const,
      detail: (id: string) => [...queryKeys.sso.roles.details(), id] as const,
      permissions: (id: string) => [...queryKeys.sso.roles.detail(id), "permissions"] as const,
    },

    // Permissions management
    permissions: {
      all: ["sso", "permissions"] as const,
      lists: () => [...queryKeys.sso.permissions.all, "list"] as const,
      list: () => [...queryKeys.sso.permissions.lists()] as const,
      details: () => [...queryKeys.sso.permissions.all, "detail"] as const,
      detail: (id: string) => [...queryKeys.sso.permissions.details(), id] as const,
      matrix: () => [...queryKeys.sso.permissions.all, "matrix"] as const,
    },

    // Branches
    branches: {
      all: ["sso", "branches"] as const,
      list: (orgSlug?: string) => [...queryKeys.sso.branches.all, orgSlug] as const,
    },

    // User role assignments (scoped)
    userRoles: {
      all: ["sso", "user-roles"] as const,
      list: (userId: string) => [...queryKeys.sso.userRoles.all, userId] as const,
    },
  },
} as const;
