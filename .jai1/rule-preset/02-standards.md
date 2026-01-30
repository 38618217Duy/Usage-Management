# Coding Standards

## Language

- **Code & Comments**: English
- **User-facing messages**: Vietnamese (or project language)
- **Commit messages**: English, Conventional Commits format

## TypeScript Standards

### Strict Mode

All packages MUST use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### Import/Export

- Use named exports (avoid default exports)
- Use absolute imports with path aliases
- Group imports: external → internal → relative

```typescript
// External
import { Hono } from 'hono';
import { z } from 'zod';

// Internal (workspace packages)
import type { User } from '@project/shared';

// Relative
import { userRoutes } from './routes/user';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user.routes.ts` |
| Routes | kebab-case | `/api/users/me` |
| Functions | camelCase | `getUserById` |
| Types | PascalCase | `UserResponse` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Zod schemas | camelCase + Schema | `userSchema` |

### Type Definitions

Use Zod for runtime validation with inferred types:

```typescript
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

// Infer type
type User = z.infer<typeof userSchema>;

// Use for validation
const result = userSchema.safeParse(data);
```

## Error Handling

Use typed errors with consistent response format:

```typescript
// All errors return this format
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}

// Use custom error classes
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
  }
}
```

## File Organization

### API (apps/api)

```
src/
├── index.ts                    # Hono app entry + DI middleware
├── core/                       # Framework & infrastructure
│   ├── container/              # Dependency Injection
│   ├── database/               # Drizzle ORM + schemas
│   ├── errors/                 # Error classes
│   ├── middleware/             # Auth, error handler
│   └── types/                  # Bindings, context types
├── modules/                    # Feature modules
│   ├── auth/                   # Authentication
│   │   ├── auth.routes.ts
│   │   ├── auth.service.ts
│   │   └── auth.schemas.ts
│   └── user/                   # User CRUD
│       ├── user.routes.ts
│       ├── user.service.ts
│       ├── user.repository.ts
│       └── user.schemas.ts
├── admin/                      # Admin-only modules
│   ├── middleware/             # Admin guard
│   └── users/                  # Admin user management
├── routes/                     # Route aggregation
│   ├── routes.ts               # Main aggregator
│   ├── api.routes.ts           # Public routes
│   └── admin.routes.ts         # Admin routes
└── shared/                     # Cross-module utilities
```

### Extension (apps/extension)

```
src/
├── entrypoints/               # WXT entrypoints
│   ├── sidepanel/             # Side panel UI (main)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── background.ts          # Service worker
│   └── content/               # Content scripts
├── components/                # React components
│   ├── ui/                    # shadcn/ui components
│   └── layout/                # Layout components
├── pages/                     # Page components
│   ├── HomePage.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── stores/                    # Zustand stores
│   ├── auth.store.ts
│   └── app.store.ts
├── hooks/                     # React hooks
│   ├── use-theme.ts
│   └── use-toast.ts
├── providers/                 # Context providers
│   └── theme-provider.tsx
└── lib/                       # Utilities
    ├── api-client.ts          # Hono RPC client
    ├── storage.ts             # Storage utilities
    └── utils.ts               # Helpers
```

### Shared Package (packages/shared)

```
src/
├── types/                     # TypeScript types
│   ├── user.ts
│   ├── auth.ts
│   └── pagination.ts
├── schemas/                   # Zod validation schemas
│   ├── user.ts
│   ├── auth.ts
│   └── pagination.ts
├── constants/                 # Configuration
│   └── config.ts
├── rpc/                       # RPC contract
│   └── contract.ts
└── index.ts                   # Public exports
```

## File Naming Conventions

### API Files

| Type | Pattern | Example |
|------|---------|---------|
| Routes | `{module}.routes.ts` | `user.routes.ts` |
| Service | `{module}.service.ts` | `user.service.ts` |
| Repository | `{module}.repository.ts` | `user.repository.ts` |
| Zod Schemas | `{module}.schemas.ts` | `user.schemas.ts` |
| DB Schema | `{module}.schema.ts` | `user.schema.ts` |
| Admin Routes | `admin-{module}.routes.ts` | `admin-users.routes.ts` |

### Extension Files

| Type | Pattern | Example |
|------|---------|---------|
| Pages | `{Name}Page.tsx` | `HomePage.tsx` |
| Stores | `{name}.store.ts` | `auth.store.ts` |
| Hooks | `use-{name}.ts` | `use-theme.ts` |
| Providers | `{name}-provider.tsx` | `theme-provider.tsx` |
