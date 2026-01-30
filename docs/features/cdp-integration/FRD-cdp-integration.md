# FRD: CDP Integration

> **Feature**: CDP Integration | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng

Kết nối với Chrome browser đang chạy thông qua Chrome DevTools Protocol (CDP) để bypass lỗi 403 Forbidden từ Cursor/Cloudflare khi sử dụng Playwright spawn browser.

### 1.2 Mục tiêu

- Bypass 403 Forbidden từ Cloudflare
- Sử dụng Chrome thật thay vì Playwright browser
- Attach vào session đã login sẵn trong Chrome

### 1.3 Tại sao cần CDP?

- Playwright spawn browser bị Cloudflare detect là bot
- Chrome thật với user profile không bị block
- CDP cho phép automation trên Chrome đang chạy

---

## 2. Functional Requirements

### 2.1 FR-001: Kiểm tra CDP Status

**Mô tả**: Kiểm tra trạng thái kết nối CDP

**Input**: Không có

**Output**:

```json
{
  "success": true,
  "data": {
    "connected": true,
    "endpoint": "http://localhost:9222"
  }
}
```

**API Endpoint**: `GET /api/automation/cdp/status`

**File**: `@src/routes/automation.routes.js:57-77`

---

### 2.2 FR-002: Kết nối CDP

**Mô tả**: Kết nối Playwright với Chrome qua CDP

**Input**: Không có

**Output (Success)**:

```json
{
  "success": true,
  "message": "Connected to Chrome via CDP"
}
```

**Output (Error)**:

```json
{
  "success": false,
  "error": {
    "code": "ERR-CDP-001",
    "message": "Connection failed",
    "hint": "Make sure Chrome is running with --remote-debugging-port=9222"
  }
}
```

**Pre-conditions**:

- Chrome phải được khởi động với flag `--remote-debugging-port=9222`

**API Endpoint**: `POST /api/automation/cdp/connect`

**File**: `@src/routes/automation.routes.js:79-106`

---

## 3. Chrome Launch Command

### 3.1 Windows

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\chrome-cdp"
```

### 3.2 macOS

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
```

### 3.3 Linux

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
```

---

## 4. CDP Configuration

```javascript
cdp: {
  endpoint: 'http://localhost:9222',
  defaultPort: 9222,
}
```

**File**: `@src/config/index.js:37-40`

---

## 5. Error Codes

| Code        | Message               | HTTP Status | Mô tả                  |
| ----------- | --------------------- | ----------- | ---------------------- |
| ERR-CDP-001 | Connection failed     | 400         | Không kết nối được CDP |
| ERR-SYS-001 | Internal server error | 500         | Lỗi hệ thống           |

---

## 6. Workflow

```
User launches Chrome with CDP flag
              │
              ▼
User logs in to Cursor in Chrome
              │
              ▼
User clicks "Connect" in Dashboard
              │
              ▼
POST /api/automation/cdp/connect
              │
              ▼
CDPService.connect()
              │
              ├─► chromium.connectOverCDP('http://localhost:9222')
              │
              ├─► Success? → Store browser reference
              │
              └─► Error? → Return hint message
              │
              ▼
CDP Connected - Ready for automation
              │
              ▼
User clicks "Download All"
              │
              ▼
AutomationCDPService.runAll()
              │
              ▼
Use connected Chrome for automation
```

---

## 7. Files liên quan

| File                                     | Mô tả                     |
| ---------------------------------------- | ------------------------- |
| `src/routes/automation.routes.js`        | CDP API endpoints         |
| `src/services/cdp.service.js`            | CDP connection management |
| `src/services/automation-cdp.service.js` | Automation via CDP        |
| `src/config/index.js`                    | CDP configuration         |
