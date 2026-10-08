-- ========================================================
-- Migration: 000003_add_users_and_notifications.up.sql
-- Description: Create users, notification settings, and notifications tables
-- ========================================================

-- 1. Bảng quản lý người dùng
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(128),
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    avatar VARCHAR(256),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Bảng cấu hình tùy biến thông báo theo người dùng
CREATE TABLE IF NOT EXISTS user_notification_settings (
    user_id VARCHAR(64) PRIMARY KEY,
    enable_price_alerts BOOLEAN DEFAULT TRUE,
    enable_volatility_alerts BOOLEAN DEFAULT TRUE,
    enable_transaction_alerts BOOLEAN DEFAULT TRUE,
    enable_sound BOOLEAN DEFAULT TRUE,
    min_change_percent DOUBLE PRECISION DEFAULT 2.0,
    watched_assets TEXT DEFAULT 'ALL',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng lưu trữ hộp thư thông báo
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    title VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL,
    data TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- 4. Thêm cột user_id vào transactions và price_alerts nếu chưa tồn tại
-- Lưu ý: SQLite & PostgreSQL đều tương thích cú pháp ADD COLUMN
ALTER TABLE transactions ADD COLUMN user_id VARCHAR(64) DEFAULT '';
ALTER TABLE price_alerts ADD COLUMN user_id VARCHAR(64) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON price_alerts(user_id);
