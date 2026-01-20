# Frontend (Next.js + Ant Design)

Next.js application with Ant Design UI, TanStack Query, and Omnify schema integration.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

| Category    | Technology                         |
| ----------- | ---------------------------------- |
| Framework   | Next.js 15 (App Router)            |
| UI          | Ant Design 6                       |
| State       | TanStack Query (React Query)       |
| Auth        | SSO via `@famgia/omnify-react-sso` |
| Validation  | Zod                                |
| i18n        | next-intl                          |
| Testing     | Vitest + Testing Library           |
| HTTP Client | Axios                              |

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (providers)
│   ├── page.tsx                # Home page
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard page
│   │   └── __tests__/          # Tests
│   │       └── page.test.tsx
│   └── (dashboard)/            # Dashboard layout group
│       ├── layout.tsx
│       └── admin/
│           ├── roles/
│           └── permissions/
│
├── lib/                        # Utilities & configured services
│   ├── ssoService.ts           # SSO services (roleService, etc.)
│   ├── queryKeys.ts            # React Query keys
│   ├── api.ts                  # Axios instance
│   └── dayjs.ts                # Date formatting
│
├── services/                   # App-specific API services
│   ├── users.ts                # User CRUD (/api/users)
│   └── auth.ts                 # Email/password auth (fallback)
│
├── omnify/schemas/             # TypeScript types & Zod schemas
│   └── index.ts                # Re-exports from package
│
├── features/                   # Feature-specific components
│   └── users/
│       └── UserTable.tsx
│
├── components/                 # Shared components
│   └── layouts/
│       └── DashboardLayout.tsx
│
├── i18n/                       # Internationalization
│   └── config.ts
│
└── test/                       # Test utilities
    ├── utils.tsx               # renderWithProviders
    └── mocks/
        └── omnify-react-sso.ts # SSO mock
```

## Import Patterns

### Types & Schemas

```typescript
// All types from unified location
import type { User, Role, Permission, Branch } from "@/omnify/schemas";

// Zod schemas for validation
import { userCreateSchema, roleCreateSchema } from "@/omnify/schemas";

// i18n helpers
import { getUserFieldLabel, getRoleFieldLabel } from "@/omnify/schemas";
```

### Services

```typescript
// SSO services (configured with NEXT_PUBLIC_API_URL)
import {
  authService,      // SSO auth (callback, logout)
  roleService,      // Role CRUD
  permissionService,// Permission CRUD
  branchService,    // Branch list
  userRoleService,  // Role assignments
} from "@/lib/ssoService";

// App-specific services
import { userService } from "@/services/users";
import { authService } from "@/services/auth"; // Email/password fallback
```

### Hooks

```typescript
// SSO hooks (from package)
import { useSso, useAuth, useOrganization } from "@famgia/omnify-react-sso";

// Usage
const { user, isAuthenticated, currentOrg, logout } = useSso();
```

### Query Keys

```typescript
import { queryKeys } from "@/lib/queryKeys";
import { ssoQueryKeys } from "@famgia/omnify-react-sso";

// App queries
useQuery({
  queryKey: queryKeys.users.list(),
  queryFn: () => userService.list(),
});

// SSO queries
useQuery({
  queryKey: ssoQueryKeys.roles.list(),
  queryFn: () => roleService.list(),
});
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  @famgia/omnify-react-sso (Package)                             │
│  ├── Hooks: useSso, useAuth, useOrganization                    │
│  ├── Components: SsoProvider, ProtectedRoute                    │
│  ├── Services: createAuthService, createRoleService, etc.       │
│  └── Types & Schemas: Role, Permission, Branch, etc.            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/ssoService.ts (Configured Instances)                       │
│  ├── authService = createAuthService({ apiUrl })                │
│  ├── roleService = createRoleService({ apiUrl })                │
│  └── ...                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Components                                                      │
│  import { roleService } from "@/lib/ssoService";                │
│  await roleService.list();                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

### Test Location

Tests go in `__tests__/` folders next to source files:

```
src/app/dashboard/
├── page.tsx
└── __tests__/
    └── page.test.tsx    ✅

src/features/users/
├── UserTable.tsx
└── __tests__/
    └── UserTable.test.tsx
```

### Test Utilities

```typescript
import { renderWithProviders, mockSsoContext } from "@/test/utils";
import { setMockSsoData, resetMockSsoData } from "@/test/mocks/omnify-react-sso";

// Setup mock data
beforeEach(() => {
  setMockSsoData({
    user: { id: 1, name: "Test", email: "test@test.com" },
    isAuthenticated: true,
  });
});

// Render with providers
renderWithProviders(<MyComponent />);
```

### Run Tests

```bash
pnpm test              # Run once
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # With coverage
```

## Scripts

| Command          | Description        |
| ---------------- | ------------------ |
| `pnpm dev`       | Development server |
| `pnpm build`     | Production build   |
| `pnpm start`     | Start production   |
| `pnpm test`      | Run tests          |
| `pnpm lint`      | ESLint check       |
| `pnpm typecheck` | TypeScript check   |

## Environment Variables

Create `.env.local`:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# SSO
NEXT_PUBLIC_SSO_CONSOLE_URL=https://console.example.com
NEXT_PUBLIC_SSO_SERVICE_SLUG=your-service
```

## SSO Authentication Flow

```
1. User visits protected page
   └── ProtectedRoute checks isAuthenticated

2. Not authenticated → Redirect to SSO Console
   └── /sso/login?service=your-service&redirect=...

3. User logs in at Console
   └── Console redirects back with code

4. Callback page (/sso/callback)
   └── authService.callback({ code })
   └── Sets session cookie

5. User is authenticated
   └── useSso() returns user data
```

## Related Documentation

- [Omnify Schemas Guide](../docs/omnify-schemas.md) - Schema management
- [Package README](https://github.com/omnifyjp/omnify-client-react-sso) - SSO package docs
