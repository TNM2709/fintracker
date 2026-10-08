-- ========================================================
-- Migration: 000002_add_indexes.down.sql
-- Description: Drop performance indexes
-- ========================================================

DROP INDEX IF EXISTS idx_live_assets_type;
DROP INDEX IF EXISTS idx_candles_asset_time;
DROP INDEX IF EXISTS idx_alerts_active_symbol;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_asset_id;
DROP INDEX IF EXISTS idx_transactions_portfolio_id;
