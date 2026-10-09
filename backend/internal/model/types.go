package model

import "time"

// AssetType represents the category of the financial asset
type AssetType string

const (
	AssetTypeGoldVN    AssetType = "GOLD_VN"
	AssetTypeGoldWorld AssetType = "GOLD_WORLD"
	AssetTypeStockVN   AssetType = "STOCK_VN"
	AssetTypeStockUS   AssetType = "STOCK_US"
	AssetTypeCrypto    AssetType = "CRYPTO"
	AssetTypeCash      AssetType = "CASH"
)

// Asset represents a tradable instrument or tracked asset
type Asset struct {
	ID            string    `json:"id"`             // e.g. "XAU-SJC", "VN-VCB", "US-AAPL", "BTC-USD"
	Symbol        string    `json:"symbol"`         // "SJC", "VCB", "AAPL", "BTC"
	Name          string    `json:"name"`           // "Vàng miếng SJC", "Vietcombank", "Apple Inc."
	AssetType     AssetType `json:"asset_type"`     // GOLD_VN, STOCK_VN, etc.
	Currency      string    `json:"currency"`       // "VND", "USD"
	Exchange      string    `json:"exchange"`       // "SJC", "HOSE", "NASDAQ", "BINANCE"
	CurrentPrice  float64   `json:"current_price"`  // Giá hiện tại
	ChangeAmount  float64   `json:"change_amount"`  // Tăng/giảm so với tham chiếu
	ChangePercent float64   `json:"change_percent"` // % Tăng/giảm
	High24h       float64   `json:"high_24h"`       // Giá cao nhất 24h
	Low24h        float64   `json:"low_24h"`        // Giá thấp nhất 24h
	Volume        float64   `json:"volume"`         // Khối lượng giao dịch
	UpdatedAt     time.Time `json:"updated_at"`     // Thời gian cập nhật
}

// GoldDetail represents domestic gold brands comparison
type GoldDetail struct {
	ID        string    `json:"id"`         // e.g. "sjc-hanoi"
	Brand     string    `json:"brand"`      // "SJC", "DOJI", "PNJ", "Bảo Tín Minh Châu", "Vàng Nhẫn 9999"
	City      string    `json:"city"`       // "Hà Nội", "TP.HCM", "Đà Nẵng"
	BuyPrice  float64   `json:"buy_price"`  // Giá mua vào (triệu VND/lượng)
	SellPrice float64   `json:"sell_price"` // Giá bán ra (triệu VND/lượng)
	Spread    float64   `json:"spread"`     // Chênh lệch mua - bán
	Unit      string    `json:"unit"`       // "triệu VND/lượng"
	UpdatedAt time.Time `json:"updated_at"`
}

// Candle represents an OHLCV candlestick point in time
type Candle struct {
	Timestamp int64   `json:"time"` // Unix timestamp in seconds
	Open      float64 `json:"open"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	Close     float64 `json:"close"`
	Volume    float64 `json:"volume"`
}

// Transaction represents a buy/sell or dividend action
type Transaction struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id,omitempty"`
	PortfolioID     string    `json:"portfolio_id"`
	AssetID         string    `json:"asset_id"`
	AssetSymbol     string    `json:"asset_symbol"`
	AssetName       string    `json:"asset_name"`
	Type            string    `json:"type"` // "BUY", "SELL", "DIVIDEND"
	Quantity        float64   `json:"quantity"`
	Price           float64   `json:"price"` // Giá mua/bán hoặc giá trị cổ tức/đơn vị
	Fee             float64   `json:"fee"`
	Tax             float64   `json:"tax"`
	TotalAmount     float64   `json:"total_amount"` // Tổng tiền
	TransactionDate time.Time `json:"transaction_date"`
	Notes           string    `json:"notes"`
}

// Holding represents aggregated position for an asset
type Holding struct {
	AssetID            string  `json:"asset_id"`
	Symbol             string  `json:"symbol"`
	Name               string  `json:"name"`
	AssetType          string  `json:"asset_type"`
	Currency           string  `json:"currency"`
	TotalQuantity      float64 `json:"total_quantity"`
	AvgBuyPrice        float64 `json:"avg_buy_price"`       // Giá vốn bình quân (DCA)
	CurrentPrice       float64 `json:"current_price"`       // Giá thị trường hiện tại
	TotalCost          float64 `json:"total_cost"`          // Tổng vốn đầu tư
	CurrentValue       float64 `json:"current_value"`       // Giá trị thị trường hiện tại
	UnrealizedPnL      float64 `json:"unrealized_pnl"`      // Lợi nhuận chưa chốt (VND hoặc USD)
	UnrealizedPnLRate  float64 `json:"unrealized_pnl_rate"` // % Lãi/lỗ
	DividendsCollected float64 `json:"dividends_collected"` // Cổ tức/lợi tức đã nhận
	PortfolioWeight    float64 `json:"portfolio_weight"`    // % Chiếm trong danh mục
}

// PortfolioSummary represents the complete net worth & allocation
type PortfolioSummary struct {
	IsGuest            bool               `json:"is_guest,omitempty"`
	UserID             string             `json:"user_id,omitempty"`
	TotalNetWorth      float64            `json:"total_net_worth"`      // Tổng tài sản ròng (quy đổi VND)
	TotalCostBasis     float64            `json:"total_cost_basis"`     // Tổng giá vốn đầu tư
	TotalUnrealizedPnL float64            `json:"total_unrealized_pnl"` // Lãi/lỗ ròng
	TotalPnLRate       float64            `json:"total_pnl_rate"`       // Tỷ suất sinh lời tổng (%)
	TotalDividends     float64            `json:"total_dividends"`      // Tổng lợi tức/cổ tức thu về
	EstimatedYield     float64            `json:"estimated_yield"`      // Tỷ suất cổ tức/lợi tức ước tính năm (%)
	AssetAllocation    map[string]float64 `json:"asset_allocation"`     // Phân bổ tỷ trọng (GOLD, STOCK_VN, STOCK_US, CRYPTO, CASH)
	Holdings           []Holding          `json:"holdings"`
	RecentTransactions []Transaction      `json:"recent_transactions"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

// ForecastResult represents predictive analytics for an asset
type ForecastResult struct {
	AssetID              string      `json:"asset_id"`
	Symbol               string      `json:"symbol"`
	Name                 string      `json:"name"`
	CurrentPrice         float64     `json:"current_price"`
	HorizonDays          int         `json:"horizon_days"`      // 7 hoặc 30 ngày
	ExpectedDrift        float64     `json:"expected_drift"`    // Tỷ lệ tăng trưởng kỳ vọng năm (%)
	AnnualVolatility     float64     `json:"annual_volatility"` // Độ biến động lịch sử (%)
	BearTarget           float64     `json:"bear_target"`       // Kịch bản bi quan (10th percentile)
	BaseTarget           float64     `json:"base_target"`       // Kịch bản trung tính (50th percentile)
	BullTarget           float64     `json:"bull_target"`       // Kịch bản lạc quan (90th percentile)
	ConfidenceLow95      float64     `json:"confidence_low_95"`
	ConfidenceHigh95     float64     `json:"confidence_high_95"`
	TrendSignal          string      `json:"trend_signal"`           // "STRONG_BUY", "BUY", "NEUTRAL", "SELL"
	TechnicalScore       float64     `json:"technical_score"`        // Điểm kỹ thuật (0 - 100)
	RSI14                float64     `json:"rsi_14"`                 // RSI hiện tại
	MACDSignal           string      `json:"macd_signal"`            // "BULLISH_CROSS", "BEARISH_CROSS", "NEUTRAL"
	SupportLevels        []float64   `json:"support_levels"`         // Các vùng hỗ trợ mạnh
	ResistanceLevels     []float64   `json:"resistance_levels"`      // Các vùng kháng cự mạnh
	SimulationSampleCone [][]float64 `json:"simulation_sample_cone"` // Các đường mẫu Monte Carlo để vẽ dải nón dự đoán
	GeneratedAt          time.Time   `json:"generated_at"`
}

// MarketSummary represents live ticker & highlighted metrics
type MarketSummary struct {
	GoldVNSpread   float64      `json:"gold_vn_spread"`   // Chênh lệch giá vàng VN so với TG (triệu VND/lượng)
	WorldGoldUSD   float64      `json:"world_gold_usd"`   // Giá vàng thế giới XAU/USD
	USDVNDExchange float64      `json:"usd_vnd_exchange"` // Tỷ giá USD/VND
	VNIndex        float64      `json:"vn_index"`         // Điểm VN-Index
	VNIndexChange  float64      `json:"vn_index_change"`
	SP500          float64      `json:"sp500"`
	SP500Change    float64      `json:"sp500_change"`
	TopGainers     []Asset      `json:"top_gainers"`
	TopLosers      []Asset      `json:"top_losers"`
	FeaturedGold   []GoldDetail `json:"featured_gold"`
	AllAssets      []Asset      `json:"all_assets"`
	LastUpdated    time.Time    `json:"last_updated"`
}

// PriceAlert represents a user alert condition for an asset
type PriceAlert struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id,omitempty"`
	AssetID     string    `json:"asset_id"`
	Symbol      string    `json:"symbol"`
	TargetPrice float64   `json:"target_price"`
	Condition   string    `json:"condition"` // "ABOVE" | "BELOW"
	IsActive    bool      `json:"is_active"`
	IsTriggered bool      `json:"is_triggered"`
	CreatedAt   time.Time `json:"created_at"`
	TriggeredAt time.Time `json:"triggered_at,omitempty"`
}

// DividendEvent represents scheduled or historical dividend distribution
type DividendEvent struct {
	ID             string  `json:"id"`
	AssetID        string  `json:"asset_id"`
	Symbol         string  `json:"symbol"`
	Name           string  `json:"name"`
	ExDate         string  `json:"ex_date"`         // Ngày giao dịch không hưởng quyền
	PayDate        string  `json:"pay_date"`        // Ngày thanh toán
	DividendAmount float64 `json:"dividend_amount"` // Số tiền/CP hoặc % cổ tức
	DividendType   string  `json:"dividend_type"`   // "TIỀN MẶT" | "CỔ PHIẾU"
	YieldPct       float64 `json:"yield_pct"`       // Tỷ suất cổ tức %
	EstimatedCash  float64 `json:"estimated_cash"`  // Ước tính số tiền nhận về dựa trên số lượng CP đang nắm giữ
}

// BenchmarkPoint represents a historical normalized performance point
type BenchmarkPoint struct {
	Date      string  `json:"date"`
	ReturnPct float64 `json:"return_pct"` // % Tăng trưởng so với mốc đầu kỳ
}

// BenchmarkSeries represents comparison dataset across asset classes
type BenchmarkSeries struct {
	ID        string           `json:"id"`
	Name      string           `json:"name"`
	AssetType string           `json:"asset_type"`
	Color     string           `json:"color"`
	Points    []BenchmarkPoint `json:"points"`
}

// ==================== USER MANAGEMENT & AUTH TYPES ====================

// User represents public user information
type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"` // "admin" | "user"
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
}

// RegisterRequest holds registration payload
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

// LoginRequest holds login payload
type LoginRequest struct {
	UsernameOrEmail string `json:"username_or_email"`
	Password        string `json:"password"`
}

// OAuthLoginRequest holds social OAuth payload (Google or Facebook)
type OAuthLoginRequest struct {
	Provider   string `json:"provider"`    // "google" | "facebook"
	Email      string `json:"email"`       // user email address
	FullName   string `json:"full_name"`   // user display name
	Avatar     string `json:"avatar"`      // profile avatar URL
	ProviderID string `json:"provider_id"` // unique user ID from provider
	Token      string `json:"token"`       // client token
}

// OAuthProviderInfo represents supported OAuth provider
type OAuthProviderInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Enabled     bool   `json:"enabled"`
	Description string `json:"description"`
}

// AuthResponse holds JWT token and user info
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UpdateProfileRequest holds profile update payload
type UpdateProfileRequest struct {
	FullName string `json:"full_name"`
	Avatar   string `json:"avatar"`
	Password string `json:"password,omitempty"` // Tùy chọn đổi mật khẩu mới
}

// UpdateRoleRequest holds admin role change payload
type UpdateRoleRequest struct {
	Role string `json:"role"` // "admin" | "user"
}

// AdminUserSummary represents user with statistics for admin dashboard
type AdminUserSummary struct {
	User             User      `json:"user"`
	TransactionCount int64     `json:"transaction_count"`
	AlertCount       int64     `json:"alert_count"`
	LastActive       time.Time `json:"last_active"`
}

// AdminStats represents system overview stats
type AdminStats struct {
	TotalUsers        int64     `json:"total_users"`
	TotalAdmins       int64     `json:"total_admins"`
	TotalRegularUsers int64     `json:"total_regular_users"`
	TotalTransactions int64     `json:"total_transactions"`
	TotalPriceAlerts  int64     `json:"total_price_alerts"`
	DatabaseDriver    string    `json:"database_driver"`
	ServerTime        time.Time `json:"server_time"`
}

// ==================== NOTIFICATION TYPES ====================

// Notification represents an in-app notification delivered to a user
type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // "PRICE_ALERT" | "VOLATILITY" | "TRANSACTION" | "SYSTEM"
	Data      string    `json:"data,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// NotificationSettings represents customer preferences for notifications
type NotificationSettings struct {
	UserID                  string    `json:"user_id"`
	EnablePriceAlerts       bool      `json:"enable_price_alerts"`
	EnableVolatilityAlerts  bool      `json:"enable_volatility_alerts"`
	EnableTransactionAlerts bool      `json:"enable_transaction_alerts"`
	EnableSound             bool      `json:"enable_sound"`
	MinChangePercent        float64   `json:"min_change_percent"`
	WatchedAssets           string    `json:"watched_assets"`
	UpdatedAt               time.Time `json:"updated_at"`
}

// UpdateNotificationSettingsRequest holds settings update payload
type UpdateNotificationSettingsRequest struct {
	EnablePriceAlerts       *bool    `json:"enable_price_alerts,omitempty"`
	EnableVolatilityAlerts  *bool    `json:"enable_volatility_alerts,omitempty"`
	EnableTransactionAlerts *bool    `json:"enable_transaction_alerts,omitempty"`
	EnableSound             *bool    `json:"enable_sound,omitempty"`
	MinChangePercent        *float64 `json:"min_change_percent,omitempty"`
	WatchedAssets           *string  `json:"watched_assets,omitempty"`
}
