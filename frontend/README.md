# Frontend (Next.js + Ant Design)

Next.js application with Ant Design UI, TanStack Query, and Omnify schema integration.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Ant Design 6
- **State**: TanStack Query (React Query)
- **Auth**: SSO via `@famgia/omnify-react-sso`
- **Validation**: Zod
- **i18n**: next-intl

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── lib/                    # Utilities & service wrappers
│   ├── ssoService.ts       # SSO service instances
│   └── queryKeys.ts        # React Query keys
├── services/               # App-specific API services
├── omnify/schemas/         # Generated schemas (app-specific only)
├── features/               # Feature components
└── test/                   # Test utilities & mocks
```

## Schema Usage

### SSO Schemas (Branch, Role, Permission, etc.)

Import from the `@famgia/omnify-react-sso` package:

```typescript
// Services
import { roleService, branchService } from "@/lib/ssoService";

// Zod schemas + i18n
import { 
  roleCreateSchema, 
  getRoleFieldLabel 
} from "@famgia/omnify-react-sso/schemas";
```

### App-specific Schemas (User, etc.)

Import from local omnify folder:

```typescript
import { 
  userCreateSchema, 
  getUserFieldLabel 
} from "@/omnify/schemas";
```

> **Note**: SSO schemas are NOT in `@/omnify/schemas`. They come from the package.
> See [docs/omnify-schemas.md](../docs/omnify-schemas.md) for details.

## Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run test      # Run tests
npm run lint      # ESLint
```

## Generate Schemas

From project root:

```bash
pnpm generate     # Generates schemas + auto-cleanup
```

This will:
1. Generate all backend migrations/models
2. Generate frontend TypeScript types
3. Auto-remove SSO schemas (they come from package)

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SSO_CONSOLE_URL=https://console.example.com
NEXT_PUBLIC_SSO_SERVICE_SLUG=your-service
```
