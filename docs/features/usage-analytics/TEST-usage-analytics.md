# Test Scenarios
# Usage Analytics Dashboard

> **Feature**: Usage Analytics Dashboard
> **Version**: 1.0
> **Created**: 2026-01-30
> **Status**: DRAFT

## 1. Happy Path Scenarios

### TC-001: View Usage Overview Dashboard
**Given** user có CSV files trong download folder  
**When** user mở usage analytics dashboard  
**Then** hiển thị tổng quan usage với metrics chính xác  
**And** load time < 2 giây

### TC-002: View Account Ranking
**Given** có nhiều accounts với usage khác nhau  
**When** user xem account ranking table  
**Then** accounts được sắp xếp theo usage giảm dần  
**And** hiển thị % limit và risk level chính xác

### TC-003: Identify High Risk Accounts
**Given** có account với usage > 80% limit  
**When** user xem risk alerts panel  
**Then** account đó hiển thị trong high risk list  
**And** có visual indicator màu đỏ/cam

### TC-004: View Account Details
**Given** user click vào một account trong ranking table  
**When** account detail modal mở  
**Then** hiển thị chi tiết usage pattern và charts  
**And** data chính xác cho account đó

### TC-005: Refresh Analytics Data
**Given** user đã xem dashboard  
**When** user click refresh button  
**Then** data được re-calculate từ CSV files  
**And** UI update với data mới

### TC-006: View Real Download History
**Given** có CSV files trong download folder  
**When** user xem download history section  
**Then** hiển thị list files thực tế (không phải mock data)  
**And** file size và date chính xác

## 2. Error Handling Scenarios

### TC-007: Handle Missing CSV Files
**Given** download folder rỗng hoặc không tồn tại  
**When** user mở usage analytics dashboard  
**Then** hiển thị message "No usage data available"  
**And** không crash application

### TC-008: Handle Corrupted CSV File
**Given** có CSV file bị corrupt hoặc format sai  
**When** system parse CSV files  
**Then** skip file đó và log error  
**And** process các file khác bình thường

### TC-009: Handle API Error
**Given** backend service không available  
**When** user load dashboard  
**Then** hiển thị error message user-friendly  
**And** có retry option

### TC-010: Handle Large File Processing
**Given** có CSV file rất lớn (>10MB)  
**When** system process file đó  
**Then** không bị memory overflow  
**And** có progress indicator nếu cần

## 3. Edge Cases

### TC-011: Handle Empty CSV File
**Given** CSV file chỉ có header, không có data  
**When** system parse file  
**Then** account đó hiển thị với 0 usage  
**And** không crash parser

### TC-012: Handle Future Dates in CSV
**Given** CSV có records với date trong tương lai  
**When** calculate 30d usage  
**Then** chỉ tính records trong 30 ngày qua  
**And** ignore future dates

### TC-013: Handle Duplicate Records
**Given** CSV có duplicate records (same date/time)  
**When** calculate usage metrics  
**Then** handle duplicates appropriately  
**And** không double-count usage

### TC-014: Handle Zero Usage Account
**Given** account không có usage trong 30d  
**When** view analytics dashboard  
**Then** account hiển thị với 0% usage  
**And** risk level = "low"

## 4. Performance Test Scenarios

### TC-015: Load Dashboard with Multiple Files
**Given** có 10 CSV files, mỗi file 1000+ records  
**When** user load dashboard lần đầu  
**Then** load time < 2 giây  
**And** UI responsive

### TC-016: Test Cache Performance
**Given** analytics data đã được cache  
**When** user reload dashboard  
**Then** load từ cache < 500ms  
**And** data consistency maintained

### TC-017: Test Concurrent Requests
**Given** multiple users access dashboard cùng lúc  
**When** system process requests  
**Then** không có race conditions  
**And** cache consistency maintained

## 5. UI/UX Test Scenarios

### TC-018: Test Responsive Design
**Given** user access dashboard trên different screen sizes  
**When** resize browser window  
**Then** layout adapt properly  
**And** all elements visible và accessible

### TC-019: Test Chart Interactions
**Given** usage trends chart hiển thị  
**When** user hover over data points  
**Then** hiển thị tooltip với chi tiết  
**And** chart interactive smooth

### TC-020: Test Table Sorting
**Given** account ranking table có data  
**When** user click column headers  
**Then** table sort theo column đó  
**And** sort direction indicator clear

## 6. Integration Test Scenarios

### TC-021: Test End-to-End Flow
**Given** fresh system với CSV files  
**When** user complete full workflow từ dashboard đến account details  
**Then** tất cả features hoạt động correctly  
**And** data consistency throughout

### TC-022: Test Download History Integration
**Given** có new CSV file được download  
**When** user refresh both download history và analytics  
**Then** both sections update với new data  
**And** data synchronized

### TC-023: Test File System Changes
**Given** CSV file được delete hoặc rename  
**When** system scan download folder  
**Then** analytics update accordingly  
**And** handle missing files gracefully

## 7. Security Test Scenarios

### TC-024: Test Path Traversal Protection
**Given** malicious input với "../" trong file paths  
**When** system process file requests  
**Then** không access files outside download folder  
**And** log security attempt

### TC-025: Test Input Validation
**Given** invalid email parameter trong API calls  
**When** system process request  
**Then** validate input và return appropriate error  
**And** không expose system information

## 8. Acceptance Criteria Validation

### TC-026: Validate All FRD Requirements
**Given** tất cả features đã implement  
**When** run complete test suite  
**Then** tất cả user stories pass  
**And** non-functional requirements met

### TC-027: Validate Performance Requirements
**Given** realistic data load  
**When** measure system performance  
**Then** load time < 2s  
**And** memory usage reasonable

### TC-028: Validate Error Handling
**Given** various error scenarios  
**When** trigger error conditions  
**Then** system handle gracefully  
**And** user experience không bị interrupt

## 9. Regression Test Scenarios

### TC-029: Test Existing Features
**Given** new usage analytics features added  
**When** test existing automation features  
**Then** không có regression  
**And** all existing functionality intact

### TC-030: Test Download History Fix
**Given** download history component updated  
**When** compare với previous mock data behavior  
**Then** real data hiển thị correctly  
**And** UI/UX improved
