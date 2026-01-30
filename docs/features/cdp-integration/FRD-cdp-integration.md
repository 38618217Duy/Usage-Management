# FRD: CDP Integration

> **Feature**: CDP Integration | **Version**: 1.1 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-30

---

## 1. Tổng quan

### 1.1 Mô tả chức năng

Kết nối với Chrome browser đang chạy thông qua Chrome DevTools Protocol (CDP) để bypass lỗi 403 Forbidden từ Cursor/Cloudflare khi sử dụng Playwright spawn browser.

**⚠️ QUAN TRỌNG**: Đây là tính năng CRITICAL cho việc automation hoạt động. Nếu không có CDP, automation sẽ bị Cloudflare block với lỗi 403 Forbidden.

### 1.2 Mục tiêu

- Bypass 403 Forbidden từ Cloudflare
- Sử dụng Chrome thật thay vì Playwright browser
- Attach vào session đã login sẵn trong Chrome
- Tự động fallback về Playwright nếu CDP không available

### 1.3 Tại sao cần CDP?

| Vấn đề                | Nguyên nhân                         | Giải pháp CDP                  |
| --------------------- | ----------------------------------- | ------------------------------ |
| 403 Forbidden         | Cloudflare detect Playwright là bot | CDP attach vào Chrome thật     |
| Session không persist | Playwright tạo browser mới mỗi lần  | CDP dùng Chrome profile có sẵn |
| Captcha/Challenge     | Bot detection                       | Chrome thật bypass được        |

### 1.4 Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│                     User's Chrome Browser                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Chrome launched with --remote-debugging-port=9222      │    │
│  │  User đã login vào Cursor trong Chrome này              │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ CDP WebSocket (port 9222)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Server                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CDPService.connect() → chromium.connectOverCDP()          │ │
│  │  AutomationCDPService.downloadCSV() → Dùng Chrome thật     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

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

| File                                     | Mô tả                      |
| ---------------------------------------- | -------------------------- |
| `src/routes/automation.routes.js`        | CDP API endpoints          |
| `src/services/cdp.service.js`            | CDP connection management  |
| `src/services/automation-cdp.service.js` | Automation via CDP         |
| `src/services/browser.service.js`        | Browser management với CDP |
| `src/config/index.js`                    | CDP configuration          |

---

## 8. FR-003: Download CSV via CDP

### 8.1 Mô tả

Sử dụng CDP connection để thực hiện automation download CSV từ Cursor Usage page, bypass Cloudflare protection.

### 8.2 Flow chi tiết (9 Checkpoints)

```
CHECKPOINT 1: Connect to Chrome via CDP
    │
    ▼
CHECKPOINT 2: Get browser context
    │
    ▼
CHECKPOINT 3: Navigate to dashboard (cursor.com/dashboard)
    │
    ▼
CHECKPOINT 4: Verify login status (check redirect to /login)
    │
    ▼
CHECKPOINT 5: Navigate to Usage tab
    │
    ▼
CHECKPOINT 6: Wait for usage page to load (5s)
    │
    ▼
CHECKPOINT 7: Select 30 days range
    │
    ▼
CHECKPOINT 8: Find and click Export CSV button
    │
    ▼
CHECKPOINT 9: Wait for download and save file
```

### 8.3 Error Codes

| Error Code                | Message                          | Nguyên nhân                     | Giải pháp                                        |
| ------------------------- | -------------------------------- | ------------------------------- | ------------------------------------------------ |
| `CDP_CONNECTION_FAILED`   | Failed to connect to Chrome      | Chrome không chạy với CDP       | Launch Chrome với `--remote-debugging-port=9222` |
| `NO_BROWSER_CONTEXT`      | No browser context found         | Chrome không có window nào      | Mở ít nhất 1 Chrome window                       |
| `SESSION_EXPIRED`         | Session expired                  | Chưa login hoặc session hết hạn | Login lại trong Chrome                           |
| `EXPORT_BUTTON_NOT_FOUND` | Could not find Export CSV button | UI Cursor thay đổi              | Cập nhật selectors                               |
| `DOWNLOAD_FAILED`         | Download failed                  | Lỗi network hoặc timeout        | Thử lại                                          |

### 8.4 Fallback Mechanism

Nếu CDP không available, hệ thống tự động fallback về Playwright persistent context:

```javascript
// automation.routes.js
let result = await AutomationCDPService.runAll();

if (result.error && result.error.includes("Chrome not connected")) {
  // Fallback to Playwright
  result = await AutomationService.runAll();
  result.method = "persistent_context_fallback";
}
```

---

## 9. Acceptance Criteria

- [ ] CDP connection hoạt động khi Chrome chạy với `--remote-debugging-port=9222`
- [ ] Status API trả về đúng trạng thái connected/disconnected
- [ ] Connect API kết nối thành công và trả về success message
- [ ] Connect API trả về error với hint khi Chrome không chạy
- [ ] Automation via CDP bypass được 403 Forbidden
- [ ] Fallback về Playwright khi CDP không available
- [ ] Disconnect event được handle đúng khi Chrome đóng
- [ ] UI hiển thị CDP status (Connected/Disconnected)

---

## 10. Testing Requirements

Xem chi tiết tại: `TEST-cdp-integration.md`

**Critical Tests:**

1. CDP connection với Chrome running
2. CDP connection khi Chrome không running
3. Download CSV via CDP
4. Fallback mechanism khi CDP fails
5. Disconnect handling
