# FRD: CSV Download

> **Feature**: CSV Download | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng
Tự động tải file CSV usage từ trang Cursor cho account đã đăng nhập. Hỗ trợ tải cho từng account hoặc batch download cho tất cả accounts.

### 1.2 Mục tiêu
- Tải CSV usage 30 ngày từ Cursor
- Lưu file với tên theo email
- Hỗ trợ batch download cho nhiều accounts

---

## 2. Functional Requirements

### 2.1 FR-001: Download CSV cho một account

**Mô tả**: Tải CSV usage cho account cụ thể

**Input**:
| Field | Type | Required | Source |
|-------|------|----------|--------|
| id | string | Yes | URL param |

**Output (Success)**:
```json
{
  "success": true,
  "data": {
    "filePath": "download/user@example.com.csv",
    "fileName": "user@example.com.csv",
    "downloadedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

**Pre-conditions**:
- Account phải có status = LOGGED_IN
- Browser không được đang mở cho account

**API Endpoint**: `POST /api/accounts/:id/download`

**File**: `@src/routes/account.routes.js:225-290`

---

### 2.2 FR-002: Batch Download (Run All)

**Mô tả**: Tải CSV cho tất cả accounts có status LOGGED_IN

**Input**: Không có

**Output**:
```json
{
  "success": true,
  "data": {
    "total": 5,
    "successful": 4,
    "failed": 1,
    "skipped": 2,
    "results": [
      {
        "id": "uuid-1",
        "email": "user1@example.com",
        "success": true,
        "error": null,
        "filePath": "download/user1@example.com.csv"
      },
      {
        "id": "uuid-2",
        "email": "user2@example.com",
        "success": false,
        "error": "Session expired",
        "filePath": null
      }
    ]
  }
}
```

**API Endpoint**: `POST /api/automation/run-all`

**File**: `@src/routes/automation.routes.js:10-32`

---

## 3. Download Process

### 3.1 Download Flow

```
Start Download
      │
      ▼
Check account status = LOGGED_IN
      │
      ├─► NOT_LOGGED_IN? → Error: NOT_LOGGED_IN
      │
      ▼
Check browser not open
      │
      ├─► Browser open? → Error: BROWSER_IN_USE
      │
      ▼
Launch headless browser with profile
      │
      ▼
Navigate to dashboard
      │
      ▼
Check not redirected to login
      │
      ├─► Redirected? → Error: SESSION_EXPIRED
      │
      ▼
Navigate to Usage tab
      │
      ▼
Select 30 days range (if available)
      │
      ▼
Find Export CSV button
      │
      ▼
Click Export CSV
      │
      ▼
Wait for download event
      │
      ▼
Save file as {email}.csv
      │
      ▼
Update lastRunAt
      │
      ▼
Close browser
      │
      ▼
Return success
```

### 3.2 Export Button Selectors

```javascript
const exportSelectors = [
  'button:has-text("Export CSV")',
  '[data-testid="export-csv"]',
  'button:has-text("Export")',
  'a:has-text("Export CSV")'
];
```

**File**: `@src/config/index.js:46`

### 3.3 Date Range Selectors

```javascript
const dateSelectors = [
  'button:has-text("30d")',
  'button:has-text("30")',
  'button:has-text("30 days")',
  'button:has-text("Last 30")',
  '[data-value="30"]'
];
```

**File**: `@src/services/automation.service.js:165-172`

---

## 4. Error Codes

| Code | Message | HTTP Status | Mô tả |
|------|---------|-------------|-------|
| ERR-ACC-002 | Account not found | 404 | Account không tồn tại |
| ERR-AUTO-001 | Account is not logged in | 400 | Account chưa đăng nhập |
| ERR-AUTO-002 | Session has expired | 401 | Session hết hạn |
| ERR-AUTO-003 | Download failed | 500 | Lỗi download |
| ERR-AUTO-004 | Browser is currently open | 409 | Browser đang mở |

---

## 5. File Output

### 5.1 File Naming

```javascript
const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
const fileName = `${sanitizedEmail}.csv`;
```

### 5.2 File Location

```
download/
├── user1@example.com.csv
├── user2@domain.org.csv
└── user.name@company.co.jp.csv
```

**Path**: `@download/` (gitignored)

---

## 6. Two Download Methods

### 6.1 Legacy Method (Spawn Browser)

- Sử dụng `chromium.launchPersistentContext()`
- Mỗi account có browser profile riêng
- Có thể bị 403 Forbidden từ Cloudflare

**Service**: `AutomationService`
**File**: `@src/services/automation.service.js`

### 6.2 CDP Method (Recommended)

- Sử dụng `chromium.connectOverCDP()`
- Attach vào Chrome đang chạy
- Bypass 403 Forbidden

**Service**: `AutomationCDPService`
**File**: `@src/services/automation-cdp.service.js`

---

## 7. Files liên quan

| File | Mô tả |
|------|-------|
| `src/routes/account.routes.js` | Single download endpoint |
| `src/routes/automation.routes.js` | Batch download endpoint |
| `src/services/automation.service.js` | Legacy download logic |
| `src/services/automation-cdp.service.js` | CDP download logic |
| `src/config/index.js` | Selectors configuration |
| `download/` | Output directory |
