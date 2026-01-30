# TEST: Dashboard UI

> **Feature**: Dashboard UI | **Version**: 1.0
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Test Cases - Dashboard

### 1.1 Initial Load

| TC-ID | Mô tả | Expected | Priority |
|-------|-------|----------|----------|
| TC-001 | Load dashboard | Accounts list displayed | High |
| TC-002 | Show statistics | Total, Logged In, Need Attention counts | High |
| TC-003 | Show CDP status | Connected/Disconnected indicator | High |
| TC-004 | Empty state | "No accounts yet" message | Medium |

### 1.2 Refresh

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-005 | Click refresh | Click Refresh button | Accounts reloaded | High |
| TC-006 | Refresh loading | During refresh | Spinner shown | Medium |

---

## 2. Test Cases - Account Card

### 2.1 Display

| TC-ID | Mô tả | Expected | Priority |
|-------|-------|----------|----------|
| TC-007 | Show email | Email displayed | High |
| TC-008 | Show status badge | Correct color per status | High |
| TC-009 | Show last run time | Formatted timestamp | Medium |
| TC-010 | Show last error | Error message if exists | Medium |

### 2.2 Actions

| TC-ID | Mô tả | Action | Expected | Priority |
|-------|-------|--------|----------|----------|
| TC-011 | Open Browser | Click button | Browser opens | High |
| TC-012 | Verify | Click button | Status updated | High |
| TC-013 | Download | Click button | CSV downloaded | High |
| TC-014 | Delete | Click button | Account removed | High |
| TC-015 | Loading state | During action | Spinner on button | Medium |

---

## 3. Test Cases - Add Account Form

| TC-ID | Mô tả | Input | Expected | Priority |
|-------|-------|-------|----------|----------|
| TC-016 | Add valid email | test@example.com | Account added | High |
| TC-017 | Add empty email | (empty) | Error shown | High |
| TC-018 | Add invalid email | invalid | Error shown | High |
| TC-019 | Add duplicate email | existing@example.com | Error shown | High |
| TC-020 | Form cleared after success | Valid email | Form empty | Medium |

---

## 4. Test Cases - Status Badge

| TC-ID | Status | Expected Color | Expected Text | Priority |
|-------|--------|----------------|---------------|----------|
| TC-021 | LOGGED_IN | Green | Logged In | High |
| TC-022 | NOT_LOGGED_IN | Gray | Not Logged In | High |
| TC-023 | SESSION_EXPIRED | Red | Session Expired | High |

---

## 5. Test Cases - CDP Integration

| TC-ID | Mô tả | Scenario | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-024 | CDP disconnected | Initial state | Red indicator, Connect button | High |
| TC-025 | CDP connected | After connect | Green indicator | High |
| TC-026 | Connect button | Click Connect | Status changes | High |
| TC-027 | Warning banner | CDP disconnected | Banner shown | High |
| TC-028 | Download All disabled | CDP disconnected | Button disabled | High |

---

## 6. Test Cases - Download All

| TC-ID | Mô tả | Pre-condition | Expected | Priority |
|-------|-------|---------------|----------|----------|
| TC-029 | Download All success | CDP connected, accounts logged in | Results shown | High |
| TC-030 | Download All disabled | No logged in accounts | Button disabled | High |
| TC-031 | Download All loading | During download | Spinner shown | Medium |
| TC-032 | Results display | After download | Summary + per-account results | High |

---

## 7. Test Cases - Responsive Design

| TC-ID | Mô tả | Viewport | Expected | Priority |
|-------|-------|----------|----------|----------|
| TC-033 | Desktop layout | 1280px+ | 3 columns grid | Medium |
| TC-034 | Tablet layout | 768px-1279px | 2 columns grid | Medium |
| TC-035 | Mobile layout | <768px | 1 column grid | Medium |

---

## 8. Manual Test Checklist

### 8.1 Initial Load

- [ ] Open http://localhost:5173
- [ ] Dashboard loads without errors
- [ ] Statistics cards show correct counts
- [ ] CDP status indicator visible

### 8.2 Account Management

- [ ] Add new account with valid email
- [ ] Verify account appears in list
- [ ] Status badge shows correct color
- [ ] Delete account
- [ ] Verify account removed

### 8.3 Account Actions

- [ ] Click "Open Browser" → Browser opens
- [ ] Login to Cursor in browser
- [ ] Close browser
- [ ] Click "Verify" → Status changes to LOGGED_IN
- [ ] Click "Download" → CSV downloaded

### 8.4 CDP Integration

- [ ] Verify "CDP: Disconnected" shown initially
- [ ] Launch Chrome with CDP flag
- [ ] Click "Connect" → Status changes to Connected
- [ ] Warning banner disappears
- [ ] "Download All" button enabled

### 8.5 Batch Download

- [ ] Have multiple LOGGED_IN accounts
- [ ] Click "Download All"
- [ ] Verify loading state
- [ ] Verify results summary displayed
- [ ] Verify per-account results shown

### 8.6 Error Handling

- [ ] Try add duplicate email → Error shown
- [ ] Try download without login → Error shown
- [ ] API error → Error message displayed

---

## 9. Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 120+ | Primary |
| Firefox | 120+ | Supported |
| Safari | 17+ | Supported |
| Edge | 120+ | Supported |

---

## 10. Accessibility

| Check | Expected | Priority |
|-------|----------|----------|
| Keyboard navigation | All buttons focusable | Medium |
| Screen reader | Labels readable | Low |
| Color contrast | WCAG AA compliant | Low |
