# Scripts

## sync-accounts.js

Script đồng bộ email accounts từ Cursor dashboard với `accounts.json`.

### Vấn đề giải quyết

Khi tên account trong danh sách không khớp với profile thực tế (ví dụ: tên là `cursor12` nhưng mở lên lại là `cursor20`), script này sẽ:

1. Mở browser headless với từng profile
2. Navigate đến Cursor dashboard
3. Đọc email thực tế đang đăng nhập
4. So sánh với email trong `accounts.json`
5. Cập nhật nếu khác

### Cách sử dụng

#### Qua npm scripts

```bash
# Kiểm tra (không cập nhật, chỉ báo cáo)
npm run sync:check

# Chạy và cập nhật accounts.json
npm run sync:run
```

#### Qua command line

```bash
# Kiểm tra tất cả accounts (dry run)
node scripts/sync-accounts.js --dry-run

# Đồng bộ tất cả accounts
node scripts/sync-accounts.js

# Đồng bộ một account cụ thể
node scripts/sync-accounts.js --id <account-id>
```

#### Qua Windows batch file

```batch
# Double-click hoặc chạy từ command prompt
scripts\sync-accounts.bat

# Với dry-run
scripts\sync-accounts.bat --dry-run
```

### Chạy định kỳ

#### Windows Task Scheduler

1. Mở Task Scheduler
2. Create Basic Task
3. Trigger: Daily hoặc Weekly
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c "cd /d C:\path\to\AgentCursor && npm run sync:run"`
5. Save

#### Qua API (khi server đang chạy)

```bash
# Kiểm tra trạng thái
curl http://localhost:3000/api/sync/status

# Chạy sync (dry run)
curl -X POST "http://localhost:3000/api/sync/accounts?dryRun=true"

# Chạy sync thực
curl -X POST http://localhost:3000/api/sync/accounts

# Sync một account cụ thể
curl -X POST http://localhost:3000/api/sync/accounts/<account-id>
```

### Output mẫu

```
============================================================
Account Email Sync Tool
============================================================
Mode: DRY RUN (no changes will be made)
Time: 2026-02-06T14:30:00.000Z
============================================================

Syncing all accounts...
----------------------------------------

Results:
----------------------------------------
jvit_cursor12@jv-it.com.vn
  → jvit_cursor20@jv-it.com.vn
  Status: ⚠️ Needs update

jvit_cursor3@jv-it.com.vn
  Status: ✅ In sync

============================================================
Summary:
  Total accounts:  24
  Checked:         24
  Updated:         0
  Errors:          0
============================================================

Done!
```
