-- ========================================================
-- Migration: 000001_create_tables.down.sql
-- Description: Drop initial tables
-- ========================================================

DROP TABLE IF EXISTS candle_history;
DROP TABLE IF EXISTS live_assets;
DROP TABLE IF EXISTS price_alerts;
DROP TABLE IF EXISTS transactions;
