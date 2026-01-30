---
name: now
description: Lấy ngày giờ hiện tại. Sử dụng khi cần biết thời gian, ngày tháng, hoặc format datetime cho code/documentation.
---

# Now

Skill để lấy ngày giờ hiện tại.

## Commands

### Mặc định (ISO 8601)

```bash
date +"%Y-%m-%d %H:%M:%S"
# → 2024-12-06 23:15:30
```

### Chỉ ngày

```bash
date +"%Y-%m-%d"    # → 2024-12-06
date +"%d/%m/%Y"    # → 06/12/2024
```

### Chỉ giờ

```bash
date +"%H:%M:%S"    # → 23:15:30
```

### Timestamp (Unix)

```bash
date +%s            # → 1733502930
```

### Format phổ biến

| Format | Command | Output |
|--------|---------|--------|
| ISO 8601 | `date -Iseconds` | 2024-12-06T23:15:30+07:00 |
| RFC 2822 | `date -R` | Fri, 06 Dec 2024 23:15:30 +0700 |
| UTC | `date -u +"%Y-%m-%dT%H:%M:%SZ"` | 2024-12-06T16:15:30Z |

## Workflow

1. Xác định format cần thiết
2. Chạy command `date` với format tương ứng
3. Trả về kết quả
