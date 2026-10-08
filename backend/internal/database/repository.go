package database

import (
	"errors"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"fin-tracker-backend/internal/auth"
	"fin-tracker-backend/internal/model"
)

type Repository struct {
	db     *gorm.DB
	driver string
}

func NewRepository(db *gorm.DB, driver string) *Repository {
	repo := &Repository{
		db:     db,
		driver: driver,
	}
	// Seed tài khoản mặc định (Admin & Demo) nếu database mới
	if err := repo.SeedInitialUsers(); err != nil {
		log.Printf("[Repository] Warning seeding users: %v", err)
	}
	return repo
}

// WithTransaction runs any arbitrary logic inside an ACID database transaction
func (r *Repository) WithTransaction(fn func(tx *gorm.DB) error) error {
	return r.db.Transaction(fn)
}

// ==================== USER MANAGEMENT ====================

// SeedInitialUsers tạo tài khoản admin và demo user nếu chưa tồn tại
func (r *Repository) SeedInitialUsers() error {
	var count int64
	if err := r.db.Model(&model.UserEntity{}).Count(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		log.Printf("[Repository] 👤 Seeding initial Admin and Demo user accounts...")
		adminPass, _ := auth.HashPassword("admin123")
		admin := model.UserEntity{
			ID:           "usr-admin",
			Username:     "admin",
			Email:        "admin@fintracker.vn",
			PasswordHash: adminPass,
			FullName:     "Hệ Thống Quản Trị",
			Role:         "admin",
			Avatar:       "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		userPass, _ := auth.HashPassword("user123")
		demoUser := model.UserEntity{
			ID:           "usr-demo",
			Username:     "demo",
			Email:        "demo@fintracker.vn",
			PasswordHash: userPass,
			FullName:     "Nhà Đầu Tư Mẫu",
			Role:         "user",
			Avatar:       "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		if err := r.db.Create(&admin).Error; err != nil {
			return err
		}
		if err := r.db.Create(&demoUser).Error; err != nil {
			return err
		}

		// Tạo cấu hình thông báo mặc định
		_ = r.UpsertNotificationSettings(&model.UserNotificationSettingsEntity{
			UserID:                  admin.ID,
			EnablePriceAlerts:       true,
			EnableVolatilityAlerts:  true,
			EnableTransactionAlerts: true,
			EnableSound:             true,
			MinChangePercent:        2.0,
			WatchedAssets:           "ALL",
		})
		_ = r.UpsertNotificationSettings(&model.UserNotificationSettingsEntity{
			UserID:                  demoUser.ID,
			EnablePriceAlerts:       true,
			EnableVolatilityAlerts:  true,
			EnableTransactionAlerts: true,
			EnableSound:             true,
			MinChangePercent:        2.0,
			WatchedAssets:           "ALL",
		})

		// Tạo thông báo chào mừng ban đầu
		_ = r.CreateNotification(&model.NotificationEntity{
			ID:        "notif-welcome-" + demoUser.ID,
			UserID:    demoUser.ID,
			Title:     "Chào mừng đến với FinTracker Pro v2.0!",
			Message:   "Tài khoản của bạn đã được khởi tạo thành công. Bạn có thể thêm giao dịch vào sổ cái và tùy biến cảnh báo giá theo ý muốn.",
			Type:      "SYSTEM",
			IsRead:    false,
			CreatedAt: time.Now(),
		})

		log.Printf("[Repository] ✅ Initial accounts seeded: admin (admin/admin123), demo (demo/user123)")
	}
	return nil
}

func (r *Repository) CreateUser(u *model.UserEntity) error {
	return r.db.Create(u).Error
}

func (r *Repository) GetUserByID(id string) (*model.UserEntity, error) {
	var user model.UserEntity
	if err := r.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetUserByUsernameOrEmail(identifier string) (*model.UserEntity, error) {
	var user model.UserEntity
	if err := r.db.Where("username = ? OR email = ?", identifier, identifier).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *Repository) GetAllUsers() ([]model.AdminUserSummary, error) {
	var users []model.UserEntity
	if err := r.db.Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, err
	}

	summaries := make([]model.AdminUserSummary, len(users))
	for i, u := range users {
		var txCount int64
		r.db.Model(&model.TransactionEntity{}).Where("user_id = ?", u.ID).Count(&txCount)

		var alertCount int64
		r.db.Model(&model.PriceAlertEntity{}).Where("user_id = ?", u.ID).Count(&alertCount)

		summaries[i] = model.AdminUserSummary{
			User: model.User{
				ID:        u.ID,
				Username:  u.Username,
				Email:     u.Email,
				FullName:  u.FullName,
				Role:      u.Role,
				Avatar:    u.Avatar,
				CreatedAt: u.CreatedAt,
			},
			TransactionCount: txCount,
			AlertCount:       alertCount,
			LastActive:       u.UpdatedAt,
		}
	}
	return summaries, nil
}

func (r *Repository) UpdateUser(u *model.UserEntity) error {
	return r.db.Save(u).Error
}

func (r *Repository) UpdateUserRole(id, role string) error {
	if role != "admin" && role != "user" {
		return errors.New("invalid role")
	}
	return r.db.Model(&model.UserEntity{}).Where("id = ?", id).Update("role", role).Error
}

func (r *Repository) DeleteUser(id string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		_ = tx.Where("user_id = ?", id).Delete(&model.TransactionEntity{}).Error
		_ = tx.Where("user_id = ?", id).Delete(&model.PriceAlertEntity{}).Error
		_ = tx.Where("user_id = ?", id).Delete(&model.NotificationEntity{}).Error
		_ = tx.Where("user_id = ?", id).Delete(&model.UserNotificationSettingsEntity{}).Error
		return tx.Where("id = ?", id).Delete(&model.UserEntity{}).Error
	})
}

func (r *Repository) GetAdminStats() (*model.AdminStats, error) {
	var totalUsers, totalAdmins, totalRegularUsers, totalTransactions, totalAlerts int64

	r.db.Model(&model.UserEntity{}).Count(&totalUsers)
	r.db.Model(&model.UserEntity{}).Where("role = ?", "admin").Count(&totalAdmins)
	r.db.Model(&model.UserEntity{}).Where("role = ?", "user").Count(&totalRegularUsers)
	r.db.Model(&model.TransactionEntity{}).Count(&totalTransactions)
	r.db.Model(&model.PriceAlertEntity{}).Where("is_active = ?", true).Count(&totalAlerts)

	return &model.AdminStats{
		TotalUsers:        totalUsers,
		TotalAdmins:       totalAdmins,
		TotalRegularUsers: totalRegularUsers,
		TotalTransactions: totalTransactions,
		TotalPriceAlerts:  totalAlerts,
		DatabaseDriver:    r.driver,
		ServerTime:        time.Now(),
	}, nil
}

// ==================== USER NOTIFICATION PREFERENCES ====================

func (r *Repository) GetNotificationSettings(userID string) (*model.UserNotificationSettingsEntity, error) {
	var settings model.UserNotificationSettingsEntity
	err := r.db.First(&settings, "user_id = ?", userID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Tạo cài đặt mặc định nếu chưa có
			defaultSettings := model.UserNotificationSettingsEntity{
				UserID:                  userID,
				EnablePriceAlerts:       true,
				EnableVolatilityAlerts:  true,
				EnableTransactionAlerts: true,
				EnableSound:             true,
				MinChangePercent:        2.0,
				WatchedAssets:           "ALL",
			}
			_ = r.db.Create(&defaultSettings)
			return &defaultSettings, nil
		}
		return nil, err
	}
	return &settings, nil
}

func (r *Repository) UpsertNotificationSettings(settings *model.UserNotificationSettingsEntity) error {
	settings.UpdatedAt = time.Now()
	return r.db.Save(settings).Error
}

// ==================== NOTIFICATIONS INBOX ====================

func (r *Repository) CreateNotification(n *model.NotificationEntity) error {
	if n.ID == "" {
		n.ID = fmt.Sprintf("notif-%d", time.Now().UnixNano())
	}
	if n.CreatedAt.IsZero() {
		n.CreatedAt = time.Now()
	}
	return r.db.Create(n).Error
}

func (r *Repository) GetNotifications(userID string, limit int) ([]model.Notification, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var entities []model.NotificationEntity
	err := r.db.Where("user_id = ? OR user_id = 'ALL'", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&entities).Error
	if err != nil {
		return nil, err
	}

	notifs := make([]model.Notification, len(entities))
	for i, e := range entities {
		notifs[i] = model.Notification{
			ID:        e.ID,
			UserID:    e.UserID,
			Title:     e.Title,
			Message:   e.Message,
			Type:      e.Type,
			Data:      e.Data,
			IsRead:    e.IsRead,
			CreatedAt: e.CreatedAt,
		}
	}
	return notifs, nil
}

func (r *Repository) GetUnreadNotificationCount(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.NotificationEntity{}).
		Where("(user_id = ? OR user_id = 'ALL') AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (r *Repository) MarkNotificationRead(id, userID string) error {
	return r.db.Model(&model.NotificationEntity{}).
		Where("id = ? AND (user_id = ? OR user_id = 'ALL')", id, userID).
		Update("is_read", true).Error
}

func (r *Repository) MarkAllNotificationsRead(userID string) error {
	return r.db.Model(&model.NotificationEntity{}).
		Where("user_id = ? OR user_id = 'ALL'", userID).
		Update("is_read", true).Error
}

func (r *Repository) DeleteNotification(id, userID string) error {
	return r.db.Where("id = ? AND (user_id = ? OR user_id = 'ALL')", id, userID).
		Delete(&model.NotificationEntity{}).Error
}

// ==================== TRANSACTIONS ====================

func (r *Repository) GetTransactions() ([]model.Transaction, error) {
	return r.GetTransactionsByUser("")
}

func (r *Repository) GetTransactionsByUser(userID string) ([]model.Transaction, error) {
	var entities []model.TransactionEntity
	query := r.db.Order("transaction_date DESC, created_at DESC")
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	err := query.Find(&entities).Error
	if err != nil {
		return nil, err
	}

	txs := make([]model.Transaction, len(entities))
	for i, e := range entities {
		txs[i] = model.Transaction{
			ID:              e.ID,
			UserID:          e.UserID,
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
		UserID:          tx.UserID,
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

	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Create(&entity).Error
	})
}

func (r *Repository) DeleteTransaction(id string) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		return dbTx.Delete(&model.TransactionEntity{}, "id = ?", id).Error
	})
}

func (r *Repository) DeleteTransactionForUser(id, userID string) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		query := dbTx.Where("id = ?", id)
		if userID != "" {
			query = query.Where("user_id = ?", userID)
		}
		res := query.Delete(&model.TransactionEntity{})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errors.New("transaction not found or not owned by user")
		}
		return nil
	})
}

func (r *Repository) ClearTransactions() error {
	return r.ClearTransactionsByUser("")
}

func (r *Repository) ClearTransactionsByUser(userID string) error {
	return r.db.Transaction(func(dbTx *gorm.DB) error {
		if userID != "" {
			return dbTx.Where("user_id = ?", userID).Delete(&model.TransactionEntity{}).Error
		}
		return dbTx.Exec("DELETE FROM transactions").Error
	})
}

// ==================== PRICE ALERTS ====================

func (r *Repository) GetAlerts() ([]model.PriceAlert, error) {
	return r.GetAlertsByUser("")
}

func (r *Repository) GetAlertsByUser(userID string) ([]model.PriceAlert, error) {
	var entities []model.PriceAlertEntity
	query := r.db.Order("created_at DESC")
	if userID != "" {
		query = query.Where("user_id = ? OR user_id = ''", userID)
	}

	err := query.Find(&entities).Error
	if err != nil {
		return nil, err
	}

	alerts := make([]model.PriceAlert, len(entities))
	for i, e := range entities {
		alerts[i] = model.PriceAlert{
			ID:          e.ID,
			UserID:      e.UserID,
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
		UserID:      alt.UserID,
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

func (r *Repository) DeleteAlertForUser(id, userID string) error {
	query := r.db.Where("id = ?", id)
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	res := query.Delete(&model.PriceAlertEntity{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("alert not found or not owned by user")
	}
	return nil
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
