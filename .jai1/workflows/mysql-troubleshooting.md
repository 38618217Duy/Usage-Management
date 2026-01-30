---
description: MySQL Troubleshooting - Interactive workflow to diagnose MySQL performance issues with step-by-step information gathering
---

# MySQL Troubleshooting Workflow

> **Goal**: Diagnose và khắc phục vấn đề performance MySQL thông qua trao đổi với user để thu thập thông tin cần thiết.
> **Skill**: Sử dụng `skill:mysql-troubleshooting` để phân tích chi tiết.

## ⚠️ CRITICAL RULES

1. ✅ **Thu thập thông tin trước** - Không đoán, hỏi user để xác định context
2. ✅ **Xác định môi trường** - Dev/Staging cho phép action trực tiếp, Production cần DBA
3. ✅ **Ưu tiên Missing Index** - Đây là nguyên nhân phổ biến nhất, ít rủi ro, hiệu quả cao
4. ✅ **Bỏ qua Sleep process** - Đó chỉ là connection pool, không phải vấn đề
5. ✅ **Kiểm tra Read Replica** - Nếu có, ưu tiên điều tra ở đó trước
6. ✅ **Output Vietnamese** - Phản hồi bằng tiếng Việt

## ⚠️ Environment Policy

| Environment | Action Policy |
|-------------|---------------|
| **Development/Staging** | Có thể thực hiện trực tiếp KILL, ALTER TABLE, SET GLOBAL |
| **Production** | Chỉ điều tra và đề xuất, DBA thực hiện các thay đổi |

---

## 🔄 Workflow Steps

### Step 1: Thu thập thông tin môi trường

**HỎI USER** các thông tin sau (có thể hỏi một lần):

```markdown
## 📋 Thông tin cần thu thập

Để điều tra hiệu quả, vui lòng cung cấp:

### 1. Triệu chứng
- [ ] Vấn đề gặp phải là gì? (High CPU, slow query, timeout, connection error...)
- [ ] Xảy ra khi nào? (Liên tục, peak hours, sau deploy...)
- [ ] Có error message/log không?

### 2. Môi trường MySQL
- [ ] MySQL version? (5.7 / 8.0 / khác)
- [ ] Server specs? (CPU, RAM, Disk type)
- [ ] **Đây là môi trường nào?** (Development / Staging / Production)

### 3. Kiến trúc
- [ ] Có sử dụng Master/Slave (Replica) không?
- [ ] Có tách READ connection riêng (read replica) không?
- [ ] Có sử dụng connection pooling không? (HikariCP, PgBouncer equivalent...)

### 4. Ứng dụng
- [ ] Framework/Language đang dùng? (Laravel, Spring, Node.js...)
- [ ] ORM? (Eloquent, Hibernate, Sequelize...)
```

**WAIT FOR USER RESPONSE**

---

### Step 2: Xác định hướng điều tra

**Dựa trên thông tin từ Step 1, xác định:**

| Triệu chứng | Hướng điều tra ưu tiên |
|-------------|------------------------|
| High CPU | → Step 3A: Active Queries + Full Table Scan |
| Slow Query | → Step 3B: Query Analysis |
| Connection Error | → Step 3C: Connection Issues |
| Lock/Deadlock | → Step 3D: Lock Analysis |
| Replication Lag | → Step 3E: Replication Issues |

**Nếu có Read Replica:**
> ⚠️ **Ưu tiên điều tra trên READ connection trước!**
> Đa số vấn đề index đều từ SELECT query thiếu index.

---

### Step 3A: High CPU Investigation

**YÊU CẦU USER chạy query:**

```sql
-- Kiểm tra query đang chạy (BỎ QUA Sleep - đó chỉ là connection pool)
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

Hoặc:
```sql
SHOW FULL PROCESSLIST;
```

**WAIT FOR USER RESPONSE**

**Phân tích kết quả:**

| Observation | Meaning | Action |
|-------------|---------|--------|
| Nhiều query giống nhau | N+1 problem hoặc missing index | → Step 4: Index Analysis |
| Query chạy > 5s | Slow query | → Step 3B |
| State = "Sending data" | Đang đọc nhiều rows | → Step 4: Index Analysis |
| State = "Copying to tmp table" | Sorting/Grouping lớn | → Step 4: Index Analysis |
| State = "Waiting for lock" | Lock contention | → Step 3D |

---

### Step 3B: Slow Query Analysis

**YÊU CẦU USER:**

1. **Lấy slow query cụ thể** (từ slow query log hoặc từ Step 3A)

2. **Chạy EXPLAIN:**
```sql
-- MySQL 8.0
EXPLAIN ANALYZE SELECT ... ;

-- MySQL 5.7
EXPLAIN SELECT ... ;
```

**WAIT FOR USER RESPONSE**

**Phân tích EXPLAIN:**

| Field | Bad Value | Meaning |
|-------|-----------|---------|
| type | ALL | ❌ Full table scan - THIẾU INDEX |
| type | index | ⚠️ Full index scan |
| rows | > 10000 | ⚠️ Nhiều rows examined |
| Extra | Using filesort | ⚠️ Sort không dùng index |
| Extra | Using temporary | ⚠️ Tạo temp table |
| key | NULL | ❌ Không dùng index |

**Nếu phát hiện Full Table Scan → Step 4**

---

### Step 3C: Connection Issues

**YÊU CẦU USER chạy:**

```sql
-- Current connections
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
SHOW VARIABLES LIKE 'max_connections';

-- Aborted connections
SHOW STATUS LIKE 'Aborted%';
```

**WAIT FOR USER RESPONSE**

**Đánh giá:**
- `Threads_connected` gần `max_connections` → Tăng max_connections hoặc optimize queries
- `Aborted_connects` cao → Network issues hoặc auth problems
- `Aborted_clients` cao → App không close connection properly

---

### Step 3D: Lock Analysis

**YÊU CẦU USER chạy:**

```sql
-- MySQL 8.0
SELECT * FROM performance_schema.data_lock_waits;

-- MySQL 5.7
SELECT * FROM information_schema.innodb_lock_waits;

-- Long transactions
SELECT * FROM information_schema.innodb_trx 
WHERE TIME_TO_SEC(TIMEDIFF(NOW(), trx_started)) > 60;
```

**WAIT FOR USER RESPONSE**

**Actions:**
- Identify blocking transaction
- Consider killing long-running transaction
- Review application transaction logic

---

### Step 3E: Replication Issues

**YÊU CẦU USER chạy trên REPLICA:**

```sql
SHOW SLAVE STATUS\G
```

**Kiểm tra:**
- `Seconds_Behind_Master` - Lag time
- `Slave_IO_Running` / `Slave_SQL_Running` - Replication status
- `Last_Error` - Error details

---

### Step 4: Index Analysis (Priority Focus)

> 🎯 **ĐÂY LÀ ƯU TIÊN CAO NHẤT**
> Missing index là nguyên nhân #1, ít rủi ro, hiệu quả cao.

**YÊU CẦU USER chạy:**

```sql
-- MySQL 8.0: Tables đang bị full scan
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

```sql
-- Hoặc dùng sys schema
SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;
```

**WAIT FOR USER RESPONSE**

**Với mỗi table có full scan:**

```sql
-- Xem structure
SHOW CREATE TABLE table_name\G

-- Xem existing indexes
SHOW INDEX FROM table_name;
```

**ĐỀ XUẤT INDEX:**

```markdown
## 💡 Đề xuất Index

### Table: `{table_name}`

**Query pattern phổ biến:**
```sql
SELECT ... WHERE column1 = ? AND column2 = ?
```

**Đề xuất cho DBA:**
```sql
ALTER TABLE {table_name} ADD INDEX idx_{column1}_{column2} ({column1}, {column2});
```

**Ước tính impact:**
- Rows examined: {before} → {after}
- Expected improvement: ~{x}x faster

**Lưu ý cho DBA:**
- Chạy vào giờ thấp tải
- Monitor sau khi add index
```

---

### Step 5: Đề xuất giải pháp

**Template output:**

```markdown
## 🔍 Kết quả điều tra MySQL

### Môi trường
- MySQL Version: {version}
- Architecture: {master/slave info}
- Read Replica: {yes/no}

### Vấn đề phát hiện

#### 1. {Issue Name}
- **Severity**: {Critical/High/Medium}
- **Root Cause**: {explanation}
- **Evidence**: {query/data từ user}

### 🛠️ Đề xuất khắc phục

> ⚠️ **Environment Policy:**
> - **Dev/Staging**: Có thể thực hiện trực tiếp các lệnh bên dưới
> - **Production**: Đề xuất cho DBA thực hiện

#### Quick Wins (Thực hiện ngay, ít rủi ro)
| Priority | Action | Impact | Risk |
|----------|--------|--------|------|
| 1 | Add index on `table.column` | High | Low |
| 2 | ... | ... | ... |

#### Medium-term (Cần planning)
- {recommendation}

#### Long-term (Cần refactor)
- {recommendation}

### 🛠️ Các lệnh thực hiện

**Dev/Staging - Có thể chạy trực tiếp:**
```sql
-- 1. Add missing index
ALTER TABLE {table} ADD INDEX idx_name ({columns});

-- 2. Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- 3. Kill problematic query (nếu cần)
KILL <process_id>;
```

> ⚠️ **Production**: Đề xuất các lệnh trên cho DBA thực hiện.

### ⚠️ Lưu ý khi thực hiện
- **Production**: Các thay đổi cần DBA thực hiện
- Backup trước khi thay đổi
- Chạy ALTER TABLE vào giờ thấp tải
- Monitor performance sau thay đổi

### 📊 Theo dõi sau fix
```sql
-- Verify index được sử dụng
EXPLAIN SELECT ... ;

-- Monitor slow queries
SHOW STATUS LIKE 'Slow_queries';
```
```

---

## 📚 Skill Reference

Khi cần thông tin chi tiết, load skill:

```
skill:mysql-troubleshooting
```

**References trong skill:**
- `references/high-cpu.md` - Chi tiết High CPU troubleshooting
- `references/mysql-8.md` - MySQL 8.0 specific commands
- `references/mysql-57.md` - MySQL 5.7 specific commands

---

## ✅ Checklist

- [ ] Thu thập thông tin môi trường
- [ ] Xác định triệu chứng chính
- [ ] Kiểm tra active queries (bỏ qua Sleep)
- [ ] Nếu có Read Replica, điều tra ở đó trước
- [ ] Ưu tiên phát hiện Full Table Scan / Missing Index
- [ ] Đề xuất giải pháp với độ ưu tiên rõ ràng
- [ ] Cung cấp các lệnh cụ thể để thực hiện
- [ ] Hướng dẫn theo dõi sau khi fix
