# ========================================================
# Stage 1: Build Frontend Assets bằng Node.js 20 Alpine
# ========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Sao chép mã nguồn và cấu hình môi trường
COPY . .

# Build production bundle
RUN npm run build

# ========================================================
# Stage 2: Serve SPA bằng Nginx Alpine trên Port 7173
# ========================================================
FROM nginx:alpine

# Sao chép cấu hình Nginx lắng nghe tại cổng 7173
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép file tĩnh đã build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 7173

CMD ["nginx", "-g", "daemon off;"]
