# Troubleshooting Guide

## Google OAuth Login Issues

### Problem: "Couldn't sign you in - This browser or app may not be secure"

**Nguyên nhân**: Google phát hiện browser được điều khiển bởi automation tool (Playwright) và chặn đăng nhập.

**Giải pháp đã implement**:

1. **Browser Args** - Thêm các tham số để bypass detection:

   ```javascript
   args: [
     '--disable-blink-features=AutomationControlled',
     '--disable-web-security',
     '--disable-features=VizDisplayCompositor',
     '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
   ],
   ignoreDefaultArgs: ['--enable-automation']
   ```

2. **JavaScript Injection** - Remove automation indicators:
   ```javascript
   await page.evaluateOnNewDocument(() => {
     Object.defineProperty(navigator, "webdriver", {
       get: () => undefined,
     });
     delete window.navigator.webdriver;
   });
   ```

### Alternative Solutions

Nếu vẫn gặp vấn đề:

1. **Sử dụng browser thật**:
   - Mở Chrome thường
   - Đăng nhập Cursor
   - Copy profile từ Chrome vào profiles/

2. **Manual workaround**:
   - Click "Open Browser"
   - Navigate manually đến cursor.com
   - Đăng nhập bình thường
   - Đóng browser

3. **Incognito mode**:
   - Thêm `--incognito` vào args
   - Đăng nhập trong incognito

### Kiểm tra Profile Path

```bash
# Check profile directory exists
ls profiles/acc-{account-id}/

# Check if session data saved
ls profiles/acc-{account-id}/Default/
```

## Common Issues

### 1. Browser không mở

**Nguyên nhân**:

- Playwright chưa install browser
- Lỗi `page.evaluateOnNewDocument is not a function` (version compatibility)

**Giải pháp**:

```bash
npx playwright install chromium
```

Nếu gặp lỗi `evaluateOnNewDocument`, đã được fix với try-catch wrapper.

### 2. CSV không download hoặc download sai file

**Nguyên nhân**:

- Selectors thay đổi
- Click nhầm nút "Download" khác thay vì "Export CSV"
- File download là executable (.exe) thay vì CSV
- Timeout khi navigate đến /usage
- Nút Export CSV nằm dưới, cần scroll để thấy

**Giải pháp**:

- Update selectors trong `src/config/index.js`
- Kiểm tra file downloaded có đúng format CSV không
- Xóa file sai: `Remove-Item "download/*.csv" -Force`
- Tăng navigation timeout lên 60s
- Thêm logic scroll để tìm nút Export

### 3. Session expired ngay

**Nguyên nhân**: Profile bị corrupt

**Giải pháp**: Xóa profile và tạo lại

```bash
rm -rf profiles/acc-{account-id}/
```

### 4. Port conflict

**Nguyên nhân**: Port 3000 hoặc 5173 đã được sử dụng

**Giải pháp**:

```bash
# Backend
PORT=3001 npm start

# Frontend
cd client && npm run dev -- --port 5174
```

## Debug Commands

```bash
# Check server logs
tail -f logs/combined.log

# Test API
curl http://localhost:3000/api/health

# Check accounts
curl http://localhost:3000/api/accounts
```
