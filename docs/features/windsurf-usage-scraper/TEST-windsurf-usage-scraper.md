# TEST: Windsurf Usage Scraper

> **Feature**: Windsurf Usage Scraper | **Version**: 1.0
> **Updated**: 2026-02-10

---

## 1. Test Scenarios Overview

| Category | Count | Description |
|----------|-------|-------------|
| Happy Path | 4 | Các luồng chính hoạt động đúng |
| Error Cases | 5 | Xử lý lỗi và edge cases |
| Integration | 2 | Tích hợp với hệ thống hiện tại |

---

## 2. Happy Path Scenarios

### TC-001: Scrape Usage Data Successfully

```gherkin
Feature: Scrape Windsurf Usage Data

Scenario: Scrape usage data từ account đã đăng nhập
  Given account Windsurf với status "LOGGED_IN"
  When gọi API POST /api/windsurf/accounts/:id/scrape
  Then response status 200
  And response chứa creditsRemaining, creditsUsed, creditsTotal, resetDate
  And file CSV được tạo tại download/windsurf/{email}.csv
```

### TC-002: Create Windsurf Account

```gherkin
Scenario: Tạo Windsurf account mới
  Given email "user@example.com" chưa tồn tại
  When gọi API POST /api/windsurf/accounts với body { "email": "user@example.com" }
  Then response status 201
  And account được tạo với platform "windsurf"
  And profile folder được tạo tại profiles/windsurf/acc-{id}
```

### TC-003: List All Windsurf Accounts

```gherkin
Scenario: Liệt kê tất cả Windsurf accounts
  Given có 3 Windsurf accounts trong hệ thống
  When gọi API GET /api/windsurf/accounts
  Then response status 200
  And response chứa danh sách 3 accounts
  And mỗi account có platform "windsurf"
```

### TC-004: Scrape All Logged-in Accounts

```gherkin
Scenario: Scrape tất cả accounts đã đăng nhập
  Given có 5 Windsurf accounts, 3 accounts có status "LOGGED_IN"
  When gọi API POST /api/windsurf/scrape-all
  Then response status 200
  And response chứa successful: 3, skipped: 2
  And 3 file CSV được tạo trong download/windsurf/
```

---

## 3. Error Cases

### TC-ERR-001: Scrape Account Not Logged In

```gherkin
Scenario: Scrape account chưa đăng nhập
  Given account Windsurf với status "NOT_LOGGED_IN"
  When gọi API POST /api/windsurf/accounts/:id/scrape
  Then response status 400
  And error code "ERR-WS-002"
  And message "Account is not logged in"
```

### TC-ERR-002: Session Expired During Scrape

```gherkin
Scenario: Session hết hạn khi scrape
  Given account Windsurf với status "LOGGED_IN"
  And session đã hết hạn (redirect về login page)
  When gọi API POST /api/windsurf/accounts/:id/scrape
  Then response status 401
  And error code "ERR-WS-003"
  And account status được cập nhật thành "SESSION_EXPIRED"
```

### TC-ERR-003: Account Not Found

```gherkin
Scenario: Scrape account không tồn tại
  Given account ID không tồn tại trong hệ thống
  When gọi API POST /api/windsurf/accounts/:id/scrape
  Then response status 404
  And error code "ERR-WS-001"
```

### TC-ERR-004: Duplicate Email

```gherkin
Scenario: Tạo account với email đã tồn tại
  Given email "user@example.com" đã tồn tại
  When gọi API POST /api/windsurf/accounts với body { "email": "user@example.com" }
  Then response status 409
  And error code "ERR-WS-005"
```

### TC-ERR-005: Scrape Failed - Cannot Find Usage Data

```gherkin
Scenario: Không tìm thấy usage data trên trang
  Given account Windsurf với status "LOGGED_IN"
  And trang Usage không có dữ liệu hoặc selectors không match
  When gọi API POST /api/windsurf/accounts/:id/scrape
  Then response status 500
  And error code "ERR-WS-004"
```

---

## 4. Integration Tests

### TC-INT-001: Download Folder Structure

```gherkin
Scenario: Verify folder structure sau khi scrape
  Given hệ thống đã scrape cả Cursor và Windsurf accounts
  When kiểm tra folder download/
  Then tồn tại folder download/cursor/
  And tồn tại folder download/windsurf/
  And Cursor CSV files nằm trong download/cursor/
  And Windsurf CSV files nằm trong download/windsurf/
```

### TC-INT-002: Verify CSV Format

```gherkin
Scenario: Verify CSV output format
  Given scrape thành công cho account "user@example.com"
  When đọc file download/windsurf/user@example.com.csv
  Then file có header: email,credits_remaining,credits_used,credits_total,reset_date,scraped_at
  And có ít nhất 1 data row
  And các giá trị đúng format (number, date, datetime)
```

---

## 5. Test Data

### Sample Accounts

| Email | Status | Expected Result |
|-------|--------|-----------------|
| ws_test1@example.com | LOGGED_IN | Scrape success |
| ws_test2@example.com | NOT_LOGGED_IN | Error ERR-WS-002 |
| ws_test3@example.com | SESSION_EXPIRED | Error ERR-WS-003 |

### Expected CSV Output

```csv
email,credits_remaining,credits_used,credits_total,reset_date,scraped_at
ws_test1@example.com,450,50,500,2026-03-01,2026-02-10T09:55:00.000Z
```

---

## References

| Type | Path/Link |
|------|-----------|
| FRD | `docs/features/windsurf-usage-scraper/FRD-windsurf-usage-scraper.md` |
| TDD | `docs/features/windsurf-usage-scraper/TDD-windsurf-usage-scraper.md` |
