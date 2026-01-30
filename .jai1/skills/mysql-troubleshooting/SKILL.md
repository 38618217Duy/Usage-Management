---
name: mysql-troubleshooting
description: MySQL performance troubleshooting and investigation guide. Use this skill when diagnosing MySQL issues including high CPU, slow queries, missing indexes, replication problems, or connection issues. Supports MySQL 5.7 and 8.0 (prioritized). Invoke when users report database performance problems, need to analyze slow queries, or investigate MySQL-related incidents.
---

# MySQL Troubleshooting

Guide for investigating and resolving MySQL performance issues.

## ⚠️ Environment Notice

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp các lệnh ALTER, SET GLOBAL, KILL |
| **Production** | Chỉ điều tra, đề xuất cho DBA thực hiện |

> Luôn xác nhận môi trường trước khi thực hiện bất kỳ thay đổi nào.

## Quick Diagnosis Flow

```
1. Identify Environment → 2. Check Active Queries → 3. Find Root Cause → 4. Apply Fix
```

### Step 1: Identify Environment

Before troubleshooting, establish the architecture:

```sql
-- Check MySQL version
SELECT VERSION();

-- Check if this is master or replica
SHOW SLAVE STATUS\G
-- Empty = Master, Data = Replica
```

**Critical questions to ask user:**
- Master/Slave (replica) architecture?
- Separate READ connection (read replicas)?
- Connection pooling in use?

> **Important:** If using read replicas, focus investigation on READ connection first. Most performance issues stem from `SELECT` queries with missing indexes.

### Step 2: Check Active Queries

**Ignore Sleep processes** - these are just connection pool connections waiting.

```sql
-- Active queries (non-Sleep), sorted by duration
SELECT 
    id,
    user,
    host,
    db,
    command,
    time,
    state,
    LEFT(info, 200) as query
FROM information_schema.processlist 
WHERE Command != 'Sleep' 
ORDER BY Time DESC;
```

Or use:
```sql
SHOW FULL PROCESSLIST;
```

**What to look for:**
- Queries running > 1 second
- Many identical queries (indicates missing index or N+1 problem)
- Queries in `Sending data` or `Copying to tmp table` state

### Step 3: Identify Root Cause

**Priority order (highest impact, lowest risk first):**

1. **Missing Index (Full Table Scan)** - Most common, easy fix
2. **Slow Query Analysis** - Identify specific problematic queries
3. **Lock Contention** - Blocking queries
4. **Resource Exhaustion** - Connections, memory, disk I/O

## Missing Index Detection (Priority 1)

Full table scans are the #1 cause of MySQL performance issues. Low risk, high reward fix.

### Check Table Indexes

```sql
-- Xem tất cả indexes của table
SHOW INDEX FROM your_table;
```

### Check Index Size

```sql
-- Kiểm tra size của index (MB)
SELECT 
    database_name,
    table_name,
    index_name,
    ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) AS size_mb
FROM mysql.innodb_index_stats 
WHERE stat_name = 'size'
  AND database_name = 'your_database'
  AND table_name = 'your_table'
ORDER BY size_mb DESC;
```

### Check If Query Uses Index

```sql
-- Kiểm tra query có sử dụng index không
EXPLAIN SELECT * FROM users WHERE email = 'test@test.com';
```

**Kết quả cần chú ý:**
- `type: ALL` → Full table scan (KHÔNG dùng index)
- `type: ref` hoặc `type: range` → Có dùng index (TỐT)
- `key: NULL` → Không có index nào được sử dụng

### Understanding EXPLAIN `type` Column

MySQL access types from **BEST to WORST**:

| Type | Meaning | Performance | Example |
|------|---------|-------------|---------|
| **const** | Single row match (PRIMARY KEY/UNIQUE) | ⚡⚡⚡ Excellent | `WHERE id = 1` |
| **eq_ref** | One row per join (PRIMARY/UNIQUE join) | ⚡⚡⚡ Excellent | JOIN on PRIMARY KEY |
| **ref** | Multiple rows match index equality | ⚡⚡ Very Good | `WHERE company_id = 123` |
| **range** | Index range scan | ⚡⚡ Good | `WHERE id > 100`, `IN (...)` |
| **index** | Full index scan (better than table scan) | ⚠️ Acceptable* | `ORDER BY indexed_col` |
| **ALL** | Full table scan (NO index used) | ❌ Bad | `WHERE non_indexed_col = 1` |

**Important Notes:**

✅ **`type = "index"` is GOOD when:**
- Query needs to scan entire index for sorting (e.g., `ORDER BY token_amount DESC`)
- Index is much smaller than table
- Eliminates "Using filesort" (index already sorted)

❌ **`type = "index"` is BAD when:**
- Better index exists but not being used
- Scanning entire large index (millions of rows)
- Could be optimized to `ref` or `range`

**Common Index Usage Patterns:**
- **Filtering with `=`**: Expect `type = "ref"`
- **Filtering with `IN (...)`**: Expect `type = "range"`
- **Sorting with `ORDER BY`**: Expect `type = "index"` (this is optimal for pure sorting!)
- **Prefix search with `LIKE 'abc%'`**: Expect `type = "range"`

### Find Tables with Full Scans

```sql
-- Tables being full-scanned (MySQL 8.0)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ as full_scans
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NULL 
  AND COUNT_READ > 1000
ORDER BY COUNT_READ DESC
LIMIT 20;
```

### Analyze Specific Query

```sql
-- Always EXPLAIN before optimizing
EXPLAIN SELECT ... ;

-- MySQL 8.0: More detailed format
EXPLAIN ANALYZE SELECT ... ;
```

**Red flags in EXPLAIN output:**
- `type: ALL` → Full table scan
- `rows` > 10000 with no index usage
- `Extra: Using filesort` on large result sets
- `Extra: Using temporary`

### Quick Index Recommendations

```sql
-- Show existing indexes
SHOW INDEX FROM table_name;
```

> ⚠️ **Để add index:**
> - **Dev/Staging**: Có thể chạy trực tiếp `ALTER TABLE table_name ADD INDEX idx_column (column_name)`
> - **Production**: Phân tích query pattern và đề xuất cho DBA, chạy vào giờ thấp tải

### Update Table Statistics After Adding Index

**Quan trọng:** Sau khi tạo index, metadata có thể không được cập nhật tự động. Cần chạy ANALYZE TABLE.

```sql
-- Kiểm tra statistics có outdated không
SELECT 
    table_name,
    update_time,
    table_rows,
    ROUND(data_length/1024/1024, 2) AS data_mb,
    ROUND(index_length/1024/1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'your_db'
ORDER BY update_time;
```

> ⚠️ **Để update statistics:**
> - **Dev/Staging**: `ANALYZE TABLE table_name;`
> - **Production**: Yêu cầu DBA thực hiện

## High CPU Investigation

See `references/high-cpu.md` for detailed High CPU troubleshooting workflow.

**Quick checklist:**
1. Check active queries (Step 2 above)
2. Look for full table scans
3. Check for lock waits
4. Review slow query log

## Version-Specific References

- **MySQL 8.0:** See `references/mysql-8.md` for 8.0-specific features and diagnostics
- **MySQL 5.7:** See `references/mysql-57.md` for 5.7-specific commands

## Common Quick Fixes

### Enable Slow Query Log

```sql
-- Check current settings
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';
```

> ⚠️ **Để enable slow query log:**
> - **Dev/Staging**: Có thể chạy `SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 1;`
> - **Production**: Yêu cầu DBA cấu hình trong `my.cnf` hoặc qua console quản trị

### Kill Long-Running Query

```sql
-- Xác định process ID từ processlist
SELECT id, user, time, state, LEFT(info, 100) as query
FROM information_schema.processlist 
WHERE Command != 'Sleep' AND time > 60;
```

> ⚠️ **Để kill query:**
> - **Dev/Staging**: Có thể chạy `KILL <process_id>;`
> - **Production**: Báo process ID cho DBA thực hiện

### Check Table Lock Status

```sql
-- Current locks
SHOW OPEN TABLES WHERE In_use > 0;

-- InnoDB lock waits (MySQL 8.0)
SELECT * FROM performance_schema.data_lock_waits;
```

## Investigation Checklist

- [ ] Confirm MySQL version (5.7 or 8.0)
- [ ] Identify architecture (master/slave, read replicas)
- [ ] Check active queries (ignore Sleep)
- [ ] Look for full table scans
- [ ] Review slow query log
- [ ] Check for lock contention
- [ ] Analyze specific slow queries with EXPLAIN
