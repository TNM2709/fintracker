export type AssetType = 'GOLD_VN' | 'GOLD_WORLD' | 'STOCK_VN' | 'STOCK_US' | 'CRYPTO' | 'CASH';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_type: AssetType;
  currency: string;
  exchange: string;
  current_price: number;
  change_amount: number;
  change_percent: number;
  high_24h: number;
  low_24h: number;
  volume: number;
  updated_at: string;
}

export interface GoldDetail {
  id: string;
  brand: string;
  city: string;
  buy_price: number;
  sell_price: number;
  spread: number;
  unit: string;
  updated_at: string;
}

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  asset_id: string;
  asset_symbol: string;
  asset_name: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  total_amount: number;
  transaction_date: string;
  notes: string;
}

export interface Holding {
  asset_id: string;
  symbol: string;
  name: string;
  asset_type: string;
  currency: string;
  total_quantity: number;
  avg_buy_price: number;
  current_price: number;
  total_cost: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_rate: number;
  dividends_collected: number;
  portfolio_weight: number;
}

export interface PortfolioSummary {
  total_net_worth: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  total_pnl_rate: number;
  total_dividends: number;
  estimated_yield: number;
  asset_allocation: Record<string, number>;
  holdings: Holding[];
  recent_transactions: Transaction[];
  updated_at: string;
}

export interface ForecastResult {
  asset_id: string;
  symbol: string;
  name: string;
  current_price: number;
  horizon_days: number;
  expected_drift: number;
  annual_volatility: number;
  bear_target: number;
  base_target: number;
  bull_target: number;
  confidence_low_95: number;
  confidence_high_95: number;
  trend_signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL';
  technical_score: number;
  rsi_14: number;
  macd_signal: string;
  support_levels: number[];
  resistance_levels: number[];
  simulation_sample_cone: number[][];
  generated_at: string;
}

export interface MarketSummary {
  gold_vn_spread: number;
  world_gold_usd: number;
  usd_vnd_exchange: number;
  vn_index: number;
  vn_index_change: number;
  sp500: number;
  sp500_change: number;
  top_gainers: Asset[];
  top_losers: Asset[];
  featured_gold: GoldDetail[];
  all_assets: Asset[];
  last_updated: string;
}

export interface PriceAlert {
  id: string;
  asset_id: string;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
  is_active: boolean;
  is_triggered: boolean;
  created_at: string;
  triggered_at?: string;
}

export interface DividendEvent {
  id: string;
  asset_id: string;
  symbol: string;
  name: string;
  ex_date: string;
  pay_date: string;
  dividend_amount: number;
  dividend_type: string;
  yield_pct: number;
  estimated_cash: number;
}

export interface BenchmarkPoint {
  date: string;
  return_pct: number;
}

export interface BenchmarkSeries {
  id: string;
  name: string;
  asset_type: string;
  color: string;
  points: BenchmarkPoint[];
}

export interface GoldCalculatorResult {
  quantity_luong: number;
  quantity_chi: number;
  quantity_grams: number;
  sjc_buy_price_lg: number;
  sjc_sell_price_lg: number;
  total_buy_cost: number;
  total_sell_value: number;
  total_spread_vnd: number;
  world_equiv_value: number;
  domestic_premium: number;
  premium_pct: number;
  gold_price_per_chi: string;
}

export interface PortfolioAnalytics {
  health_score: number;
  risk_profile: string;
  diversification_grade: string;
  hhi_index: number;
  estimated_annual_yield: number;
  estimated_sharpe_ratio: number;
  rebalance_tips: string[];
  strength_points: string[];
  risk_warnings: string[];
}

export interface DCAPoint {
  year: number;
  total_deposited: number;
  portfolio_value: number;
  compound_profit: number;
  bank_value: number;
}

export interface DCASimulationResult {
  monthly_investment: number;
  years: number;
  expected_annual_roi: number;
  total_deposited: number;
  final_asset_value: number;
  final_compound_gain: number;
  final_bank_value: number;
  outperformance: number;
  yearly_points: DCAPoint[];
}
