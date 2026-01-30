# Project Overview

## Monorepo Structure

This is a **pnpm workspaces monorepo** for a browser extension with backend API:

```
├── apps/
│   ├── api/                    # Hono RPC API (Cloudflare Workers + D1)
│   │   ├── src/
│   │   │   ├── core/           # Database, middleware, errors, DI
│   │   │   ├── modules/        # Feature modules (auth, user)
│   │   │   ├── admin/          # Admin routes
│   │   │   ├── routes/         # Route aggregation
│   │   │   └── shared/         # Cross-module utilities
│   │   ├── drizzle/            # Drizzle migrations
│   │   └── migrations/         # Wrangler migrations
│   │
│   └── extension/              # WXT Browser Extension (React + shadcn)
│       └── src/
│           ├── entrypoints/    # sidepanel, background, content
│           ├── components/     # React + shadcn/ui
│           ├── pages/          # Page components
│           ├── stores/         # Zustand state
│           ├── hooks/          # Custom hooks
│           ├── providers/      # Context providers
│           └── lib/            # Utilities
│
├── packages/
│   └── shared/                 # Shared types, schemas, constants
│       └── src/
│           ├── types/          # TypeScript types
│           ├── schemas/        # Zod validation schemas
│           ├── constants/      # Configuration constants
│           └── rpc/            # RPC contract
│
├── admin.sh                    # Admin CLI script
├── user.sh                     # User CLI script
├── setup-test-user.sh          # Setup test credentials
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | Hono RPC + Cloudflare Workers + Drizzle ORM |
| Database | Cloudflare D1 (SQLite at edge) |
| Extension | WXT + React 19 + Side Panel UI |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand with chrome.storage persistence |
| Types | TypeScript with shared RPC contracts |
| Validation | Zod schemas |

## Package Naming

- `@project/api` - Backend API
- `@project/extension` - Browser extension
- `@project/shared` - Shared types, schemas, constants

## Development Workflow

```bash
# Install dependencies
pnpm install

# Setup database (local)
pnpm db:migrate

# Run all in parallel
pnpm dev

# Run specific app
pnpm dev:api        # API on localhost:8787
pnpm dev:extension  # Extension dev mode

# Build
pnpm build

# Deploy API to Cloudflare
pnpm --filter @project/api deploy
```

## CLI Scripts

### Setup Test User

```bash
./setup-test-user.sh
```

### User CLI

```bash
./user.sh help              # Show help
./user.sh register email password "Name"
./user.sh me                # Get current user
./user.sh update "New Name" # Update name
./user.sh password old new  # Change password
```

### Admin CLI

```bash
./admin.sh help                      # Show help
./admin.sh list                      # List all users
./admin.sh list --search=john        # Search users
./admin.sh update <id> --role=admin  # Update user role
./admin.sh bulk-status suspended <ids...>
```

## Key Concepts

### 1. Modular API Architecture

API uses Dependency Injection pattern with feature modules:

```
src/modules/user/
├── user.routes.ts      # HTTP endpoints
├── user.service.ts     # Business logic
├── user.repository.ts  # Data access
├── user.schemas.ts     # Zod validation
└── index.ts            # Module exports
```

### 2. Type-Safe RPC

The API and extension share type definitions through `@project/shared`:

1. Define RPC routes in `apps/api/src/modules/`
2. Export app type from `apps/api/src/rpc/client.ts`
3. Import types in extension via `@project/shared`
4. Full end-to-end type safety

### 3. Side Panel UI

Extension uses Chrome's Side Panel API as main UI instead of popup.
