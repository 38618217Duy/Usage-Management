# TDD: Account Management

> **Feature**: Account Management | **Version**: 1.0 | **Complexity**: Medium
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ AddAccountForm  │  │   AccountCard   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      ▼                                       │
│              ┌───────────────┐                               │
│              │  useAccounts  │ (Custom Hook)                 │
│              └───────┬───────┘                               │
│                      ▼                                       │
│              ┌───────────────┐                               │
│              │     api.ts    │                               │
│              └───────┬───────┘                               │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                      Backend (Express)                        │
│  ┌────────────────────┐                                      │
│  │ account.routes.js  │ (API Layer)                          │
│  └─────────┬──────────┘                                      │
│            ▼                                                  │
│  ┌────────────────────┐                                      │
│  │ account.service.js │ (Business Logic)                     │
│  └─────────┬──────────┘                                      │
│            ▼                                                  │
│  ┌────────────────────┐                                      │
│  │    account.js      │ (Data Model)                         │
│  └─────────┬──────────┘                                      │
│            ▼                                                  │
│  ┌────────────────────┐                                      │
│  │   accounts.json    │ (File Storage)                       │
│  └────────────────────┘                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Implementation

### 2.1 Data Model (`src/models/account.js`)

```javascript
// Account Status Enum
export const AccountStatus = {
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  LOGGED_IN: 'LOGGED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
};

// Account Schema
const account = {
  id: "string (UUID v4)",
  email: "string",
  profilePath: "string (relative path)",
  status: "AccountStatus",
  lastRunAt: "ISO datetime | null",
  lastError: "string | null",
  createdAt: "ISO datetime",
  updatedAt: "ISO datetime"
};
```

### 2.2 AccountModel Methods

| Method | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `ensureFileExists()` | - | void | Tạo accounts.json nếu chưa tồn tại |
| `readAll()` | - | Account[] | Đọc tất cả accounts |
| `writeAll(accounts)` | Account[] | void | Ghi tất cả accounts |
| `findById(id)` | string | Account \| null | Tìm account theo ID |
| `findByEmail(email)` | string | Account \| null | Tìm account theo email |
| `create(email)` | string | {error, account} | Tạo account mới |
| `update(id, updates)` | string, object | Account \| null | Cập nhật account |
| `updateStatus(id, status, error)` | string, string, string? | Account \| null | Cập nhật status |
| `updateLastRun(id, error)` | string, string? | Account \| null | Cập nhật lastRunAt |
| `delete(id)` | string | boolean | Xóa account |

**File**: `@src/models/account.js`

### 2.3 AccountService Methods

| Method | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getAll()` | - | Account[] | Lấy tất cả accounts |
| `getById(id)` | string | Account \| null | Lấy account theo ID |
| `create(email)` | string | {error, account} | Tạo account mới với validation |
| `delete(id)` | string | boolean | Xóa account |
| `updateStatus(id, status, error)` | string, string, string? | Account \| null | Cập nhật status |
| `updateLastRun(id, error)` | string, string? | Account \| null | Cập nhật lastRunAt |
| `getLoggedInAccounts()` | - | Account[] | Lấy accounts có status LOGGED_IN |

**File**: `@src/services/account.service.js`

### 2.4 API Routes

| Method | Endpoint | Handler | Mô tả |
|--------|----------|---------|-------|
| GET | `/api/accounts` | getAll | Lấy danh sách accounts |
| GET | `/api/accounts/:id` | getById | Lấy chi tiết account |
| POST | `/api/accounts` | create | Tạo account mới |
| DELETE | `/api/accounts/:id` | delete | Xóa account |

**File**: `@src/routes/account.routes.js`

---

## 3. Frontend Implementation

### 3.1 Custom Hook: useAccounts

```typescript
interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAccount: (email: string) => Promise<ApiResponse>;
  deleteAccount: (id: string) => Promise<ApiResponse>;
  openBrowser: (id: string) => Promise<ApiResponse>;
  verifyLogin: (id: string) => Promise<ApiResponse>;
  downloadCSV: (id: string) => Promise<ApiResponse>;
  runAll: () => Promise<ApiResponse>;
}
```

**File**: `@client/src/hooks/useAccounts.ts`

### 3.2 Components

#### AddAccountForm
- Input field cho email
- Submit button
- Error message display
- Loading state

**Props**: `{ onAdd: (email: string) => Promise<ApiResponse> }`

**File**: `@client/src/components/AddAccountForm.tsx`

#### AccountCard
- Hiển thị thông tin account
- Status badge (color-coded)
- Action buttons: Open Browser, Verify, Download, Delete
- Loading states cho từng action

**Props**:
```typescript
{
  account: Account;
  onOpenBrowser: (id: string) => Promise<ApiResponse>;
  onVerify: (id: string) => Promise<ApiResponse>;
  onDownload: (id: string) => Promise<ApiResponse>;
  onDelete: (id: string) => Promise<ApiResponse>;
}
```

**File**: `@client/src/components/AccountCard.tsx`

---

## 4. Data Flow

### 4.1 Create Account Flow

```
User Input Email
       │
       ▼
AddAccountForm.handleSubmit()
       │
       ▼
useAccounts.addAccount(email)
       │
       ▼
api.accounts.create(email)
       │
       ▼ POST /api/accounts
       │
account.routes.js
       │
       ▼
AccountService.create(email)
       │
       ├─► Validate email format
       │
       ▼
AccountModel.create(email)
       │
       ├─► Check email exists
       ├─► Generate UUID
       ├─► Create profile directory
       ├─► Save to accounts.json
       │
       ▼
Return new account
```

### 4.2 Delete Account Flow

```
User Click Delete
       │
       ▼
AccountCard.handleDelete()
       │
       ▼
useAccounts.deleteAccount(id)
       │
       ▼
api.accounts.delete(id)
       │
       ▼ DELETE /api/accounts/:id
       │
account.routes.js
       │
       ▼
AccountService.delete(id)
       │
       ▼
AccountModel.delete(id)
       │
       ├─► Find account
       ├─► Delete profile directory (fs.rm)
       ├─► Remove from accounts.json
       │
       ▼
Return success
```

---

## 5. File Storage

### 5.1 accounts.json Structure

```json
{
  "accounts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "profilePath": "profiles/acc-550e8400-e29b-41d4-a716-446655440000",
      "status": "NOT_LOGGED_IN",
      "lastRunAt": null,
      "lastError": null,
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T10:00:00.000Z"
    }
  ]
}
```

**Location**: `@accounts.json` (project root)

### 5.2 Profile Directory Structure

```
profiles/
├── acc-{uuid-1}/
│   ├── Default/
│   │   ├── Cookies
│   │   ├── Local Storage/
│   │   └── ...
│   └── ...
└── acc-{uuid-2}/
    └── ...
```

**Location**: `@profiles/` (gitignored)

---

## 6. Configuration

### 6.1 Paths Config

```javascript
paths: {
  root: ROOT_DIR,
  profiles: path.join(ROOT_DIR, 'profiles'),
  download: path.join(ROOT_DIR, 'download'),
  logs: path.join(ROOT_DIR, 'logs'),
  accountsFile: path.join(ROOT_DIR, 'accounts.json'),
}
```

**File**: `@src/config/index.js:14-19`

---

## 7. Error Handling

### 7.1 Backend Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERR-ACC-001",
    "message": "Email is required"
  }
}
```

### 7.2 Error Codes

| Code | HTTP | Trigger |
|------|------|---------|
| ERR-ACC-001 | 400 | Email validation failed |
| ERR-ACC-002 | 404 | Account not found |
| ERR-ACC-003 | 409 | Email already exists |
| ERR-SYS-001 | 500 | Internal server error |

---

## 8. Dependencies

### 8.1 Backend
- `uuid` - Generate unique IDs
- `fs/promises` - File system operations
- `path` - Path manipulation

### 8.2 Frontend
- `react` - UI framework
- `lucide-react` - Icons
