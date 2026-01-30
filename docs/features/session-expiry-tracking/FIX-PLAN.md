# Fix Plan: Session Expiry Tracking

> **Created**: 2026-01-30 | **Status**: In Progress

## Overview

Kế hoạch fix các issues được phát hiện trong branch review cho feature Session Expiry Tracking.

---

## Phase 1: Security Issues (Priority: HIGH)

### Issue 1.1: Path Traversal Vulnerability

- **File**: `src/services/cookie-analyzer.service.js:11-13`
- **Problem**: `profilePath` được nối trực tiếp với root path mà không validate
- **Risk**: Attacker có thể đọc cookie database từ bất kỳ đâu trong filesystem
- **Fix**: Validate và normalize path, ensure path nằm trong root directory
- **Status**: ⬜ Pending

### Issue 1.2: Sensitive Cookie Data Exposure in Logs

- **File**: `src/services/cookie-analyzer.service.js:118-123`
- **Problem**: Log output có thể chứa session tokens
- **Risk**: Session tokens có thể bị leak qua log files
- **Fix**: Không log cookie values, chỉ log metadata
- **Status**: ⬜ Pending

### Issue 1.3: Temp File Race Condition

- **File**: `src/services/cookie-analyzer.service.js:31-49`
- **Problem**: Sử dụng `Date.now()` có thể collision trong concurrent requests
- **Risk**: Data corruption
- **Fix**: Sử dụng `crypto.randomUUID()` thay vì `Date.now()`
- **Status**: ⬜ Pending

---

## Phase 2: Bug Issues (Priority: HIGH)

### Issue 2.1: Missing Error Handling for File Operations

- **File**: `src/models/session-history.js:27-29`
- **Problem**: `writeAll()` không có try-catch
- **Risk**: Session history data loss, silent failures
- **Fix**: Wrap trong try-catch và throw error với proper message
- **Status**: ⬜ Pending

### Issue 2.2: Time Calculation Logic Error

- **File**: `src/services/session.service.js:29-36`
- **Problem**: CRITICAL (72h) overlap với WARNING (3 days = 72h)
- **Risk**: Account có thể bị classify sai status
- **Fix**: Thay đổi CRITICAL threshold thành 24h (1 day) để tránh overlap
- **Status**: ⬜ Pending

### Issue 2.3: Potential Memory Leak

- **File**: `src/services/cookie-analyzer.service.js:36-47`
- **Problem**: `SQL.Database` buffer có thể không được cleanup nếu có error
- **Risk**: Memory leak khi analyze nhiều accounts
- **Fix**: Sử dụng try-finally để ensure cleanup
- **Status**: ⬜ Pending

---

## Phase 3: Code Quality Issues (Priority: MEDIUM)

### Issue 3.1: Missing Input Validation

- **File**: `src/routes/session.routes.js:105-131`
- **Problem**: `accountIds` array không được validate
- **Fix**: Add validation cho length, format, duplicates
- **Status**: ⬜ Pending

### Issue 3.2: Hardcoded Magic Numbers

- **Files**: Multiple files
- **Problem**: Constants không có documentation
- **Fix**: Move to config với comments giải thích
- **Status**: ⬜ Pending

### Issue 3.3: Inconsistent Error Format

- **File**: `src/services/session.service.js`
- **Problem**: Error format khác nhau ở các nơi
- **Fix**: Standardize error format
- **Status**: ⬜ Pending

---

## Phase 4: Architecture Issues (Priority: MEDIUM)

### Issue 4.1: Missing Shared Types

- **File**: `client/src/hooks/useSessionStatus.ts`
- **Problem**: Interfaces được define inline
- **Fix**: Move interfaces to `client/src/types/session.ts`
- **Status**: ⬜ Pending

### Issue 4.2: Backend Standards Violation

- **Problem**: Backend dùng JavaScript thay vì TypeScript
- **Decision**: Giữ JavaScript cho backend (đây là legacy codebase), nhưng document rõ ràng
- **Status**: ⬜ Pending (Document only)

---

## Phase 5: Test Suite (Priority: CRITICAL)

### Test Requirements

- Unit tests cho `CookieAnalyzerService`
- Unit tests cho `SessionService`
- Unit tests cho `SessionHistoryModel`
- Integration tests cho API endpoints
- Target: ≥90% branch coverage

### Test Perspective Table

Sẽ được tạo trong `TEST-session-expiry-tracking.md`

---

## Progress Tracking

| Phase   | Status       | Issues Fixed | Notes          |
| ------- | ------------ | ------------ | -------------- |
| Phase 1 | ✅ Completed | 3/3          | Security fixes |
| Phase 2 | ✅ Completed | 3/3          | Bug fixes      |
| Phase 3 | ✅ Completed | 3/3          | Code quality   |
| Phase 4 | ✅ Completed | 2/2          | Architecture   |
| Phase 5 | ✅ Completed | 1/1          | Test suite     |
| Phase 6 | ✅ Completed | -            | Documentation  |

---

## Changelog

### 2026-01-30

- Created fix plan document
- **Phase 1 Completed**: Fixed 3 security issues
  - Path traversal vulnerability in cookie-analyzer.service.js
  - Cookie data exposure in logs
  - Temp file race condition (using crypto.randomUUID)
  - Memory leak prevention with try-finally cleanup
- **Phase 2 Completed**: Fixed 3 bug issues
  - Added error handling for file operations in session-history.js
  - Fixed time calculation logic (CRITICAL threshold changed from 72h to 24h)
  - Memory leak fix included in Phase 1
- **Phase 3 Completed**: Fixed 3 code quality issues
  - Added comprehensive input validation for batch-login endpoint
  - Added documentation for magic numbers
  - Standardized error format in session.service.js
- **Phase 4 Completed**: Fixed 2 architecture issues
  - Created shared types in client/src/types/session.ts
  - Refactored useSessionStatus.ts to use shared types
- **Phase 5 Completed**: Created comprehensive test suite
  - session.service.test.js - 15+ test cases
  - cookie-analyzer.service.test.js - 20+ test cases
  - session-history.model.test.js - 12+ test cases
  - session.routes.test.js - 20+ test cases
- **Phase 6 Completed**: Updated documentation
