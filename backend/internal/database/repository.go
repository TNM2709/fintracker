package database

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"fin-tracker-backend/internal/model"
)

type Repository struct {
	db     *gorm.DB
	driver string
}

func NewRepository(db *gorm.DB, driver string) *Repository {
	return &Repository{
		db:     db,
		driver: driver,
	}
}

// WithTransaction runs any arbitrary logic inside an ACID database transaction
// Automatically commits on success, and rolls back on error or panic!
func (r *Repository) WithTransaction(fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(fn)
}

// ==================== TRANSACTIONS ====================

func (r *Repository) GetTransactions() ([]model.Transaction, error) {
	var entities []model.TransactionEntity
	err := r.db.Order("transaction_date DESC, created_at DESC").Find(&entities).Error
	if err != nil {
		return nil, err
	}

	txs := make([]model.Transaction, len(entities))
	for i, e := range entities {
		txs[i] = model.Transaction{
			ID:              e.ID,
			PortfolioID:     e.PortfolioID,
			AssetID:         e.AssetID,
			AssetSymbol:     e.AssetSymbol,
			AssetName:       e.AssetName,
			Type:            e.Type,
			Quantity:        e.Quantity,
			Price:           e.Price,
			Fee:             e.Fee,
			Tax:             e.Tax,
			TotalAmount:     e.TotalAmount,
			TransactionDate: e.TransactionDate,
			Notes:           e.Notes,
		}
	}
	return txs, nil
}

func (r *Repository) InsertTransaction(tx *model.Transaction) error {
	entity := model.TransactionEntity{
		ID:              tx.ID,
		PortfolioID:     tx.PortfolioID,
		AssetID:         tx.AssetID,
		AssetSymbol:     tx.AssetSymbol,
		AssetName:       tx.AssetName,
		Type:            tx.Type,
		Quantity:        tx.Quantity,
		Price:           tx.Price,
		Fee:             tx.Fee,
		Tax:             tx.Tax,
		TotalAmount:     tx.TotalAmount,
		TransactionDate: tx.TransactionDate,
		Notes:           tx.Notes,
	}

	// Managed ACID Transaction
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Create(&entity).Error
	})
}

func (r *Repository) DeleteTransaction(id string) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Delete(&model.TransactionEntity{}, "id = ?", id).Error
	})
}

func (r *Repository) ClearTransactions() error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Exec("DELETE FROM transactions").Error
	})
}

// ==================== PRICE ALERTS ====================

func (r *Repository) GetAlerts() ([]model.PriceAlert, error) {
	var entities []model.PriceAlertEntity
	err := r.db.Order("created_at DESC").Find(&entities).Error
	if err != nil {
		return nil, err
	}

	alerts := make([]model.PriceAlert, len(entities))
	for i, e := range entities {
		alerts[i] = model.PriceAlert{
			ID:          e.ID,
			AssetID:     e.AssetID,
			Symbol:      e.Symbol,
			Condition:   e.Condition,
			TargetPrice: e.TargetPrice,
			IsActive:    e.IsActive,
			CreatedAt:   e.CreatedAt,
		}
	}
	return alerts, nil
}

func (r *Repository) InsertAlert(alt *model.PriceAlert) error {
	entity := model.PriceAlertEntity{
		ID:          alt.ID,
		AssetID:     alt.AssetID,
		Symbol:      alt.Symbol,
		Condition:   alt.Condition,
		TargetPrice: alt.TargetPrice,
		IsActive:    alt.IsActive,
		CreatedAt:   alt.CreatedAt,
	}
	return r.db.Create(&entity).Error
}

func (r *Repository) DeleteAlert(id string) error {
	return r.db.Delete(&model.PriceAlertEntity{}, "id = ?", id).Error
}

func (r *Repository) UpdateAlertTriggered(id string, triggered bool) error {
	return r.db.Model(&model.PriceAlertEntity{}).
		Where("id = ?", id).
		Update("is_active", !triggered).Error
}

// ==================== REAL-TIME ASSETS CACHE ====================

func (r *Repository) UpsertLiveAsset(a model.Asset, source string) error {
	entity := model.LiveAssetEntity{
		ID:            a.ID,
		Symbol:        a.Symbol,
		Name:          a.Name,
		AssetType:     string(a.AssetType),
		CurrentPrice:  a.CurrentPrice,
		ChangeAmount:  a.ChangeAmount,
		ChangePercent: a.ChangePercent,
		HighPrice:     a.High24h,
		LowPrice:      a.Low24h,
		Volume:        a.Volume,
		Currency:      a.Currency,
		Source:        source,
		UpdatedAt:     time.Now(),
	}

	return r.db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&entity).Error
}

func (r *Repository) GetLiveAssets() ([]model.Asset, error) {
	var entities []model.LiveAssetEntity
	err := r.db.Order("id ASC").Find(&entities).Error
	if err != nil {
		return nil, err
	}

	assets := make([]model.Asset, len(entities))
	for i, e := range entities {
		assets[i] = model.Asset{
			ID:            e.ID,
			Symbol:        e.Symbol,
			Name:          e.Name,
			AssetType:     model.AssetType(e.AssetType),
			CurrentPrice:  e.CurrentPrice,
			ChangeAmount:  e.ChangeAmount,
			ChangePercent: e.ChangePercent,
			High24h:       e.HighPrice,
			Low24h:        e.LowPrice,
			Volume:        e.Volume,
			Currency:      e.Currency,
			UpdatedAt:     e.UpdatedAt,
		}
	}
	return assets, nil
}

// ==================== OHLCV CANDLES HISTORY ====================

func (r *Repository) SaveCandles(assetID string, candles []model.Candle) error {
	if len(candles) == 0 {
		return nil
	}

	entities := make([]model.CandleHistoryEntity, len(candles))
	for i, c := range candles {
		entities[i] = model.CandleHistoryEntity{
			AssetID: assetID,
			Time:    c.Timestamp,
			Open:    c.Open,
			High:    c.High,
			Low:     c.Low,
			Close:   c.Close,
			Volume:  c.Volume,
		}
	}

	// Managed ACID Transaction with conflict resolution
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).CreateInBatches(entities, 100).Error
	})
}

func (r *Repository) GetCandles(assetID string, limit int) ([]model.Candle, error) {
	var entities []model.CandleHistoryEntity
	err := r.db.Where("asset_id = ?", assetID).
		Order("time ASC").
		Limit(limit).
		Find(&entities).Error
	if err != nil {
		return nil, err
	}

	candles := make([]model.Candle, len(entities))
	for i, e := range entities {
		candles[i] = model.Candle{
			Timestamp: e.Time,
			Open:      e.Open,
			High:      e.High,
			Low:       e.Low,
			Close:     e.Close,
			Volume:    e.Volume,
		}
	}
	return candles, nil
}
