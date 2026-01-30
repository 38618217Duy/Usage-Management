# Fix Report: Service Variable Names in Usage Analytics Routes

> **Date**: 2026-01-30 | **Feature**: Usage Analytics | **Severity**: High

## Bug Description
API Error: 500 Internal Server Error khi tải usage analytics. Tab usage analytics không thể hiển thị dữ liệu mặc dù file CSV đã có trong thư mục download.

## Root Cause
Trong file `src/routes/usage-analytics.routes.js`, các service được import đúng nhưng sử dụng sai tên biến:

1. **Import statement**: `import UsageAnalyticsService from '../services/usage-analytics.service.js'`
2. **Usage**: `usageAnalyticsService.getUsageOverview()` (sai - biến không tồn tại)
3. **Correct**: `UsageAnalyticsService.getUsageOverview()` (đúng - khớp với import)

Tương tự với `DownloadHistoryService`.

## Solution
Sửa tên biến trong tất cả các endpoint để khớp với import statements:

- `usageAnalyticsService` → `UsageAnalyticsService`
- `downloadHistoryService` → `DownloadHistoryService`

## Files Changed
| File | Change |
|------|--------|
| `src/routes/usage-analytics.routes.js` | Sửa 6 chỗ sử dụng sai tên biến service |

## Testing
### Verification Steps
1. Khởi động server: `npm run dev`
2. Truy cập frontend và mở tab Usage Analytics
3. Kiểm tra API calls không còn trả về 500 error
4. Xác nhận dữ liệu từ CSV files được hiển thị đúng

### Expected Results
- API `/api/usage-analytics/overview` trả về status 200
- API `/api/usage-analytics/account/:email` trả về status 200  
- Dashboard hiển thị dữ liệu usage từ file CSV
- Không còn lỗi 500 Internal Server Error

## Related
- FRD: `docs/features/usage-analytics/FRD-usage-analytics.md`
- TDD: `docs/features/usage-analytics/TDD-usage-analytics.md`
- Test: `docs/features/usage-analytics/TEST-usage-analytics.md`

## Prevention
- Sử dụng TypeScript để catch lỗi biến không tồn tại tại compile time
- Thêm ESLint rule để kiểm tra import/usage consistency
- Code review cẩn thận hơn khi thay đổi import statements
