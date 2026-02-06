# TEST: CSV Download Automation Enhancement

> **Feature**: CSV Download Automation Enhancement | **FRD**: [FRD](./FRD-csv-download-automation.md) | **TDD**: [TDD](./TDD-csv-download-automation.md)

---

## Summary

| Loại | Số lượng |
|------|----------|
| Happy Path | 6 |
| Error Cases | 5 |
| Edge Cases | 3 |

---

## 1. Happy Path

### SC-001: Monthly Date Range Filtering Success

```gherkin
Given CSV file contains 1000 records spanning 3 months (Nov 2025 - Jan 2026)
And current date is 2026-02-06
When downloadCSV is called with monthly filtering
Then CSV should be filtered to only include records from 2026-01-01 to 2026-02-01
And originalCount should be 1000
And filteredCount should be approximately 333 records
```

### SC-002: CDP Download Success

```gherkin
Given Chrome is running with --remote-debugging-port=9222
And user is logged into Cursor dashboard in Chrome
When AutomationCDPService.downloadCSV is called
Then CSV file should be downloaded successfully
And monthly filtering should be applied
And result should contain filePath and filteredRecords count
```

### SC-003: Playwright Download Success (Enhanced)

```gherkin
Given user account has LOGGED_IN status
And browser profile exists
When AutomationService.downloadCSV is called
Then browser should navigate to usage page
And custom date range should be selected (previous month)
And CSV should be downloaded and filtered
And result should include originalRecords and filteredRecords
```

### SC-004: Custom Date Range Selection

```gherkin
Given usage page is loaded with calendar picker
And target date range is January 1 to February 1
When selectCustomDateRange is called
Then calendar should open successfully
And navigation should go to January 2026
And day "1" should be selected (not "10", "11", "12")
And Apply button should be clicked
```

### SC-005: Batch Download All Accounts (CDP)

```gherkin
Given 3 accounts with LOGGED_IN status
And Chrome CDP is connected
When AutomationCDPService.runAll is called
Then all 3 accounts should be processed sequentially
And each CSV should be downloaded and filtered
And summary should show successful: 3, failed: 0
```

### SC-006: Calendar Month Navigation

```gherkin
Given calendar picker is open
And current month is February 2026
And target month is January 2026
When navigateToMonthAndSelectDay is called for January 1
Then previous button should be clicked once
And calendar should show January 2026
And day "1" should be selected precisely
```

---

## 2. Error Cases

### SC-007: CDP Connection Failed

```gherkin
Given Chrome is not running with CDP enabled
When AutomationCDPService.downloadCSV is called
Then error should be "CDP_CONNECTION_FAILED"
And message should contain "--remote-debugging-port=9222"
And filePath should be null
```

### SC-008: Session Expired During Download

```gherkin
Given user session expires during download process
When automation reaches usage page navigation
Then current URL should contain "/login" or "/signin"
And account status should be updated to SESSION_EXPIRED
And error should be "SESSION_EXPIRED"
```

### SC-009: Export Button Not Found

```gherkin
Given usage page loads successfully
But export button selectors have changed
When searching for export button with all patterns
Then error should be "EXPORT_BUTTON_NOT_FOUND"
And message should be "Could not find Export CSV button on the page"
```

### SC-010: No Browser Context (CDP)

```gherkin
Given Chrome is running with CDP enabled
But no browser windows are open
When AutomationCDPService.downloadCSV attempts to get context
Then error should be "NO_BROWSER_CONTEXT"
And message should contain "Make sure Chrome has at least one window open"
```

### SC-011: CSV Filtering Failed

```gherkin
Given CSV file is downloaded successfully
But file contains invalid date format in first column
When filterCsvByDateRange is called
Then filtering should skip invalid records
And filteredCount should reflect only valid records
And process should complete without throwing error
```

---

## 3. Edge Cases

### SC-012: Large CSV File Processing

```gherkin
Given CSV file is 100MB with 500,000 records
When filterCsvByDateRange processes the file
Then filtering should complete within 30 seconds
And memory usage should remain stable
And filtered file should be written successfully
```

### SC-013: Calendar Navigation Edge Case

```gherkin
Given calendar picker shows December 2025
And target month is January 2026 (next year)
When navigateToMonthAndSelectDay is called
Then navigation should handle year boundary correctly
And should find "January 2026" header
And should select day "1" in correct month/year
```

### SC-014: Concurrent Download Prevention

```gherkin
Given automation is already running for account A
When second download request is made for same account
Then second request should return "BROWSER_IN_USE" error
And first download should continue uninterrupted
And browser cleanup should work correctly
```

---

## Test Execution

| Date | Tester | Pass | Fail | Notes |
|------|--------|------|------|-------|
| | | | | |
