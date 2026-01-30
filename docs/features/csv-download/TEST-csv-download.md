# TEST: CSV Download

> **Feature**: CSV Download | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - Single Download API

### 1.1 POST /api/accounts/:id/download

| TC-ID | Mô tả | Pre-condition | Expected | Priority |
|-------|-------|---------------|----------|----------|
| TC-001 | Download CSV thành công | LOGGED_IN account | 200, file saved | High |
| TC-002 | Download account không tồn tại | Invalid ID | 404, ERR-ACC-002 | High |
| TC-003 | Download account chưa login | NOT_LOGGED_IN | 400, ERR-AUTO-001 | High |
| TC-004 | Download account session expired | SESSION_EXPIRED | 401, ERR-AUTO-002 | High |
| TC-005 | Download khi browser đang mở | Browser open | 409, ERR-AUTO-004 | High |

---

## 2. Test Cases - Batch Download API

### 2.1 POST /api/automation/run-all

| TC-ID | Mô tả | Pre-condition | Expected | Priority |
|-------|-------|---------------|----------|----------|
| TC-006 | Batch download thành công | Multiple LOGGED_IN | All downloaded | High |
| TC-007 | Batch download không có account | No LOGGED_IN | total=0, skipped=all | High |
| TC-008 | Batch download mixed results | Some LOGGED_IN | Partial success | High |
| TC-009 | Batch download với CDP disconnected | CDP not connected | Error message | High |

---

## 3. Test Cases - Download Process

### 3.1 Navigation

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-010 | Navigate to dashboard | Valid session | Dashboard loaded | High |
| TC-011 | Navigate to usage tab | Click menu | Usage page loaded | High |
| TC-012 | Direct URL fallback | Menu not found | Usage page via URL | Medium |
| TC-013 | Session expired during nav | Invalid session | SESSION_EXPIRED error | High |

### 3.2 Date Range Selection

| TC-ID | Mô tả | Selector | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-014 | Select 30 days | button:has-text("30d") | Range selected | Medium |
| TC-015 | 30 days button not found | - | Continue without selection | Low |

### 3.3 Export Button

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-016 | Find Export CSV button | Primary selector | Button found | High |
| TC-017 | Find via text search | Fallback | Button found | Medium |
| TC-018 | Export button not found | No button | EXPORT_BUTTON_NOT_FOUND | High |

### 3.4 File Download

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-019 | Download triggered | Click export | Download event fired | High |
| TC-020 | File saved correctly | Download complete | File at download/{email}.csv | High |
| TC-021 | Download timeout | Slow response | DOWNLOAD_FAILED | Medium |

---

## 4. Test Cases - File Output

### 4.1 File Naming

| TC-ID | Email | Expected Filename | Priority |
|-------|-------|-------------------|----------|
| TC-022 | user@example.com | user@example.com.csv | High |
| TC-023 | user.name@domain.org | user.name@domain.org.csv | High |
| TC-024 | user+tag@example.com | user_tag@example.com.csv | Medium |
| TC-025 | user@sub.domain.co.jp | user@sub.domain.co.jp.csv | Medium |

### 4.2 File Location

| TC-ID | Mô tả | Expected | Priority |
|-------|-------|----------|----------|
| TC-026 | File saved in download/ | download/{email}.csv | High |
| TC-027 | download/ created if not exists | Directory created | High |
| TC-028 | Overwrite existing file | Old file replaced | Medium |

---

## 5. Test Cases - Error Handling

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-029 | Browser launch failed | Playwright error | Error returned | Medium |
| TC-030 | Navigation timeout | Network issue | Error returned | Medium |
| TC-031 | Page crash | Browser crash | Cleanup, error returned | Medium |
| TC-032 | lastRunAt updated on success | Download complete | Timestamp updated | High |
| TC-033 | lastError updated on failure | Download failed | Error message saved | High |

---

## 6. Manual Test Checklist

### 6.1 Single Download

- [ ] Login to account via "Open Browser"
- [ ] Close browser
- [ ] Click "Download" button
- [ ] Verify loading state shown
- [ ] Verify file downloaded to download/
- [ ] Verify file contains CSV data
- [ ] Verify lastRunAt updated

### 6.2 Batch Download

- [ ] Have multiple LOGGED_IN accounts
- [ ] Launch Chrome with CDP (--remote-debugging-port=9222)
- [ ] Login to Cursor in Chrome
- [ ] Click "Connect" in dashboard
- [ ] Click "Download All" button
- [ ] Verify progress shown
- [ ] Verify results summary displayed
- [ ] Verify all files downloaded

### 6.3 Error Cases

- [ ] Try download without login → Error message
- [ ] Try download with browser open → Error message
- [ ] Try batch download without CDP → Error message
- [ ] Disconnect network during download → Error handled

### 6.4 File Verification

- [ ] Open downloaded CSV
- [ ] Verify CSV format correct
- [ ] Verify data contains usage info
- [ ] Verify date range is 30 days

---

## 7. Test Data

### 7.1 Test Accounts

```json
{
  "loggedInAccount": {
    "id": "logged-uuid",
    "email": "logged@example.com",
    "status": "LOGGED_IN"
  },
  "notLoggedInAccount": {
    "id": "notlogged-uuid",
    "email": "notlogged@example.com",
    "status": "NOT_LOGGED_IN"
  }
}
```

### 7.2 Expected CSV Format

```csv
Date,Model,Requests,Tokens
2026-01-29,gpt-4,100,50000
2026-01-28,gpt-4,85,42000
...
```

---

## 8. Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Single download time | < 30s | Time from click to file saved |
| Batch download per account | < 2min | Average time per account |
| Memory usage | < 1GB | During batch download |
