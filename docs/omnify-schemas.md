# Omnify Schemas Guide

## Overview

This project uses **Omnify** for schema-driven development. Schemas define your data models once, and Omnify generates:

- **Backend**: Laravel migrations, models, factories
- **Frontend**: TypeScript types, Zod validation schemas, i18n labels

## Schema Sources

### 1. SSO Schemas (from Package)

SSO-related schemas (Branch, Role, Permission, Team, etc.) come from the `@famgia/omnify-react-sso` package:

```typescript
// ✅ Correct: Import from package
import { 
  roleService,
  roleCreateSchema, 
  getRoleFieldLabel 
} from "@famgia/omnify-react-sso/schemas";

// ❌ Wrong: Don't import from local omnify folder
import { roleCreateSchema } from "@/omnify/schemas"; // This doesn't exist!
```

**Why?**
- SSO schemas are maintained in `omnify-client-laravel-sso` (Laravel package)
- The React package `@famgia/omnify-react-sso` generates and bundles them during build
- Ensures consistency across all projects using SSO

### 2. App-specific Schemas (Local)

Your application's own schemas are generated locally:

```
.omnify/schemas/              ← Define your schemas here (YAML)
frontend/src/omnify/schemas/  ← Generated TypeScript (auto)
```

Example import:

```typescript
// App-specific schemas
import { 
  userCreateSchema, 
  getUserFieldLabel 
} from "@/omnify/schemas";
```

## Build Process

### SSO Package Build (when SSO schemas change)

```bash
cd /Users/f.satoshi/dev/omnify/packages/omnify-client-react-sso
pnpm build
```

This:
1. Fetches latest schemas from `omnify-client-laravel-sso`
2. Runs `omnify generate --types-only`
3. Bundles everything into `dist/`

### Boilerplate Generate (for app-specific schemas)

```bash
# From boilerplate root
pnpm generate
```

This runs `omnify generate` which:
- Generates backend migrations/models
- Generates frontend TypeScript **excluding** SSO schemas

### Package Linking (Development)

The boilerplate links directly to the package source:

```json
// frontend/package.json
"@famgia/omnify-react-sso": "link:/Users/f.satoshi/dev/omnify/packages/omnify-client-react-sso"
```

After rebuilding the package, the boilerplate automatically uses the new dist.

### Exclude Configuration

SSO schemas are excluded via `omnify.config.ts`:

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
  ],
})
```

This ensures SSO schemas are **not generated** locally - import them from `@famgia/omnify-react-sso` instead.

## Adding New Schemas

### App-specific Schema

1. Create YAML in `.omnify/schemas/`:

```yaml
# .omnify/schemas/Product.yaml
displayName:
  ja: 商品
  en: Product
  vi: Sản phẩm

properties:
  name:
    type: String
    length: 255
    displayName:
      ja: 商品名
      en: Product Name
  price:
    type: Decimal
    precision: 10
    scale: 2
```

2. Run generate:

```bash
pnpm generate
```

3. Use in frontend:

```typescript
import { 
  productCreateSchema,
  getProductFieldLabel 
} from "@/omnify/schemas";
```

## Import Cheatsheet

```typescript
// =============================================================================
// SSO (from package)
// =============================================================================

// Services
import { 
  roleService, 
  permissionService, 
  branchService 
} from "@famgia/omnify-react-sso";

// OR from lib wrapper
import { 
  roleService, 
  permissionService 
} from "@/lib/ssoService";

// Zod schemas + i18n
import { 
  roleCreateSchema,
  getRoleFieldLabel,
  branchI18n 
} from "@famgia/omnify-react-sso/schemas";

// Query keys
import { ssoQueryKeys } from "@famgia/omnify-react-sso";

// =============================================================================
// App-specific (local)
// =============================================================================

// Types, Zod, i18n
import { 
  userCreateSchema,
  getUserFieldLabel 
} from "@/omnify/schemas";

// Common types
import type { 
  LocaleMap, 
  DateTimeString 
} from "@/omnify/schemas";

// Plugin enums (Japan)
import { 
  Prefecture,
  getPrefectureLabel 
} from "@/omnify/schemas";
```

## Troubleshooting

### "Cannot find module '@omnify-base/...'"

Run `pnpm generate` to create the `@omnify-base` folder in `node_modules/`.

### "Module has no exported member 'roleCreateSchema'"

You're importing from the wrong place. SSO schemas come from the package:

```typescript
// ❌ Wrong
import { roleCreateSchema } from "@/omnify/schemas";

// ✅ Correct
import { roleCreateSchema } from "@famgia/omnify-react-sso/schemas";
```

### SSO schemas appearing in local folder

If you see `Branch.ts`, `Role.ts`, etc. in `frontend/src/omnify/schemas/`:

1. Check `omnify.config.ts` has `exclude` option configured
2. Delete the SSO files manually
3. Re-run `pnpm generate`

### After changing SSO schemas

If you modify schemas in `omnify-client-laravel-sso`:

```bash
# 1. Rebuild the React SSO package
cd /Users/f.satoshi/dev/omnify/packages/omnify-client-react-sso
pnpm build

# 2. Boilerplate automatically uses new dist (linked)
```
