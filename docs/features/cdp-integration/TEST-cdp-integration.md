# TEST: CDP Integration

> **Feature**: CDP Integration | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - API

### 1.1 GET /api/automation/cdp/status

| TC-ID  | Mô tả                      | Pre-condition     | Expected        | Priority |
| ------ | -------------------------- | ----------------- | --------------- | -------- |
| TC-001 | Status khi chưa connect    | CDP not connected | connected=false | High     |
| TC-002 | Status khi đã connect      | CDP connected     | connected=true  | High     |
| TC-003 | Status sau khi Chrome đóng | Chrome closed     | connected=false | Medium   |

### 1.2 POST /api/automation/cdp/connect

| TC-ID  | Mô tả                         | Pre-condition           | Expected                | Priority |
| ------ | ----------------------------- | ----------------------- | ----------------------- | -------- |
| TC-004 | Connect thành công            | Chrome running with CDP | 200, success            | High     |
| TC-005 | Connect khi Chrome không chạy | Chrome not running      | 400, ERR-CDP-001        | High     |
| TC-006 | Connect khi đã connected      | Already connected       | 200, reuse connection   | Medium   |
| TC-007 | Connect với port sai          | Wrong port              | 400, connection refused | Medium   |

---

## 2. Test Cases - CDPService

### 2.1 connect()

| TC-ID  | Mô tả           | Scenario           | Expected        | Priority |
| ------ | --------------- | ------------------ | --------------- | -------- |
| TC-008 | Connect lần đầu | Chrome running     | cdpBrowser set  | High     |
| TC-009 | Connect lần 2   | Already connected  | Return existing | High     |
| TC-010 | Connect failed  | Chrome not running | Error with hint | High     |

### 2.2 isConnected()

| TC-ID  | Mô tả                   | Scenario          | Expected | Priority |
| ------ | ----------------------- | ----------------- | -------- | -------- |
| TC-011 | Check khi connected     | cdpBrowser exists | true     | High     |
| TC-012 | Check khi not connected | cdpBrowser null   | false    | High     |
| TC-013 | Check sau disconnect    | Chrome closed     | false    | Medium   |

### 2.3 getDefaultContext()

| TC-ID  | Mô tả                      | Scenario           | Expected                | Priority |
| ------ | -------------------------- | ------------------ | ----------------------- | -------- |
| TC-014 | Get context thành công     | Chrome has windows | context returned        | High     |
| TC-015 | Get context khi no windows | Chrome no windows  | Error: No contexts      | Medium   |
| TC-016 | Get context auto-connect   | Not connected      | Connect first, then get | Medium   |

### 2.4 getOrCreatePage()

| TC-ID  | Mô tả             | Scenario    | Expected          | Priority |
| ------ | ----------------- | ----------- | ----------------- | -------- |
| TC-017 | Get existing page | Pages exist | Return first page | High     |
| TC-018 | Create new page   | No pages    | Create and return | Medium   |

### 2.5 findPageByUrl()

| TC-ID  | Mô tả                | Pattern           | Expected   | Priority |
| ------ | -------------------- | ----------------- | ---------- | -------- |
| TC-019 | Find cursor.com page | 'cursor.com'      | Page found | High     |
| TC-020 | Pattern not found    | 'nonexistent.com' | page=null  | Medium   |

---

## 3. Test Cases - Disconnect Handling

| TC-ID  | Mô tả                      | Action                   | Expected           | Priority |
| ------ | -------------------------- | ------------------------ | ------------------ | -------- |
| TC-021 | Chrome closed by user      | Close Chrome             | cdpBrowser=null    | High     |
| TC-022 | Network disconnected       | Disconnect network       | Error on next call | Medium   |
| TC-023 | Reconnect after disconnect | Close then reopen Chrome | Can reconnect      | High     |

---

## 4. Manual Test Checklist

### 4.1 Setup

- [ ] Close all Chrome instances
- [ ] Launch Chrome with CDP flag:
  ```
  C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\chrome-cdp
  ```
- [ ] Verify Chrome opens normally
- [ ] Navigate to cursor.com in Chrome
- [ ] Login to Cursor

### 4.2 Connect Test

- [ ] Start backend server
- [ ] Open frontend dashboard
- [ ] Verify "CDP: Disconnected" shown
- [ ] Click "Connect" button
- [ ] Verify "CDP: Connected" shown
- [ ] Verify green indicator

### 4.3 Status Test

- [ ] Refresh page
- [ ] Check CDP status (may need reconnect)
- [ ] Close Chrome
- [ ] Check status changes to Disconnected

### 4.4 Integration Test

- [ ] Connect CDP
- [ ] Click "Download All"
- [ ] Verify automation uses Chrome
- [ ] Verify no 403 Forbidden errors
- [ ] Verify CSV downloaded

### 4.5 Error Cases

- [ ] Try connect without Chrome running → Error message with hint
- [ ] Try connect with wrong port → Connection refused
- [ ] Close Chrome during download → Error handled gracefully

---

## 5. Test Environment

### 5.1 Prerequisites

- Chrome browser installed
- Node.js 18+
- Backend server running
- Port 9222 available

### 5.2 Chrome Launch Commands

**Windows (PowerShell):**

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data"
```

**Windows (CMD):**

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"
```

### 5.3 Verify CDP Running

```bash
curl http://localhost:9222/json/version
```

Expected response:

```json
{
  "Browser": "Chrome/xxx.x.xxxx.xx",
  "Protocol-Version": "1.3",
  "User-Agent": "...",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

---

## 6. Troubleshooting

| Issue                      | Cause                       | Solution                                                 |
| -------------------------- | --------------------------- | -------------------------------------------------------- |
| Connection refused         | Chrome not running with CDP | Launch Chrome with --remote-debugging-port=9222          |
| Port already in use        | Another Chrome instance     | Close all Chrome, restart with CDP                       |
| No contexts found          | No Chrome windows open      | Open at least one Chrome window                          |
| 403 Forbidden still occurs | Not using CDP service       | Ensure using AutomationCDPService, not AutomationService |
