# Development Tasks: Usage Analytics

> **Status**: IN_PROGRESS | **Mode**: NEW
> **Created**: 2026-01-30 10:47
> **Updated**: 2026-01-30 10:47

## Planning Summary

### Requirements (Confirmed)

- Theo dõi usage của từng account từ dữ liệu CSV trong folder download
- Tổng usage 30d (Total Tokens và Cost)
- % so với limit (2M tokens/tháng cho free tier)
- Account dùng nhiều nhất (ranking theo usage)
- Account sắp chạm trần (>80% limit)
- Metrics bổ sung: Average cost/day, Most active day, Token efficiency, Usage trend
- Sửa lỗi DownloadHistory component (đang dùng mock data)

### Design Decisions

- Backend: Thêm UsageAnalyticsService để parse CSV và tính analytics
- Frontend: Tạo UsageAnalyticsDashboard component mới
- CSV Parser: Sử dụng csv-parser library
- Caching: In-memory cache với TTL cho performance
- Charts: Sử dụng Recharts cho data visualization
- File scanning: fs/promises để scan download folder

## Phase 1: Documentation

- [x] FRD-usage-analytics.md
- [x] TDD-usage-analytics.md
- [x] TEST-usage-analytics.md

## Phase 2: Implementation

- [x] package.json (add csv-parser dependency)
- [x] src/services/usage-analytics.service.js
- [x] src/services/download-history.service.js
- [x] src/routes/usage-analytics.routes.js
- [x] src/app.js (add routes)
- [x] client/package.json (add recharts dependency)
- [x] client/src/components/UsageAnalyticsDashboard.tsx
- [x] client/src/components/usage-analytics/UsageOverviewCards.tsx
- [x] client/src/components/usage-analytics/AccountRankingTable.tsx
- [x] client/src/components/usage-analytics/RiskAlertsPanel.tsx
- [x] client/src/components/usage-analytics/UsageTrendsChart.tsx
- [x] client/src/components/usage-analytics/AccountDetailModal.tsx
- [x] client/src/hooks/useUsageAnalytics.ts
- [x] client/src/components/DownloadHistory.tsx (fix mock data)
- [x] client/src/App.tsx (add dashboard)

## Modified Files

| File | Action | Notes |
| ---- | ------ | ----- |

## Checkpoint Log

| Time             | Task                | Status  | Notes     |
| ---------------- | ------------------- | ------- | --------- |
| 2026-01-30 10:47 | Initialize tasks.md | Started | Mode: NEW |
