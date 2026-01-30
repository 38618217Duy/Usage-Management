# TEST: Login Verification

> **Feature**: Login Verification | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - API

### 1.1 POST /api/accounts/:id/verify

| TC-ID | Mô tả | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| TC-001 | Verify account đã login | logged-in account ID | 200, status=LOGGED_IN | High |
| TC-002 | Verify account chưa login | not-logged-in account ID | 200, status=SESSION_EXPIRED | High |
| TC-003 | Verify account không tồn tại | non-existent ID | 404, ERR-ACC-002 | High |
| TC-004 | Verify khi browser đang mở | account with open browser | 409, ERR-AUTO-004 | High |

---

## 2. Test Cases - Verification Logic

### 2.1 Dashboard Access

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-005 | Dashboard accessible | Valid session | Continue to usage check | High |
| TC-006 | Dashboard redirects to login | Expired session | SESSION_EXPIRED | High |
| TC-007 | Dashboard timeout | Network issue | SESSION_EXPIRED | Medium |

### 2.2 Usage Page Access

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-008 | Usage page accessible | Valid session | LOGGED_IN | High |
| TC-009 | Usage page redirects to login | Expired session | SESSION_EXPIRED | High |
| TC-010 | Usage page has content | Valid session | LOGGED_IN | High |
| TC-011 | Usage page empty | Edge case | Check text fallback | Medium |

### 2.3 Content Detection

| TC-ID | Mô tả | Selector Found | Expected | Priority |
|-------|-------|----------------|----------|----------|
| TC-012 | Table element found | `table` | LOGGED_IN | High |
| TC-013 | Dashboard class found | `.dashboard` | LOGGED_IN | Medium |
| TC-014 | Main content found | `main` | LOGGED_IN | Medium |
| TC-015 | No content, no login text | - | LOGGED_IN | Low |
| TC-016 | No content, has login text | - | SESSION_EXPIRED | Medium |

---

## 3. Test Cases - Status Transitions

| TC-ID | From Status | Action | Expected Status | Priority |
|-------|-------------|--------|-----------------|----------|
| TC-017 | NOT_LOGGED_IN | Verify (success) | LOGGED_IN | High |
| TC-018 | NOT_LOGGED_IN | Verify (fail) | SESSION_EXPIRED | High |
| TC-019 | LOGGED_IN | Verify (success) | LOGGED_IN | High |
| TC-020 | LOGGED_IN | Verify (fail) | SESSION_EXPIRED | High |
| TC-021 | SESSION_EXPIRED | Verify (success) | LOGGED_IN | High |
| TC-022 | SESSION_EXPIRED | Verify (fail) | SESSION_EXPIRED | High |

---

## 4. Test Cases - Error Handling

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-023 | Profile directory không tồn tại | Missing profile | NOT_LOGGED_IN | Medium |
| TC-024 | Browser launch failed | Playwright error | SESSION_EXPIRED | Medium |
| TC-025 | Navigation timeout | Slow network | SESSION_EXPIRED | Medium |
| TC-026 | Unexpected error | Any exception | SESSION_EXPIRED, error logged | Medium |

---

## 5. Manual Test Checklist

### 5.1 Happy Path - Logged In

- [ ] Login to Cursor via "Open Browser"
- [ ] Close browser
- [ ] Click "Verify" button
- [ ] Status should change to LOGGED_IN
- [ ] Badge should be green

### 5.2 Happy Path - Session Expired

- [ ] Clear profile cookies manually (or wait for session to expire)
- [ ] Click "Verify" button
- [ ] Status should change to SESSION_EXPIRED
- [ ] Badge should be red/orange

### 5.3 Error Cases

- [ ] Try verify when browser is open → Should show error
- [ ] Delete profile directory, try verify → Should set NOT_LOGGED_IN
- [ ] Disconnect network, try verify → Should handle gracefully

### 5.4 UI Feedback

- [ ] Loading spinner shown during verification
- [ ] Status badge updates after verification
- [ ] Previous status shown in response
- [ ] Error messages displayed correctly

---

## 6. Test Data

### 6.1 Test Accounts

```json
{
  "loggedInAccount": {
    "id": "logged-in-uuid",
    "email": "logged@example.com",
    "status": "LOGGED_IN"
  },
  "notLoggedInAccount": {
    "id": "not-logged-uuid",
    "email": "notlogged@example.com",
    "status": "NOT_LOGGED_IN"
  },
  "expiredAccount": {
    "id": "expired-uuid",
    "email": "expired@example.com",
    "status": "SESSION_EXPIRED"
  }
}
```

### 6.2 Expected URLs

| Page | URL |
|------|-----|
| Dashboard | `https://cursor.com/dashboard` |
| Usage | `https://cursor.com/dashboard?tab=usage` |
| Login | `https://cursor.com/login` |

---

## 7. Automation Test Script (Example)

```javascript
// Test verify logged-in account
describe('Login Verification', () => {
  it('should return LOGGED_IN for valid session', async () => {
    // Setup: Create account with valid session
    const account = await createAccountWithSession();
    
    // Action: Verify
    const response = await api.post(`/api/accounts/${account.id}/verify`);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('LOGGED_IN');
    expect(response.body.data.isLoggedIn).toBe(true);
  });

  it('should return SESSION_EXPIRED for invalid session', async () => {
    // Setup: Create account without session
    const account = await createAccountWithoutSession();
    
    // Action: Verify
    const response = await api.post(`/api/accounts/${account.id}/verify`);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('SESSION_EXPIRED');
    expect(response.body.data.isLoggedIn).toBe(false);
  });
});
```
