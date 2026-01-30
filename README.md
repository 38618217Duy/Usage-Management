# Cursor Usage Automation

Công cụ tự động hóa việc tải CSV usage từ Cursor cho nhiều tài khoản, sử dụng persistent browser profile.

## 🎯 Tính năng

- **Quản lý nhiều tài khoản** - Thêm/xóa/theo dõi nhiều tài khoản Cursor
- **Persistent Browser Profile** - Mỗi account có browser profile riêng, session được lưu lâu dài
- **Đăng nhập thủ công** - Mở browser để user đăng nhập, không tự động login
- **Verify Login Status** - Kiểm tra session còn valid không
- **Tải CSV tự động** - Tải file CSV usage 30 ngày
- **Batch Download** - Tải CSV cho tất cả accounts đã đăng nhập
- **Dashboard UI** - Giao diện web để theo dõi và điều khiển

## 📁 Cấu trúc thư mục

```
project/
├── accounts.json          # Dữ liệu accounts
├── package.json           # Dependencies
├── src/                   # Backend source
│   ├── config/           # Configuration
│   ├── utils/            # Utilities (logger)
│   ├── models/           # Data models
│   ├── services/         # Business logic
│   ├── routes/           # API routes
│   ├── app.js            # Express app
│   └── server.js         # Entry point
├── client/               # Frontend React app
├── profiles/             # Browser profiles (gitignored)
├── download/             # Downloaded CSV files (gitignored)
├── logs/                 # Log files (gitignored)
└── docs/                 # Documentation
```

## 🚀 Cài đặt

### Prerequisites

- Node.js 18+
- npm

### Cài đặt dependencies

```bash
# Cài đặt backend
npm install

# Cài đặt frontend
cd client && npm install
```

### Cài đặt Playwright browsers

```bash
npx playwright install chromium
```

## 🏃 Chạy ứng dụng

### ⚠️ QUAN TRỌNG: Launch Chrome với Remote Debugging

**Để bypass 403 Forbidden từ Cursor/Cloudflare, bạn PHẢI chạy Chrome với CDP:**

```bash
# Windows / Command Prompt
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="C:\chrome-cdp"

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Google/Chrome"

# Linux
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
```

**Sau đó:**

1. Đăng nhập vào Cursor trong Chrome
2. Chạy backend server
3. Automation sẽ attach vào Chrome thật thay vì spawn browser mới

### Development

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run client
```

### Production

```bash
# Build frontend
npm run client:build

# Start server
npm start
```

Truy cập:

- Backend API: http://localhost:3000
- Frontend (dev): http://localhost:5173

## 📡 API Endpoints

| Method | Endpoint                         | Mô tả                                 |
| ------ | -------------------------------- | ------------------------------------- |
| GET    | `/api/health`                    | Health check                          |
| GET    | `/api/accounts`                  | Lấy danh sách accounts                |
| POST   | `/api/accounts`                  | Thêm account mới                      |
| GET    | `/api/accounts/:id`              | Lấy chi tiết account                  |
| DELETE | `/api/accounts/:id`              | Xóa account                           |
| POST   | `/api/accounts/:id/open-browser` | Mở browser để đăng nhập               |
| POST   | `/api/accounts/:id/verify`       | Verify login status                   |
| POST   | `/api/accounts/:id/download`     | Tải CSV cho account                   |
| POST   | `/api/automation/run-all`        | Tải CSV cho tất cả LOGGED_IN accounts |
| GET    | `/api/automation/status`         | Lấy trạng thái automation             |

## 🔐 Bảo mật

- **profiles/** và **download/** được gitignore
- Không log/serialize/expose cookies
- Mỗi account có profile riêng biệt
- Không tự động đăng nhập

## 📊 Account Status

| Status            | Mô tả                            |
| ----------------- | -------------------------------- |
| `NOT_LOGGED_IN`   | Account mới, chưa đăng nhập      |
| `LOGGED_IN`       | Session valid, có thể automation |
| `SESSION_EXPIRED` | Session hết hạn, cần re-login    |

## 🔄 Workflow

1. **Thêm account** - Nhập email, tạo profile directory
2. **Mở browser** - Click "Open Browser", đăng nhập thủ công
3. **Đóng browser** - Session được lưu trong profile
4. **Verify** - Kiểm tra session còn valid
5. **Download** - Tải CSV nếu LOGGED_IN
6. **Run All** - Batch download cho tất cả accounts

## 📝 Logging

Logs được lưu tại `logs/`:

- `combined.log` - Tất cả logs
- `error.log` - Chỉ errors

Log levels: ERROR, WARN, INFO, DEBUG

## 📚 Documentation

- [PRD](docs/PRD.md) - Product Requirements Document
- [FRD](docs/features/cursor-usage-automation/FRD-cursor-usage-automation.md) - Functional Requirements
- [TDD](docs/features/cursor-usage-automation/TDD-cursor-usage-automation.md) - Technical Design
- [TEST](docs/features/cursor-usage-automation/TEST-cursor-usage-automation.md) - Test Scenarios

## ⚠️ Lưu ý

- Selectors có thể thay đổi khi Cursor update UI
- Cấu hình selectors tại `src/config/index.js`
- Không chạy concurrent cùng một profile
- Đảm bảo đóng browser trước khi verify/download
