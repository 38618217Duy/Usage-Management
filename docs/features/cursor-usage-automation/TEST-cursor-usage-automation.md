# TEST: Cursor Usage Automation

> **Feature**: Cursor Usage Automation | **FRD**: [FRD](./FRD-cursor-usage-automation.md) | **TDD**: [TDD](./TDD-cursor-usage-automation.md)

---

## Summary

| Loại | Số lượng |
|------|----------|
| Happy Path | 7 |
| Error Cases | 6 |
| Edge Cases | 3 |

---

## 1. Happy Path

### SC-001: Thêm tài khoản mới thành công

```gherkin
Given admin ở trang dashboard
When nhập email "user@example.com" và submit
Then tạo account với status "NOT_LOGGED_IN"
And tạo thư mục profile tại profiles/acc-{id}
And hiển thị account trong danh sách
```

### SC-002: Xem danh sách tài khoản

```gherkin
Given có 3 accounts trong hệ thống
When load dashboard
Then hiển thị 3 accounts với status, lastRunAt, lastError
```

### SC-003: Mở browser để đăng nhập

```gherkin
Given account với status "NOT_LOGGED_IN"
When click "Open Login Browser"
Then mở Chromium browser với persistent profile
And browser navigate đến cursor.com
```

### SC-004: Verify login thành công

```gherkin
Given account đã đăng nhập trong browser
When trigger verify
Then navigate đến /usage không bị redirect
And update status thành "LOGGED_IN"
```

### SC-005: Tải CSV thành công

```gherkin
Given account với status "LOGGED_IN"
When trigger download CSV
Then navigate đến /usage
And select 30-day range
And click Export CSV
And save file tại download/{email}.csv
And update lastRunAt
```

### SC-006: Batch download thành công

```gherkin
Given 3 accounts với status "LOGGED_IN"
When trigger "Run All"
Then download CSV tuần tự cho từng account
And trả về summary với total=3, successful=3
```

### SC-007: Xóa tài khoản thành công

```gherkin
Given account tồn tại
When click Delete và confirm
Then xóa account khỏi accounts.json
And xóa thư mục profile
```

---

## 2. Error Cases

### SC-008: Thêm account với email trống

```gherkin
When submit form với email trống
Then response 400 với code "ERR-ACC-001"
And message "Email là bắt buộc"
```

### SC-009: Thêm account với email đã tồn tại

```gherkin
Given account với email "user@example.com" đã tồn tại
When thêm account với cùng email
Then response 409 với code "ERR-ACC-003"
And message "Email đã tồn tại"
```

### SC-010: Download CSV khi chưa đăng nhập

```gherkin
Given account với status "NOT_LOGGED_IN"
When trigger download CSV
Then response 400 với code "ERR-AUTO-001"
And message "Tài khoản chưa đăng nhập"
```

### SC-011: Verify phát hiện session expired

```gherkin
Given account với session đã hết hạn
When trigger verify
Then navigate đến /usage bị redirect về /login
And update status thành "SESSION_EXPIRED"
```

### SC-012: Account không tồn tại

```gherkin
When request với account id không tồn tại
Then response 404 với code "ERR-ACC-002"
And message "Không tìm thấy tài khoản"
```

### SC-013: Download thất bại do lỗi mạng

```gherkin
Given account LOGGED_IN nhưng mạng bị lỗi
When trigger download
Then response 500 với code "ERR-AUTO-003"
And update lastError với message lỗi
```

---

## 3. Edge Cases

### SC-014: Batch download với một số account expired

```gherkin
Given 3 accounts: 2 LOGGED_IN, 1 SESSION_EXPIRED
When trigger "Run All"
Then download CSV cho 2 LOGGED_IN accounts
And skip SESSION_EXPIRED account
And trả về summary với total=2, successful=2, skipped=1
```

### SC-015: Mở browser khi browser đã mở

```gherkin
Given browser đang mở cho account
When click "Open Login Browser" lần nữa
Then response 409 với code "ERR-AUTO-004"
And message "Browser đang mở cho tài khoản này"
```

### SC-016: Download với file CSV đã tồn tại

```gherkin
Given file download/{email}.csv đã tồn tại
When trigger download
Then overwrite file cũ với file mới
And update lastRunAt
```

---

## Test Execution

| Date | Tester | Pass | Fail | Notes |
|------|--------|------|------|-------|
| | | | | |
