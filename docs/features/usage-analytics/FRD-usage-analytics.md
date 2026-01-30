# Functional Requirements Document (FRD)
# Usage Analytics Dashboard

> **Feature**: Usage Analytics Dashboard
> **Version**: 1.0
> **Created**: 2026-01-30
> **Status**: DRAFT

## 1. Overview

### 1.1 Purpose
Phát triển dashboard theo dõi usage của từng Cursor account dựa trên dữ liệu CSV đã được download, cung cấp insights về việc sử dụng tokens và chi phí.

### 1.2 Scope
- Phân tích dữ liệu usage từ CSV files trong folder download
- Hiển thị metrics tổng quan và chi tiết cho từng account
- Cảnh báo accounts sắp đạt giới hạn usage
- Sửa lỗi DownloadHistory component

## 2. Business Requirements

### 2.1 Problem Statement
- Hiện tại không có cách theo dõi usage tổng quan của tất cả accounts
- Không biết account nào đang sử dụng nhiều nhất
- Không có cảnh báo khi account sắp chạm trần limit
- DownloadHistory component đang hiển thị mock data

### 2.2 Success Criteria
- Dashboard hiển thị đầy đủ metrics usage cho tất cả accounts
- Có thể identify accounts có risk cao (sắp chạm trần)
- Performance tốt khi load nhiều CSV files
- UI/UX trực quan và dễ hiểu

## 3. Functional Requirements

### 3.1 User Stories

#### US-001: Xem tổng quan usage tất cả accounts
**As a** user  
**I want to** xem tổng quan usage của tất cả accounts trong 30 ngày  
**So that** tôi có thể nắm được tình hình sử dụng chung

**Acceptance Criteria:**
- Hiển thị tổng số tokens đã sử dụng (30d)
- Hiển thị tổng chi phí (30d)
- Hiển thị số lượng accounts active
- Hiển thị average usage per account

#### US-002: Xem ranking accounts theo usage
**As a** user  
**I want to** xem danh sách accounts được sắp xếp theo mức độ sử dụng  
**So that** tôi biết account nào đang sử dụng nhiều nhất

**Acceptance Criteria:**
- List accounts theo thứ tự usage giảm dần
- Hiển thị tokens used và % so với limit
- Hiển thị cost cho mỗi account
- Có thể filter theo time range

#### US-003: Cảnh báo accounts sắp chạm trần
**As a** user  
**I want to** được cảnh báo khi account nào sắp đạt limit  
**So that** tôi có thể điều chỉnh usage hoặc upgrade plan

**Acceptance Criteria:**
- Highlight accounts > 80% limit
- Hiển thị số tokens còn lại
- Estimate số ngày còn lại dựa trên usage trend
- Visual indicator (màu đỏ/cam)

#### US-004: Xem chi tiết usage của từng account
**As a** user  
**I want to** xem chi tiết usage pattern của từng account  
**So that** tôi hiểu cách account đó được sử dụng

**Acceptance Criteria:**
- Usage chart theo thời gian
- Breakdown theo loại tokens (Input/Output/Cache)
- Most active days
- Token efficiency metrics

#### US-005: Xem download history thực tế
**As a** user  
**I want to** xem danh sách file CSV đã download thực tế  
**So that** tôi biết dữ liệu nào đang có sẵn

**Acceptance Criteria:**
- Hiển thị list file CSV từ folder download
- Hiển thị file size, last modified date
- Có thể open file hoặc folder
- Không còn mock data

## 4. Non-Functional Requirements

### 4.1 Performance
- Load dashboard trong < 2 giây với 10 CSV files
- Responsive UI không lag khi scroll
- Cache analytics data để tránh re-parse CSV

### 4.2 Usability
- Dashboard hiển thị tốt trên desktop (1920x1080+)
- Consistent với existing UI design
- Tooltips cho các metrics phức tạp

### 4.3 Reliability
- Graceful handling khi CSV file bị corrupt
- Fallback khi không có data
- Error messages rõ ràng

## 5. Business Rules

### 5.1 Usage Limits
- Free tier limit: 2,000,000 tokens/month
- Warning threshold: 80% của limit (1,600,000 tokens)
- Critical threshold: 95% của limit (1,900,000 tokens)

### 5.2 Data Processing
- Chỉ process CSV files có format đúng
- Ignore entries > 30 days
- Handle timezone UTC

### 5.3 Calculations
- Total tokens = sum of "Total Tokens" column
- Cost = sum of "Cost" column
- Usage % = (Total tokens / 2,000,000) * 100
- Trend = compare với 7 days trước

## 6. Constraints

### 6.1 Technical
- Sử dụng existing tech stack (Node.js, React, TailwindCSS)
- Không thay đổi CSV format
- Không require database

### 6.2 Business
- Không có budget cho external services
- Phải maintain backward compatibility

## 7. Assumptions

- CSV files có format consistent như hiện tại
- Download folder luôn accessible
- Users hiểu Cursor usage model
- Free tier limit không thay đổi

## 8. Dependencies

- CSV files phải được download trước
- Folder download phải có read permission
- Node.js csv-parser library

## 9. Risks

### 9.1 Technical Risks
- **Risk**: CSV format thay đổi
- **Mitigation**: Validate CSV headers trước khi parse

- **Risk**: Performance với nhiều files
- **Mitigation**: Implement caching và pagination

### 9.2 Business Risks
- **Risk**: Cursor thay đổi limit policy
- **Mitigation**: Make limit configurable

## 10. Acceptance Criteria Summary

- [ ] Dashboard hiển thị tổng quan usage 30d
- [ ] Ranking accounts theo usage với % limit
- [ ] Cảnh báo accounts > 80% limit
- [ ] Chi tiết usage cho từng account
- [ ] Download history hiển thị data thực tế
- [ ] Performance < 2s load time
- [ ] UI consistent với existing design
- [ ] Error handling robust
