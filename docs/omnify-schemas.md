# Omnify Schemas Guide

## Overview

This project uses **Omnify** for schema-driven development. Schemas define your data models once, and Omnify generates:

- **Backend**: Laravel migrations, models, factories
- **Frontend**: TypeScript types, Zod validation schemas, i18n labels

## Schema Sources

### SSO Schemas (from Package)

SSO schemas (User, Role, Permission, Branch, Team) come from `@famgia/omnify-react-sso` package and are **re-exported** through `@/omnify/schemas`:

```typescript
// ✅ Correct: Import from unified location
import type { User, Role, Permission, Branch } from "@/omnify/schemas";
import { 
  roleCreateSchema, 
  getRoleFieldLabel,
  userCreateSchema,
} from "@/omnify/schemas";
```

### App-specific Schemas (Local)

Your application's own schemas are generated locally in `.omnify/schemas/` (YAML) and output to `frontend/src/omnify/schemas/`.

## Import Pattern Summary

| What                                       | Import From                |
| ------------------------------------------ | -------------------------- |
| Types (`User`, `Role`, `Permission`, etc.) | `@/omnify/schemas`         |
| Zod schemas (`userCreateSchema`, etc.)     | `@/omnify/schemas`         |
| i18n helpers (`getRoleFieldLabel`, etc.)   | `@/omnify/schemas`         |
| Services (`roleService`, etc.)             | `@/lib/ssoService`         |
| Hooks (`useSso`, `useAuth`)                | `@famgia/omnify-react-sso` |
| Service-specific types (`RoleAssignment`)  | `@famgia/omnify-react-sso` |

## Build Process

### Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  omnify-client-laravel-sso (Laravel Package)                    │
│  └── database/schemas/Sso/*.yaml  (Source of truth)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ pnpm build (copies schemas)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  @famgia/omnify-react-sso (React Package)                       │
│  └── dist/  (bundled types, schemas, services, hooks)           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ linked via pnpm
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Boilerplate / Your App                                         │
│  └── frontend/src/omnify/schemas/index.ts                       │
│      (re-exports from package + app-specific schemas)           │
└─────────────────────────────────────────────────────────────────┘
```

### When SSO Schemas Change

```bash
# 1. Rebuild the React SSO package
cd /path/to/omnify/packages/omnify-client-react-sso
pnpm build

# 2. Boilerplate automatically uses new dist (linked)
```

### When App Schemas Change

```bash
# From boilerplate root
pnpm generate
```

### Package Linking (Development)

```json
// frontend/package.json
"@famgia/omnify-react-sso": "link:/path/to/omnify/packages/omnify-client-react-sso"
```

## Configuration

### Exclude SSO Schemas from Local Generation

In `omnify.config.ts`:

```typescript
typescriptPlugin({
  modelsPath: "./frontend/src/omnify/schemas",
  exclude: [
    "Branch",
    "Permission",
    "Role",
    "RolePermission",
    "Team",
    "TeamPermission",
    "User",
  ],
})
```

## Code Examples

### Importing Types and Services

```typescript
// Types from unified schemas
import type { Role, Permission, Branch } from "@/omnify/schemas";

// Services from ssoService (configured with apiUrl)
import { roleService, permissionService, branchService } from "@/lib/ssoService";

// Hooks from package
import { useSso } from "@famgia/omnify-react-sso";

// Service-specific types (not in schemas)
import type { RoleAssignment, PermissionMatrix } from "@famgia/omnify-react-sso";
```

### Using Zod Schemas

```typescript
import { roleCreateSchema, userCreateSchema } from "@/omnify/schemas";

// Validate form data
const result = roleCreateSchema.safeParse(formData);
if (!result.success) {
  console.error(result.error);
}
```

### Using i18n Helpers

```typescript
import { getRoleFieldLabel, getUserFieldLabel } from "@/omnify/schemas";

// Get localized field label
const label = getRoleFieldLabel("name", "ja"); // "名前"
```

## Adding New App Schemas

1. Create YAML in `.omnify/schemas/`:

```yaml
# .omnify/schemas/Product.yaml
displayName:
  ja: 商品
  en: Product

properties:
  name:
    type: String
    length: 255
    displayName:
      ja: 商品名
      en: Product Name
```

2. Run generate:

```bash
pnpm generate
```

3. Use in frontend:

```typescript
import type { Product } from "@/omnify/schemas";
import { productCreateSchema, getProductFieldLabel } from "@/omnify/schemas";
```

## Troubleshooting

### "Cannot find module '@omnify-base/...'"

Run `pnpm generate` to create the `@omnify-base` folder in `node_modules/`.

### SSO schemas appearing in local folder

If you see `Branch.ts`, `Role.ts`, etc. in `frontend/src/omnify/schemas/`:

1. Check `omnify.config.ts` has `exclude` option configured (including `"User"`)
2. Delete the SSO files manually
3. Re-run `pnpm generate`

### Type errors after package changes

Rebuild the SSO package:

```bash
cd /path/to/omnify/packages/omnify-client-react-sso
pnpm build
```
