# MySQL 8.0 Troubleshooting Reference

MySQL 8.0 specific diagnostics, features, and commands.

## ⚠️ Environment Policy

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp ALTER, CREATE INDEX, SET |
| **Production** | Chỉ điều tra, yêu cầu DBA thực hiện thay đổi |

## Table of Contents

1. [Performance Schema](#performance-schema)
2. [Query Analysis](#query-analysis)
3. [Index Diagnostics](#index-diagnostics)
4. [Lock Analysis](#lock-analysis)
5. [InnoDB Improvements](#innodb-improvements)
6. [New 8.0 Features](#new-80-features)

## Performance Schema

MySQL 8.0 has enhanced Performance Schema enabled by default.

### Top Resource-Consuming Queries

```sql
-- By total execution time
SELECT 
    DIGEST_TEXT,
    COUNT_STAR as exec_count,
    ROUND(SUM_TIMER_WAIT/1000000000000, 2) as total_sec,
    ROUND(AVG_TIMER_WAIT/1000000000, 2) as avg_ms,
    SUM_ROWS_EXAMINED,
    SUM_ROWS_SENT,
    FIRST_SEEN,
    LAST_SEEN
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME = 'your_database'
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 10;
```

### Queries with Full Table Scans

```sql
SELECT 
    DIGEST_TEXT,
    COUNT_STAR,
    SUM_NO_INDEX_USED,
    SUM_NO_GOOD_INDEX_USED
FROM performance_schema.events_statements_summary_by_digest
WHERE SUM_NO_INDEX_USED > 0 OR SUM_NO_GOOD_INDEX_USED > 0
ORDER BY SUM_NO_INDEX_USED DESC
LIMIT 20;
```

### Table I/O Statistics

```sql
-- Tables with most I/O
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ,
    COUNT_WRITE,
    SUM_TIMER_READ/1000000000 as read_ms,
    SUM_TIMER_WRITE/1000000000 as write_ms
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema', 'sys')
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

### Index Usage Statistics

```sql
-- Unused indexes (candidates for removal)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NOT NULL
  AND COUNT_STAR = 0
  AND OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema')
ORDER BY OBJECT_SCHEMA, OBJECT_NAME;

-- Full table scans (missing index opportunities)
SELECT 
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ as full_scan_count
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NULL 
  AND COUNT_READ > 1000
  AND OBJECT_SCHEMA NOT IN ('mysql', 'performance_schema', 'information_schema')
ORDER BY COUNT_READ DESC
LIMIT 20;
```

## Query Analysis

### EXPLAIN ANALYZE (New in 8.0)

Shows actual execution statistics, not just estimates:

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 123;
```

Output includes:
- Actual rows vs estimated
- Actual time per operation
- Loop iterations

### EXPLAIN FORMAT=TREE

```sql
EXPLAIN FORMAT=TREE SELECT ...;
```

Visual tree representation of query execution plan.

### Optimizer Trace

```sql
SET optimizer_trace = 'enabled=on';
SELECT * FROM your_query;
SELECT * FROM information_schema.optimizer_trace\G
SET optimizer_trace = 'enabled=off';
```

## Index Diagnostics

### Invisible Indexes (Testing)

Test impact of removing an index without actually dropping it:

```sql
-- Check index visibility
SHOW INDEX FROM table_name;
```

> ⚠️ **Để test invisible index:**
> - **Dev/Staging**: `ALTER TABLE table_name ALTER INDEX idx_name INVISIBLE/VISIBLE`
> - **Production**: Yêu cầu DBA thực hiện. Đây là cách an toàn để test trước khi drop index.

### Descending Indexes

MySQL 8.0 supports true descending indexes:

```sql
-- Check existing indexes
SHOW INDEX FROM orders;
```

> ⚠️ **Để tạo descending index:**
> - **Dev/Staging**: `CREATE INDEX idx_date_desc ON orders (order_date DESC)`
> - **Production**: Yêu cầu DBA thực hiện

### Functional Indexes

MySQL 8.0 supports indexes on expressions:

```sql
-- Check if functional index exists
SHOW INDEX FROM users;
```

> ⚠️ **Để tạo functional index:**
> - **Dev/Staging**: `CREATE INDEX idx_lower_email ON users ((LOWER(email)))`
> - **Production**: Yêu cầu DBA thực hiện
>
> Query sử dụng `WHERE LOWER(email) = 'value'` sẽ dùng index này.

## Lock Analysis

### Data Lock Waits

```sql
-- Current lock waits
SELECT 
    REQUESTING_ENGINE_LOCK_ID,
    REQUESTING_ENGINE_TRANSACTION_ID,
    BLOCKING_ENGINE_LOCK_ID,
    BLOCKING_ENGINE_TRANSACTION_ID
FROM performance_schema.data_lock_waits;
```

### Detailed Lock Information

```sql
-- All current locks
SELECT 
    ENGINE_LOCK_ID,
    ENGINE_TRANSACTION_ID,
    OBJECT_SCHEMA,
    OBJECT_NAME,
    LOCK_TYPE,
    LOCK_MODE,
    LOCK_STATUS,
    LOCK_DATA
FROM performance_schema.data_locks
LIMIT 50;
```

### Metadata Lock Waits

```sql
SELECT 
    OBJECT_TYPE,
    OBJECT_SCHEMA,
    OBJECT_NAME,
    LOCK_TYPE,
    LOCK_DURATION,
    LOCK_STATUS,
    OWNER_THREAD_ID
FROM performance_schema.metadata_locks
WHERE LOCK_STATUS = 'PENDING';
```

## InnoDB Improvements

### InnoDB Status

```sql
SHOW ENGINE INNODB STATUS\G
```

Key sections to review:
- SEMAPHORES: Lock waits
- TRANSACTIONS: Long-running transactions
- BUFFER POOL: Memory usage
- ROW OPERATIONS: Read/write activity

### Buffer Pool Monitoring

```sql
-- Buffer pool usage
SELECT 
    POOL_ID,
    POOL_SIZE,
    FREE_BUFFERS,
    DATABASE_PAGES,
    PAGES_MADE_YOUNG,
    PAGES_NOT_MADE_YOUNG
FROM information_schema.INNODB_BUFFER_POOL_STATS;

-- Buffer pool contents by table
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    NUMBER_RECORDS,
    DATA_SIZE
FROM information_schema.INNODB_BUFFER_PAGE_LRU b
JOIN information_schema.INNODB_BUFFER_PAGE p ON b.LRU_POSITION = p.PAGE_NUMBER
LIMIT 50;
```

### Redo Log Monitoring

```sql
-- Redo log capacity (8.0.30+)
SHOW STATUS LIKE 'Innodb_redo_log%';
```

## New 8.0 Features

### sys Schema Helpers

```sql
-- Statements with full table scans
SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;

-- Statements with temp tables
SELECT * FROM sys.statements_with_temp_tables LIMIT 10;

-- Host summary
SELECT * FROM sys.host_summary;

-- User summary
SELECT * FROM sys.user_summary;

-- IO by file
SELECT * FROM sys.io_global_by_file_by_bytes LIMIT 20;

-- Schema table statistics
SELECT * FROM sys.schema_table_statistics WHERE table_schema = 'your_db';

-- Redundant indexes
SELECT * FROM sys.schema_redundant_indexes;

-- Unused indexes
SELECT * FROM sys.schema_unused_indexes;
```

### Resource Groups (8.0+)

```sql
-- View resource groups
SELECT * FROM information_schema.RESOURCE_GROUPS;
```

> ⚠️ **Resource groups** cho phép ưu tiên threads. Yêu cầu DBA cấu hình nếu cần throttle workload.

### Clone Plugin (Backup)

> ⚠️ **Clone plugin** dùng cho backup/restore. Yêu cầu DBA cài đặt và cấu hình.

### Hash Joins (8.0.18+)

MySQL 8.0.18+ uses hash joins for equi-joins without indexes. Check with EXPLAIN:

```sql
EXPLAIN FORMAT=TREE SELECT ...;
-- Look for "Hash join" in output
```

## Configuration Tuning

### Key Variables to Check

```sql
-- Buffer pool size (should be 70-80% of RAM for dedicated server)
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';

-- Redo log size
SHOW VARIABLES LIKE 'innodb_redo_log_capacity';  -- 8.0.30+
SHOW VARIABLES LIKE 'innodb_log_file_size';      -- Earlier versions

-- Thread configuration
SHOW VARIABLES LIKE 'innodb_read_io_threads';
SHOW VARIABLES LIKE 'innodb_write_io_threads';
SHOW VARIABLES LIKE 'innodb_thread_concurrency';

-- Query cache (removed in 8.0)
-- Note: Query cache no longer exists in MySQL 8.0
```

### Common 8.0 Optimizations

```sql
-- Check current settings
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'innodb_adaptive_hash_index';
SHOW VARIABLES LIKE 'innodb_parallel_read_threads';
```

> ⚠️ **Các thay đổi cấu hình** cần được DBA thực hiện trong `my.cnf`.

## Troubleshooting Commands Summary

```sql
-- Quick performance check
SELECT * FROM sys.statements_with_full_table_scans LIMIT 5;
SELECT * FROM sys.schema_unused_indexes;
SELECT * FROM sys.schema_redundant_indexes;

-- Active sessions
SELECT * FROM sys.processlist WHERE command != 'Sleep';

-- Memory usage
SELECT * FROM sys.memory_global_total;

-- Wait events
SELECT * FROM sys.wait_classes_global_by_avg_latency LIMIT 10;
```
