# ========================================================
# Stage 1: Build binary với Golang Alpine tối ưu
# ========================================================
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Cài đặt chứng chỉ gốc và múi giờ
RUN apk add --no-cache ca-certificates git tzdata

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Sao chép mã nguồn backend
COPY . .

# Biên dịch tĩnh siêu nhẹ không phụ thuộc thư viện C bên ngoài
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# ========================================================
# Stage 2: Runtime image siêu nhỏ gọn (~20MB)
# ========================================================
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone

# Sao chép binary từ builder stage
COPY --from=builder /app/server /app/server
COPY migrations /app/migrations

# Tạo thư mục lưu data SQLite fallback nếu cần
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["/app/server"]
