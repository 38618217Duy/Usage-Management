# TDD: Browser Automation

> **Feature**: Browser Automation | **Version**: 1.0 | **Complexity**: Medium
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   AccountCard                        │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │         "Open Browser" Button                │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP POST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              account.routes.js                          │ │
│  │              POST /:id/open-browser                     │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              BrowserService                             │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  activeBrowsers: Map<accountId, BrowserContext>  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                         │ │
│  │  Methods:                                               │ │
│  │  - openLoginBrowser(account)                           │ │
│  │  - closeBrowser(accountId)                             │ │
│  │  - isBrowserOpen(accountId)                            │ │
│  │  - getActiveBrowserCount()                             │ │
│  └─────────────────────┬──────────────────────────────────┘ │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Playwright                                 │ │
│  │              chromium.launchPersistentContext()        │ │
│  └─────────────────────┬──────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────┘
                         ▼
              ┌──────────────────────┐
              │   Browser Window     │
              │   (Chromium)         │
              │                      │
              │   cursor.com         │
              └──────────────────────┘
```

---

## 2. Backend Implementation

### 2.1 BrowserService (`src/services/browser.service.js`)

#### State Management

```javascript
// In-memory tracking of active browsers
const activeBrowsers = new Map(); // Map<accountId, BrowserContext>
```

#### Methods

| Method | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `openLoginBrowser(account)` | Account object | `{error, browser}` | Mở browser với persistent profile |
| `closeBrowser(accountId)` | string | boolean | Đóng browser |
| `isBrowserOpen(accountId)` | string | boolean | Kiểm tra browser đang mở |
| `getActiveBrowserCount()` | - | number | Đếm số browser đang mở |

### 2.2 openLoginBrowser Flow

```javascript
async openLoginBrowser(account) {
  // 1. Check if browser already open
  if (activeBrowsers.has(id)) {
    return { error: 'BROWSER_ALREADY_OPEN' };
  }

  // 2. Build full profile path
  const fullProfilePath = path.join(config.paths.root, profilePath);

  // 3. Launch persistent context
  const context = await chromium.launchPersistentContext(fullProfilePath, {
    headless: false,
    viewport: { width: 1280, height: 720 },
    args: [...antiDetectionArgs],
    ignoreDefaultArgs: ['--enable-automation']
  });

  // 4. Track browser
  activeBrowsers.set(id, context);

  // 5. Get or create page
  const page = context.pages()[0] || await context.newPage();

  // 6. Inject anti-detection scripts
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // ... more anti-detection
  });

  // 7. Navigate to Cursor
  await page.goto(config.cursor.baseUrl);

  // 8. Setup close handler
  context.on('close', () => {
    activeBrowsers.delete(id);
  });

  return { error: null, browser: context };
}
```

---

## 3. Anti-Detection Techniques

### 3.1 Launch Arguments

| Argument | Purpose |
|----------|---------|
| `--disable-blink-features=AutomationControlled` | Ẩn automation flag |
| `--disable-web-security` | Bypass CORS |
| `--no-sandbox` | Chạy không cần sandbox |
| `--user-agent=...` | Custom user agent |

### 3.2 JavaScript Injection

```javascript
// Remove webdriver property
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
delete window.navigator.webdriver;

// Fake plugins
Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

// Fake languages
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
```

---

## 4. Persistent Profile

### 4.1 Profile Structure

```
profiles/acc-{uuid}/
├── Default/
│   ├── Cookies              # Session cookies
│   ├── Local Storage/       # localStorage data
│   ├── Session Storage/     # sessionStorage data
│   ├── IndexedDB/           # IndexedDB data
│   ├── Cache/               # Browser cache
│   └── Preferences          # Browser preferences
├── First Run
└── Local State
```

### 4.2 Session Persistence

- Cookies được lưu tự động khi browser đóng
- localStorage/sessionStorage được persist
- Không cần extract/inject cookies thủ công

---

## 5. Data Flow

### 5.1 Open Browser Flow

```
User clicks "Open Browser"
           │
           ▼
AccountCard.handleOpenBrowser()
           │
           ▼
useAccounts.openBrowser(id)
           │
           ▼
api.accounts.openBrowser(id)
           │
           ▼ POST /api/accounts/:id/open-browser
           │
account.routes.js
           │
           ├─► AccountService.getById(id)
           │
           ▼
BrowserService.openLoginBrowser(account)
           │
           ├─► Check activeBrowsers.has(id)
           ├─► chromium.launchPersistentContext()
           ├─► Inject anti-detection
           ├─► Navigate to cursor.com
           ├─► activeBrowsers.set(id, context)
           │
           ▼
Return success response
           │
           ▼
Browser window opens
           │
           ▼
User logs in manually
           │
           ▼
User closes browser
           │
           ▼
context.on('close') triggered
           │
           ▼
activeBrowsers.delete(id)
```

---

## 6. Configuration

### 6.1 Browser Config

```javascript
browser: {
  headless: false,
  timeout: 60000,
  navigationTimeout: 60000,
  downloadTimeout: 30000,
  pageLoadTimeout: 45000,
}
```

**File**: `@src/config/index.js:29-35`

### 6.2 Cursor URLs

```javascript
cursor: {
  baseUrl: 'https://cursor.com',
  dashboardUrl: 'https://cursor.com/dashboard',
  usageUrl: 'https://cursor.com/dashboard?tab=usage',
  loginUrl: 'https://cursor.com/login',
}
```

**File**: `@src/config/index.js:22-27`

---

## 7. Error Handling

### 7.1 Error Cases

| Error | Cause | Handling |
|-------|-------|----------|
| BROWSER_ALREADY_OPEN | Browser đã mở cho account | Return 409 |
| Launch failed | Playwright error | Return 500, log error |
| Navigation timeout | Network issue | Return 500, cleanup browser |

### 7.2 Cleanup

```javascript
// On error, ensure browser is cleaned up
catch (err) {
  activeBrowsers.delete(id);
  return { error: err.message };
}
```

---

## 8. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| playwright | ^1.40.0 | Browser automation |
| path | built-in | Path manipulation |
| fs | built-in | File system |
