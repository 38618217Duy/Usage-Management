---
trigger: always_on
description: HonoJS + Drizzle ORM stack rules for Edge Computing and Cloudflare Workers
---

# HonoJS + Drizzle ORM Rules

> Stack khuyến nghị cho Edge Computing và Cloudflare Workers

## Khi nào sử dụng

- Cloudflare Workers / Edge Functions
- Serverless APIs với yêu cầu nhẹ và nhanh
- Dự án cần type-safety từ database đến API
- APIs với Cloudflare D1 (SQLite at edge)

## Tech Stack

- **Framework**: HonoJS - ultra-lightweight (~13KB), native Workers support
- **ORM**: Drizzle ORM - type-safe, zero runtime dependencies
- **Validation**: Zod + @hono/zod-validator
- **Database**: Cloudflare D1 hoặc SQLite

---

## Kiến trúc Scalable Modular

### Cấu trúc thư mục

```
src/
├── index.ts                    # App entry - chỉ mount routes
├── shared/
│   ├── middleware/             # Các middleware dùng chung
│   ├── lib/                    # Utilities: response, errors
│   └── types/                  # TypeScript types, bindings
├── modules/                    # Feature modules theo domain
│   └── [module-name]/
│       ├── [module].routes.ts
│       ├── [module].handler.ts
│       ├── [module].schema.ts
│       └── [module].service.ts
└── db/
    ├── schema/                 # Drizzle schemas theo domain
    └── client.ts               # Database client factory
```

### Nguyên tắc module

1. **Tự chứa**: Mỗi module chứa đầy đủ routes, handlers, schemas
2. **Độc lập**: Module không import trực tiếp từ module khác
3. **Chia sẻ qua shared/**: Logic dùng chung đặt trong shared/

---

## Quy tắc Naming

| Loại file | Pattern | Ví dụ |
|-----------|---------|-------|
| Route | `[module].routes.ts` | `users.routes.ts` |
| Handler | `[module].handler.ts` | `users.handler.ts` |
| Schema (Zod) | `[module].schema.ts` | `users.schema.ts` |
| Schema (Drizzle) | `[table].schema.ts` | `users.schema.ts` |
| Service | `[module].service.ts` | `users.service.ts` |
| Middleware | `[name].middleware.ts` | `auth.middleware.ts` |

---

## Quy tắc Routes

### Thứ tự mount routes (QUAN TRỌNG)

Mount routes theo thứ tự từ **specific đến generic**:

1. Management/Admin routes (cụ thể nhất)
2. API routes theo feature
3. Public routes (catch-all cuối cùng)

**Lý do**: Hono match route theo thứ tự khai báo. Route generic trước sẽ intercept routes cụ thể.

### Route structure

- Mỗi module export 1 Hono instance
- Middleware apply trong module, không apply global
- Handler tách riêng file, routes chỉ define paths

---

## Quy tắc Handler

### Cấu trúc handler

1. **Input**: Lấy từ context (params, query, body)
2. **Validation**: Sử dụng Zod schema
3. **Business logic**: Call service nếu phức tạp
4. **Database**: Sử dụng Drizzle queries
5. **Output**: Return JSON response chuẩn

### Error handling

- Wrap trong try-catch
- Log error với context
- Return standardized error response
- Không expose internal errors ra client

---

## Quy tắc Validation

### Sử dụng Zod

- Mỗi endpoint có schema riêng
- Schema đặt trong file `[module].schema.ts`
- Export type từ schema: `type X = z.infer<typeof xSchema>`
- Sử dụng `@hono/zod-validator` middleware

### Validation flow

1. Request → Zod middleware validate
2. Invalid → Auto return 400 với error details
3. Valid → Handler nhận typed data

---

## Quy tắc Database

### Drizzle Schema

- Mỗi table 1 file schema riêng
- Export table và types (Select, Insert)
- Re-export tất cả từ `schema/index.ts`
- Schema match 1:1 với database structure

### Query patterns

- Sử dụng Drizzle query builder
- Tránh raw SQL trừ khi cần complex aggregations
- Transactions khi cần atomic operations
- Connection từ env.DB (D1 binding)

---

## Quy tắc Middleware

### Auth middleware

- Validate token/key từ header
- Set user/key data vào context variables
- Return 401 sớm nếu invalid
- Không block cho public routes

### Middleware order

1. Logger (đầu tiên)
2. CORS
3. Auth (theo route group)
4. Validation (per route)

---

## Quy tắc Response

### Success response

- HTTP 200/201/204 tùy operation
- Body: `{ data: ... }` hoặc `{ ...fields }`
- Include metadata nếu cần (pagination, timestamp)

### Error response

- HTTP status phù hợp (400, 401, 404, 500)
- Body: `{ error: true, message: "...", status: N }`
- Consistent format across all endpoints

---

## Best Practices

### NÊN làm

- TypeScript strict mode
- Split schemas theo domain
- Handler mỏng, service cho logic phức tạp
- Zod validation cho mọi input
- Mount specific routes trước generic
- Export types từ schema files

### KHÔNG nên làm

- Business logic trong routes
- Raw SQL khi có thể dùng Drizzle
- Mix auth types trong 1 middleware
- Monolithic handler files
- Skip error handling
- Import cross-module trực tiếp

---

## Dependencies

### Production
- hono
- @hono/zod-validator
- drizzle-orm
- zod

### Development
- typescript
- @cloudflare/workers-types
- drizzle-kit
- wrangler

---

## Scripts thường dùng

- `dev`: Chạy local dev server
- `deploy`: Deploy lên Cloudflare
- `typecheck`: Kiểm tra TypeScript
- `db:generate`: Generate Drizzle migrations
- `db:push`: Push schema lên database
