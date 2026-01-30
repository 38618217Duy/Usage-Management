# TEST: Session Expiry Tracking

> **Feature**: Session Expiry Tracking | **FRD**: [FRD](./FRD-session-expiry-tracking.md) | **TDD**: [TDD](./TDD-session-expiry-tracking.md)

---

## Summary

| Loại | Số lượng |
|------|----------|
| Happy Path | 6 |
| Error Cases | 4 |
| Edge Cases | 3 |

---

## 1. Happy Path

### SC-001: Lấy session status của tất cả accounts

```gherkin
Given có 5 accounts trong hệ thống với các trạng thái session khác nhau
When gọi GET /api/sessions/status
Then response 200 với danh sách accounts được nhóm theo sessionStatus
And mỗi account có timeRemaining được tính toán chính xác
And summary hiển thị đúng số lượng từng trạng thái
```

### SC-002: Kiểm tra session status của 1 account có cookie hợp lệ

```gherkin
Given account có profile với cookie cursor.com còn hạn 5 ngày
When gọi POST /api/sessions/check/:accountId
Then response 200 với sessionStatus = "HEALTHY"
And sessionExpirySource = "cookie"
And timeRemaining.days = 5
```

### SC-003: Kiểm tra session status của account không có cookie

```gherkin
Given account có profile nhưng không có cookie cursor.com
And account có lịch sử 3 sessions với average duration 7 ngày
When gọi POST /api/sessions/check/:accountId
Then response 200 với sessionExpirySource = "estimated"
And sessionExpiryAt được tính từ lastLoginAt + 7 ngày
```

### SC-004: Lấy session history của account

```gherkin
Given account có 5 session records trong lịch sử
When gọi GET /api/sessions/history/:accountId
Then response 200 với history array có 5 items
And statistics.averageDurationDays được tính đúng
And predictedNextExpiry được tính từ average duration
```

### SC-005: Lấy summary theo nhóm trạng thái

```gherkin
Given có 10 accounts: 2 EXPIRED, 1 CRITICAL, 2 WARNING, 5 HEALTHY
When gọi GET /api/sessions/summary
Then response 200 với groups chứa đúng accounts theo từng trạng thái
And needsAttention = 5 (EXPIRED + CRITICAL + WARNING)
```

### SC-006: Batch login workflow

```gherkin
Given có 3 accounts cần login (1 EXPIRED, 1 CRITICAL, 1 WARNING)
When gọi POST /api/sessions/batch-login với accountIds
Then accounts được sắp xếp theo urgency: EXPIRED > CRITICAL > WARNING
And browser được mở tuần tự cho từng account
And sau khi user đóng browser, session được verify và record
```

---

## 2. Error Cases

### SC-007: Kiểm tra session của account không tồn tại

```gherkin
Given accountId không tồn tại trong hệ thống
When gọi POST /api/sessions/check/:accountId
Then response 404 với error code "ERR-SESSION-001"
And message "Không tìm thấy tài khoản"
```

### SC-008: Kiểm tra session của account chưa có profile

```gherkin
Given account tồn tại nhưng profilePath không tồn tại trên disk
When gọi POST /api/sessions/check/:accountId
Then response 400 với error code "ERR-SESSION-002"
And message "Profile chưa được tạo, vui lòng login trước"
```

### SC-009: Batch login khi đã có browser đang mở

```gherkin
Given account A đang có browser mở
When gọi POST /api/sessions/batch-login với accountIds chứa account A
Then response 409 với error code "ERR-SESSION-004"
And message "Browser đang mở cho tài khoản này"
```

### SC-010: Cookie analysis thất bại

```gherkin
Given account có profile nhưng Cookies database bị corrupted
When gọi POST /api/sessions/check/:accountId
Then fallback sang estimated từ session history
And sessionExpirySource = "estimated"
```

---

## 3. Edge Cases

### SC-011: Account mới chưa có lịch sử session

```gherkin
Given account mới tạo, chưa login lần nào
And không có session history
When gọi POST /api/sessions/check/:accountId
Then sessionStatus = "UNKNOWN"
And sessionExpiryAt = null
And averageSessionDays = null
```

### SC-012: Session hết hạn đúng lúc kiểm tra

```gherkin
Given account có cookie với expiryAt = now + 1 minute
When gọi POST /api/sessions/check/:accountId
Then sessionStatus = "CRITICAL"
And timeRemaining.hours < 1
```

### SC-013: History đạt giới hạn 50 records

```gherkin
Given account đã có 50 session records
When record session mới
Then record cũ nhất bị xóa
And total records vẫn là 50
```

---

## Test Execution

| Date | Tester | Pass | Fail | Notes |
|------|--------|------|------|-------|
| | | | | |
