# FRD: Dashboard UI

> **Feature**: Dashboard UI | **Version**: 1.0 | **Status**: Implemented
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Tổng quan

### 1.1 Mô tả chức năng
Giao diện web React để quản lý và theo dõi các tài khoản Cursor, trigger automation, và xem kết quả download.

### 1.2 Mục tiêu
- Hiển thị danh sách accounts với status
- Trigger các actions: Open Browser, Verify, Download
- Hiển thị CDP connection status
- Batch download cho tất cả accounts

---

## 2. Functional Requirements

### 2.1 FR-001: Dashboard Overview

**Mô tả**: Hiển thị tổng quan về accounts

**UI Elements**:
- Header với title và action buttons
- Statistics cards (Total, Logged In, Need Attention)
- CDP connection status indicator
- Account list grid

**File**: `@client/src/components/Dashboard.tsx`

---

### 2.2 FR-002: Account Statistics

**Mô tả**: Hiển thị thống kê accounts

| Card | Value | Color |
|------|-------|-------|
| Total Accounts | accounts.length | Blue |
| Logged In | LOGGED_IN count | Green |
| Need Attention | EXPIRED + NOT_LOGGED_IN | Red |

**File**: `@client/src/components/Dashboard.tsx:135-171`

---

### 2.3 FR-003: CDP Status Indicator

**Mô tả**: Hiển thị trạng thái kết nối CDP

| Status | Icon | Color | Action |
|--------|------|-------|--------|
| Connected | Wifi | Green | - |
| Disconnected | WifiOff | Red | Connect button |

**File**: `@client/src/components/Dashboard.tsx:86-105`

---

### 2.4 FR-004: Account Card

**Mô tả**: Hiển thị thông tin và actions cho mỗi account

**Display**:
- Email
- Status badge (color-coded)
- Last run time
- Last error (if any)

**Actions**:
| Button | Action | Condition |
|--------|--------|-----------|
| Open Browser | Mở browser để login | Always |
| Verify | Kiểm tra login status | Always |
| Download | Tải CSV | LOGGED_IN only |
| Delete | Xóa account | Always |

**File**: `@client/src/components/AccountCard.tsx`

---

### 2.5 FR-005: Add Account Form

**Mô tả**: Form thêm account mới

**Fields**:
| Field | Type | Validation |
|-------|------|------------|
| Email | text input | Required, email format |

**Actions**:
- Submit: Thêm account
- Clear on success

**File**: `@client/src/components/AddAccountForm.tsx`

---

### 2.6 FR-006: Status Badge

**Mô tả**: Badge hiển thị status với màu sắc

| Status | Color | Text |
|--------|-------|------|
| LOGGED_IN | Green | Logged In |
| NOT_LOGGED_IN | Gray | Not Logged In |
| SESSION_EXPIRED | Red/Orange | Session Expired |

**File**: `@client/src/components/StatusBadge.tsx`

---

### 2.7 FR-007: Download All

**Mô tả**: Batch download cho tất cả LOGGED_IN accounts

**Pre-conditions**:
- CDP phải connected
- Có ít nhất 1 LOGGED_IN account

**UI**:
- Button "Download All (n)" với count
- Loading state khi đang chạy
- Results summary sau khi hoàn thành

**File**: `@client/src/components/Dashboard.tsx:116-129`

---

### 2.8 FR-008: Download Results

**Mô tả**: Hiển thị kết quả batch download

**Display**:
- Total, Successful, Failed, Skipped counts
- Per-account results (email, success/error)

**File**: `@client/src/components/Dashboard.tsx:193-231`

---

### 2.9 FR-009: CDP Warning Banner

**Mô tả**: Hiển thị hướng dẫn khi CDP chưa connected

**Content**:
- Warning message
- Chrome launch command
- Instructions

**File**: `@client/src/components/Dashboard.tsx:173-191`

---

## 3. UI Components

| Component | File | Mô tả |
|-----------|------|-------|
| Dashboard | `Dashboard.tsx` | Main layout |
| AccountCard | `AccountCard.tsx` | Account display |
| AddAccountForm | `AddAccountForm.tsx` | Add account form |
| StatusBadge | `StatusBadge.tsx` | Status indicator |
| DownloadHistory | `DownloadHistory.tsx` | Download history |

---

## 4. State Management

### 4.1 useAccounts Hook

```typescript
interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAccount: (email: string) => Promise<ApiResponse>;
  deleteAccount: (id: string) => Promise<ApiResponse>;
  openBrowser: (id: string) => Promise<ApiResponse>;
  verifyLogin: (id: string) => Promise<ApiResponse>;
  downloadCSV: (id: string) => Promise<ApiResponse>;
  runAll: () => Promise<ApiResponse>;
}
```

**File**: `@client/src/hooks/useAccounts.ts`

---

## 5. API Integration

| Action | API Endpoint | Method |
|--------|--------------|--------|
| Get accounts | /api/accounts | GET |
| Add account | /api/accounts | POST |
| Delete account | /api/accounts/:id | DELETE |
| Open browser | /api/accounts/:id/open-browser | POST |
| Verify login | /api/accounts/:id/verify | POST |
| Download CSV | /api/accounts/:id/download | POST |
| Run all | /api/automation/run-all | POST |
| CDP status | /api/automation/cdp/status | GET |
| CDP connect | /api/automation/cdp/connect | POST |

**File**: `@client/src/lib/api.ts`

---

## 6. Styling

- **Framework**: TailwindCSS
- **Icons**: Lucide React
- **Layout**: Responsive grid
- **Colors**: Gray, Blue, Green, Red, Yellow

---

## 7. Files liên quan

| File | Mô tả |
|------|-------|
| `client/src/App.tsx` | App entry |
| `client/src/components/Dashboard.tsx` | Main dashboard |
| `client/src/components/AccountCard.tsx` | Account card |
| `client/src/components/AddAccountForm.tsx` | Add form |
| `client/src/components/StatusBadge.tsx` | Status badge |
| `client/src/components/DownloadHistory.tsx` | History |
| `client/src/hooks/useAccounts.ts` | State hook |
| `client/src/lib/api.ts` | API client |
| `client/src/types/account.ts` | TypeScript types |
