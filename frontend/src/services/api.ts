import type {
  MarketSummary,
  PortfolioSummary,
  ForecastResult,
  Candle,
  Transaction,
  PriceAlert,
  DividendEvent,
  BenchmarkSeries,
  GoldCalculatorResult,
  PortfolioAnalytics,
  DCASimulationResult,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || (typeof window !== 'undefined' && window.location.port === '8080' ? '/api/v1' : 'http://localhost:8080/api/v1');
const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string) || (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/api/v1/ws` : 'ws://localhost:8080/api/v1/ws');

export async function fetchMarketSummary(): Promise<MarketSummary> {
  const res = await fetch(`${API_BASE}/market/summary`);
  if (!res.ok) throw new Error(`Market fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchCandles(assetId: string, timeframe = '1D'): Promise<Candle[]> {
  const res = await fetch(`${API_BASE}/market/candles/${assetId}?timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`Candles fetch failed: ${res.statusText}`);
  const data = await res.json();
  return data.candles || [];
}

export async function fetchForecast(assetId: string, horizon = 30): Promise<ForecastResult> {
  const res = await fetch(`${API_BASE}/forecast/${assetId}?horizon=${horizon}`);
  if (!res.ok) throw new Error(`Forecast fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await fetch(`${API_BASE}/portfolio/summary`);
  if (!res.ok) throw new Error(`Portfolio fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  const res = await fetch(`${API_BASE}/portfolio/analytics`);
  if (!res.ok) throw new Error(`Portfolio analytics fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDCASimulator(
  amount = 10000000,
  years = 5,
  roi = 15
): Promise<DCASimulationResult> {
  const res = await fetch(`${API_BASE}/tools/dca-simulator?amount=${amount}&years=${years}&roi=${roi}`);
  if (!res.ok) throw new Error(`DCA simulator fetch failed: ${res.statusText}`);
  return res.json();
}

export async function addTransaction(tx: Partial<Transaction>): Promise<PortfolioSummary> {
  const res = await fetch(`${API_BASE}/portfolio/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error(`Add transaction failed: ${res.statusText}`);
  const data = await res.json();
  return data.portfolio;
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Delete transaction failed: ${res.statusText}`);
}

export async function resetPortfolio(): Promise<PortfolioSummary> {
  const res = await fetch(`${API_BASE}/portfolio/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`Reset portfolio failed: ${res.statusText}`);
  const data = await res.json();
  return data.portfolio;
}

// Cảnh báo giá
export async function fetchAlerts(): Promise<PriceAlert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error(`Fetch alerts failed: ${res.statusText}`);
  return res.json();
}

export async function addAlert(alt: Partial<PriceAlert>): Promise<PriceAlert> {
  const res = await fetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alt),
  });
  if (!res.ok) throw new Error(`Add alert failed: ${res.statusText}`);
  return res.json();
}

export async function deleteAlert(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete alert failed: ${res.statusText}`);
}

// So sánh Benchmark
export async function fetchBenchmark(): Promise<BenchmarkSeries[]> {
  const res = await fetch(`${API_BASE}/market/benchmark`);
  if (!res.ok) throw new Error(`Fetch benchmark failed: ${res.statusText}`);
  return res.json();
}

// Lịch cổ tức
export async function fetchDividendCalendar(): Promise<DividendEvent[]> {
  const res = await fetch(`${API_BASE}/portfolio/dividends`);
  if (!res.ok) throw new Error(`Fetch dividends failed: ${res.statusText}`);
  return res.json();
}

// Công cụ quy đổi vàng
export async function fetchGoldCalculator(luong: number): Promise<GoldCalculatorResult> {
  const res = await fetch(`${API_BASE}/tools/gold-calculator?luong=${luong}`);
  if (!res.ok) throw new Error(`Fetch gold calculator failed: ${res.statusText}`);
  return res.json();
}

// WebSocket Connection Manager
export class RealtimeTickerClient {
  private ws: WebSocket | null = null;
  private listeners: ((summary: MarketSummary) => void)[] = [];
  private alertListeners: ((alert: PriceAlert) => void)[] = [];
  private isConnected = false;
  private reconnectTimer: number | null = null;

  constructor() {
    this.connect();
  }

  public connect() {
    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        this.isConnected = true;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'MARKET_UPDATE' && payload.data) {
            this.listeners.forEach((cb) => cb(payload.data));
          } else if (payload.type === 'ALERT_TRIGGERED' && payload.alert) {
            this.alertListeners.forEach((cb) => cb(payload.alert));
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, 3000);
    }
  }

  public onUpdate(callback: (summary: MarketSummary) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public onAlertTrigger(callback: (alert: PriceAlert) => void) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== callback);
    };
  }

  public getStatus() {
    return this.isConnected;
  }
}
