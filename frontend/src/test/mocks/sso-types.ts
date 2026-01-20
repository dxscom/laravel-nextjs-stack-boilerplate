// Mock types for SSO
export interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  description?: string | null;
  permissions?: (string | { slug: string })[];
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  group: string | null;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface PermissionMatrix {
  matrix: Record<string, string[]>;
}
