# Development Tasks: Session Expiry Tracking

> **Status**: ✅ COMPLETED | **Mode**: NEW
> **Created**: 2026-01-30 16:26
> **Updated**: 2026-01-30 16:26

## Planning Summary

### Requirements (Confirmed)

- Theo dõi thời gian session còn hiệu lực của từng account
- Cảnh báo trước 3 ngày khi session sắp hết hạn
- Cảnh báo lần 2 khi còn dưới 72 giờ
- Phân tích cookie/profile để dự đoán thời gian hết hạn
- Hiển thị accounts nhóm theo trạng thái (OK, Sắp hết hạn, Đã hết hạn)
- Lưu trữ lịch sử login/session expiry để phân tích pattern
- Batch login workflow: Mở từng browser một (an toàn hơn)
- Chu kỳ kiểm tra: Khi user trigger (vì dữ liệu 30 ngày, chạy 1 tháng/lần)

### Design Decisions

- Phân tích cookie từ profile directory để lấy expiry time
- Tạo SessionHistory model để lưu lịch sử
- Tính toán average session duration từ lịch sử
- UI nhóm accounts theo: HEALTHY (>3 ngày), WARNING (1-3 ngày), CRITICAL (<72h), EXPIRED
- Sequential batch login để đảm bảo an toàn

## Phase 1: Documentation

- [x] FRD-session-expiry-tracking.md
- [x] TDD-session-expiry-tracking.md
- [x] TEST-session-expiry-tracking.md

## Phase 2: Implementation

- [x] src/models/session-history.js
- [x] src/services/cookie-analyzer.service.js
- [x] src/services/session.service.js
- [x] src/routes/session.routes.js
- [x] src/models/account.js (MODIFY)
- [x] client/src/components/session-tracking/SessionStatusDashboard.tsx
- [x] client/src/components/session-tracking/SessionHistoryPanel.tsx
- [x] client/src/components/session-tracking/BatchLoginModal.tsx
- [x] client/src/hooks/useSessionStatus.ts

## Modified Files

| File                                          | Action | Notes                               |
| --------------------------------------------- | ------ | ----------------------------------- |
| src/models/session-history.js                 | CREATE | Session history model               |
| src/services/cookie-analyzer.service.js       | CREATE | Cookie analysis from Chrome profile |
| src/services/session.service.js               | CREATE | Session tracking business logic     |
| src/routes/session.routes.js                  | CREATE | API routes                          |
| src/app.js                                    | MODIFY | Register session routes             |
| src/models/account.js                         | MODIFY | Add session fields                  |
| package.json                                  | MODIFY | Add better-sqlite3 dependency       |
| client/src/hooks/useSessionStatus.ts          | CREATE | React hooks for session data        |
| client/src/components/session-tracking/\*.tsx | CREATE | UI components                       |

## Checkpoint Log

| Time             | Task                  | Status | Notes                    |
| ---------------- | --------------------- | ------ | ------------------------ |
| 2026-01-30 16:26 | tasks.md created      | ✓      | Initial setup            |
| 2026-01-30 16:28 | Phase 1 Documentation | ✓      | FRD, TDD, TEST created   |
| 2026-01-30 16:32 | Phase 2 Backend       | ✓      | Models, Services, Routes |
| 2026-01-30 16:35 | Phase 2 Frontend      | ✓      | Components, Hooks        |
