# TDD: CSV Download

> **Feature**: CSV Download | **Version**: 1.0 | **Complexity**: Complex
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌─────────────────┐        ┌─────────────────────────────────┐ │
│  │   AccountCard   │        │          Dashboard              │ │
│  │ [Download btn]  │        │    [Download All btn]           │ │
│  └────────┬────────┘        └──────────────┬──────────────────┘ │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            ▼                                 ▼
     POST /accounts/:id/download      POST /automation/run-all
            │                                 │
            └────────────────┬────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (Express)                         │
│  ┌────────────────────┐    ┌────────────────────────────────┐   │
│  │ account.routes.js  │    │    automation.routes.js        │   │
│  └─────────┬──────────┘    └──────────────┬─────────────────┘   │
│            │                              │                      │
│            ▼                              ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AutomationService (Legacy)                  │    │
│  │                        OR                                │    │
│  │              AutomationCDPService (Recommended)          │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     Playwright                           │    │
│  │   launchPersistentContext() OR connectOverCDP()         │    │
│  └─────────────────────────┬───────────────────────────────┘    │
└────────────────────────────┼────────────────────────────────────┘
                             ▼
                    ┌────────────────┐
                    │  Cursor.com    │
                    │  Usage Page    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  download/     │
                    │  {email}.csv   │
                    └────────────────┘
```

---

## 2. Backend Implementation

### 2.1 AutomationService (`src/services/automation.service.js`)

#### downloadCSV Method

```javascript
static async downloadCSV(account) {
  const { id, email, profilePath, status } = account;

  // 1. Pre-checks
  if (status !== AccountStatus.LOGGED_IN) {
    return { error: 'NOT_LOGGED_IN' };
  }
  if (BrowserService.isBrowserOpen(id)) {
    return { error: 'BROWSER_IN_USE' };
  }

  // 2. Launch browser
  const context = await chromium.launchPersistentContext(fullProfilePath, {
    headless: true,
    acceptDownloads: true,
  });

  // 3. Navigate to dashboard
  await page.goto(config.cursor.dashboardUrl);

  // 4. Check login status
  if (currentUrl.includes('/login')) {
    return { error: 'SESSION_EXPIRED' };
  }

  // 5. Navigate to usage tab
  // Try clicking Usage menu or direct URL

  // 6. Select 30 days range
  // Try multiple selectors

  // 7. Find and click Export CSV
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  // 8. Save file
  const fileName = `${sanitizedEmail}.csv`;
  await download.saveAs(filePath);

  // 9. Update lastRunAt
  await AccountModel.updateLastRun(id, null);

  return { filePath, fileName, downloadedAt };
}
```

**File**: `@src/services/automation.service.js:10-396`

#### runAll Method

```javascript
static async runAll() {
  // 1. Get all logged-in accounts
  const accounts = await AccountModel.readAll();
  const loggedInAccounts = accounts.filter(acc => acc.status === 'LOGGED_IN');

  // 2. Process each account sequentially
  for (const account of loggedInAccounts) {
    const result = await this.downloadCSV(account);
    results.push({
      id: account.id,
      email: account.email,
      success: !result.error,
      error: result.error ? result.message : null,
      filePath: result.filePath,
    });
    
    // Delay between accounts
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { total, successful, failed, skipped, results };
}
```

**File**: `@src/services/automation.service.js:399-479`

### 2.2 AutomationCDPService (`src/services/automation-cdp.service.js`)

Tương tự AutomationService nhưng sử dụng CDP connection:

```javascript
// Connect to existing Chrome instead of launching new browser
const { browser } = await CDPService.connect();
const { context } = await CDPService.getDefaultContext();
const page = context.pages()[0] || await context.newPage();
```

**File**: `@src/services/automation-cdp.service.js`

---

## 3. Download Checkpoints

### 3.1 Checkpoint Flow

| # | Checkpoint | Action | Failure Handling |
|---|------------|--------|------------------|
| 1 | Connect/Launch | Connect CDP or launch browser | Return CDP_CONNECTION_FAILED |
| 2 | Get Context | Get browser context | Return NO_BROWSER_CONTEXT |
| 3 | Navigate Dashboard | Go to dashboard URL | Continue |
| 4 | Verify Login | Check not redirected | Return SESSION_EXPIRED |
| 5 | Navigate Usage | Click Usage or direct URL | Continue |
| 6 | Wait Load | Wait for page content | Continue |
| 7 | Select 30 Days | Click date range button | Continue (optional) |
| 8 | Scroll Page | Load all content | Continue |
| 9 | Find Export | Find export button | Return EXPORT_BUTTON_NOT_FOUND |
| 10 | Click Export | Trigger download | Wait for download |
| 11 | Save File | Save to download/ | Return DOWNLOAD_FAILED |

### 3.2 Smart Button Search

```javascript
// Priority-based search for export button
const searchPatterns = [
  { pattern: 'export csv', exact: true, priority: 1 },
  { pattern: 'export', exact: false, priority: 2 },
  { pattern: 'csv', exact: false, priority: 3 },
  { pattern: 'download csv', exact: true, priority: 4 },
  { pattern: 'download', exact: false, priority: 5 }
];
```

**File**: `@src/services/automation.service.js:279-316`

---

## 4. Data Flow

### 4.1 Single Download Flow

```
POST /api/accounts/:id/download
              │
              ▼
        Get account by ID
              │
              ├─► Not found? → 404
              │
              ▼
    AutomationService.downloadCSV(account)
              │
              ├─► NOT_LOGGED_IN? → 400
              ├─► BROWSER_IN_USE? → 409
              │
              ▼
    Launch headless browser
              │
              ▼
    Navigate to dashboard
              │
              ├─► Redirected to login? → 401 SESSION_EXPIRED
              │
              ▼
    Navigate to usage tab
              │
              ▼
    Select 30 days (optional)
              │
              ▼
    Find Export CSV button
              │
              ├─► Not found? → 500 EXPORT_BUTTON_NOT_FOUND
              │
              ▼
    Click and wait for download
              │
              ▼
    Save as {email}.csv
              │
              ▼
    Update lastRunAt
              │
              ▼
    Return { filePath, fileName, downloadedAt }
```

### 4.2 Batch Download Flow

```
POST /api/automation/run-all
              │
              ▼
    AutomationCDPService.runAll()
              │
              ▼
    Connect to Chrome via CDP
              │
              ├─► Not connected? → Return error
              │
              ▼
    Get all LOGGED_IN accounts
              │
              ├─► None? → Return { total: 0 }
              │
              ▼
    For each account:
              │
              ├─► downloadCSV(account)
              │         │
              │         ├─► Success → results.push(success)
              │         │
              │         └─► Error → results.push(error)
              │
              ├─► Wait 2 seconds
              │
              └─► Next account
              │
              ▼
    Return { total, successful, failed, skipped, results }
```

---

## 5. Configuration

### 5.1 Selectors

```javascript
selectors: {
  usage: {
    dateRangeDropdown: '[data-testid="date-range-dropdown"], .date-range-selector',
    last30Days: '[data-testid="last-30-days"], button:has-text("30 days")',
    exportButton: 'button:has-text("Export CSV"), [data-testid="export-csv"]',
  }
}
```

**File**: `@src/config/index.js:42-47`

### 5.2 Timeouts

```javascript
browser: {
  timeout: 60000,
  navigationTimeout: 60000,
  downloadTimeout: 30000,
}
```

---

## 6. File Output

### 6.1 File Naming

```javascript
// Sanitize email for filename
const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
const fileName = `${sanitizedEmail}.csv`;
const filePath = path.join(config.paths.download, fileName);
```

### 6.2 Directory Structure

```
download/
├── user1@example.com.csv
├── user2@domain.org.csv
└── user.name@company.co.jp.csv
```

---

## 7. Error Handling

### 7.1 Error Types

| Error | Cause | Recovery |
|-------|-------|----------|
| NOT_LOGGED_IN | Account status != LOGGED_IN | User must login first |
| BROWSER_IN_USE | Browser already open | Close browser first |
| SESSION_EXPIRED | Redirected to login | User must re-login |
| EXPORT_BUTTON_NOT_FOUND | Button not found | Check selectors |
| DOWNLOAD_FAILED | Download timeout/error | Retry |
| CDP_CONNECTION_FAILED | Chrome not running | Start Chrome with CDP |

### 7.2 Cleanup

```javascript
try {
  // download logic
} catch (err) {
  await AccountModel.updateLastRun(id, err.message);
  if (context) await context.close();
  return { error: 'DOWNLOAD_FAILED', message: err.message };
}
```

---

## 8. Dependencies

| Package | Purpose |
|---------|---------|
| playwright | Browser automation |
| path | Path manipulation |
| fs/promises | File system operations |
