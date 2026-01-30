# Hono RPC API

## Overview

The API uses Hono RPC with Drizzle ORM on Cloudflare Workers (D1 database). It follows a **Hybrid Modular Architecture** with Dependency Injection.

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts                    # App entry point + DI middleware
│   │
│   ├── core/                       # Framework & infrastructure
│   │   ├── container/              # Dependency Injection
│   │   │   ├── index.ts            # createContainer() factory
│   │   │   └── middleware.ts       # containerMiddleware
│   │   ├── database/               # Drizzle ORM setup
│   │   │   ├── index.ts            # createDatabase() factory
│   │   │   └── schema/             # All DB schemas
│   │   │       ├── index.ts        # Schema exports
│   │   │       ├── _common.ts      # Shared column helpers
│   │   │       └── user.schema.ts  # User table definition
│   │   ├── errors/                 # Error classes
│   │   │   ├── app-error.ts        # Base AppError class
│   │   │   └── http-errors.ts      # NotFoundError, ConflictError
│   │   ├── middleware/             # Global middleware
│   │   │   ├── auth.ts             # JWT authentication
│   │   │   └── error-handler.ts    # Global error handler
│   │   └── types/                  # TypeScript types
│   │       ├── bindings.ts         # Cloudflare bindings
│   │       └── context.ts          # AppEnv, AppContext
│   │
│   ├── modules/                    # Feature modules (self-contained)
│   │   ├── auth/                   # Authentication module
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schemas.ts
│   │   └── user/                   # User CRUD module
│   │       ├── index.ts
│   │       ├── user.routes.ts
│   │       ├── user.service.ts
│   │       ├── user.repository.ts
│   │       ├── user.schemas.ts
│   │       └── user.types.ts
│   │
│   ├── admin/                      # Admin-only modules
│   │   ├── index.ts
│   │   ├── middleware/
│   │   │   └── admin-guard.ts      # Admin role check
│   │   └── users/                  # Admin user management
│   │       ├── index.ts
│   │       ├── admin-users.routes.ts
│   │       ├── admin-users.service.ts
│   │       └── admin-users.schemas.ts
│   │
│   ├── routes/                     # Route aggregation layer
│   │   ├── routes.ts               # Main aggregator (/api/*)
│   │   ├── api.routes.ts           # Public routes
│   │   └── admin.routes.ts         # Admin routes
│   │
│   └── shared/                     # Cross-module utilities
│       └── utils/
│           └── password.ts         # Password hashing
│
├── drizzle/                        # Drizzle migrations (generated)
├── migrations/                     # Wrangler migrations (copied)
├── wrangler.toml
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Dependency Injection Pattern

Routes use clean DI - services are injected via middleware:

```typescript
// OLD PATTERN (repeated in every handler)
.get('/me', async (c) => {
  const db = createDatabase(c.env.DB);
  const service = new UserService(new UserRepository(db));
  // ...
})

// NEW PATTERN (clean, one-liner)
.get('/me', async (c) => {
  const { userService } = c.get('services');
  const user = await userService.getUserById(c.get('userId'));
  return c.json({ success: true, data: user });
})
```

### How It Works

1. **Container Factory** (`core/container/index.ts`):
   ```typescript
   export function createContainer(env: Bindings): ServiceContainer {
     const db = createDatabase(env.DB);
     const userRepository = new UserRepository(db);
     const userService = new UserService(userRepository);
     const authService = new AuthService(userRepository, env.JWT_SECRET);
     return { db, userRepository, userService, authService };
   }
   ```

2. **Middleware Injection** (`core/container/middleware.ts`):
   ```typescript
   export const containerMiddleware = createMiddleware<AppEnv>(async (c, next) => {
     const services = createContainer(c.env);
     c.set('services', services);
     await next();
   });
   ```

3. **Usage in Routes**:
   ```typescript
   const { userService, authService } = c.get('services');
   ```

## Adding a New Module

1. Create module folder: `src/modules/product/`
2. Add files:
   - `product.routes.ts` - HTTP endpoints
   - `product.service.ts` - Business logic
   - `product.repository.ts` - Data access
   - `product.schemas.ts` - Zod validation
   - `product.types.ts` - TypeScript types
   - `index.ts` - Module exports
3. Add schema: `src/core/database/schema/product.schema.ts`
4. Register in container: `src/core/container/index.ts`
5. Mount routes: `src/routes/api.routes.ts`

## Database & Migrations

### Schema Definition

```typescript
// src/core/database/schema/user.schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).default('user'),
  status: text('status', { enum: ['active', 'inactive', 'suspended'] }).default('active'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Migration Workflow

```bash
# 1. Modify schema in src/core/database/schema/

# 2. Generate migration (auto-copies to migrations/)
pnpm db:generate

# 3. Apply to LOCAL database
pnpm db:migrate

# 4. Apply to PRODUCTION database
pnpm db:migrate:prod
```

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate migration from schema |
| `pnpm db:migrate` | Apply to LOCAL D1 |
| `pnpm db:migrate:prod` | Apply to PRODUCTION D1 |
| `pnpm db:studio` | Open Drizzle Studio (local) |
| `pnpm db:studio:prod` | Open Drizzle Studio (production) |

## Validation with Zod

```typescript
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

app.post('/users', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json'); // Fully typed
  // ...
});
```

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Zod validation failed |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Routes | `{module}.routes.ts` | `user.routes.ts` |
| Service | `{module}.service.ts` | `user.service.ts` |
| Repository | `{module}.repository.ts` | `user.repository.ts` |
| Zod Schemas | `{module}.schemas.ts` | `user.schemas.ts` |
| DB Schema | `{module}.schema.ts` | `user.schema.ts` |
| Admin Routes | `admin-{module}.routes.ts` | `admin-users.routes.ts` |

## Development

```bash
# Local dev
pnpm dev

# Deploy to Cloudflare
pnpm deploy

# Type check
pnpm typecheck
```
