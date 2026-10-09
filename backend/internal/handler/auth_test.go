package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"fin-tracker-backend/internal/alert"
	"fin-tracker-backend/internal/collector"
	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/model"
	"fin-tracker-backend/internal/notification"
	"fin-tracker-backend/internal/portfolio"
)

func setupTestRouter(t *testing.T) (*chi.Mux, *database.Repository) {
	// Create an in-memory SQLite DB for testing
	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("SQLITE_PATH", ":memory:")
	t.Setenv("JWT_SECRET", "test-secret-key-123")

	db, driver, err := database.ConnectGORM()
	if err != nil {
		t.Fatalf("Failed to connect test DB: %v", err)
	}
	_ = db.AutoMigrate(
		&model.UserEntity{},
		&model.UserNotificationSettingsEntity{},
		&model.NotificationEntity{},
		&model.TransactionEntity{},
		&model.PriceAlertEntity{},
		&model.LiveAssetEntity{},
		&model.CandleHistoryEntity{},
	)

	repo := database.NewRepository(db, driver)
	collector := collector.NewCentralCollector(repo)
	portfolioStore := portfolio.NewPortfolioStore(repo)
	alertStore := alert.NewAlertStore(repo)
	notificationStore := notification.NewService(repo)
	wsHub := NewHub()

	h := NewAPIHandler(collector, portfolioStore, alertStore, notificationStore, repo, wsHub)
	r := chi.NewRouter()
	h.RegisterRoutes(r)

	return r, repo
}

func TestRegisterAndLoginFlow(t *testing.T) {
	r, _ := setupTestRouter(t)

	// 1. Register new user
	regPayload := model.RegisterRequest{
		Username: "trader_alice",
		Email:    "alice@example.com",
		Password: "alicePassword123",
		FullName: "Alice Trader",
	}
	body, _ := json.Marshal(regPayload)
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on register, got %d: %s", w.Code, w.Body.String())
	}

	var regResp model.AuthResponse
	if err := json.NewDecoder(w.Body).Decode(&regResp); err != nil {
		t.Fatalf("Failed to decode register response: %v", err)
	}
	if regResp.Token == "" || regResp.User.Username != "trader_alice" {
		t.Fatalf("Invalid register response: %+v", regResp)
	}

	// 2. Login with registered user
	loginPayload := model.LoginRequest{
		UsernameOrEmail: "alice@example.com",
		Password:        "alicePassword123",
	}
	body, _ = json.Marshal(loginPayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on login, got %d: %s", w.Code, w.Body.String())
	}

	var loginResp model.AuthResponse
	_ = json.NewDecoder(w.Body).Decode(&loginResp)
	if loginResp.Token == "" {
		t.Fatalf("Empty token on login response")
	}

	// 3. Test /auth/me with Bearer token
	req = httptest.NewRequest("GET", "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on /auth/me, got %d", w.Code)
	}

	var meResp model.User
	_ = json.NewDecoder(w.Body).Decode(&meResp)
	if meResp.Email != "alice@example.com" {
		t.Fatalf("Expected email alice@example.com, got %s", meResp.Email)
	}

	// 4. Test regular user accessing admin endpoint -> Expect 403 Forbidden
	req = httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("Expected 403 Forbidden for regular user on /admin/users, got %d", w.Code)
	}

	// 5. Test Admin login (seeded default account)
	adminLoginPayload := model.LoginRequest{
		UsernameOrEmail: "admin",
		Password:        "admin123",
	}
	body, _ = json.Marshal(adminLoginPayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on admin login, got %d: %s", w.Code, w.Body.String())
	}

	var adminResp model.AuthResponse
	_ = json.NewDecoder(w.Body).Decode(&adminResp)

	// Admin accesses /admin/users -> Expect 200 OK
	req = httptest.NewRequest("GET", "/api/v1/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+adminResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// 6. Test Admin Stats
	req = httptest.NewRequest("GET", "/api/v1/admin/stats", nil)
	req.Header.Set("Authorization", "Bearer "+adminResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on /admin/stats, got %d: %s", w.Code, w.Body.String())
	}

	var stats model.AdminStats
	if err := json.NewDecoder(w.Body).Decode(&stats); err != nil {
		t.Fatalf("Failed to decode admin stats: %v", err)
	}
	if stats.TotalUsers < 2 {
		t.Fatalf("Expected at least 2 users in stats, got %d", stats.TotalUsers)
	}

	// 7. Test User Notification Settings & Customization
	req = httptest.NewRequest("GET", "/api/v1/notifications/settings", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on GET /notifications/settings, got %d", w.Code)
	}

	var settings model.NotificationSettings
	_ = json.NewDecoder(w.Body).Decode(&settings)

	// Update customer notification settings
	enable := true
	falseVal := false
	thresh := 7.5
	watched := "SJC_HANOI,BTC"
	updateSettings := model.UpdateNotificationSettingsRequest{
		EnablePriceAlerts:       &enable,
		EnableVolatilityAlerts:  &enable,
		MinChangePercent:        &thresh,
		EnableTransactionAlerts: &falseVal,
		EnableSound:             &falseVal,
		WatchedAssets:           &watched,
	}
	body, _ = json.Marshal(updateSettings)
	req = httptest.NewRequest("PUT", "/api/v1/notifications/settings", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on PUT /notifications/settings, got %d: %s", w.Code, w.Body.String())
	}

	var updatedSettings model.NotificationSettings
	_ = json.NewDecoder(w.Body).Decode(&updatedSettings)
	if updatedSettings.MinChangePercent != 7.5 || updatedSettings.EnableSound != false {
		t.Fatalf("Settings not updated correctly: %+v", updatedSettings)
	}

	// 8. Test Send Test Notification
	req = httptest.NewRequest("POST", "/api/v1/notifications/test", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on POST /notifications/test, got %d: %s", w.Code, w.Body.String())
	}

	// Verify notification inbox received the notification
	req = httptest.NewRequest("GET", "/api/v1/notifications", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on GET /notifications, got %d", w.Code)
	}

	var notifResp struct {
		Notifications []model.Notification `json:"notifications"`
		UnreadCount   int                  `json:"unread_count"`
	}
	_ = json.NewDecoder(w.Body).Decode(&notifResp)
	if len(notifResp.Notifications) == 0 {
		t.Fatalf("Expected at least 1 notification in inbox, got %d", len(notifResp.Notifications))
	}

	// 9. Data Isolation Test: Guest cannot create transaction (401 Unauthorized)
	newTx := model.Transaction{
		AssetID:  "SJC_HANOI",
		Type:     "BUY",
		Quantity: 1.5,
		Price:    85000000,
	}
	body, _ = json.Marshal(newTx)
	req = httptest.NewRequest("POST", "/api/v1/portfolio/transactions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized for guest adding transaction, got %d", w.Code)
	}

	// Authenticated user Alice creates transaction -> Expect 201 Created
	req = httptest.NewRequest("POST", "/api/v1/portfolio/transactions", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for authenticated transaction, got %d: %s", w.Code, w.Body.String())
	}

	// Authenticated user Alice checks portfolio -> Should have 1 transaction
	req = httptest.NewRequest("GET", "/api/v1/portfolio/summary", nil)
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on /portfolio/summary, got %d", w.Code)
	}

	var alicePortfolio model.PortfolioSummary
	_ = json.NewDecoder(w.Body).Decode(&alicePortfolio)
	if len(alicePortfolio.RecentTransactions) != 1 {
		t.Fatalf("Expected 1 transaction for Alice, got %d", len(alicePortfolio.RecentTransactions))
	}

	// Another user (e.g. Admin) checks their portfolio -> Alice's transaction is NOT visible to Admin
	req = httptest.NewRequest("GET", "/api/v1/portfolio/summary", nil)
	req.Header.Set("Authorization", "Bearer "+adminResp.Token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var adminPortfolio model.PortfolioSummary
	_ = json.NewDecoder(w.Body).Decode(&adminPortfolio)
	if len(adminPortfolio.RecentTransactions) != 0 {
		t.Fatalf("Data isolation violation! Admin saw %d transactions, expected 0", len(adminPortfolio.RecentTransactions))
	}
}

func TestOAuthLoginFlow(t *testing.T) {
	r, _ := setupTestRouter(t)

	// 1. Get OAuth providers list
	req := httptest.NewRequest("GET", "/api/v1/auth/oauth/providers", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /auth/oauth/providers, got %d", w.Code)
	}

	// 2. Login via Google OAuth (new user)
	googlePayload := model.OAuthLoginRequest{
		Provider:   "google",
		Email:      "john.doe@gmail.com",
		FullName:   "John Doe",
		Avatar:     "https://lh3.googleusercontent.com/test",
		ProviderID: "google-uid-1001",
	}
	body, _ := json.Marshal(googlePayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for new Google OAuth user, got %d: %s", w.Code, w.Body.String())
	}

	var googleResp model.AuthResponse
	_ = json.NewDecoder(w.Body).Decode(&googleResp)
	if googleResp.Token == "" || googleResp.User.Email != "john.doe@gmail.com" {
		t.Fatalf("Invalid Google OAuth response: %+v", googleResp)
	}

	// 3. Login via Facebook OAuth (new user)
	fbPayload := model.OAuthLoginRequest{
		Provider:   "facebook",
		Email:      "sarah.fb@example.com",
		FullName:   "Sarah Connor",
		Avatar:     "https://graph.facebook.com/test",
		ProviderID: "fb-uid-2002",
	}
	body, _ = json.Marshal(fbPayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created for new Facebook OAuth user, got %d: %s", w.Code, w.Body.String())
	}

	var fbResp model.AuthResponse
	_ = json.NewDecoder(w.Body).Decode(&fbResp)
	if fbResp.Token == "" || fbResp.User.Email != "sarah.fb@example.com" {
		t.Fatalf("Invalid Facebook OAuth response: %+v", fbResp)
	}

	// 4. Repeated login for existing Google user (should return 200 OK with valid JWT)
	body, _ = json.Marshal(googlePayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK for existing Google OAuth login, got %d: %s", w.Code, w.Body.String())
	}

	// 5. Test invalid provider -> 400 Bad Request
	badPayload := model.OAuthLoginRequest{
		Provider: "twitter",
		Email:    "test@example.com",
	}
	body, _ = json.Marshal(badPayload)
	req = httptest.NewRequest("POST", "/api/v1/auth/oauth", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 Bad Request for unsupported provider, got %d", w.Code)
	}
}
