# 📘 Hướng Dẫn DevOps: Self-Hosted Server, Cloudflare Tunnel & GitHub Actions

Tài liệu này hướng dẫn chi tiết cách biến máy tính cá nhân (Windows hoặc Linux) thành một máy chủ **Self-Hosted Production Server**, kết nối tên miền an toàn qua **Cloudflare Tunnel (Zero Trust)** và thiết lập luồng **CI/CD tự động bằng GitHub Actions**.

---

## PHẦN 1: Cơ Chế GORM Auto-Migration & Quản Lý Transaction

### 1. Auto-Migration Hoạt Động Như Thế Nào?
Thay vì phải viết file migration SQL thủ công bằng tay mỗi lần sửa bảng:
- Khi bạn thêm một trường mới vào struct trong `backend/internal/model/entity.go` (ví dụ `Category string gorm:"size:64"`), hoặc tạo một struct entity mới.
- Khi Server khởi động, hàm `db.AutoMigrate(...)` sẽ tự động:
  1. Kiểm tra cấu trúc bảng hiện tại trong PostgreSQL/SQLite.
  2. Tự động chạy `CREATE TABLE` nếu bảng chưa tồn tại.
  3. Tự động chạy `ALTER TABLE ADD COLUMN` để thêm các cột mới mà **không làm mất dữ liệu cũ**.
  4. Tự động tạo các Indexes cần thiết theo tag `gorm:"index"`.

### 2. Quản Lý Transaction (ACID)
Mỗi lần ghi dữ liệu phức tạp (như tạo giao dịch, thanh lý, cập nhật danh mục), GORM bảo vệ dữ liệu bằng transaction tự động:
```go
err := repo.WithTransaction(func(tx *gorm.DB) error {
    // 1. Tạo bản ghi giao dịch
    if err := tx.Create(&transaction).Error; err != nil {
        return err // Tự động ROLLBACK toàn bộ
    }
    // 2. Cập nhật số dư / trạng thái
    if err := tx.Model(&asset).Update(...).Error; err != nil {
        return err // Tự động ROLLBACK toàn bộ
    }
    return nil // Tự động COMMIT xuống DB
})
```
Nếu bất kỳ thao tác nào thất bại hoặc code bị `panic`, toàn bộ dữ liệu tự động hoàn tác về trạng thái ban đầu.

---

## PHẦN 2: Biến Máy Tính Cá Nhân Thành Server Quản Lý Bằng Docker & Portainer

### 1. Thiết Lập Hệ Thống Tự Động Khởi Động
- **Docker Desktop:** Mở Settings ➔ Bật **"Start Docker Desktop when you log in"**.
- **Chính Sách Restart Container:** Trong `docker-compose.yml`, tất cả service đều có cấu hình `restart: unless-stopped`. Khi máy tính khởi động lại, toàn bộ Database, Backend và Frontend sẽ tự động chạy ngầm mà không cần thao tác chuột.
- **BIOS Máy Tính (Tùy chọn):** Vào BIOS máy ➔ tìm mục **Power Management** ➔ bật **"Restore on AC Power Loss"** hoặc **"Auto Power On"** (khi bị cúp điện và có điện lại, máy tính sẽ tự động bật nguồn).

### 2. Cài Đặt Giao Diện Quản Trị Trực Quan Portainer CE
Portainer biến máy tính của bạn thành một giao diện quản trị Cloud chuyên nghiệp:
```bash
docker volume create portainer_data
docker run -d -p 9000:9000 --name portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest
```
- Mở trình duyệt truy cập: `http://localhost:9000`
- Bạn có thể xem biểu đồ CPU, RAM, xem Logs thời gian thực của từng container và Restart/Stop chỉ với 1 click.

---

## PHẦN 3: Đưa Ứng Dụng Ra Internet Qua Cloudflare Tunnel (Miễn Phí & An Toàn)

### Tại Sao Dùng Cloudflare Tunnel?
- **Không cần mở port modem (Port Forwarding):** Mạng gia đình (CGNAT) thường không có IP tĩnh. Mở port modem rất dễ bị hacker quét và DDoS.
- **Cloudflare Tunnel (`cloudflared`):** Tạo một đường hầm mã hóa outbound từ máy tính bạn đến mạng toàn cầu của Cloudflare.
- **Có sẵn HTTPS/SSL miễn phí:** Toàn bộ truy cập được bảo vệ bởi chứng chỉ SSL của Cloudflare.
- **Ẩn 100% địa chỉ IP nhà bạn.**

### Các Bước Cấu Hình Cloudflare Zero Trust:
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/) (Tài khoản miễn phí).
2. Vào menu **Zero Trust** (bên tay trái) ➔ Chọn **Networks** ➔ **Tunnels** ➔ Bấm **Add a tunnel**.
3. Chọn loại **Cloudflared** ➔ Đặt tên tunnel (ví dụ: `fintracker-home`).
4. Cloudflare sẽ cấp cho bạn một chuỗi token bí mật:
   ```
   docker run cloudflare/cloudflared:latest tunnel run --token <TUNNEL_TOKEN>
   ```
5. Trong giao diện Cloudflare Tunnel, thêm **Public Hostname**:
   - **Frontend:**
     - Subdomain: `app` | Domain: `yourdomain.com` (ví dụ: `app.yourdomain.com`)
     - Service Type: `HTTP` | URL: `localhost:7173`
   - **Backend API:**
     - Subdomain: `api` | Domain: `yourdomain.com` (ví dụ: `api.yourdomain.com`)
     - Service Type: `HTTP` | URL: `localhost:8080`
6. Mở file `docker-compose.yml`, uncomment service `tunnel` và điền token vào:
   ```yaml
   tunnel:
     image: cloudflare/cloudflared:latest
     container_name: fintracker-tunnel
     restart: unless-stopped
     command: tunnel run --token <TUNNEL_TOKEN_CỦA_BẠN>
     network_mode: host
   ```
Sau bước này, bất kỳ ai trên thế giới đều có thể truy cập website của bạn qua `https://app.yourdomain.com`!

---

## PHẦN 4: Thiết Lập GitHub Actions Tự Động Deploy Lên Máy Cá Nhân

Workflow CI/CD đã được cấu hình sẵn tại [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml).

### Các Bước Kích Hoạt Self-Hosted Runner Trên Máy Tính:
1. Mở repository dự án của bạn trên GitHub.
2. Vào **Settings** ➔ Menu bên trái chọn **Actions** ➔ **Runners** ➔ Bấm **New self-hosted runner**.
3. Chọn hệ điều hành máy tính của bạn (**Windows** hoặc **Linux**).
4. GitHub sẽ hiện các dòng lệnh PowerShell / Bash:
   - Tải file Runner về máy.
   - Giải nén và chạy lệnh config kèm token do GitHub cung cấp:
     ```powershell
     .\config.cmd --url https://github.com/username/repo --token XXXXXXXXXXX
     ```
   - Chạy runner:
     ```powershell
     .\run.cmd
     # Hoặc cài đặt thành Windows Service chạy ngầm vĩnh viễn:
     .\svc.cmd install
     .\svc.cmd start
     ```
5. **Kiểm tra hoạt động:**
   - Mỗi khi bạn thực hiện `git push` lên nhánh `main`, GitHub sẽ gửi lệnh xuống Runner trên máy tính của bạn.
   - Máy tính tự động thực thi:
     1. Kéo mã nguồn mới nhất.
     2. Tự động kiểm tra file `.env`.
     3. Chạy `docker compose up -d --build` cập nhật cả Frontend (port 7173), Backend (port 8080) và PostgreSQL.
     4. Tự động xóa các Docker image cũ để tiết kiệm dung lượng ổ cứng.
