# Development Tasks: CDP Integration

> **Status**: COMPLETED | **Mode**: NEW
> **Created**: 2026-01-29 | **Updated**: 2026-01-30

## Planning Summary

### Requirements (Confirmed)

- Bypass 403 Forbidden từ Cloudflare khi automation
- Kết nối với Chrome thật đang chạy qua CDP
- Attach vào session đã login sẵn
- Fallback về Playwright nếu CDP không available
- UI hiển thị CDP connection status

### Design Decisions

- Sử dụng Playwright `chromium.connectOverCDP()` để kết nối
- Singleton pattern cho CDP browser connection
- Port mặc định: 9222
- Auto-reconnect khi connection lost

## Phase 1: Documentation

- [x] FRD-cdp-integration.md
- [x] TDD-cdp-integration.md
- [x] TEST-cdp-integration.md
- [x] test-cdp.ps1 (PowerShell test script)

## Phase 2: Implementation

- [x] src/config/index.js (CDP configuration)
- [x] src/services/cdp.service.js (CDP connection management)
- [x] src/services/automation-cdp.service.js (Automation via CDP)
- [x] src/services/browser.service.js (Browser management với CDP)
- [x] src/routes/automation.routes.js (CDP API endpoints)

## Phase 3: Frontend

- [x] client/src/components/Dashboard.tsx (CDP status indicator)
- [x] client/src/lib/api.ts (CDP API calls)

## Phase 4: Testing

- [x] Manual testing với Chrome CDP
- [ ] Automated test scripts (test-cdp.ps1)
- [ ] Integration testing với real Cursor accounts

## Test Commands

### Quick Test

```powershell
# Run test script
.\docs\features\cdp-integration\test-cdp.ps1
```

### Manual Test

```powershell
# 1. Launch Chrome with CDP
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-cdp"

# 2. Verify CDP
Invoke-RestMethod -Uri "http://localhost:9222/json/version"

# 3. Test API
Invoke-RestMethod -Uri "http://localhost:3000/api/automation/cdp/connect" -Method POST
```

## Known Issues

- Chrome phải được launch riêng với CDP flag trước khi connect
- Nếu Chrome đóng, cần reconnect lại
- Port 9222 phải available (không có Chrome instance khác dùng)

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/config/index.js` | Modified | Added CDP configuration |
| `src/services/cdp.service.js` | New | CDP connection service |
| `src/services/automation-cdp.service.js` | New | Automation via CDP |
| `src/services/browser.service.js` | Modified | Added CDP integration |
| `src/routes/automation.routes.js` | Modified | Added CDP endpoints |
| `client/src/components/Dashboard.tsx` | Modified | Added CDP status UI |
