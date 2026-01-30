# High CPU Troubleshooting

Detailed workflow for investigating MySQL high CPU issues.

## ⚠️ Environment Policy

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp KILL, ALTER, SET GLOBAL |
| **Production** | Chỉ điều tra và báo cáo, DBA thực hiện các thay đổi |

## Table of Contents

1. [Initial Assessment](#initial-assessment)
2. [Active Query Analysis](#active-query-analysis)
3. [Full Table Scan Detection](#full-table-scan-detection)
4. [Read Replica Investigation](#read-replica-investigation)
5. [Common Causes](#common-causes)
6. [Resolution Steps](#resolution-steps)

## Initial Assessment

### Confirm the Problem

```bash
# Check MySQL process CPU usage
top -p $(pgrep mysqld)

# Or use htop for better visualization
htop -p $(pgrep mysqld)
```

### Identify Environment

**Critical:** Determine if using master/slave or read replicas.

```sql
-- Check replication status
SHOW SLAVE STATUS\G

-- Check if read-only (likely a replica)
SHOW VARIABLES LIKE 'read_only';
```

> **Note:** If using separate READ connection (read replicas), investigate there first. Most index-related issues come from SELECT queries.

## Active Query Analysis

### Check Running Queries

**Important:** Sleep processes are NOT the problem - they're just connection pool connections waiting for work.

```sql
-- Non-Sleep queries sorted by execution time
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

Alternative:
```sql
SHOW FULL PROCESSLIST;
```

### Identify Expensive Queries

Look for queries with:
- `time` > 1 second
- `state` = 'Sending data' (reading lots of rows)
- `state` = 'Copying to tmp table' (sorting/grouping large datasets)
- `state` = 'Creating sort index'

### Performance Schema (MySQL 8.0)

```sql
-- Top queries by total execution time
SELECT 
    DIGEST_TEXT,
    COUNT_STAR as exec_count,
    SUM_TIMER_WAIT/1000000000000 as total_time_sec,
    AVG_TIMER_WAIT/1000000000 as avg_time_ms,
    SUM_ROWS_EXAMINED as rows_examined,
    SUM_ROWS_SENT as rows_sent
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

## Full Table Scan Detection

**This is the #1 priority** - missing indexes cause most CPU issues. Low risk, high reward fix.

### Find Full Scan Tables

```sql
-- Tables without index usage (MySQL 8.0)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ as full_scans
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NULL 
  AND COUNT_READ > 1000
  AND OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY COUNT_READ DESC
LIMIT 20;
```

### Analyze Query Execution Plan

```sql
-- Basic explain
EXPLAIN SELECT ...;

-- MySQL 8.0: With actual execution stats
EXPLAIN ANALYZE SELECT ...;

-- Format as JSON for detailed analysis
EXPLAIN FORMAT=JSON SELECT ...;
```

**Red flags:**
| EXPLAIN Field | Bad Value | Meaning |
|---------------|-----------|---------|
| type | ALL | Full table scan |
| type | index | Full index scan |
| rows | >10000 | Many rows examined |
| Extra | Using filesort | Sorting without index |
| Extra | Using temporary | Temp table created |
| key | NULL | No index used |

### Identify Missing Indexes

```sql
-- Show table structure and indexes
SHOW CREATE TABLE table_name\G

-- Show index statistics
SHOW INDEX FROM table_name;

-- Check index size (MB)
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

-- Check column cardinality (high = good for index)
SELECT 
    column_name,
    COUNT(DISTINCT column_name) as cardinality,
    COUNT(*) as total_rows
FROM table_name
GROUP BY column_name;
```

### Check Table Statistics (Outdated = Bad Query Plan)

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

> **Lưu ý:** Sau khi tạo index mới, cần chạy `ANALYZE TABLE table_name` để cập nhật statistics.

## Read Replica Investigation

If architecture uses read replicas for SELECT queries:

### Connect to Read Replica

```bash
mysql -h read-replica-host -u user -p database
```

### Check Replica-Specific Queries

```sql
-- Same process list query
SELECT 
    id, user, host, db, command, time, state,
    LEFT(info, 200) as query
FROM information_schema.processlist 
WHERE Command != 'Sleep' 
ORDER BY Time DESC;
```

### Check Replication Lag

```sql
SHOW SLAVE STATUS\G
-- Look for Seconds_Behind_Master
```

High replication lag + high CPU on replica = query performance issue on replica.

## Common Causes

### 1. Missing Index (Most Common)

**Symptoms:**
- SELECT queries taking long time
- `EXPLAIN` shows `type: ALL`
- High `rows_examined` vs `rows_sent` ratio

**Đề xuất:** Phân tích query với EXPLAIN và thêm index.

```sql
-- Phân tích query
EXPLAIN SELECT ... ;

-- Xem existing indexes
SHOW INDEX FROM table_name;
```

**Thực hiện (Dev/Staging):**
```sql
ALTER TABLE table_name ADD INDEX idx_column (column_name);
ALTER TABLE table_name ADD INDEX idx_composite (col1, col2);
```

> ⚠️ **Production**: Đề xuất index cho DBA, chạy vào giờ thấp tải.

### 2. N+1 Query Problem

**Symptoms:**
- Many identical queries in processlist
- Application making repeated similar queries

**Fix:** Application-level - use JOINs or eager loading.

### 3. Lock Contention

**Symptoms:**
- Queries in `Waiting for table metadata lock`
- Long-running transactions

**Check:**
```sql
-- Current locks (MySQL 8.0)
SELECT * FROM performance_schema.data_lock_waits;

-- InnoDB status
SHOW ENGINE INNODB STATUS\G
```

### 4. Suboptimal Query

**Symptoms:**
- Single query causing high CPU
- Complex JOINs or subqueries

**Fix:** Rewrite query, add indexes, or break into smaller queries.

### 5. Table Statistics Outdated

**Symptoms:**
- Good indexes exist but not used
- Query optimizer making bad decisions

**Đề xuất:** 
- **Dev/Staging**: Có thể chạy `ANALYZE TABLE table_name`
- **Production**: Yêu cầu DBA thực hiện

## Resolution Steps

### Quick Wins (Do First)

1. **Xác định query có vấn đề** từ processlist
2. **Phân tích với EXPLAIN** để tìm missing index
3. **Thực hiện fix** (theo environment policy)

**Dev/Staging - Có thể thực hiện trực tiếp:**
```sql
-- Kill problematic query
KILL <process_id>;

-- Add missing index
ALTER TABLE table_name ADD INDEX idx_name (column);

-- Update statistics
ANALYZE TABLE table_name;

-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

> ⚠️ **Production**: Chỉ điều tra và báo cáo findings cho DBA thực hiện các action trên.

### Medium-Term Fixes

1. **Yêu cầu DBA enable slow query log** để monitoring ongoing
2. Review và optimize top slow queries
3. Đề xuất composite indexes cho common query patterns

### Long-Term Solutions

1. Implement query review process
2. Set up monitoring (Percona Monitoring, MySQL Enterprise Monitor)
3. Regular index maintenance
4. Query optimization training for developers

## Monitoring Commands Summary

```sql
-- Quick health check
SHOW STATUS LIKE 'Threads_running';
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Handler_read%';

-- Connection status
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Aborted_connects';

-- InnoDB status
SHOW STATUS LIKE 'Innodb_buffer_pool%';
SHOW STATUS LIKE 'Innodb_row_lock%';
```
