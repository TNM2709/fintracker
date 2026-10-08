package alert

import (
	"fmt"
	"log"
	"sync"
	"time"

	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/model"
)

type AlertStore struct {
	mu     sync.RWMutex
	repo   *database.Repository
	alerts []model.PriceAlert
}

func NewAlertStore(repo *database.Repository) *AlertStore {
	store := &AlertStore{
		repo:   repo,
		alerts: []model.PriceAlert{},
	}

	// Đọc cảnh báo thực tế từ Database
	if repo != nil {
		if loaded, err := repo.GetAlerts(); err == nil {
			store.alerts = loaded
			log.Printf("[AlertStore] Loaded %d real price alerts from Database", len(loaded))
		} else {
			log.Printf("[AlertStore] Error loading alerts: %v", err)
		}
	}

	return store
}

func (s *AlertStore) GetAll() []model.PriceAlert {
	return s.GetByUser("")
}

func (s *AlertStore) GetByUser(userID string) []model.PriceAlert {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if userID == "" {
		res := make([]model.PriceAlert, len(s.alerts))
		copy(res, s.alerts)
		return res
	}

	var res []model.PriceAlert
	for _, a := range s.alerts {
		if a.UserID == userID || a.UserID == "" {
			res = append(res, a)
		}
	}
	return res
}

func (s *AlertStore) AddAlert(alt model.PriceAlert) model.PriceAlert {
	s.mu.Lock()
	defer s.mu.Unlock()

	if alt.ID == "" {
		alt.ID = fmt.Sprintf("alt-%d", time.Now().UnixNano())
	}
	alt.CreatedAt = time.Now()
	alt.IsActive = true
	alt.IsTriggered = false

	if s.repo != nil {
		if err := s.repo.InsertAlert(&alt); err != nil {
			log.Printf("[AlertStore] InsertAlert error: %v", err)
		}
	}

	s.alerts = append([]model.PriceAlert{alt}, s.alerts...)
	return alt
}

func (s *AlertStore) DeleteAlert(id string) bool {
	return s.DeleteAlertForUser(id, "")
}

func (s *AlertStore) DeleteAlertForUser(id string, userID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.repo != nil {
		if err := s.repo.DeleteAlertForUser(id, userID); err != nil {
			log.Printf("[AlertStore] DeleteAlertForUser error: %v", err)
			return false
		}
	}

	for i, a := range s.alerts {
		if a.ID == id && (userID == "" || a.UserID == userID || a.UserID == "") {
			s.alerts = append(s.alerts[:i], s.alerts[i+1:]...)
			return true
		}
	}
	return false
}

// CheckTriggers kiểm tra xem có cảnh báo nào vừa chạm ngưỡng không
func (s *AlertStore) CheckTriggers(assetPrices map[string]float64) []model.PriceAlert {
	s.mu.Lock()
	defer s.mu.Unlock()

	var newlyTriggered []model.PriceAlert
	now := time.Now()

	for i := range s.alerts {
		a := &s.alerts[i]
		if !a.IsActive || a.IsTriggered {
			continue
		}

		price, exists := assetPrices[a.AssetID]
		if !exists {
			continue
		}

		triggered := false
		if a.Condition == "ABOVE" && price >= a.TargetPrice {
			triggered = true
		} else if a.Condition == "BELOW" && price <= a.TargetPrice {
			triggered = true
		}

		if triggered {
			a.IsTriggered = true
			a.TriggeredAt = now
			newlyTriggered = append(newlyTriggered, *a)
			if s.repo != nil {
				_ = s.repo.UpdateAlertTriggered(a.ID, true)
			}
		}
	}

	return newlyTriggered
}
