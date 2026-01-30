# TEST: Account Management

> **Feature**: Account Management | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - API

### 1.1 POST /api/accounts - Tạo account mới

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-001 | Tạo account với email hợp lệ | `{"email": "test@example.com"}` | 201, account object | High |
| TC-002 | Tạo account với email đã tồn tại | `{"email": "existing@example.com"}` | 409, ERR-ACC-003 | High |
| TC-003 | Tạo account không có email | `{}` | 400, ERR-ACC-001 | High |
| TC-004 | Tạo account với email không hợp lệ | `{"email": "invalid-email"}` | 400, ERR-ACC-001 | High |
| TC-005 | Tạo account với email có spaces | `{"email": "  test@example.com  "}` | 201, email trimmed | Medium |

### 1.2 GET /api/accounts - Lấy danh sách accounts

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-006 | Lấy danh sách khi có accounts | - | 200, array of accounts | High |
| TC-007 | Lấy danh sách khi không có accounts | - | 200, empty array | High |

### 1.3 GET /api/accounts/:id - Lấy chi tiết account

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-008 | Lấy account với ID hợp lệ | valid UUID | 200, account object | High |
| TC-009 | Lấy account với ID không tồn tại | non-existent UUID | 404, ERR-ACC-002 | High |

### 1.4 DELETE /api/accounts/:id - Xóa account

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-010 | Xóa account với ID hợp lệ | valid UUID | 200, success message | High |
| TC-011 | Xóa account với ID không tồn tại | non-existent UUID | 404, ERR-ACC-002 | High |
| TC-012 | Xóa account và verify profile directory bị xóa | valid UUID | Profile dir removed | Medium |

---

## 2. Test Cases - Business Logic

### 2.1 Email Validation

| TC-ID | Mô tả | Input | Expected | Priority |
|-------|-------|-------|----------|----------|
| TC-013 | Email format chuẩn | `user@domain.com` | Valid | High |
| TC-014 | Email với subdomain | `user@sub.domain.com` | Valid | Medium |
| TC-015 | Email không có @ | `userdomain.com` | Invalid | High |
| TC-016 | Email không có domain | `user@` | Invalid | High |
| TC-017 | Email rỗng | `""` | Invalid | High |

### 2.2 Profile Directory

| TC-ID | Mô tả | Expected | Priority |
|-------|-------|----------|----------|
| TC-018 | Tạo profile directory khi create account | Directory created at `profiles/acc-{uuid}` | High |
| TC-019 | Xóa profile directory khi delete account | Directory removed | High |
| TC-020 | Profile directory không tồn tại khi delete | No error, account still deleted | Medium |

---

## 3. Test Cases - UI

### 3.1 AddAccountForm

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-021 | Submit với email hợp lệ | Enter email, click Add | Account added, form cleared | High |
| TC-022 | Submit với email rỗng | Click Add without email | Error message shown | High |
| TC-023 | Submit khi đang loading | Click Add twice quickly | Second click disabled | Medium |
| TC-024 | Hiển thị error từ API | Submit duplicate email | Error message from API | High |

### 3.2 AccountCard

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-025 | Hiển thị thông tin account | Render card | Email, status, timestamps shown | High |
| TC-026 | Click Delete button | Click Delete | Confirmation, then delete | High |
| TC-027 | Status badge color | Render with different status | Correct color per status | Medium |

### 3.3 Dashboard

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-028 | Hiển thị danh sách accounts | Load page | All accounts displayed | High |
| TC-029 | Refresh accounts | Click Refresh | List updated | High |
| TC-030 | Empty state | No accounts | "No accounts yet" message | Medium |

---

## 4. Test Data

### 4.1 Valid Accounts

```json
[
  { "email": "test1@example.com" },
  { "email": "test2@domain.org" },
  { "email": "user.name@company.co.jp" }
]
```

### 4.2 Invalid Emails

```json
[
  { "email": "" },
  { "email": "invalid" },
  { "email": "@domain.com" },
  { "email": "user@" },
  { "email": "user name@domain.com" }
]
```

---

## 5. Manual Test Checklist

### 5.1 Account CRUD

- [ ] Thêm account mới với email hợp lệ
- [ ] Verify account xuất hiện trong danh sách
- [ ] Verify profile directory được tạo
- [ ] Xóa account
- [ ] Verify account bị xóa khỏi danh sách
- [ ] Verify profile directory bị xóa

### 5.2 Validation

- [ ] Thử thêm account với email không hợp lệ
- [ ] Thử thêm account với email đã tồn tại
- [ ] Verify error messages hiển thị đúng

### 5.3 UI/UX

- [ ] Form clear sau khi thêm thành công
- [ ] Loading state hiển thị khi đang xử lý
- [ ] Status badge hiển thị đúng màu
- [ ] Responsive trên mobile
