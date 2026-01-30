# MySQL 5.7 Troubleshooting Reference

MySQL 5.7 specific diagnostics and commands. For most cases, prefer MySQL 8.0 reference if upgrading is an option.

## ⚠️ Environment Policy

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp SET GLOBAL, ALTER TABLE |
| **Production** | Chỉ điều tra, yêu cầu DBA thực hiện thay đổi |

## Table of Contents

1. [Performance Schema](#performance-schema)
2. [Query Analysis](#query-analysis)
3. [Index Diagnostics](#index-diagnostics)
4. [Lock Analysis](#lock-analysis)
5. [InnoDB Monitoring](#innodb-monitoring)
6. [5.7 Specific Limitations](#57-specific-limitations)

## Performance Schema

Performance Schema available but with fewer features than 8.0.

### Enable Performance Schema

Check if enabled (should be by default in 5.7):

```sql
SHOW VARIABLES LIKE 'performance_schema';
```

### Top Queries by Execution Time

```sql
SELECT 
    DIGEST_TEXT,
    COUNT_STAR as exec_count,
    ROUND(SUM_TIMER_WAIT/1000000000000, 2) as total_sec,
    ROUND(AVG_TIMER_WAIT/1000000000, 2) as avg_ms,
    SUM_ROWS_EXAMINED,
    SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

### Queries Without Index

```sql
SELECT 
    DIGEST_TEXT,
    COUNT_STAR,
    SUM_NO_INDEX_USED
FROM performance_schema.events_statements_summary_by_digest
WHERE SUM_NO_INDEX_USED > 0
ORDER BY SUM_NO_INDEX_USED DESC
LIMIT 20;
```

## Query Analysis

### EXPLAIN (Standard)

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 123;

-- Extended format
EXPLAIN EXTENDED SELECT ...;
SHOW WARNINGS;  -- Shows optimized query

-- JSON format (5.7+)
EXPLAIN FORMAT=JSON SELECT ...;
```

**Note:** `EXPLAIN ANALYZE` is NOT available in 5.7 (8.0+ only).

### Slow Query Log

```sql
-- Check current settings
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';
SHOW VARIABLES LIKE 'log_queries_not_using_indexes';
```

> ⚠️ **Để enable slow query log:**
> - **Dev/Staging**: `SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 1;`
> - **Production**: Yêu cầu DBA cấu hình trong `my.cnf`

Analyze with mysqldumpslow:

```bash
mysqldumpslow -s t /var/log/mysql/slow.log | head -20
```

### Query Profiling (Deprecated but works in 5.7)

```sql
SET profiling = 1;
SELECT * FROM your_query;
SHOW PROFILES;
SHOW PROFILE FOR QUERY 1;
```

## Index Diagnostics

### Check Index Usage

```sql
-- Show table indexes
SHOW INDEX FROM table_name;

-- Index statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'your_database'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

### Tables with Full Scans

```sql
-- Handler statistics (indicates full scans)
SHOW STATUS LIKE 'Handler_read%';
```

| Counter | Meaning |
|---------|---------|
| Handler_read_rnd_next | Full table scan rows read |
| Handler_read_first | Index scan starting from first |
| Handler_read_key | Index lookups (good) |

High `Handler_read_rnd_next` indicates full table scans.

### Index Hints (5.7)

```sql
-- Force specific index
SELECT * FROM orders FORCE INDEX (idx_customer) WHERE customer_id = 123;

-- Ignore specific index
SELECT * FROM orders IGNORE INDEX (idx_date) WHERE order_date > '2024-01-01';
```

## Lock Analysis

### InnoDB Lock Waits (5.7)

```sql
-- Current lock waits
SELECT 
    r.trx_id waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query waiting_query,
    b.trx_id blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;
```

**Note:** These tables are deprecated in 8.0. Use `performance_schema.data_locks` in 8.0.

### Current Locks

```sql
-- All current locks
SELECT * FROM information_schema.innodb_locks;

-- Lock wait info
SELECT * FROM information_schema.innodb_lock_waits;
```

### Metadata Locks

```sql
-- Check metadata locks (requires instrumentation enabled)
SELECT 
    OBJECT_TYPE,
    OBJECT_SCHEMA,
    OBJECT_NAME,
    LOCK_TYPE,
    LOCK_STATUS,
    OWNER_THREAD_ID
FROM performance_schema.metadata_locks;
```

> ⚠️ **Nếu không có kết quả**, metadata lock instrumentation có thể chưa được enable. Yêu cầu DBA kiểm tra cấu hình `performance_schema.setup_instruments`.

## InnoDB Monitoring

### InnoDB Status

```sql
SHOW ENGINE INNODB STATUS\G
```

Key sections:
- **TRANSACTIONS**: Long-running or blocking transactions
- **SEMAPHORES**: Lock waits and mutex contention
- **BUFFER POOL AND MEMORY**: Memory usage
- **ROW OPERATIONS**: Read/write statistics

### Buffer Pool Stats

```sql
-- Buffer pool usage
SHOW STATUS LIKE 'Innodb_buffer_pool%';

-- Key metrics
SHOW STATUS LIKE 'Innodb_buffer_pool_read_requests';  -- Logical reads
SHOW STATUS LIKE 'Innodb_buffer_pool_reads';          -- Disk reads

-- Hit ratio (should be > 99%)
-- Calculate: (read_requests - reads) / read_requests * 100
```

### InnoDB Metrics

```sql
-- Detailed metrics
SELECT NAME, COUNT, STATUS 
FROM information_schema.INNODB_METRICS 
WHERE STATUS = 'enabled'
ORDER BY NAME;
```

## 5.7 Specific Limitations

### Features NOT Available in 5.7

| Feature | 5.7 | 8.0 |
|---------|-----|-----|
| EXPLAIN ANALYZE | ❌ | ✅ |
| Invisible indexes | ❌ | ✅ |
| Descending indexes | ❌ | ✅ |
| Functional indexes | ❌ | ✅ |
| Hash joins | ❌ | ✅ |
| Window functions | ❌ | ✅ |
| CTEs (WITH clause) | ❌ | ✅ |
| data_locks table | ❌ | ✅ |

### sys Schema in 5.7

sys schema exists in 5.7 but with fewer views:

```sql
-- Available in 5.7
SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;
SELECT * FROM sys.schema_unused_indexes;
SELECT * FROM sys.processlist WHERE command != 'Sleep';

-- User/host summary
SELECT * FROM sys.user_summary;
SELECT * FROM sys.host_summary;
```

### Query Cache (5.7 Only)

Query cache exists in 5.7 but often causes issues:

```sql
-- Check query cache status
SHOW VARIABLES LIKE 'query_cache%';
SHOW STATUS LIKE 'Qcache%';
```

> ⚠️ **Nếu query cache gây vấn đề:**
> - **Dev/Staging**: `SET GLOBAL query_cache_type = 'OFF'; SET GLOBAL query_cache_size = 0;`
> - **Production**: Yêu cầu DBA disable trong `my.cnf`
>
> Query cache đã bị loại bỏ hoàn toàn trong MySQL 8.0.

## Configuration Tuning (5.7)

### Key Variables

```sql
-- Buffer pool (70-80% of RAM for dedicated server)
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';

-- Log file size (larger = better for writes)
SHOW VARIABLES LIKE 'innodb_log_file_size';

-- Thread pool
SHOW VARIABLES LIKE 'thread_cache_size';

-- Table cache
SHOW VARIABLES LIKE 'table_open_cache';
SHOW STATUS LIKE 'Opened_tables';  -- High = increase cache
```

### Recommended Settings

> ⚠️ **Các thay đổi cấu hình cần được DBA thực hiện** trong `my.cnf` và restart MySQL service.

Các giá trị tham khảo (tùy thuộc vào server specs):
- `innodb_buffer_pool_size`: 70-80% RAM cho dedicated server
- `innodb_log_file_size`: 1G hoặc lớn hơn cho write-heavy workload  
- `table_open_cache`: 4000+
- `thread_cache_size`: 100+
- `query_cache_type = 0`: Disable query cache (recommended)

## Troubleshooting Commands Summary

```sql
-- Active queries
SELECT * FROM information_schema.processlist 
WHERE Command != 'Sleep' ORDER BY Time DESC;

-- Lock waits
SELECT * FROM information_schema.innodb_lock_waits;

-- Long transactions
SELECT * FROM information_schema.innodb_trx 
WHERE TIME_TO_SEC(TIMEDIFF(NOW(), trx_started)) > 60;

-- Full table scan queries
SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;

-- Buffer pool hit ratio
SELECT 
    (1 - (Innodb_buffer_pool_reads / Innodb_buffer_pool_read_requests)) * 100 
    as hit_ratio
FROM (
    SELECT 
        VARIABLE_VALUE as Innodb_buffer_pool_reads 
    FROM information_schema.GLOBAL_STATUS 
    WHERE VARIABLE_NAME = 'Innodb_buffer_pool_reads'
) a, (
    SELECT 
        VARIABLE_VALUE as Innodb_buffer_pool_read_requests 
    FROM information_schema.GLOBAL_STATUS 
    WHERE VARIABLE_NAME = 'Innodb_buffer_pool_read_requests'
) b;
```

## Upgrade Recommendation

MySQL 5.7 reaches end of life in **October 2023**. Consider upgrading to MySQL 8.0 for:
- Better performance diagnostics
- Enhanced security features
- Improved query optimizer
- Modern SQL features (CTEs, window functions)
- Continued support and updates
