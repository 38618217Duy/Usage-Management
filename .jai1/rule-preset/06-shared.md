# Shared Package

## Overview

The `@project/shared` package contains shared types, Zod schemas, constants, and RPC contracts used by both API and extension.

## Structure

```
packages/shared/
├── src/
│   ├── index.ts              # Public exports
│   ├── types/                # TypeScript types
│   │   ├── index.ts          # Type exports
│   │   ├── user.ts           # User types
│   │   ├── auth.ts           # Auth types
│   │   └── pagination.ts     # Pagination types
│   ├── schemas/              # Zod validation schemas
│   │   ├── index.ts          # Schema exports
│   │   ├── user.ts           # User schemas
│   │   ├── auth.ts           # Auth schemas
│   │   └── pagination.ts     # Pagination schemas
│   ├── constants/            # Configuration constants
│   │   ├── index.ts          # Constant exports
│   │   └── config.ts         # API URL, etc.
│   └── rpc/                  # RPC contract
│       └── contract.ts       # API type re-exports
├── dist/                     # Built output
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Types

### User Types

```typescript
// src/types/user.ts
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}
```

### Auth Types

```typescript
// src/types/auth.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
```

### Pagination Types

```typescript
// src/types/pagination.ts
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Zod Schemas

Schemas mirror types but add runtime validation:

```typescript
// src/schemas/user.ts
import { z } from 'zod';

export const userRoleSchema = z.enum(['user', 'admin']);
export const userStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// Infer types from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### Pagination Schemas

```typescript
// src/schemas/pagination.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
```

## Constants

```typescript
// src/constants/config.ts
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
```

## RPC Type Sharing

### Export API Types

The API exports its type through the shared package:

```typescript
// src/rpc/contract.ts

// Re-export the API type from the api package
// This is imported at build time for type checking
export type { AppType } from '@project/api';
```

### Use in Extension

```typescript
// apps/extension/src/lib/api-client.ts
import { hc } from 'hono/client';
import type { AppType } from '@project/shared';

export const apiClient = hc<AppType>('http://localhost:8787');

// Full type safety
const res = await apiClient.api.users.me.$get();
const { data } = await res.json(); // data is typed
```

## Build Configuration

### package.json

```json
{
  "name": "@project/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "zod": "^3.x"
  }
}
```

### tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

## Public Exports

```typescript
// src/index.ts

// Types
export * from './types';

// Schemas
export * from './schemas';

// Constants
export * from './constants';

// RPC
export type { AppType } from './rpc/contract';
```

## Best Practices

1. **Types + Schemas together**: Keep type definitions and Zod schemas in sync
2. **Test schemas**: Write tests for validation edge cases
3. **Keep it minimal**: Only share what's truly needed
4. **Build first**: Always build shared before other packages
5. **Version together**: Shared package version should match other packages
