# TDD: Login Verification

> **Feature**: Login Verification | **Version**: 1.0 | **Complexity**: Medium
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Sequence Diagram

```
┌────────┐     ┌─────────┐     ┌───────────────┐     ┌──────────┐     ┌─────────┐
│ Client │     │ Routes  │     │ BrowserService│     │ Playwright│     │ Cursor  │
└───┬────┘     └────┬────┘     └───────┬───────┘     └─────┬────┘     └────┬────┘
    │               │                  │                   │               │
    │ POST /verify  │                  │                   │               │
    │──────────────>│                  │                   │               │
    │               │ verifyLogin(id)  │                   │               │
    │               │─────────────────>│                   │               │
    │               │                  │ launchPersistent  │               │
    │               │                  │──────────────────>│               │
    │               │                  │                   │ goto dashboard│
    │               │                  │                   │──────────────>│
    │               │                  │                   │    response   │
    │               │                  │                   │<──────────────│
    │               │                  │ check URL         │               │
    │               │                  │<──────────────────│               │
    │               │                  │                   │ goto usage    │
    │               │                  │                   │──────────────>│
    │               │                  │                   │    response   │
    │               │                  │                   │<──────────────│
    │               │                  │ check content     │               │
    │               │                  │<──────────────────│               │
    │               │                  │ close browser     │               │
    │               │                  │──────────────────>│               │
    │               │ {status, isLoggedIn}                 │               │
    │               │<─────────────────│                   │               │
    │  response     │                  │                   │               │
    │<──────────────│                  │                   │               │
```

---

## 2. Backend Implementation

### 2.1 BrowserService.verifyLogin (`src/services/browser.service.js`)

```javascript
static async verifyLogin(id) {
  // 1. Get account
  const account = await AccountModel.findById(id);
  
  // 2. Check profile exists
  const fullProfilePath = path.resolve(account.profilePath);
  if (!fs.existsSync(fullProfilePath)) {
    await AccountModel.updateStatus(id, AccountStatus.NOT_LOGGED_IN);
    return { isLoggedIn: false, message: 'Profile not found' };
  }

  // 3. Launch headless browser
  const context = await chromium.launchPersistentContext(fullProfilePath, {
    headless: true,
    timeout: config.browser.timeout,
  });

  // 4. Test dashboard access
  const page = context.pages()[0] || await context.newPage();
  await page.goto(config.cursor.dashboardUrl);
  await page.waitForTimeout(3000);

  // 5. Check for login redirect
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
    await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
    await context.close();
    return { isLoggedIn: false, status: 'SESSION_EXPIRED' };
  }

  // 6. Test usage page access
  await page.goto(config.cursor.usageUrl);
  await page.waitForTimeout(2000);

  // 7. Check for content
  const hasContent = await page.$('table, .usage-table, main, .content');
  
  // 8. Update status and return
  if (hasContent || !pageContainsLoginText) {
    await AccountModel.updateStatus(id, AccountStatus.LOGGED_IN);
    return { isLoggedIn: true, status: 'LOGGED_IN' };
  }

  await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
  return { isLoggedIn: false, status: 'SESSION_EXPIRED' };
}
```

**File**: `@src/services/browser.service.js:99-191`

### 2.2 API Route Handler

```javascript
router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  
  // 1. Get account
  const account = await AccountService.getById(id);
  if (!account) {
    return res.status(404).json({ error: 'ERR-ACC-002' });
  }

  // 2. Store previous status
  const previousStatus = account.status;

  // 3. Run verification
  const result = await BrowserService.verifyLogin(id);

  // 4. Return result
  res.json({
    success: true,
    data: {
      status: result.status,
      previousStatus,
      isLoggedIn: result.isLoggedIn
    }
  });
});
```

**File**: `@src/routes/account.routes.js:173-223`

---

## 3. Verification Checks

### 3.1 URL-based Checks

| Check | URL Pattern | Result |
|-------|-------------|--------|
| Login redirect | `/login`, `/signin` | SESSION_EXPIRED |
| Dashboard access | `/dashboard` | Continue |
| Usage access | `/dashboard?tab=usage` | Continue |

### 3.2 Content-based Checks

| Selector | Purpose |
|----------|---------|
| `table` | Usage data table |
| `.usage-table` | Usage table class |
| `[data-testid*="usage"]` | Test ID for usage |
| `.dashboard` | Dashboard container |
| `main` | Main content area |
| `.content` | Content container |

### 3.3 Text-based Fallback

```javascript
const bodyText = await page.textContent('body');
if (bodyText.toLowerCase().includes('sign in') || 
    bodyText.toLowerCase().includes('log in')) {
  // SESSION_EXPIRED
}
```

---

## 4. Data Flow

### 4.1 Verify Flow

```
POST /api/accounts/:id/verify
              │
              ▼
        Get account by ID
              │
              ├─► Not found? → 404
              │
              ▼
        Store previousStatus
              │
              ▼
    BrowserService.verifyLogin(id)
              │
              ├─► Profile not found? → NOT_LOGGED_IN
              │
              ▼
    Launch headless browser
              │
              ▼
    Navigate to dashboard
              │
              ├─► Redirected to login? → SESSION_EXPIRED
              │
              ▼
    Navigate to usage page
              │
              ├─► Redirected to login? → SESSION_EXPIRED
              │
              ▼
    Check for content
              │
              ├─► Has content? → LOGGED_IN
              │
              ├─► Contains login text? → SESSION_EXPIRED
              │
              └─► Otherwise → LOGGED_IN
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

---

## 5. Configuration

### 5.1 Timeouts

```javascript
browser: {
  timeout: 60000,           // Browser launch timeout
  navigationTimeout: 60000, // Page navigation timeout
}
```

### 5.2 URLs

```javascript
cursor: {
  dashboardUrl: 'https://cursor.com/dashboard',
  usageUrl: 'https://cursor.com/dashboard?tab=usage',
}
```

---

## 6. Error Handling

### 6.1 Error Cases

| Error | Cause | Handling |
|-------|-------|----------|
| Account not found | Invalid ID | 404 response |
| Browser in use | Browser already open | 409 response |
| Profile not found | Directory missing | Set NOT_LOGGED_IN |
| Navigation timeout | Network issue | Set SESSION_EXPIRED |
| Verification error | Any exception | Set SESSION_EXPIRED |

### 6.2 Cleanup

```javascript
try {
  // verification logic
} catch (error) {
  if (context) await context.close();
  await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
  return { isLoggedIn: false, message: error.message };
}
```

---

## 7. Dependencies

| Package | Purpose |
|---------|---------|
| playwright | Browser automation |
| fs | Check profile exists |
| path | Path manipulation |
