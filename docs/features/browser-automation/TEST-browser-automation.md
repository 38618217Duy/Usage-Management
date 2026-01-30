# TEST: Browser Automation

> **Feature**: Browser Automation | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - API

### 1.1 POST /api/accounts/:id/open-browser

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-001 | Mở browser cho account hợp lệ | valid account ID | 200, success message | High |
| TC-002 | Mở browser cho account không tồn tại | non-existent ID | 404, ERR-ACC-002 | High |
| TC-003 | Mở browser khi đã có browser đang mở | same account ID | 409, ERR-AUTO-004 | High |
| TC-004 | Mở browser cho 2 accounts khác nhau | different IDs | Both succeed | Medium |

---

## 2. Test Cases - Browser Behavior

### 2.1 Browser Launch

| TC-ID | Mô tả | Expected | Priority |
|-------|-------|----------|----------|
| TC-005 | Browser mở ở chế độ headed | Visible browser window | High |
| TC-006 | Browser navigate đến cursor.com | URL = cursor.com | High |
| TC-007 | Browser sử dụng đúng profile path | Profile at profiles/acc-{uuid} | High |
| TC-008 | Viewport size đúng | 1280x720 | Low |

### 2.2 Anti-Detection

| TC-ID | Mô tả | Check | Expected | Priority |
|-------|-------|-------|----------|----------|
| TC-009 | navigator.webdriver | `navigator.webdriver` | undefined | High |
| TC-010 | User agent | `navigator.userAgent` | Chrome 120 string | Medium |
| TC-011 | Plugins | `navigator.plugins.length` | > 0 | Medium |
| TC-012 | Languages | `navigator.languages` | ['en-US', 'en'] | Low |

### 2.3 Session Persistence

| TC-ID | Mô tả | Steps | Expected | Priority |
|-------|-------|-------|----------|----------|
| TC-013 | Session saved after login | Login, close, reopen | Still logged in | High |
| TC-014 | Cookies persisted | Login, close, check profile | Cookies file exists | High |
| TC-015 | localStorage persisted | Set value, close, reopen | Value still exists | Medium |

---

## 3. Test Cases - State Management

### 3.1 Active Browsers Tracking

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-016 | Track browser khi mở | Open browser | activeBrowsers.has(id) = true | High |
| TC-017 | Remove tracking khi đóng | Close browser | activeBrowsers.has(id) = false | High |
| TC-018 | Count active browsers | Open 2 browsers | getActiveBrowserCount() = 2 | Medium |

### 3.2 Concurrent Access

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-019 | Prevent double open | Open same account twice | Second request returns 409 | High |
| TC-020 | Allow different accounts | Open 2 different accounts | Both succeed | High |

---

## 4. Test Cases - Error Handling

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-021 | Profile path không tồn tại | Invalid profilePath | Browser creates directory | Medium |
| TC-022 | Playwright crash | Kill browser process | activeBrowsers cleaned up | Medium |
| TC-023 | Network timeout | No internet | Error returned, browser closed | Medium |

---

## 5. Manual Test Checklist

### 5.1 Basic Flow

- [ ] Click "Open Browser" button
- [ ] Browser window opens
- [ ] Browser navigates to cursor.com
- [ ] Login manually to Cursor
- [ ] Close browser
- [ ] Verify session saved (check via Verify button)

### 5.2 Anti-Detection Verification

- [ ] Open browser
- [ ] Open DevTools (F12)
- [ ] Console: `navigator.webdriver` → undefined
- [ ] Console: `navigator.plugins.length` → > 0
- [ ] No "Chrome is being controlled by automated test software" banner

### 5.3 Error Cases

- [ ] Try opening browser twice for same account
- [ ] Verify error message "Browser is already open"
- [ ] Close browser and try again
- [ ] Should succeed

### 5.4 Session Persistence

- [ ] Open browser, login to Cursor
- [ ] Close browser
- [ ] Open browser again
- [ ] Should still be logged in (no login required)

---

## 6. Test Environment

### 6.1 Prerequisites

- Node.js 18+
- Playwright browsers installed (`npx playwright install chromium`)
- Backend server running

### 6.2 Test Data

```json
{
  "testAccount": {
    "id": "test-uuid-123",
    "email": "test@example.com",
    "profilePath": "profiles/acc-test-uuid-123"
  }
}
```
