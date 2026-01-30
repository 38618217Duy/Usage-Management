---
description: MySQL Performance Improvement - Proactive analysis of source code to identify missing indexes and query optimization opportunities
---

# MySQL Performance Improvement Workflow

> **Goal**: Phân tích source code để phát hiện query patterns, đánh giá missing indexes, và đề xuất cải thiện performance.
> **Approach**: Proactive - không cần có incident, phân tích trước để phòng ngừa.

## ⚠️ Environment Policy

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp các thay đổi |
| **Production** | Đề xuất cho DBA review và thực hiện |

---

## 🔄 Workflow Overview

```
1. Scan Query Patterns → 2. Check Existing Indexes → 3. Assess Risk/Priority → 4. Propose Solutions → 5. Generate Verification SQL
```

---

## Phase 1: Scan Query Patterns

### Step 1.1: Identify ORM/Query Layer

**Xác định framework và ORM đang sử dụng:**

| Framework | ORM/Query Builder | File Patterns to Scan |
|-----------|-------------------|----------------------|
| Laravel | Eloquent | `*.php` (Models, Repositories) |
| Spring | JPA/Hibernate | `*.java` (Repository, @Query) |
| Node.js | Sequelize/TypeORM/Prisma | `*.ts`, `*.js` |
| Django | Django ORM | `*.py` (models, views) |
| Rails | ActiveRecord | `*.rb` (models, scopes) |

### Step 1.2: Extract Query Patterns

**Scan source code để tìm tất cả query patterns:**

#### Laravel/Eloquent Patterns
```bash
# Find WHERE clauses
grep -rn "->where(" --include="*.php" app/
grep -rn "->whereIn(" --include="*.php" app/
grep -rn "->orderBy(" --include="*.php" app/

# Find raw queries
grep -rn "DB::select" --include="*.php" app/
grep -rn "DB::raw" --include="*.php" app/

# Find scope definitions
grep -rn "scopeWhere" --include="*.php" app/Models/
```

#### TypeORM/Sequelize Patterns
```bash
# Find query conditions
grep -rn "where:" --include="*.ts" src/
grep -rn "findOne\|findMany\|findAll" --include="*.ts" src/
grep -rn "orderBy\|order:" --include="*.ts" src/
```

#### Raw SQL Patterns
```bash
# Find direct SQL
grep -rn "SELECT.*FROM.*WHERE" --include="*.php" --include="*.ts" --include="*.java" .
grep -rn "JOIN.*ON" --include="*.php" --include="*.ts" --include="*.java" .
```

### Step 1.3: Document Query Patterns

**Output format cho mỗi query pattern:**

```markdown
## Query Pattern #{number}

**Location:** `{file_path}:{line_number}`
**Method/Function:** `{method_name}`
**Table(s):** `{table_names}`

**Query Pattern:**
```sql
SELECT ... FROM {table} WHERE {column} = ? AND {column2} = ? ORDER BY {column3}
```

**Columns Used:**
- WHERE: `column1`, `column2`
- ORDER BY: `column3`
- JOIN ON: `column4`

**Frequency Estimate:** {High/Medium/Low}
**Called From:** {API endpoint, Batch job, Background worker, etc.}
```

---

## Phase 2: Check Existing Indexes

### Step 2.1: Scan Migration Files

**Tìm các indexes đã được define:**

#### Laravel Migrations
```bash
grep -rn "->index(" --include="*.php" database/migrations/
grep -rn "->unique(" --include="*.php" database/migrations/
grep -rn "Schema::table.*index" --include="*.php" database/migrations/
```

#### TypeORM/Prisma
```bash
# TypeORM
grep -rn "@Index" --include="*.ts" src/

# Prisma
grep -rn "@@index" --include="*.prisma" prisma/
```

#### Raw SQL Migrations
```bash
grep -rn "CREATE INDEX" --include="*.sql" .
grep -rn "ADD INDEX" --include="*.sql" .
```

### Step 2.2: Query Database Schema (if accessible)

```sql
-- Lấy tất cả indexes của database
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns,
    INDEX_TYPE,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;
```

### Step 2.3: Build Index Coverage Map

**Tạo mapping giữa tables và indexes:**

```markdown
## Table: `users`

| Index Name | Columns | Type | Covers Query Patterns |
|------------|---------|------|----------------------|
| PRIMARY | id | PRIMARY | #1, #5 |
| idx_email | email | BTREE | #2 |
| idx_company | company_id | BTREE | #3, #7 |

**Missing Coverage:** Query patterns #4, #8 không có index phù hợp
```

---

## Phase 3: Assess Risk & Priority

### Step 3.1: Frequency Assessment

**Đánh giá tần suất sử dụng của mỗi query pattern:**

| Frequency | Criteria | Priority |
|-----------|----------|----------|
| **Critical** | API endpoint được gọi > 1000 req/min | P0 |
| **High** | API endpoint chính, user-facing | P1 |
| **Medium** | Background jobs, batch processing | P2 |
| **Low** | Admin functions, reports, one-time scripts | P3 |

### Step 3.2: Business Impact Assessment

**Xem xét business context:**

```markdown
## Query Pattern #{number} - Risk Assessment

**Frequency:** {Critical/High/Medium/Low}
**Called From:** {location}
**Business Context:** 
- [ ] User-facing API (high impact)
- [ ] Background job (medium impact)
- [ ] Admin/internal tool (low impact)
- [ ] Batch processing (depends on data size)

**Data Volume:**
- Current table size: {rows estimate}
- Growth rate: {estimate}

**Risk Level:** {Critical/High/Medium/Low}
**Recommendation Priority:** P{0-3}
```

### Step 3.3: Batch Job Analysis

**Đặc biệt chú ý các batch jobs:**

```markdown
## Batch Job Analysis

| Job Name | Schedule | Tables Affected | Query Patterns | Current Index | Risk |
|----------|----------|-----------------|----------------|---------------|------|
| SyncUsers | Daily 2AM | users, profiles | #12, #15 | Missing | High |
| GenerateReports | Hourly | transactions | #20 | Partial | Medium |
```

---

## Phase 4: Propose Index Solutions

### Step 4.1: Index Recommendation Template

**Cho mỗi missing index, tạo đề xuất chi tiết:**

```markdown
## Index Recommendation #{number}

### Summary
- **Table:** `{table_name}`
- **Priority:** P{0-3}
- **Risk Level:** {Critical/High/Medium/Low}
- **Affected Query Patterns:** #{list}

### Problem
Query pattern đang thực hiện full table scan vì thiếu index trên columns được sử dụng trong WHERE/ORDER BY.

**Current Query:**
```sql
SELECT * FROM users WHERE company_id = 123 AND status = 'active' ORDER BY created_at DESC;
```

**Current EXPLAIN (estimated):**
- type: ALL (full table scan)
- rows: ~100,000
- Extra: Using filesort

### Proposed Solution

**Option A: Single Column Index** (nếu chỉ filter 1 column)
```sql
ALTER TABLE users ADD INDEX idx_company_id (company_id);
```

**Option B: Composite Index** (recommended cho multiple columns)
```sql
ALTER TABLE users ADD INDEX idx_company_status_created (company_id, status, created_at);
```

### Why This Index?
- Column order: Most selective first (company_id), then filter (status), then sort (created_at)
- Covers cả WHERE và ORDER BY trong một index
- Avoids "Using filesort"

### Expected Improvement
- type: ALL → ref hoặc range
- rows: ~100,000 → ~500
- Extra: Using filesort → Using index

### Verification SQL
```sql
-- Chạy trên server để verify improvement
EXPLAIN SELECT * FROM users 
WHERE company_id = 123 AND status = 'active' 
ORDER BY created_at DESC;

-- Expected result sau khi add index:
-- type: ref
-- key: idx_company_status_created
-- rows: ~500
-- Extra: Using where; Using index
```

### Migration Code

**Laravel:**
```php
Schema::table('users', function (Blueprint $table) {
    $table->index(['company_id', 'status', 'created_at'], 'idx_company_status_created');
});
```

**Raw SQL:**
```sql
ALTER TABLE users ADD INDEX idx_company_status_created (company_id, status, created_at);
```

### Rollback (if needed)
```sql
ALTER TABLE users DROP INDEX idx_company_status_created;
```
```

### Step 4.2: Index Design Best Practices

**Áp dụng các nguyên tắc khi đề xuất index:**

1. **Column Order trong Composite Index:**
   - Equality conditions first (`=`)
   - Range conditions next (`>`, `<`, `BETWEEN`, `IN`)
   - ORDER BY columns last

2. **Covering Index (nếu phù hợp):**
   - Include các columns trong SELECT để tránh table lookup
   - Trade-off: index size vs query performance

3. **Avoid Redundant Indexes:**
   - `(a, b)` covers queries on `(a)` alone
   - Don't create `(a)` if `(a, b)` exists

4. **Consider Index Size:**
   - Larger indexes = slower writes
   - Prioritize read-heavy tables

---

## Phase 5: Query Optimization

### Step 5.1: Identify Query Optimization Opportunities

**Ngoài index, xem xét các cải thiện khác:**

| Issue | Detection | Solution |
|-------|-----------|----------|
| SELECT * | Grep for `SELECT *` | Select only needed columns |
| N+1 Query | Loop with individual queries | Use eager loading/JOIN |
| Missing LIMIT | Large result sets | Add pagination |
| Subquery in WHERE | `WHERE x IN (SELECT...)` | Convert to JOIN |
| Function on indexed column | `WHERE YEAR(date) = 2024` | Use range: `date BETWEEN ...` |

### Step 5.2: Query Optimization Template

```markdown
## Query Optimization #{number}

### Current Query
```sql
SELECT * FROM orders WHERE YEAR(created_at) = 2024;
```

**Problem:** Function `YEAR()` trên indexed column ngăn MySQL sử dụng index.

### Optimized Query
```sql
SELECT id, user_id, total, created_at 
FROM orders 
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

### Improvement
- Removes function on indexed column
- Allows index usage on `created_at`
- Selects only needed columns

### Verification
```sql
-- Before (explain)
EXPLAIN SELECT * FROM orders WHERE YEAR(created_at) = 2024;
-- type: ALL, rows: 1000000

-- After (explain)
EXPLAIN SELECT id, user_id, total, created_at 
FROM orders 
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
-- type: range, rows: 50000
```
```

---

## Output: Performance Improvement Report

### Final Report Template

```markdown
# MySQL Performance Improvement Report

**Project:** {project_name}
**Date:** {date}
**Analyzed By:** AI Assistant

## Executive Summary

- **Query Patterns Analyzed:** {count}
- **Missing Indexes Found:** {count}
- **Query Optimizations Suggested:** {count}
- **Estimated Impact:** {description}

## Priority Matrix

| Priority | Count | Description |
|----------|-------|-------------|
| P0 (Critical) | {n} | Must fix immediately |
| P1 (High) | {n} | Fix within 1 week |
| P2 (Medium) | {n} | Plan for next sprint |
| P3 (Low) | {n} | Nice to have |

## Recommendations Summary

### Index Recommendations (Top 5)

| # | Table | Proposed Index | Priority | Impact |
|---|-------|----------------|----------|--------|
| 1 | users | idx_company_status | P0 | High |
| 2 | orders | idx_user_created | P1 | High |
| ... | ... | ... | ... | ... |

### Query Optimizations (Top 5)

| # | Location | Issue | Priority |
|---|----------|-------|----------|
| 1 | OrderService:45 | N+1 Query | P1 |
| 2 | UserRepository:120 | SELECT * | P2 |
| ... | ... | ... | ... |

## Detailed Recommendations

[Include full recommendations from Phase 4 & 5]

## Implementation Checklist

- [ ] Review recommendations with team
- [ ] Prioritize based on business impact
- [ ] Test on staging environment
- [ ] Prepare rollback plan
- [ ] Schedule deployment (low traffic period)
- [ ] Monitor after deployment

## Verification Queries

[Include all EXPLAIN queries for manual verification]
```

---

## ✅ Workflow Checklist

- [ ] Xác định ORM/framework đang sử dụng
- [ ] Scan tất cả query patterns từ source code
- [ ] Kiểm tra migrations/schema cho existing indexes
- [ ] Đánh giá frequency và business impact
- [ ] Phân tích batch jobs riêng
- [ ] Tạo index recommendations với verification SQL
- [ ] Xác định query optimization opportunities
- [ ] Generate final report với priority matrix
- [ ] Cung cấp migration code và rollback plan

---

## 📚 Related Resources

- **Troubleshooting:** `workflows/mysql-troubleshooting.md` - Khi có incident cần điều tra
- **Skill Reference:** `skill:mysql-troubleshooting` - Chi tiết commands và best practices
