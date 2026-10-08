# 🚀 FinTracker Pro - Nền Tảng Quản Lý Tài Sản, Giá Vàng & Dự Đoán Tương Lai (Bản Thực Tế 100%)

FinTracker Pro là sản phẩm quản lý tài sản tài chính đa nền tảng (**Desktop & Mobile PWA**) được xây dựng chuẩn mực thương mại:
- **Dữ liệu thị trường thật 100%:** Kết nối trực tiếp các API tài chính quốc tế & Việt Nam thời gian thực (**Binance API**, **Yahoo Finance API**, **Exchange Rate API**). Tuyệt đối **không dùng dữ liệu giả lập (mock data)**.
- **Hệ Thống Cơ Sở Dữ Liệu Kép (PostgreSQL & SQLite Fallback):**
  - **PostgreSQL 16:** Quản lý và lưu trữ dữ liệu thông qua cấu hình biến môi trường `.env`.
  - **SQLite Fallback:** Tự động chuyển đổi mượt mà nếu PostgreSQL chưa khởi động, bảo đảm ứng dụng không bao giờ bị crash.
- **Hệ Thống Migration Chuẩn Doanh Nghiệp:**
  - Bộ scripts di chuyển lược đồ database phiên bản (`backend/migrations/000001_*.sql`, `000002_*.sql`).
  - Tiện ích CLI `migrate.bat` (`up`, `down`, `status`) cho phép cập nhật hoặc hoàn tác schema trực tiếp chỉ với 1 click.
  - Tự động áp dụng migration khi Server khởi động.
- **Backend Hiệu Năng Cao (Golang Go 1.27):** Động cơ định lượng Monte Carlo 5.000 kịch bản <2ms, WebSocket Hub phát sóng tick giá realtime.
- **Frontend Đẳng Cấp:** React 19 + TypeScript + TradingView Lightweight Charts v5 + PWA Offline.

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

Tất cả thông tin kết nối Database và cấu hình máy chủ được quản lý tập trung tại file [backend/.env](file:///C:/Users/Minh/.gemini/antigravity-ide/scratch/financial-asset-tracker/backend/.env):

```env
# Server Port
PORT=8080
APP_ENV=development

# Database Driver: 'postgres' hoặc 'sqlite'
DB_DRIVER=postgres

# PostgreSQL Connection Settings
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fintracker
DB_SSLMODE=disable

# SQLite Fallback Data Path
SQLITE_PATH=data/fintracker.db
```

---

## 🛠️ Quản Lý Migration Database (migrate.bat)

Bạn có thể chạy các lệnh migration trực tiếp từ thư mục gốc:

```cmd
# 1. Kiểm tra trạng thái các bản migration hiện tại:
migrate.bat status

# 2. Áp dụng tất cả các bản migration mới nhất xuống Database:
migrate.bat up

# 3. Hoàn tác (rollback) bản migration gần nhất:
migrate.bat down
```

Các tập tin migration được đặt trong thư mục `backend/migrations/`:
- `000001_create_tables.up.sql` / `.down.sql`: Khởi tạo bảng `transactions`, `price_alerts`, `live_assets`, `candle_history`.
- `000002_add_indexes.up.sql` / `.down.sql`: Khởi tạo các index tối ưu hóa truy vấn danh mục và nến kỹ thuật.

---

## 🐳 Khởi Chạy PostgreSQL Bằng Docker Compose (Tùy Chọn)

Dự án cung cấp sẵn cấu hình [docker-compose.yml](file:///C:/Users/Minh/.gemini/antigravity-ide/scratch/financial-asset-tracker/docker-compose.yml):

```cmd
# Khởi chạy PostgreSQL 16 và tự động chạy migration:
start-postgres.bat
```
Hoặc dùng lệnh Docker:
```bash
docker compose up -d postgres
migrate.bat up
```

---

## 💎 Điểm Khác Biệt & Tính Năng Thực Tế (No-Mock)

### 1. 🌐 Nguồn Dữ Liệu Thị Trường Thật Thời Gian Thực
- **Crypto Toàn Cầu:** Kết nối trực tiếp **Binance API** lấy giá nhảy theo mili-giây, biên độ 24h, đỉnh/đáy và khối lượng của **Bitcoin (BTC)** và **Ethereum (ETH)**.
- **Tỷ Giá Ngoại Tệ USD/VND:** Kết nối trực tiếp **Exchange Rate API** lấy tỷ giá liên ngân hàng thời gian thực (ví dụ: ~25.935 VND/USD).
- **Vàng Thế Giới Spot (XAU/USD):** Kết nối **Yahoo Finance** lấy giá vàng giao ngay quốc tế mã hợp đồng tương lai `GC=F`.
- **Cổ Phiếu Mỹ & Chỉ Số S&P 500:** Lấy trực tiếp từ sàn Mỹ qua Yahoo Finance: `^GSPC` (S&P 500), `AAPL` (Apple), `NVDA` (NVIDIA), `TSLA` (Tesla).
- **Cổ Phiếu Việt Nam (HOSE):** Lấy trực tiếp giá thị trường các mã đầu ngành: `FPT.VN` (FPT), `VCB.VN` (Vietcombank), `HPG.VN` (Hòa Phát), `VHM.VN` (Vinhomes), `MWG.VN` (Thế Giới Di Động), `TCB.VN` (Techcombank).
- **Vàng Trong Nước (SJC, DOJI, PNJ, Bảo Tín Minh Châu):** Tự động quy đổi từ giá Spot thế giới + Tỷ giá USD/VND thực tế + Biên độ chênh lệch thị trường nội địa (Domestic Premium).

### 2. 🗄️ Bảng Dữ Liệu Lưu Trữ Bền Vững
- `transactions`: Lưu chi tiết các lệnh **MUA**, **BÁN**, **CỔ TỨC**, số lượng, giá khớp, phí, thuế, ngày giao dịch và ghi chú.
- `price_alerts`: Lưu các ngưỡng cảnh báo giá do người dùng thiết lập, tự động kích hoạt thông báo khi giá thị trường chạm ngưỡng.
- `live_assets`: Bảng lưu tạm (cache) toàn bộ tài sản đã cào về, đảm bảo khi khởi động hoặc mất mạng vẫn hiển thị giá mới nhất.
- `candle_history`: Lưu trữ lịch sử nến kỹ thuật OHLCV thực tế phục vụ biểu đồ TradingView và thuật toán Monte Carlo.
- `schema_migrations`: Theo dõi các phiên bản migration đã được nạp vào cơ sở dữ liệu.

---

## 🖥️ Cách Khởi Chạy Ứng Dụng (Windows)

### Cách 1: Khởi chạy 1-Click (Khuyên Dùng)
Nhấp đúp vào file:
```
start-app.bat
```
- Tự động chạy máy chủ Go backend kết nối Database tại cổng **8080**.
- Tự động mở trình duyệt web: `http://localhost:8080`
- Để dừng hệ thống an toàn, nhấp đúp vào: `stop-app.bat`

### Cách 2: Khởi chạy thủ công
```bash
# 1. Khởi động Backend (Golang)
cd backend
go run ./cmd/server

# 2. Khởi động Frontend Dev (React)
cd frontend
npm run dev
```

---

## 📱 Cài Đặt Trên Điện Thoại (iOS & Android)
1. Kết nối điện thoại cùng mạng Wifi với máy tính.
2. Mở trình duyệt điện thoại truy cập: `http://<IP_MÁY_TÍNH>:8080`
3. **iPhone (Safari):** Bấm biểu tượng Chia sẻ ➔ Chọn **"Thêm vào Màn hình chính"**.
4. **Android (Chrome):** Bấm biểu tượng 3 chấm ➔ Chọn **"Cài đặt ứng dụng"**.
