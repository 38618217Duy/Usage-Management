# Workspace Management

## pnpm Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Cross-Package References

```json
{
  "dependencies": {
    "@project/shared": "workspace:*"
  }
}
```

## TypeScript Project References

### Root tsconfig.json

```json
{
  "extends": "./tsconfig.base.json",
  "files": [],
  "references": [
    { "path": "apps/api" },
    { "path": "apps/extension" },
    { "path": "packages/shared" }
  ]
}
```

## NPM Scripts

### Development

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "dev:api": "pnpm --filter @project/api dev",
    "dev:extension": "pnpm --filter @project/extension dev",
    "build": "pnpm -r build",
    "build:shared": "pnpm --filter @project/shared build",
    "typecheck": "tsc --build"
  }
}
```

### Database Commands

```json
{
  "scripts": {
    "db:generate": "pnpm --filter @project/api db:generate",
    "db:migrate": "pnpm --filter @project/api db:migrate",
    "db:migrate:prod": "pnpm --filter @project/api db:migrate:prod",
    "db:migrate:list": "pnpm --filter @project/api db:migrate:list",
    "db:studio": "pnpm --filter @project/api db:studio",
    "db:studio:prod": "pnpm --filter @project/api db:studio:prod"
  }
}
```

### Testing

```json
{
  "scripts": {
    "test": "pnpm -r test",
    "test:run": "pnpm -r test:run"
  }
}
```

## Database Workflow

### Migration Process

```bash
# 1. Modify schema in apps/api/src/core/database/schema/

# 2. Generate migration (auto-copies to migrations/)
pnpm db:generate

# 3. Check pending migrations
pnpm db:migrate:list

# 4. Apply to LOCAL database
pnpm db:migrate

# 5. Apply to PRODUCTION database
pnpm db:migrate:prod
```

### How Migrations Work

1. **Drizzle generates SQL** → `./drizzle/` folder
2. **Script copies to** → `./migrations/` folder (wrangler reads from here)
3. **Wrangler tracks** → `d1_migrations` table in database
4. **`db:migrate` only applies** → migrations not yet in `d1_migrations` table

### Drizzle Studio

```bash
# Local database
pnpm db:studio

# Production database (requires env vars)
pnpm db:studio:prod
```

## Build Order

1. Build shared first (contains types and schemas)
2. Build API and extension in parallel

```bash
pnpm build:shared
pnpm --filter @project/api --filter @project/extension build
```

## Adding New Packages

### New Shared Package

1. Create `packages/new-package/`
2. Add `package.json` with workspace reference
3. Add to root `tsconfig.json` references
4. Reference in dependent packages

### New App

1. Create `apps/new-app/`
2. Configure build tooling
3. Add workspace reference to shared packages
4. Add dev script to root package.json

## Environment Variables

### API (.dev.vars - local only)

```bash
JWT_SECRET=my-local-development-secret
```

### Production (Cloudflare Dashboard or wrangler.toml)

```toml
[vars]
JWT_SECRET = "production-secret-here"
```

### Drizzle Studio Remote

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
D1_DATABASE_ID=your-d1-database-id
CLOUDFLARE_API_TOKEN=your-api-token
```
