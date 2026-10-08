package model

import "time"

// TransactionEntity represents database record for transactions
type TransactionEntity struct {
	ID              string    `gorm:"primaryKey;size:64" json:"id"`
	PortfolioID     string    `gorm:"index;size:64;not null" json:"portfolio_id"`
	AssetID         string    `gorm:"index;size:64;not null" json:"asset_id"`
	AssetSymbol     string    `gorm:"size:32;not null" json:"asset_symbol"`
	AssetName       string    `gorm:"size:128;not null" json:"asset_name"`
	Type            string    `gorm:"size:16;not null" json:"type"` // BUY, SELL, DIVIDEND
	Quantity        float64   `gorm:"not null" json:"quantity"`
	Price           float64   `gorm:"not null" json:"price"`
	Fee             float64   `gorm:"default:0" json:"fee"`
	Tax             float64   `gorm:"default:0" json:"tax"`
	TotalAmount     float64   `gorm:"not null" json:"total_amount"`
	TransactionDate time.Time `gorm:"index;not null" json:"transaction_date"`
	Notes           string    `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (TransactionEntity) TableName() string {
	return "transactions"
}

// PriceAlertEntity represents database record for price threshold alerts
type PriceAlertEntity struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	AssetID     string    `gorm:"size:64;not null" json:"asset_id"`
	Symbol      string    `gorm:"index:idx_symbol_active;size:32;not null" json:"symbol"`
	Condition   string    `gorm:"size:16;not null" json:"condition"`
	TargetPrice float64   `gorm:"not null" json:"target_price"`
	IsActive    bool      `gorm:"index:idx_symbol_active;default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}

func (PriceAlertEntity) TableName() string {
	return "price_alerts"
}

// LiveAssetEntity represents cached real-time market assets
type LiveAssetEntity struct {
	ID            string    `gorm:"primaryKey;size:64" json:"id"`
	Symbol        string    `gorm:"size:32;not null" json:"symbol"`
	Name          string    `gorm:"size:128;not null" json:"name"`
	AssetType     string    `gorm:"index;size:32;not null" json:"asset_type"`
	CurrentPrice  float64   `gorm:"not null" json:"current_price"`
	ChangeAmount  float64   `gorm:"default:0" json:"change_amount"`
	ChangePercent float64   `gorm:"default:0" json:"change_percent"`
	HighPrice     float64   `gorm:"default:0" json:"high_price"`
	LowPrice      float64   `gorm:"default:0" json:"low_price"`
	Volume        float64   `gorm:"default:0" json:"volume"`
	Currency      string    `gorm:"size:8;not null" json:"currency"`
	Source        string    `gorm:"size:64;not null" json:"source"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

func (LiveAssetEntity) TableName() string {
	return "live_assets"
}

// CandleHistoryEntity represents historical candlestick bars
type CandleHistoryEntity struct {
	AssetID string  `gorm:"primaryKey;size:64;index:idx_asset_time" json:"asset_id"`
	Time    int64   `gorm:"primaryKey;index:idx_asset_time" json:"time"`
	Open    float64 `gorm:"not null" json:"open"`
	High    float64 `gorm:"not null" json:"high"`
	Low     float64 `gorm:"not null" json:"low"`
	Close   float64 `gorm:"not null" json:"close"`
	Volume  float64 `gorm:"not null" json:"volume"`
}

func (CandleHistoryEntity) TableName() string {
	return "candle_history"
}
