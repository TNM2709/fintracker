-- ========================================================
-- Migration: 000001_create_tables.up.sql
-- Description: Create initial tables for FinTracker Pro
-- Compatible with PostgreSQL & SQLite
-- ========================================================

-- 1. Bảng lưu trữ giao dịch thực tế của người dùng
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    portfolio_id VARCHAR(64) NOT NULL,
    asset_id VARCHAR(64) NOT NULL,
    asset_symbol VARCHAR(32) NOT NULL,
    asset_name VARCHAR(128) NOT NULL,
    type VARCHAR(16) NOT NULL, -- BUY, SELL, DIVIDEND
    quantity DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    fee DOUBLE PRECISION DEFAULT 0,
    tax DOUBLE PRECISION DEFAULT 0,
    total_amount DOUBLE PRECISION NOT NULL,
    transaction_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng cảnh báo giá tự động
CREATE TABLE IF NOT EXISTS price_alerts (
    id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    condition VARCHAR(16) NOT NULL, -- ABOVE, BELOW
    target_price DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng lưu trữ giá thị trường thực tế (Real-Time Live Asset Cache)
CREATE TABLE IF NOT EXISTS live_assets (
    id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    current_price DOUBLE PRECISION NOT NULL,
    change_amount DOUBLE PRECISION DEFAULT 0,
    change_percent DOUBLE PRECISION DEFAULT 0,
    high_price DOUBLE PRECISION DEFAULT 0,
    low_price DOUBLE PRECISION DEFAULT 0,
    volume DOUBLE PRECISION DEFAULT 0,
    currency VARCHAR(8) NOT NULL,
    source VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng lưu trữ lịch sử nến kỹ thuật OHLCV thực tế
CREATE TABLE IF NOT EXISTS candle_history (
    asset_id VARCHAR(64) NOT NULL,
    time BIGINT NOT NULL,
    open DOUBLE PRECISION NOT NULL,
    high DOUBLE PRECISION NOT NULL,
    low DOUBLE PRECISION NOT NULL,
    close DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (asset_id, time)
);
