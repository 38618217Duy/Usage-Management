---
name: check-domain-availability
description: Kiểm tra xem domain có available để đăng ký không (hỗ trợ .jp, .co.jp, .com, .net, .ai, .io...)
version: 1.0.0
author: JAI1
---

# Check Domain Availability Skill

Skill này giúp bạn kiểm tra nhanh tình trạng (Available/Taken) của danh sách các domain mà không cần dùng browser.
Skill sử dụng kết hợp RDAP (Registration Data Access Protocol) và WHOIS command line để có kết quả chính xác nhất.

## Yêu cầu
- Node.js (đã có sẵn trong môi trường)
- Command `whois` (nếu kiểm tra fallback hoặc các TLD đặc thù như .ai)
  - Trên macOS: `brew install whois` (thường đã có sẵn)
  - Trên Linux: `apt-get install whois` hoặc `yum install whois`

## Cách sử dụng

### 1. Kiểm tra nhanh danh sách domain
Chạy script `check-domain.js` trong thư mục scripts của skill.

```bash
# Thay thế domains bằng danh sách bạn muốn kiểm tra
node .jai1/skills/check-domain-availability/scripts/check-domain.js example.com example.jp my-startup.ai
```

### 2. Sử dụng trong Workflow (Agentic)
Nếu bạn là Agent, hãy thực hiện bước sau:
1. Xác định danh sách domain người dùng muốn kiểm tra.
2. Run command:
   ```bash
   node .jai1/skills/check-domain-availability/scripts/check-domain.js [list_of_domains]
   ```
3. Đọc output và báo cáo lại cho user.

## Supported TLDs
Các TLD phổ biến đã được tối ưu:
- **.com, .net, .org, .io**: Sử dụng RDAP (nhanh, chính xác).
- **.jp, .co.jp**: Sử dụng JPRS RDAP.
- **.ai**: Sử dụng WHOIS (do RDAP của .ai đang trong giai đoạn chuyển đổi).
- **Other TLDs**: Tự động thử RDAP qua IANA Bootstrap, fallback về WHOIS nếu thất bại.

## Troubleshooting
- Nếu kết quả là `UNKNOWN`:
  - Có thể do lỗi mạng khi kết nối đến RDAP server.
  - Hoặc output của WHOIS có format lạ chưa được parse.
  - Hãy thử chạy lại hoặc dùng thủ công `whois <domain>` để kiểm tra.

## Resources
- **Script**: `.jai1/skills/check-domain-availability/scripts/check-domain.js`
