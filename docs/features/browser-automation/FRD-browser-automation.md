# FRD: Browser Automation

> **Feature**: Browser Automation | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng
Mở browser với persistent profile để user đăng nhập thủ công vào Cursor. Browser sử dụng Playwright với anti-detection để tránh bị block.

### 1.2 Mục tiêu
- Mở browser với profile riêng cho từng account
- Lưu session sau khi user đăng nhập
- Tránh detection từ Cursor/Cloudflare

---

## 2. Functional Requirements

### 2.1 FR-001: Mở browser để đăng nhập

**Mô tả**: Mở browser với persistent profile cho account cụ thể

**Input**:
| Field | Type | Required | Source |
|-------|------|----------|--------|
| id | string | Yes | URL param |

**Output**:
```json
{
  "success": true,
  "message": "Browser opened. Please login manually and close the browser when done."
}
```

**Business Rules**:
- Chỉ mở 1 browser cho 1 account tại một thời điểm
- Browser mở ở chế độ headed (có giao diện)
- Tự động navigate đến `https://cursor.com`
- Session được lưu khi user đóng browser

**Anti-Detection Features**:
- Disable `webdriver` property
- Custom user-agent
- Disable automation flags
- Override plugins và languages

**API Endpoint**: `POST /api/accounts/:id/open-browser`

**File**: `@src/routes/account.routes.js:126-171`

---

### 2.2 FR-002: Đóng browser

**Mô tả**: Đóng browser đang mở cho account (internal use)

**Business Rules**:
- Browser tự động cleanup khi user đóng
- Có thể force close từ code nếu cần

**File**: `@src/services/browser.service.js:194-207`

---

### 2.3 FR-003: Kiểm tra browser đang mở

**Mô tả**: Kiểm tra xem browser có đang mở cho account không

**Business Rules**:
- Sử dụng Map để track active browsers
- Prevent concurrent browser cho cùng account

**File**: `@src/services/browser.service.js:209-211`

---

## 3. Error Codes

| Code | Message | HTTP Status | Mô tả |
|------|---------|-------------|-------|
| ERR-ACC-002 | Account not found | 404 | Account không tồn tại |
| ERR-AUTO-004 | Browser is already open for this account | 409 | Browser đã mở |
| ERR-SYS-001 | Internal server error | 500 | Lỗi hệ thống |

---

## 4. Browser Configuration

### 4.1 Launch Options

```javascript
{
  headless: false,
  viewport: { width: 1280, height: 720 },
  args: [
    '--start-maximized',
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-extensions-except',
    '--disable-extensions',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ],
  ignoreDefaultArgs: ['--enable-automation']
}
```

**File**: `@src/services/browser.service.js:25-41`

### 4.2 Anti-Detection Script

```javascript
// Injected vào mỗi page
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
delete window.navigator.webdriver;
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
```

**File**: `@src/services/browser.service.js:49-67`

---

## 5. Workflow

```
User click "Open Browser"
         │
         ▼
POST /api/accounts/:id/open-browser
         │
         ▼
Check account exists
         │
         ▼
Check browser not already open
         │
         ▼
Launch Playwright persistent context
         │
         ▼
Inject anti-detection scripts
         │
         ▼
Navigate to cursor.com
         │
         ▼
User logs in manually
         │
         ▼
User closes browser
         │
         ▼
Session saved in profile directory
```

---

## 6. Files liên quan

| File | Mô tả |
|------|-------|
| `src/routes/account.routes.js` | API endpoint |
| `src/services/browser.service.js` | Browser management logic |
| `profiles/acc-{uuid}/` | Browser profile storage |
