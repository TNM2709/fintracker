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
  User,
  AuthResponse,
  OAuthLoginRequest,
  OAuthProviderInfo,
  AdminUserSummary,
  AdminStats,
  NotificationItem,
  NotificationSettings,
  UpdateNotificationSettingsPayload,
} from '../types';

const isBrowser = typeof window !== 'undefined';
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || (isBrowser ? `${window.location.origin}/api/v1` : 'http://localhost:8081/api/v1');
const WS_BASE = (import.meta.env.VITE_WS_BASE_URL as string) || (isBrowser ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/ws` : 'ws://localhost:8081/api/v1/ws');


// ==================== AUTH TOKEN HELPERS ====================

const TOKEN_KEY = 'fintracker_auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

// ==================== AUTH APIS ====================

export async function loginApi(usernameOrEmail: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Đăng nhập thất bại');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function registerApi(payload: {
  username: string;
  email: string;
  password: string;
  full_name: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Đăng ký tài khoản thất bại');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function loginWithOAuthApi(payload: OAuthLoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Đăng nhập mạng xã hội thất bại');
  }
  const data: AuthResponse = await res.json();
  setAuthToken(data.token);
  return data;
}

export async function getOAuthProvidersApi(): Promise<{ providers: OAuthProviderInfo[] }> {
  const res = await fetch(`${API_BASE}/auth/oauth/providers`);
  if (!res.ok) {
    return { providers: [] };
  }
  return res.json();
}

export async function getMeApi(): Promise<User> {
  const res = await authFetch(`${API_BASE}/auth/me`);
  if (!res.ok) throw new Error('Không thể lấy thông tin người dùng');
  return res.json();
}

export async function updateProfileApi(payload: {
  full_name?: string;
  avatar?: string;
  password?: string;
}): Promise<User> {
  const res = await authFetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Cập nhật hồ sơ thất bại');
  }
  return res.json();
}

// ==================== ADMIN APIS ====================

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const res = await authFetch(`${API_BASE}/admin/users`);
  if (!res.ok) throw new Error('Không có quyền truy cập trang quản trị');
  return res.json();
}

export async function updateAdminUserRole(id: string, role: 'admin' | 'user'): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${id}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi cập nhật vai trò');
  }
}

export async function deleteAdminUser(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Lỗi xóa người dùng');
  }
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await authFetch(`${API_BASE}/admin/stats`);
  if (!res.ok) throw new Error('Lỗi lấy thống kê quản trị');
  return res.json();
}

// ==================== NOTIFICATION APIS ====================

export async function fetchNotifications(limit = 50): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
  const res = await authFetch(`${API_BASE}/notifications?limit=${limit}`);
  if (!res.ok) throw new Error('Lỗi tải thông báo');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Lỗi đánh dấu đã đọc');
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Lỗi đánh dấu tất cả đã đọc');
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Lỗi xóa thông báo');
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await authFetch(`${API_BASE}/notifications/settings`);
  if (!res.ok) throw new Error('Lỗi tải cài đặt thông báo');
  return res.json();
}

export async function updateNotificationSettings(payload: UpdateNotificationSettingsPayload): Promise<NotificationSettings> {
  const res = await authFetch(`${API_BASE}/notifications/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lỗi cập nhật cài đặt thông báo');
  return res.json();
}

export async function sendTestNotification(): Promise<NotificationItem> {
  const res = await authFetch(`${API_BASE}/notifications/test`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Lỗi gửi thông báo thử nghiệm');
  const data = await res.json();
  return data.notification;
}

// ==================== MARKET & PUBLIC APIS ====================

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
  const res = await authFetch(`${API_BASE}/portfolio/summary`);
  if (!res.ok) throw new Error(`Portfolio fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchPortfolioAnalytics(): Promise<PortfolioAnalytics> {
  const res = await authFetch(`${API_BASE}/portfolio/analytics`);
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
  const res = await authFetch(`${API_BASE}/portfolio/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Thêm giao dịch thất bại: ${res.statusText}`);
  }
  const data = await res.json();
  return data.portfolio;
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/portfolio/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Xóa giao dịch thất bại: ${res.statusText}`);
  }
}

export async function resetPortfolio(): Promise<PortfolioSummary> {
  const res = await authFetch(`${API_BASE}/portfolio/reset`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Đặt lại danh mục thất bại: ${res.statusText}`);
  }
  const data = await res.json();
  return data.portfolio;
}

// Cảnh báo giá
export async function fetchAlerts(): Promise<PriceAlert[]> {
  const res = await authFetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error(`Fetch alerts failed: ${res.statusText}`);
  return res.json();
}

export async function addAlert(alt: Partial<PriceAlert>): Promise<PriceAlert> {
  const res = await authFetch(`${API_BASE}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alt),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Thêm cảnh báo thất bại: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteAlert(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Xóa cảnh báo thất bại: ${res.statusText}`);
  }
}

// So sánh Benchmark
export async function fetchBenchmark(): Promise<BenchmarkSeries[]> {
  const res = await fetch(`${API_BASE}/market/benchmark`);
  if (!res.ok) throw new Error(`Fetch benchmark failed: ${res.statusText}`);
  return res.json();
}

// Lịch cổ tức
export async function fetchDividendCalendar(): Promise<DividendEvent[]> {
  const res = await authFetch(`${API_BASE}/portfolio/dividends`);
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
  private notificationListeners: ((notification: NotificationItem) => void)[] = [];
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
          } else if (payload.type === 'NOTIFICATION_RECEIVED' && payload.notification) {
            this.notificationListeners.forEach((cb) => cb(payload.notification));
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

  public onNotification(callback: (notification: NotificationItem) => void) {
    this.notificationListeners.push(callback);
    return () => {
      this.notificationListeners = this.notificationListeners.filter((l) => l !== callback);
    };
  }

  public getStatus() {
    return this.isConnected;
  }
}
