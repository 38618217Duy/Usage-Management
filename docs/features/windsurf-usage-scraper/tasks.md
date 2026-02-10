# Development Tasks: Windsurf Usage Scraper

> **Status**: ✅ COMPLETED | **Mode**: NEW
> **Created**: 2026-02-10 09:55
> **Updated**: 2026-02-10 10:10

## Planning Summary

### Requirements (Confirmed)

- Scrape usage data từ Windsurf UI (không có file CSV để download)
- Đăng nhập vào https://windsurf.com/profile
- Navigate đến trang Usage
- Trích xuất thông tin: credits còn lại / đã sử dụng / ngày reset hàng tháng
- Xuất ra file CSV với cấu trúc rõ ràng
- Tổ chức folder download riêng cho cursor và windsurf

### Design Decisions

- Sử dụng Playwright để scrape UI (tương tự Cursor automation)
- Tạo service riêng: `windsurf-automation.service.js`
- Cấu trúc folder download: `download/cursor/`, `download/windsurf/`
- Mở rộng config với windsurf URLs và selectors
- Tạo windsurf account model riêng hoặc mở rộng account model hiện tại
- CSV output format: email, credits_remaining, credits_used, reset_date, scraped_at

## Phase 1: Documentation

- [x] FRD-windsurf-usage-scraper.md
- [x] TDD-windsurf-usage-scraper.md
- [x] TEST-windsurf-usage-scraper.md

## Phase 2: Implementation

- [x] src/config/index.js (MODIFY)
- [x] src/models/windsurf-account.js (CREATE)
- [x] src/services/windsurf-automation.service.js (CREATE)
- [x] src/services/windsurf-browser.service.js (CREATE)
- [x] src/routes/windsurf.routes.js (CREATE)
- [x] src/app.js (MODIFY)
- [x] src/services/automation.service.js (MODIFY - update to use cursorDownload)
- [x] scripts/migrate-downloads.js (CREATE)
- [x] Migrate existing CSV files to download/cursor/ (MIGRATE)

## Modified Files

| File                                        | Action | Notes                                          |
| ------------------------------------------- | ------ | ---------------------------------------------- |
| src/config/index.js                         | MODIFY | Added windsurf URLs, selectors, download paths |
| src/models/windsurf-account.js              | CREATE | Windsurf account model                         |
| src/services/windsurf-automation.service.js | CREATE | Scrape usage from UI                           |
| src/services/windsurf-browser.service.js    | CREATE | Browser management for Windsurf                |
| src/routes/windsurf.routes.js               | CREATE | API routes for Windsurf                        |
| src/app.js                                  | MODIFY | Register windsurf routes                       |
| src/services/automation.service.js          | MODIFY | Update to use cursorDownload path              |
| scripts/migrate-downloads.js                | CREATE | Migration script for download folder           |

## Checkpoint Log

| Time             | Task             | Status | Notes                                  |
| ---------------- | ---------------- | ------ | -------------------------------------- |
| 2026-02-10 09:55 | tasks.md created | ✅     | Initial setup                          |
| 2026-02-10 09:56 | FRD completed    | ✅     | FRD-windsurf-usage-scraper.md          |
| 2026-02-10 09:57 | TDD completed    | ✅     | TDD-windsurf-usage-scraper.md          |
| 2026-02-10 09:58 | TEST completed   | ✅     | TEST-windsurf-usage-scraper.md         |
| 2026-02-10 10:00 | Config updated   | ✅     | Added windsurf config                  |
| 2026-02-10 10:02 | Models created   | ✅     | windsurf-account.js                    |
| 2026-02-10 10:05 | Services created | ✅     | automation + browser services          |
| 2026-02-10 10:07 | Routes created   | ✅     | windsurf.routes.js                     |
| 2026-02-10 10:08 | App.js updated   | ✅     | Registered windsurf routes             |
| 2026-02-10 10:10 | Migration done   | ✅     | 23 CSV files moved to download/cursor/ |
