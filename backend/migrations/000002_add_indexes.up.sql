-- ========================================================
-- Migration: 000002_add_indexes.up.sql
-- Description: Add performance indexes for high-throughput queries
-- ========================================================

-- Tối ưu hóa truy vấn lịch sử giao dịch và danh mục
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);

-- Tối ưu hóa kiểm tra cảnh báo giá realtime
CREATE INDEX IF NOT EXISTS idx_alerts_active_symbol ON price_alerts(is_active, symbol);

-- Tối ưu hóa lấy nến OHLCV theo mốc thời gian
CREATE INDEX IF NOT EXISTS idx_candles_asset_time ON candle_history(asset_id, time DESC);

-- Tối ưu hóa lọc theo loại tài sản
CREATE INDEX IF NOT EXISTS idx_live_assets_type ON live_assets(asset_type);
