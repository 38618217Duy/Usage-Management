# Hướng dẫn Cài đặt và Chạy Cursor Usage Automation

> **Version**: 1.0 | **Cập nhật**: 2026-01-29

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt](#2-cài-đặt)
3. [Cấu hình](#3-cấu-hình)
4. [Chạy ứng dụng](#4-chạy-ứng-dụng)
5. [Sử dụng](#5-sử-dụng)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Yêu cầu hệ thống

### 1.1 Phần mềm bắt buộc

| Phần mềm | Version | Kiểm tra |
|----------|---------|----------|
| Node.js | 18.0.0+ | `node --version` |
| npm | 9.0.0+ | `npm --version` |
| Google Chrome | Latest | Kiểm tra trong Chrome |

### 1.2 Hệ điều hành hỗ trợ

- ✅ Windows 10/11
- ✅ macOS 12+
- ✅ Linux (Ubuntu 20.04+)

### 1.3 Ports sử dụng

| Port | Service | Mô tả |
|------|---------|-------|
| 3000 | Backend API | Express server |
| 5173 | Frontend Dev | Vite dev server |
| 9222 | Chrome CDP | Chrome DevTools Protocol |

---

## 2. Cài đặt

### 2.1 Clone repository

```bash
git clone <repository-url>
cd AgentCursor
```

### 2.2 Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies (backend + frontend)
npm run install:all

# Hoặc cài đặt riêng lẻ:
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

### 2.3 Cài đặt Playwright browsers

```bash
npx playwright install chromium
```

> ⚠️ **Lưu ý**: Bước này tải về Chromium browser (~150MB), cần thiết cho automation.

### 2.4 Verify cài đặt

```bash
# Kiểm tra Node.js
node --version
# Expected: v18.x.x hoặc cao hơn

# Kiểm tra npm
npm --version
# Expected: 9.x.x hoặc cao hơn

# Kiểm tra Playwright
npx playwright --version
# Expected: Version 1.40.x hoặc cao hơn
```

---

## 3. Cấu hình

### 3.1 Cấu trúc thư mục

Sau khi cài đặt, cấu trúc thư mục như sau:

```
AgentCursor/
├── accounts.json          # Dữ liệu accounts (tự động tạo)
├── package.json           # Backend dependencies
├── src/                   # Backend source code
│   ├── config/           # Configuration
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   ├── app.js            # Express app
│   └── server.js         # Entry point
├── client/               # Frontend React app
│   ├── src/
│   └── package.json
├── profiles/             # Browser profiles (gitignored)
├── download/             # Downloaded CSV files (gitignored)
├── logs/                 # Log files (gitignored)
└── docs/                 # Documentation
```

### 3.2 Cấu hình Backend

File cấu hình: `src/config/index.js`

```javascript
// Có thể thay đổi các giá trị sau nếu cần:
server: {
  port: process.env.PORT || 3000,  // Port backend
  host: process.env.HOST || 'localhost',
},
cdp: {
  endpoint: 'http://localhost:9222',  // Chrome CDP endpoint
  defaultPort: 9222,
}
```

### 3.3 Environment Variables (Optional)

Tạo file `.env` nếu cần override config:

```env
PORT=3000
HOST=localhost
```

---

## 4. Chạy ứng dụng

### 4.1 Phương pháp 1: Development Mode (Khuyến nghị)

Mở **2 terminal** riêng biệt:

**Terminal 1 - Backend:**
```bash
npm run dev
```

Output expected:
```
Server running on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

Output expected:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 4.2 Phương pháp 2: Production Mode

```bash
# Build frontend
npm run client:build

# Start server (serve cả backend + frontend)
npm start
```

Truy cập: http://localhost:3000

### 4.3 ⚠️ QUAN TRỌNG: Launch Chrome với CDP

**Để bypass lỗi 403 Forbidden từ Cursor/Cloudflare, bạn PHẢI chạy Chrome với CDP:**

#### Windows (PowerShell):
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\Google\Chrome\User Data"
```

#### Windows (CMD):
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"
```

#### macOS:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
```

#### Linux:
```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
```

> ⚠️ **Lưu ý quan trọng**:
> - Đóng TẤT CẢ cửa sổ Chrome trước khi chạy lệnh trên
> - Chrome phải được mở bằng lệnh này, không phải click icon
> - Giữ Chrome mở trong suốt quá trình sử dụng

### 4.4 Verify Chrome CDP

Kiểm tra Chrome CDP đang chạy:

```bash
curl http://localhost:9222/json/version
```

Expected response:
```json
{
  "Browser": "Chrome/xxx.x.xxxx.xx",
  "Protocol-Version": "1.3",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

---

## 5. Sử dụng

### 5.1 Workflow cơ bản

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW SỬ DỤNG                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Launch Chrome với CDP                                    │
│           │                                                  │
│           ▼                                                  │
│  2. Login vào Cursor trong Chrome                           │
│           │                                                  │
│           ▼                                                  │
│  3. Mở Dashboard (http://localhost:5173)                    │
│           │                                                  │
│           ▼                                                  │
│  4. Click "Connect" để kết nối CDP                          │
│           │                                                  │
│           ▼                                                  │
│  5. Thêm account (email)                                    │
│           │                                                  │
│           ▼                                                  │
│  6. Click "Verify" để xác nhận login                        │
│           │                                                  │
│           ▼                                                  │
│  7. Click "Download" hoặc "Download All"                    │
│           │                                                  │
│           ▼                                                  │
│  8. CSV được lưu tại download/{email}.csv                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Bước chi tiết

#### Bước 1: Khởi động hệ thống

1. Mở Terminal 1, chạy: `npm run dev`
2. Mở Terminal 2, chạy: `npm run client`
3. Mở Terminal 3, chạy Chrome với CDP (xem mục 4.3)

#### Bước 2: Login vào Cursor

1. Trong Chrome (đã mở với CDP), truy cập: https://cursor.com
2. Đăng nhập vào tài khoản Cursor của bạn
3. Đảm bảo có thể truy cập trang Usage

#### Bước 3: Kết nối CDP

1. Mở browser, truy cập: http://localhost:5173
2. Nhìn góc phải header, thấy "CDP: Disconnected"
3. Click nút "Connect"
4. Đợi đến khi hiện "CDP: Connected" (màu xanh)

#### Bước 4: Thêm Account

1. Trong phần "Add New Account"
2. Nhập email của tài khoản Cursor
3. Click "Add Account"
4. Account xuất hiện trong danh sách với status "Not Logged In"

#### Bước 5: Verify Login

1. Click nút "Verify" trên account card
2. Hệ thống kiểm tra session trong Chrome
3. Nếu đã login trong Chrome → Status chuyển thành "Logged In" (xanh)
4. Nếu chưa login → Status là "Session Expired" (đỏ)

#### Bước 6: Download CSV

**Cho một account:**
1. Click nút "Download" trên account card
2. Đợi quá trình download hoàn tất
3. File CSV được lưu tại `download/{email}.csv`

**Cho tất cả accounts:**
1. Click nút "Download All (n)" ở header
2. Hệ thống download lần lượt cho từng account
3. Kết quả hiển thị: Total, Successful, Failed, Skipped

### 5.3 Xem file CSV đã tải

```bash
# Windows
dir download\

# macOS/Linux
ls -la download/
```

---

## 6. Troubleshooting

### 6.1 Lỗi thường gặp

#### ❌ "CDP: Disconnected" - Không kết nối được

**Nguyên nhân**: Chrome không chạy với CDP flag

**Giải pháp**:
1. Đóng TẤT CẢ cửa sổ Chrome
2. Chạy Chrome với lệnh ở mục 4.3
3. Verify bằng: `curl http://localhost:9222/json/version`
4. Click "Connect" lại trong Dashboard

#### ❌ "403 Forbidden" khi download

**Nguyên nhân**: Sử dụng Playwright spawn browser thay vì CDP

**Giải pháp**:
1. Đảm bảo Chrome chạy với CDP
2. Đảm bảo đã login vào Cursor trong Chrome
3. Đảm bảo "CDP: Connected" trong Dashboard
4. Sử dụng "Download All" (dùng CDP) thay vì "Download" đơn lẻ

#### ❌ "Session Expired" sau khi Verify

**Nguyên nhân**: Chưa login hoặc session hết hạn

**Giải pháp**:
1. Mở Chrome (đã chạy với CDP)
2. Truy cập https://cursor.com
3. Login lại vào tài khoản
4. Quay lại Dashboard, click "Verify" lại

#### ❌ "Port 3000 already in use"

**Nguyên nhân**: Có process khác đang dùng port 3000

**Giải pháp**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

#### ❌ "ENOENT: no such file or directory, open 'accounts.json'"

**Nguyên nhân**: File accounts.json chưa được tạo

**Giải pháp**: File sẽ tự động tạo khi thêm account đầu tiên. Hoặc tạo thủ công:

```bash
echo '{"accounts":[]}' > accounts.json
```

### 6.2 Logs

Xem logs để debug:

```bash
# Tất cả logs
cat logs/combined.log

# Chỉ errors
cat logs/error.log

# Theo dõi real-time
tail -f logs/combined.log
```

### 6.3 Reset dữ liệu

```bash
# Xóa tất cả accounts
rm accounts.json

# Xóa tất cả profiles
rm -rf profiles/

# Xóa tất cả downloads
rm -rf download/

# Xóa logs
rm -rf logs/
```

---

## 7. API Reference

Xem chi tiết tại: [README.md](../README.md#-api-endpoints)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/accounts` | Lấy danh sách accounts |
| POST | `/api/accounts` | Thêm account mới |
| DELETE | `/api/accounts/:id` | Xóa account |
| POST | `/api/accounts/:id/open-browser` | Mở browser để login |
| POST | `/api/accounts/:id/verify` | Verify login status |
| POST | `/api/accounts/:id/download` | Download CSV |
| POST | `/api/automation/run-all` | Download tất cả |
| GET | `/api/automation/cdp/status` | CDP status |
| POST | `/api/automation/cdp/connect` | Connect CDP |

---

## 8. Tài liệu liên quan

- [README.md](../README.md) - Tổng quan dự án
- [PRD.md](./PRD.md) - Product Requirements Document
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Chi tiết xử lý lỗi
- [Feature Docs](./features/) - Tài liệu chi tiết từng feature

---

## 9. Liên hệ hỗ trợ

Nếu gặp vấn đề không giải quyết được:
1. Kiểm tra logs tại `logs/combined.log`
2. Tạo issue với thông tin:
   - Mô tả lỗi
   - Steps to reproduce
   - Log output
   - OS và Node.js version
