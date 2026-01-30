# FRD: Account Management

> **Feature**: Account Management | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng
Quản lý tài khoản Cursor với persistent browser profile. Cho phép thêm, xem, xóa tài khoản và theo dõi trạng thái đăng nhập của từng tài khoản.

### 1.2 Mục tiêu
- Quản lý nhiều tài khoản Cursor trong một hệ thống
- Mỗi tài khoản có browser profile riêng biệt
- Theo dõi trạng thái đăng nhập (NOT_LOGGED_IN, LOGGED_IN, SESSION_EXPIRED)

---

## 2. Functional Requirements

### 2.1 FR-001: Thêm tài khoản mới

**Mô tả**: Cho phép thêm tài khoản Cursor mới vào hệ thống

**Input**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Email format valid, không trùng lặp |

**Output**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "profilePath": "profiles/acc-{uuid}",
    "status": "NOT_LOGGED_IN",
    "lastRunAt": null,
    "lastError": null,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```

**Business Rules**:
- Email phải unique trong hệ thống
- Tự động tạo thư mục profile tại `profiles/acc-{uuid}`
- Trạng thái mặc định là `NOT_LOGGED_IN`

**API Endpoint**: `POST /api/accounts`

**File**: `@src/routes/account.routes.js:50-98`

---

### 2.2 FR-002: Lấy danh sách tài khoản

**Mô tả**: Lấy tất cả tài khoản trong hệ thống

**Input**: Không có

**Output**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "profilePath": "profiles/acc-{uuid}",
      "status": "LOGGED_IN",
      "lastRunAt": "ISO datetime",
      "lastError": null,
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ]
}
```

**API Endpoint**: `GET /api/accounts`

**File**: `@src/routes/account.routes.js:9-22`

---

### 2.3 FR-003: Lấy chi tiết tài khoản

**Mô tả**: Lấy thông tin chi tiết của một tài khoản

**Input**:
| Field | Type | Required | Source |
|-------|------|----------|--------|
| id | string | Yes | URL param |

**Output**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "profilePath": "profiles/acc-{uuid}",
    "status": "LOGGED_IN",
    "lastRunAt": "ISO datetime",
    "lastError": null,
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  }
}
```

**Error Cases**:
| Code | Message | HTTP Status |
|------|---------|-------------|
| ERR-ACC-002 | Account not found | 404 |

**API Endpoint**: `GET /api/accounts/:id`

**File**: `@src/routes/account.routes.js:24-48`

---

### 2.4 FR-004: Xóa tài khoản

**Mô tả**: Xóa tài khoản và thư mục profile liên quan

**Input**:
| Field | Type | Required | Source |
|-------|------|----------|--------|
| id | string | Yes | URL param |

**Output**:
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Business Rules**:
- Xóa thư mục profile tại `profiles/acc-{uuid}`
- Xóa record trong `accounts.json`

**Error Cases**:
| Code | Message | HTTP Status |
|------|---------|-------------|
| ERR-ACC-002 | Account not found | 404 |

**API Endpoint**: `DELETE /api/accounts/:id`

**File**: `@src/routes/account.routes.js:100-124`

---

## 3. Data Model

### 3.1 Account Schema

```javascript
{
  id: "string (UUID)",
  email: "string",
  profilePath: "string",
  status: "NOT_LOGGED_IN | LOGGED_IN | SESSION_EXPIRED",
  lastRunAt: "ISO datetime | null",
  lastError: "string | null",
  createdAt: "ISO datetime",
  updatedAt: "ISO datetime"
}
```

**File**: `@src/models/account.js:59-68`

### 3.2 Account Status Enum

```javascript
const AccountStatus = {
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  LOGGED_IN: 'LOGGED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
};
```

**File**: `@src/models/account.js:7-11`

---

## 4. Error Codes

| Code | Message | HTTP Status | Mô tả |
|------|---------|-------------|-------|
| ERR-ACC-001 | Email is required / Invalid email format | 400 | Email không hợp lệ |
| ERR-ACC-002 | Account not found | 404 | Không tìm thấy tài khoản |
| ERR-ACC-003 | Email already exists | 409 | Email đã tồn tại |
| ERR-SYS-001 | Internal server error | 500 | Lỗi hệ thống |

---

## 5. UI Components

### 5.1 AddAccountForm
- Input email
- Button "Add Account"
- Validation message

**File**: `@client/src/components/AddAccountForm.tsx`

### 5.2 AccountCard
- Hiển thị email, status
- Buttons: Open Browser, Verify, Download, Delete

**File**: `@client/src/components/AccountCard.tsx`

---

## 6. Files liên quan

| File | Mô tả |
|------|-------|
| `src/routes/account.routes.js` | API routes |
| `src/services/account.service.js` | Business logic |
| `src/models/account.js` | Data model |
| `accounts.json` | Data storage |
| `client/src/components/AddAccountForm.tsx` | UI thêm account |
| `client/src/components/AccountCard.tsx` | UI hiển thị account |
