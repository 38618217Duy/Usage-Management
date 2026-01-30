# TDD: CDP Integration

> **Feature**: CDP Integration | **Version**: 1.0 | **Complexity**: Medium
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User's Chrome Browser                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Chrome launched with --remote-debugging-port=9222      │    │
│  │                                                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │   Tab 1     │  │   Tab 2     │  │   Tab 3     │     │    │
│  │  │ cursor.com  │  │  gmail.com  │  │   ...       │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ CDP (port 9222)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      CDPService                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  cdpBrowser: Browser | null                          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  Methods:                                                   │ │
│  │  - connect()                                                │ │
│  │  - disconnect()                                             │ │
│  │  - isConnected()                                            │ │
│  │  - getBrowser()                                             │ │
│  │  - getDefaultContext()                                      │ │
│  │  - getOrCreatePage()                                        │ │
│  │  - findPageByUrl(pattern)                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              AutomationCDPService                           │ │
│  │              Uses CDPService for automation                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Implementation

### 2.1 CDPService (`src/services/cdp.service.js`)

#### State Management

```javascript
// Singleton browser connection
let cdpBrowser = null;
```

#### Methods

| Method | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `connect()` | - | `{error, browser}` | Kết nối CDP |
| `disconnect()` | - | void | Ngắt kết nối |
| `isConnected()` | - | boolean | Kiểm tra trạng thái |
| `getBrowser()` | - | Browser \| null | Lấy browser instance |
| `getDefaultContext()` | - | `{error, context}` | Lấy browser context |
| `getOrCreatePage()` | - | `{error, page, context}` | Lấy hoặc tạo page |
| `findPageByUrl(pattern)` | string | `{error, page, context}` | Tìm page theo URL |

### 2.2 connect() Implementation

```javascript
static async connect() {
  // Return existing connection if available
  if (cdpBrowser) {
    return { error: null, browser: cdpBrowser };
  }

  try {
    // Connect to Chrome via CDP
    cdpBrowser = await chromium.connectOverCDP(config.cdp.endpoint);
    
    // Setup disconnect handler
    cdpBrowser.on('disconnected', () => {
      cdpBrowser = null;
    });

    return { error: null, browser: cdpBrowser };
  } catch (err) {
    return { 
      error: err.message, 
      browser: null,
      hint: 'Make sure Chrome is running with --remote-debugging-port=9222'
    };
  }
}
```

**File**: `@src/services/cdp.service.js:8-40`

### 2.3 getDefaultContext() Implementation

```javascript
static async getDefaultContext() {
  if (!cdpBrowser) {
    const result = await this.connect();
    if (result.error) {
      return { error: result.error, context: null };
    }
  }

  const contexts = cdpBrowser.contexts();
  if (contexts.length === 0) {
    return { error: 'No browser contexts found', context: null };
  }

  return { error: null, context: contexts[0] };
}
```

**File**: `@src/services/cdp.service.js:62-83`

---

## 3. API Routes

### 3.1 GET /api/automation/cdp/status

```javascript
router.get('/cdp/status', async (req, res) => {
  const isConnected = CDPService.isConnected();
  
  res.json({ 
    success: true, 
    data: {
      connected: isConnected,
      endpoint: 'http://localhost:9222'
    }
  });
});
```

**File**: `@src/routes/automation.routes.js:57-77`

### 3.2 POST /api/automation/cdp/connect

```javascript
router.post('/cdp/connect', async (req, res) => {
  const result = await CDPService.connect();
  
  if (result.error) {
    return res.status(400).json({ 
      success: false, 
      error: { 
        code: 'ERR-CDP-001', 
        message: result.error,
        hint: result.hint
      }
    });
  }
  
  res.json({ success: true, message: 'Connected to Chrome via CDP' });
});
```

**File**: `@src/routes/automation.routes.js:79-106`

---

## 4. Data Flow

### 4.1 Connect Flow

```
User clicks "Connect" button
              │
              ▼
POST /api/automation/cdp/connect
              │
              ▼
CDPService.connect()
              │
              ├─► Already connected? → Return existing browser
              │
              ▼
chromium.connectOverCDP('http://localhost:9222')
              │
              ├─► Success? → Store cdpBrowser, return success
              │
              └─► Error? → Return error with hint
              │
              ▼
Setup 'disconnected' event handler
              │
              ▼
Return { error: null, browser }
```

### 4.2 Usage Flow

```
AutomationCDPService.downloadCSV()
              │
              ▼
CDPService.connect()
              │
              ▼
CDPService.getDefaultContext()
              │
              ▼
context.pages() → Get existing pages
              │
              ▼
Use page for automation
              │
              ▼
Navigate, click, download...
```

---

## 5. Configuration

### 5.1 CDP Config

```javascript
cdp: {
  endpoint: 'http://localhost:9222',
  defaultPort: 9222,
}
```

**File**: `@src/config/index.js:37-40`

---

## 6. Chrome Launch Requirements

### 6.1 Required Flags

| Flag | Purpose |
|------|---------|
| `--remote-debugging-port=9222` | Enable CDP on port 9222 |
| `--user-data-dir=<path>` | Use existing user profile |

### 6.2 Platform-specific Commands

**Windows:**
```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\Users\%USERNAME%\AppData\Local\Google\Chrome\User Data"
```

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
```

**Linux:**
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.config/google-chrome"
```

---

## 7. Error Handling

### 7.1 Connection Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Connection refused | Chrome not running | Start Chrome with CDP flag |
| Connection timeout | Port blocked | Check firewall |
| No contexts found | No Chrome windows | Open at least one window |

### 7.2 Disconnect Handling

```javascript
cdpBrowser.on('disconnected', () => {
  logger.info('CDPService: Chrome disconnected');
  cdpBrowser = null;
});
```

---

## 8. Dependencies

| Package | Purpose |
|---------|---------|
| playwright | CDP connection via `chromium.connectOverCDP()` |
