# FRD: Login Verification

> **Feature**: Login Verification | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng
Xác thực trạng thái đăng nhập của tài khoản Cursor bằng cách kiểm tra khả năng truy cập dashboard và usage page.

### 1.2 Mục tiêu
- Kiểm tra session còn valid không
- Cập nhật status account (LOGGED_IN / SESSION_EXPIRED)
- Phát hiện session hết hạn để user re-login

---

## 2. Functional Requirements

### 2.1 FR-001: Verify Login Status

**Mô tả**: Kiểm tra trạng thái đăng nhập của account

**Input**:
| Field | Type | Required | Source |
|-------|------|----------|--------|
| id | string | Yes | URL param |

**Output (Success)**:
```json
{
  "success": true,
  "data": {
    "status": "LOGGED_IN",
    "previousStatus": "NOT_LOGGED_IN",
    "isLoggedIn": true
  }
}
```

**Output (Session Expired)**:
```json
{
  "success": true,
  "data": {
    "status": "SESSION_EXPIRED",
    "previousStatus": "LOGGED_IN",
    "isLoggedIn": false
  }
}
```

**Verification Steps**:
1. Mở headless browser với profile
2. Navigate đến dashboard URL
3. Kiểm tra có bị redirect về login page không
4. Navigate đến usage page
5. Kiểm tra có content hợp lệ không
6. Cập nhật status account

**API Endpoint**: `POST /api/accounts/:id/verify`

**File**: `@src/routes/account.routes.js:173-223`

---

## 3. Verification Logic

### 3.1 Login Check Flow

```
Start Verification
        │
        ▼
Launch headless browser with profile
        │
        ▼
Navigate to dashboard URL
        │
        ▼
Wait for page load (3s)
        │
        ▼
Check current URL
        │
        ├─► Contains /login or /signin?
        │         │
        │         ├─► YES: SESSION_EXPIRED
        │         │
        │         └─► NO: Continue
        │
        ▼
Navigate to usage URL
        │
        ▼
Wait for page load (2s)
        │
        ▼
Check current URL
        │
        ├─► Contains /login or /signin?
        │         │
        │         ├─► YES: SESSION_EXPIRED
        │         │
        │         └─► NO: Continue
        │
        ▼
Check for usage content
        │
        ├─► Has content selectors?
        │         │
        │         ├─► YES: LOGGED_IN
        │         │
        │         └─► NO: Check page text
        │                    │
        │                    ├─► Contains "sign in"/"log in"?
        │                    │         │
        │                    │         ├─► YES: SESSION_EXPIRED
        │                    │         │
        │                    │         └─► NO: LOGGED_IN
        │
        ▼
Update account status
        │
        ▼
Close browser
        │
        ▼
Return result
```

### 3.2 Content Selectors

```javascript
// Selectors để kiểm tra usage page có content
const contentSelectors = [
  'table',
  '.usage-table',
  '[data-testid*="usage"]',
  '.dashboard',
  '[class*="usage"]',
  '[class*="dashboard"]',
  'main',
  '.content'
];
```

**File**: `@src/services/browser.service.js:163`

---

## 4. Error Codes

| Code | Message | HTTP Status | Mô tả |
|------|---------|-------------|-------|
| ERR-ACC-002 | Account not found | 404 | Account không tồn tại |
| ERR-AUTO-004 | Browser is currently open for this account | 409 | Browser đang mở |
| ERR-SYS-001 | Internal server error | 500 | Lỗi hệ thống |

---

## 5. Status Transitions

| From Status | To Status | Condition |
|-------------|-----------|-----------|
| NOT_LOGGED_IN | LOGGED_IN | Verify thành công |
| NOT_LOGGED_IN | SESSION_EXPIRED | Verify thất bại |
| LOGGED_IN | LOGGED_IN | Verify thành công |
| LOGGED_IN | SESSION_EXPIRED | Verify thất bại |
| SESSION_EXPIRED | LOGGED_IN | Verify thành công (sau re-login) |
| SESSION_EXPIRED | SESSION_EXPIRED | Verify thất bại |

---

## 6. URLs được kiểm tra

| URL | Purpose |
|-----|---------|
| `https://cursor.com/dashboard` | Kiểm tra access dashboard |
| `https://cursor.com/dashboard?tab=usage` | Kiểm tra access usage page |

**File**: `@src/config/index.js:22-27`

---

## 7. Files liên quan

| File | Mô tả |
|------|-------|
| `src/routes/account.routes.js` | API endpoint |
| `src/services/browser.service.js` | Verification logic |
| `src/models/account.js` | Status update |
