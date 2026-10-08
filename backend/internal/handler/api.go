package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"fin-tracker-backend/internal/alert"
	"fin-tracker-backend/internal/auth"
	"fin-tracker-backend/internal/collector"
	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/forecasting"
	"fin-tracker-backend/internal/model"
	"fin-tracker-backend/internal/notification"
	"fin-tracker-backend/internal/portfolio"
)

type APIHandler struct {
	collector     *collector.CentralCollector
	portfolio     *portfolio.PortfolioStore
	alerts        *alert.AlertStore
	notifications *notification.Service
	repo          *database.Repository
	hub           *Hub
}

func NewAPIHandler(
	c *collector.CentralCollector,
	p *portfolio.PortfolioStore,
	a *alert.AlertStore,
	n *notification.Service,
	repo *database.Repository,
	h *Hub,
) *APIHandler {
	return &APIHandler{
		collector:     c,
		portfolio:     p,
		alerts:        a,
		notifications: n,
		repo:          repo,
		hub:           h,
	}
}

func (h *APIHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1", func(r chi.Router) {
		// ==================== AUTH & USER PROFILE ====================
		r.Post("/auth/register", h.HandleRegister)
		r.Post("/auth/login", h.HandleLogin)
		r.With(auth.AuthMiddleware(false)).Get("/auth/me", h.HandleGetMe)
		r.With(auth.AuthMiddleware(false)).Put("/auth/profile", h.HandleUpdateProfile)

		// ==================== ADMIN MANAGEMENT ====================
		r.Group(func(admin chi.Router) {
			admin.Use(auth.AuthMiddleware(false))
			admin.Use(auth.RequireAdmin)
			admin.Get("/admin/users", h.HandleAdminGetUsers)
			admin.Put("/admin/users/{id}/role", h.HandleAdminUpdateRole)
			admin.Delete("/admin/users/{id}", h.HandleAdminDeleteUser)
			admin.Get("/admin/stats", h.HandleAdminStats)
		})

		// ==================== NOTIFICATIONS & SETTINGS ====================
		r.Group(func(notif chi.Router) {
			notif.Use(auth.AuthMiddleware(false))
			notif.Get("/notifications", h.HandleGetNotifications)
			notif.Put("/notifications/{id}/read", h.HandleMarkNotificationRead)
			notif.Put("/notifications/read-all", h.HandleMarkAllNotificationsRead)
			notif.Delete("/notifications/{id}", h.HandleDeleteNotification)
			notif.Get("/notifications/settings", h.HandleGetNotificationSettings)
			notif.Put("/notifications/settings", h.HandleUpdateNotificationSettings)
			notif.Post("/notifications/test", h.HandleSendTestNotification)
		})

		// ==================== THỊ TRƯỜNG & BẢNG GIÁ (PUBLIC) ====================
		r.Get("/market/summary", h.HandleMarketSummary)
		r.Get("/market/gold", h.HandleMarketGold)
		r.Get("/market/candles/{asset_id}", h.HandleCandles)
		r.Get("/market/benchmark", h.HandleBenchmark)

		// ==================== ĐỘNG CƠ DỰ BÁO & CÔNG CỤ (PUBLIC) ====================
		r.Get("/forecast/{asset_id}", h.HandleForecast)
		r.Get("/tools/gold-calculator", h.HandleGoldCalculator)
		r.Get("/tools/dca-simulator", h.HandleDCASimulator)

		// ==================== QUẢN LÝ DANH MỤC & LỢI TỨC ====================
		// Khách chưa đăng nhập chỉ xem (Guest mode), đăng nhập để xem thông tin riêng
		r.With(auth.AuthMiddleware(true)).Get("/portfolio/summary", h.HandlePortfolioSummary)
		r.With(auth.AuthMiddleware(true)).Get("/portfolio/analytics", h.HandlePortfolioAnalytics)
		r.With(auth.AuthMiddleware(true)).Get("/portfolio/dividends", h.HandleDividendCalendar)

		// Yêu cầu đăng nhập mới có thể thêm/xóa/reset giao dịch
		r.With(auth.AuthMiddleware(false)).Post("/portfolio/transactions", h.HandleAddTransaction)
		r.With(auth.AuthMiddleware(false)).Delete("/portfolio/transactions/{id}", h.HandleDeleteTransaction)
		r.With(auth.AuthMiddleware(false)).Post("/portfolio/reset", h.HandleResetPortfolio)

		// ==================== CẢNH BÁO GIÁ THÔNG MINH ====================
		r.With(auth.AuthMiddleware(true)).Get("/alerts", h.HandleGetAlerts)
		r.With(auth.AuthMiddleware(false)).Post("/alerts", h.HandleAddAlert)
		r.With(auth.AuthMiddleware(false)).Delete("/alerts/{id}", h.HandleDeleteAlert)

		// ==================== WEBSOCKET STREAM ====================
		r.Get("/ws", h.hub.ServeWS)
	})
}

// ==================== AUTH HANDLERS ====================

func (h *APIHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ: "+err.Error())
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)

	if req.Username == "" || req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "Tên đăng nhập, Email và Mật khẩu không được để trống")
		return
	}
	if len(req.Password) < 6 {
		writeError(w, http.StatusBadRequest, "Mật khẩu phải chứa ít nhất 6 ký tự")
		return
	}

	// Kiểm tra tài khoản đã tồn tại chưa
	if existing, _ := h.repo.GetUserByUsernameOrEmail(req.Username); existing != nil {
		writeError(w, http.StatusConflict, "Tên đăng nhập đã được sử dụng")
		return
	}
	if existing, _ := h.repo.GetUserByUsernameOrEmail(req.Email); existing != nil {
		writeError(w, http.StatusConflict, "Email đã được sử dụng")
		return
	}

	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi mã hóa mật khẩu")
		return
	}

	userEntity := model.UserEntity{
		ID:           fmt.Sprintf("usr-%d", time.Now().UnixNano()),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FullName:     req.FullName,
		Role:         "user", // Mặc định là user thông thường
		Avatar:       fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", req.Username),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.repo.CreateUser(&userEntity); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tạo tài khoản: "+err.Error())
		return
	}

	// Khởi tạo tùy biến thông báo mặc định cho người dùng
	_ = h.repo.UpsertNotificationSettings(&model.UserNotificationSettingsEntity{
		UserID:                  userEntity.ID,
		EnablePriceAlerts:       true,
		EnableVolatilityAlerts:  true,
		EnableTransactionAlerts: true,
		EnableSound:             true,
		MinChangePercent:        2.0,
		WatchedAssets:           "ALL",
	})

	// Gửi thông báo chào mừng
	if h.notifications != nil {
		_, _ = h.notifications.SendNotification(
			userEntity.ID,
			"Chào mừng đến với FinTracker Pro!",
			fmt.Sprintf("Chào mừng %s! Bạn đã có thể tự tạo và quản lý sổ cái danh mục cũng như tùy biến cảnh báo giá.", userEntity.FullName),
			"SYSTEM",
			"",
		)
	}

	// Tạo Token JWT (hạn 7 ngày)
	token, err := auth.GenerateJWT(userEntity.ID, userEntity.Username, userEntity.Role, 7*24*time.Hour)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tạo token phiên đăng nhập")
		return
	}

	writeJSON(w, http.StatusCreated, model.AuthResponse{
		Token: token,
		User: model.User{
			ID:        userEntity.ID,
			Username:  userEntity.Username,
			Email:     userEntity.Email,
			FullName:  userEntity.FullName,
			Role:      userEntity.Role,
			Avatar:    userEntity.Avatar,
			CreatedAt: userEntity.CreatedAt,
		},
	})
}

func (h *APIHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ: "+err.Error())
		return
	}

	req.UsernameOrEmail = strings.TrimSpace(req.UsernameOrEmail)
	if req.UsernameOrEmail == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "Tên đăng nhập/email và mật khẩu không được để trống")
		return
	}

	userEntity, err := h.repo.GetUserByUsernameOrEmail(req.UsernameOrEmail)
	if err != nil || userEntity == nil {
		writeError(w, http.StatusUnauthorized, "Tài khoản hoặc mật khẩu không chính xác")
		return
	}

	if !auth.CheckPassword(req.Password, userEntity.PasswordHash) {
		writeError(w, http.StatusUnauthorized, "Tài khoản hoặc mật khẩu không chính xác")
		return
	}

	token, err := auth.GenerateJWT(userEntity.ID, userEntity.Username, userEntity.Role, 7*24*time.Hour)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi tạo token phiên đăng nhập")
		return
	}

	writeJSON(w, http.StatusOK, model.AuthResponse{
		Token: token,
		User: model.User{
			ID:        userEntity.ID,
			Username:  userEntity.Username,
			Email:     userEntity.Email,
			FullName:  userEntity.FullName,
			Role:      userEntity.Role,
			Avatar:    userEntity.Avatar,
			CreatedAt: userEntity.CreatedAt,
		},
	})
}

func (h *APIHandler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	userEntity, err := h.repo.GetUserByID(userID)
	if err != nil || userEntity == nil {
		writeError(w, http.StatusNotFound, "Không tìm thấy thông tin người dùng")
		return
	}

	writeJSON(w, http.StatusOK, model.User{
		ID:        userEntity.ID,
		Username:  userEntity.Username,
		Email:     userEntity.Email,
		FullName:  userEntity.FullName,
		Role:      userEntity.Role,
		Avatar:    userEntity.Avatar,
		CreatedAt: userEntity.CreatedAt,
	})
}

func (h *APIHandler) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	userEntity, err := h.repo.GetUserByID(userID)
	if err != nil || userEntity == nil {
		writeError(w, http.StatusNotFound, "Không tìm thấy thông tin người dùng")
		return
	}

	var req model.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ")
		return
	}

	if req.FullName != "" {
		userEntity.FullName = strings.TrimSpace(req.FullName)
	}
	if req.Avatar != "" {
		userEntity.Avatar = strings.TrimSpace(req.Avatar)
	}
	if req.Password != "" {
		if len(req.Password) < 6 {
			writeError(w, http.StatusBadRequest, "Mật khẩu mới phải có ít nhất 6 ký tự")
			return
		}
		newHash, err := auth.HashPassword(req.Password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Lỗi mã hóa mật khẩu mới")
			return
		}
		userEntity.PasswordHash = newHash
	}

	userEntity.UpdatedAt = time.Now()
	if err := h.repo.UpdateUser(userEntity); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật hồ sơ: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, model.User{
		ID:        userEntity.ID,
		Username:  userEntity.Username,
		Email:     userEntity.Email,
		FullName:  userEntity.FullName,
		Role:      userEntity.Role,
		Avatar:    userEntity.Avatar,
		CreatedAt: userEntity.CreatedAt,
	})
}

// ==================== ADMIN HANDLERS ====================

func (h *APIHandler) HandleAdminGetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.repo.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy danh sách người dùng: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, users)
}

func (h *APIHandler) HandleAdminUpdateRole(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "usr-admin" {
		writeError(w, http.StatusBadRequest, "Không thể thay đổi quyền tài khoản quản trị hệ thống gốc")
		return
	}

	var req model.UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ")
		return
	}

	if req.Role != "admin" && req.Role != "user" {
		writeError(w, http.StatusBadRequest, "Role chỉ có thể là 'admin' hoặc 'user'")
		return
	}

	if err := h.repo.UpdateUserRole(id, req.Role); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật role: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Đã cập nhật vai trò người dùng thành %s", req.Role),
	})
}

func (h *APIHandler) HandleAdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	currentUserID := auth.GetUserIDFromContext(r.Context())

	if id == "usr-admin" {
		writeError(w, http.StatusBadRequest, "Không thể xóa tài khoản quản trị hệ thống gốc")
		return
	}
	if id == currentUserID {
		writeError(w, http.StatusBadRequest, "Không thể tự xóa tài khoản của chính mình")
		return
	}

	if err := h.repo.DeleteUser(id); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa người dùng: "+err.Error())
		return
	}

	// Làm mới bộ nhớ ram của portfolio nếu có
	h.portfolio.ResetPortfolioForUser(id)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Đã xóa người dùng và dữ liệu liên quan thành công",
	})
}

func (h *APIHandler) HandleAdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetAdminStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy thống kê: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

// ==================== NOTIFICATION HANDLERS ====================

func (h *APIHandler) HandleGetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}

	notifs, err := h.notifications.GetNotifications(userID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy thông báo: "+err.Error())
		return
	}

	unreadCount, _ := h.notifications.GetUnreadCount(userID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"notifications": notifs,
		"unread_count":  unreadCount,
	})
}

func (h *APIHandler) HandleMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := auth.GetUserIDFromContext(r.Context())

	if err := h.notifications.MarkRead(id, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi đánh dấu đã đọc")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *APIHandler) HandleMarkAllNotificationsRead(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	if err := h.notifications.MarkAllRead(userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi đánh dấu tất cả đã đọc")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *APIHandler) HandleDeleteNotification(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := auth.GetUserIDFromContext(r.Context())

	if err := h.notifications.Delete(id, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi xóa thông báo")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *APIHandler) HandleGetNotificationSettings(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	settings, err := h.notifications.GetSettings(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi lấy cài đặt thông báo: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (h *APIHandler) HandleUpdateNotificationSettings(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	var req model.UpdateNotificationSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ")
		return
	}

	updated, err := h.notifications.UpdateSettings(userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi cập nhật cài đặt thông báo: "+err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *APIHandler) HandleSendTestNotification(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	username := auth.GetUsernameFromContext(r.Context())

	notif, err := h.notifications.SendNotification(
		userID,
		"Kiểm tra thông báo FinTracker",
		fmt.Sprintf("Xin chào %s! Cài đặt thông báo tùy biến của bạn đang hoạt động bình thường.", username),
		"SYSTEM",
		`{"test":true}`,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Lỗi gửi thông báo thử nghiệm")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"notification": notif,
	})
}

// ==================== THỊ TRƯỜNG & BẢNG GIÁ HANDLERS ====================

func (h *APIHandler) HandleMarketSummary(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	writeJSON(w, http.StatusOK, summary)
}

func (h *APIHandler) HandleMarketGold(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"featured_gold":    summary.FeaturedGold,
		"world_gold_usd":   summary.WorldGoldUSD,
		"usd_vnd_exchange": summary.USDVNDExchange,
		"gold_vn_spread":   summary.GoldVNSpread,
		"updated_at":       summary.LastUpdated,
	})
}

func (h *APIHandler) HandleBenchmark(w http.ResponseWriter, r *http.Request) {
	series := h.collector.GetBenchmarkComparison()
	writeJSON(w, http.StatusOK, series)
}

func (h *APIHandler) HandleCandles(w http.ResponseWriter, r *http.Request) {
	assetID := chi.URLParam(r, "asset_id")
	timeframe := r.URL.Query().Get("timeframe")
	if timeframe == "" {
		timeframe = "1D"
	}

	candles := h.collector.GetHistoricalCandles(assetID, timeframe)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"asset_id":  assetID,
		"timeframe": timeframe,
		"count":     len(candles),
		"candles":   candles,
	})
}

func (h *APIHandler) HandleForecast(w http.ResponseWriter, r *http.Request) {
	assetID := chi.URLParam(r, "asset_id")
	horizonStr := r.URL.Query().Get("horizon")
	horizon := 30
	if hVal, err := strconv.Atoi(horizonStr); err == nil && hVal > 0 {
		horizon = hVal
	}

	asset, found := h.collector.GetAsset(assetID)
	if !found {
		asset = model.Asset{
			ID:           assetID,
			Symbol:       strings.ToUpper(assetID),
			Name:         assetID,
			CurrentPrice: 100,
		}
	}

	candles := h.collector.GetHistoricalCandles(assetID, "1D")
	forecast := forecasting.GenerateForecast(asset, candles, horizon)

	writeJSON(w, http.StatusOK, forecast)
}

// ==================== QUẢN LÝ DANH MỤC HANDLERS ====================

func (h *APIHandler) HandlePortfolioSummary(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}

	portfolioSummary := h.portfolio.GetSummaryByUser(userID, assetMap, summary.USDVNDExchange)
	writeJSON(w, http.StatusOK, portfolioSummary)
}

func (h *APIHandler) HandleDividendCalendar(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	portfolioSummary := h.portfolio.GetSummaryByUser(userID, assetMap, summary.USDVNDExchange)
	events := h.portfolio.GetDividendCalendar(portfolioSummary)

	writeJSON(w, http.StatusOK, events)
}

func (h *APIHandler) HandlePortfolioAnalytics(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	portfolioSummary := h.portfolio.GetSummaryByUser(userID, assetMap, summary.USDVNDExchange)
	analytics := h.portfolio.ComputeAnalytics(portfolioSummary)
	writeJSON(w, http.StatusOK, analytics)
}

func (h *APIHandler) HandleAddTransaction(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Bạn cần đăng nhập để thêm và lưu trữ giao dịch của riêng mình")
		return
	}

	var tx model.Transaction
	if err := json.NewDecoder(r.Body).Decode(&tx); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ: "+err.Error())
		return
	}

	if tx.AssetID == "" || tx.Quantity <= 0 || tx.Price <= 0 {
		writeError(w, http.StatusBadRequest, "AssetID, Số lượng, và Giá phải hợp lệ và lớn hơn 0")
		return
	}

	if tx.AssetSymbol == "" || tx.AssetName == "" {
		if a, ok := h.collector.GetAsset(tx.AssetID); ok {
			tx.AssetSymbol = a.Symbol
			tx.AssetName = a.Name
		}
	}

	tx.UserID = userID
	h.portfolio.AddTransaction(tx)

	// Gửi thông báo nếu người dùng bật nhận thông báo giao dịch
	if h.notifications != nil {
		actionVerb := "Mua"
		if tx.Type == "SELL" {
			actionVerb = "Bán"
		} else if tx.Type == "DIVIDEND" {
			actionVerb = "Nhận cổ tức"
		}
		title := fmt.Sprintf("Giao dịch mới: %s %s", actionVerb, tx.AssetSymbol)
		msg := fmt.Sprintf("Đã ghi nhận %s %.2f %s tại mức giá %s vào sổ cái cá nhân.",
			actionVerb, tx.Quantity, tx.AssetSymbol, formatNumber(tx.Price))
		_, _ = h.notifications.SendNotification(userID, title, msg, "TRANSACTION", "")
	}

	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	newPortfolioSummary := h.portfolio.GetSummaryByUser(userID, assetMap, summary.USDVNDExchange)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success":   true,
		"message":   "Giao dịch đã được lưu trữ thành công",
		"portfolio": newPortfolioSummary,
	})
}

func (h *APIHandler) HandleDeleteTransaction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := auth.GetUserIDFromContext(r.Context())
	role := auth.GetUserRoleFromContext(r.Context())

	// Admin có thể xóa bất kỳ giao dịch nào, user chỉ xóa giao dịch của mình
	deleteUserID := userID
	if role == "admin" {
		deleteUserID = ""
	}

	deleted := h.portfolio.DeleteTransactionForUser(id, deleteUserID)
	if !deleted {
		writeError(w, http.StatusNotFound, "Không tìm thấy giao dịch hoặc bạn không có quyền xóa")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Đã xóa giao dịch thành công",
	})
}

func (h *APIHandler) HandleResetPortfolio(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Bạn cần đăng nhập để đặt lại danh mục")
		return
	}

	h.portfolio.ResetPortfolioForUser(userID)
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	newPortfolioSummary := h.portfolio.GetSummaryByUser(userID, assetMap, summary.USDVNDExchange)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"message":   "Đã làm sạch sổ cái cá nhân thành công",
		"portfolio": newPortfolioSummary,
	})
}

// ==================== CẢNH BÁO GIÁ HANDLERS ====================

func (h *APIHandler) HandleGetAlerts(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	alerts := h.alerts.GetByUser(userID)
	writeJSON(w, http.StatusOK, alerts)
}

func (h *APIHandler) HandleAddAlert(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserIDFromContext(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Bạn cần đăng nhập để thiết lập cảnh báo giá")
		return
	}

	var req model.PriceAlert
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Dữ liệu JSON không hợp lệ: "+err.Error())
		return
	}

	if req.AssetID == "" || req.TargetPrice <= 0 {
		writeError(w, http.StatusBadRequest, "AssetID và Giá mục tiêu phải hợp lệ")
		return
	}

	if req.Symbol == "" {
		if a, ok := h.collector.GetAsset(req.AssetID); ok {
			req.Symbol = a.Symbol
		}
	}

	req.UserID = userID
	created := h.alerts.AddAlert(req)
	writeJSON(w, http.StatusCreated, created)
}

func (h *APIHandler) HandleDeleteAlert(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := auth.GetUserIDFromContext(r.Context())
	role := auth.GetUserRoleFromContext(r.Context())

	deleteUserID := userID
	if role == "admin" {
		deleteUserID = ""
	}

	if h.alerts.DeleteAlertForUser(id, deleteUserID) {
		writeJSON(w, http.StatusOK, map[string]bool{"success": true})
	} else {
		writeError(w, http.StatusNotFound, "Không tìm thấy cảnh báo giá hoặc bạn không có quyền xóa")
	}
}

// ==================== CÔNG CỤ TÀI CHÍNH HANDLERS ====================

func (h *APIHandler) HandleGoldCalculator(w http.ResponseWriter, r *http.Request) {
	luongStr := r.URL.Query().Get("luong")
	luong := 1.0
	if l, err := strconv.ParseFloat(luongStr, 64); err == nil && l > 0 {
		luong = l
	}

	result := h.collector.ConvertGoldCalculator(luong)
	writeJSON(w, http.StatusOK, result)
}

func (h *APIHandler) HandleDCASimulator(w http.ResponseWriter, r *http.Request) {
	amountStr := r.URL.Query().Get("amount")
	yearsStr := r.URL.Query().Get("years")
	roiStr := r.URL.Query().Get("roi")

	amount := 10000000.0
	if a, err := strconv.ParseFloat(amountStr, 64); err == nil && a > 0 {
		amount = a
	}
	years := 5
	if y, err := strconv.Atoi(yearsStr); err == nil && y > 0 {
		years = y
	}
	roi := 15.0
	if ro, err := strconv.ParseFloat(roiStr, 64); err == nil && ro > 0 {
		roi = ro
	}

	result := portfolio.SimulateDCA(amount, years, roi)
	writeJSON(w, http.StatusOK, result)
}

// ==================== JSON HELPERS ====================

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}

func formatNumber(val float64) string {
	if val >= 1000000 {
		return fmt.Sprintf("%.2fM", val/1000000)
	}
	return fmt.Sprintf("%.2f", val)
}
