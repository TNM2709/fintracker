package notification

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"strings"
	"sync"
	"time"

	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/model"
)

type NotificationListener func(notification model.Notification)

type Service struct {
	mu           sync.RWMutex
	repo         *database.Repository
	listeners    []NotificationListener
	volatilityMu sync.Mutex
	lastVolAlert map[string]time.Time // Ngăn spam cảnh báo biến động cho cùng 1 mã trong 10 phút
}

func NewService(repo *database.Repository) *Service {
	return &Service{
		repo:         repo,
		listeners:    []NotificationListener{},
		lastVolAlert: make(map[string]time.Time),
	}
}

// RegisterListener đăng ký hook để đẩy thông báo realtime ra WebSocket Hub
func (s *Service) RegisterListener(l NotificationListener) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.listeners = append(s.listeners, l)
}

func (s *Service) broadcast(notif model.Notification) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, listener := range s.listeners {
		listener(notif)
	}
}

// SendNotification kiểm tra tùy biến của người dùng và lưu/phát thông báo
func (s *Service) SendNotification(userID, title, message, notifType, data string) (*model.Notification, error) {
	if s.repo == nil {
		return nil, nil
	}

	// 1. Kiểm tra cấu hình tùy biến thông báo của người dùng
	if userID != "" && userID != "ALL" {
		settings, err := s.repo.GetNotificationSettings(userID)
		if err == nil && settings != nil {
			switch notifType {
			case "PRICE_ALERT":
				if !settings.EnablePriceAlerts {
					return nil, nil // Người dùng tắt thông báo giá
				}
			case "VOLATILITY":
				if !settings.EnableVolatilityAlerts {
					return nil, nil // Người dùng tắt thông báo biến động
				}
			case "TRANSACTION":
				if !settings.EnableTransactionAlerts {
					return nil, nil // Người dùng tắt thông báo giao dịch
				}
			}
		}
	}

	entity := model.NotificationEntity{
		ID:        fmt.Sprintf("notif-%d", time.Now().UnixNano()),
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      notifType,
		Data:      data,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateNotification(&entity); err != nil {
		log.Printf("[Notification] Error creating notification: %v", err)
		return nil, err
	}

	notif := model.Notification{
		ID:        entity.ID,
		UserID:    entity.UserID,
		Title:     entity.Title,
		Message:   entity.Message,
		Type:      entity.Type,
		Data:      entity.Data,
		IsRead:    entity.IsRead,
		CreatedAt: entity.CreatedAt,
	}

	s.broadcast(notif)
	return &notif, nil
}

// HandlePriceAlertTriggered được gọi khi giá chạm ngưỡng
func (s *Service) HandlePriceAlertTriggered(alert model.PriceAlert, currentPrice float64) {
	title := fmt.Sprintf("Cảnh Báo Giá: %s chạm mục tiêu!", alert.Symbol)
	condStr := "vượt lên trên"
	if alert.Condition == "BELOW" {
		condStr = "giảm xuống dưới"
	}
	msg := fmt.Sprintf("Mã %s hiện có giá %s, đã %s ngưỡng cảnh báo %s của bạn.",
		alert.Symbol,
		formatNumber(currentPrice),
		condStr,
		formatNumber(alert.TargetPrice),
	)

	payload, _ := json.Marshal(map[string]interface{}{
		"alert_id":      alert.ID,
		"symbol":        alert.Symbol,
		"target_price":  alert.TargetPrice,
		"current_price": currentPrice,
		"condition":     alert.Condition,
	})

	userID := alert.UserID
	if userID == "" {
		userID = "ALL"
	}

	_, _ = s.SendNotification(userID, title, msg, "PRICE_ALERT", string(payload))
}

// CheckMarketVolatility kiểm tra và thông báo các mã biến động mạnh theo ngưỡng của từng người dùng
func (s *Service) CheckMarketVolatility(summary model.MarketSummary) {
	if s.repo == nil {
		return
	}

	s.volatilityMu.Lock()
	defer s.volatilityMu.Unlock()
	now := time.Now()

	// Tìm các tài sản có biến động mạnh trên 2%
	for _, a := range summary.AllAssets {
		absChange := math.Abs(a.ChangePercent)
		if absChange < 2.0 {
			continue
		}

		// Giới hạn tần suất thông báo cho cùng mã (tối đa 1 lần / 15 phút)
		if last, ok := s.lastVolAlert[a.ID]; ok && now.Sub(last) < 15*time.Minute {
			continue
		}
		s.lastVolAlert[a.ID] = now

		dir := "tăng vọt"
		if a.ChangePercent < 0 {
			dir = "giảm mạnh"
		}

		title := fmt.Sprintf("Biến động thị trường: %s %s %.2f%%", a.Symbol, dir, absChange)
		msg := fmt.Sprintf("%s (%s) hiện đang giao dịch ở mức %s (%+.2f%%). Hãy kiểm tra danh mục của bạn.",
			a.Name, a.Symbol, formatNumber(a.CurrentPrice), a.ChangePercent)

		data, _ := json.Marshal(map[string]interface{}{
			"asset_id":       a.ID,
			"symbol":         a.Symbol,
			"current_price":  a.CurrentPrice,
			"change_percent": a.ChangePercent,
		})

		// Gửi thông báo hệ thống cho tất cả người dùng bật biến động
		_, _ = s.SendNotification("ALL", title, msg, "VOLATILITY", string(data))
	}
}

// GetNotifications lấy danh sách thông báo của người dùng
func (s *Service) GetNotifications(userID string, limit int) ([]model.Notification, error) {
	return s.repo.GetNotifications(userID, limit)
}

// GetUnreadCount lấy số lượng thông báo chưa đọc
func (s *Service) GetUnreadCount(userID string) (int64, error) {
	return s.repo.GetUnreadNotificationCount(userID)
}

// MarkRead đánh dấu đã đọc
func (s *Service) MarkRead(id, userID string) error {
	return s.repo.MarkNotificationRead(id, userID)
}

// MarkAllRead đánh dấu tất cả đã đọc
func (s *Service) MarkAllRead(userID string) error {
	return s.repo.MarkAllNotificationsRead(userID)
}

// Delete xóa thông báo
func (s *Service) Delete(id, userID string) error {
	return s.repo.DeleteNotification(id, userID)
}

// GetSettings lấy cài đặt thông báo của người dùng
func (s *Service) GetSettings(userID string) (*model.NotificationSettings, error) {
	entity, err := s.repo.GetNotificationSettings(userID)
	if err != nil {
		return nil, err
	}
	return &model.NotificationSettings{
		UserID:                  entity.UserID,
		EnablePriceAlerts:       entity.EnablePriceAlerts,
		EnableVolatilityAlerts:  entity.EnableVolatilityAlerts,
		EnableTransactionAlerts: entity.EnableTransactionAlerts,
		EnableSound:             entity.EnableSound,
		MinChangePercent:        entity.MinChangePercent,
		WatchedAssets:           entity.WatchedAssets,
		UpdatedAt:               entity.UpdatedAt,
	}, nil
}

// UpdateSettings cập nhật cài đặt thông báo của người dùng
func (s *Service) UpdateSettings(userID string, req model.UpdateNotificationSettingsRequest) (*model.NotificationSettings, error) {
	entity, err := s.repo.GetNotificationSettings(userID)
	if err != nil {
		return nil, err
	}

	if req.EnablePriceAlerts != nil {
		entity.EnablePriceAlerts = *req.EnablePriceAlerts
	}
	if req.EnableVolatilityAlerts != nil {
		entity.EnableVolatilityAlerts = *req.EnableVolatilityAlerts
	}
	if req.EnableTransactionAlerts != nil {
		entity.EnableTransactionAlerts = *req.EnableTransactionAlerts
	}
	if req.EnableSound != nil {
		entity.EnableSound = *req.EnableSound
	}
	if req.MinChangePercent != nil {
		entity.MinChangePercent = *req.MinChangePercent
	}
	if req.WatchedAssets != nil {
		entity.WatchedAssets = strings.TrimSpace(*req.WatchedAssets)
	}

	if err := s.repo.UpsertNotificationSettings(entity); err != nil {
		return nil, err
	}

	return s.GetSettings(userID)
}

func formatNumber(val float64) string {
	if val >= 1000000 {
		return fmt.Sprintf("%.2fM", val/1000000)
	}
	return fmt.Sprintf("%.2f", val)
}
