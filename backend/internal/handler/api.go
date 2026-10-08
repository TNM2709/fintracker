package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"fin-tracker-backend/internal/alert"
	"fin-tracker-backend/internal/collector"
	"fin-tracker-backend/internal/forecasting"
	"fin-tracker-backend/internal/model"
	"fin-tracker-backend/internal/portfolio"
)

type APIHandler struct {
	collector *collector.CentralCollector
	portfolio *portfolio.PortfolioStore
	alerts    *alert.AlertStore
	hub       *Hub
}

func NewAPIHandler(c *collector.CentralCollector, p *portfolio.PortfolioStore, a *alert.AlertStore, h *Hub) *APIHandler {
	return &APIHandler{
		collector: c,
		portfolio: p,
		alerts:    a,
		hub:       h,
	}
}

func (h *APIHandler) RegisterRoutes(r chi.Router) {
	r.Route("/api/v1", func(r chi.Router) {
		// Thị trường & Bảng giá
		r.Get("/market/summary", h.HandleMarketSummary)
		r.Get("/market/gold", h.HandleMarketGold)
		r.Get("/market/candles/{asset_id}", h.HandleCandles)
		r.Get("/market/benchmark", h.HandleBenchmark)

		// Động cơ dự đoán
		r.Get("/forecast/{asset_id}", h.HandleForecast)

		// Quản lý danh mục & Lợi tức
		r.Get("/portfolio/summary", h.HandlePortfolioSummary)
		r.Get("/portfolio/analytics", h.HandlePortfolioAnalytics)
		r.Get("/portfolio/dividends", h.HandleDividendCalendar)
		r.Post("/portfolio/transactions", h.HandleAddTransaction)
		r.Delete("/portfolio/transactions/{id}", h.HandleDeleteTransaction)
		r.Post("/portfolio/reset", h.HandleResetPortfolio)

		// Cảnh báo giá thông minh
		r.Get("/alerts", h.HandleGetAlerts)
		r.Post("/alerts", h.HandleAddAlert)
		r.Delete("/alerts/{id}", h.HandleDeleteAlert)

		// Công cụ tài chính & Quy đổi vàng & Lãi kép DCA
		r.Get("/tools/gold-calculator", h.HandleGoldCalculator)
		r.Get("/tools/dca-simulator", h.HandleDCASimulator)

		// WebSocket realtime stream
		r.Get("/ws", h.hub.ServeWS)
	})
}

// HandleMarketSummary trả về tổng quan toàn diện thị trường
func (h *APIHandler) HandleMarketSummary(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	writeJSON(w, http.StatusOK, summary)
}

// HandleMarketGold trả về chi tiết giá vàng các thương hiệu
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

// HandleBenchmark trả về so sánh hiệu suất 12 tháng giữa các lớp tài sản
func (h *APIHandler) HandleBenchmark(w http.ResponseWriter, r *http.Request) {
	series := h.collector.GetBenchmarkComparison()
	writeJSON(w, http.StatusOK, series)
}

// HandleCandles trả về chuỗi nến OHLCV để vẽ biểu đồ TradingView
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

// HandleForecast tính toán dự đoán Monte Carlo & chỉ báo kỹ thuật
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

// HandlePortfolioSummary tính toán tài sản ròng, PnL, cổ tức
func (h *APIHandler) HandlePortfolioSummary(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}

	portfolioSummary := h.portfolio.GetSummary(assetMap, summary.USDVNDExchange)
	writeJSON(w, http.StatusOK, portfolioSummary)
}

// HandleDividendCalendar trả về lịch nhận cổ tức & ước tính dòng tiền
func (h *APIHandler) HandleDividendCalendar(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	portfolioSummary := h.portfolio.GetSummary(assetMap, summary.USDVNDExchange)
	events := h.portfolio.GetDividendCalendar(portfolioSummary)

	writeJSON(w, http.StatusOK, events)
}

// HandleAddTransaction thêm giao dịch mua/bán/cổ tức
func (h *APIHandler) HandleAddTransaction(w http.ResponseWriter, r *http.Request) {
	var tx model.Transaction
	if err := json.NewDecoder(r.Body).Decode(&tx); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if tx.AssetID == "" || tx.Quantity <= 0 || tx.Price <= 0 {
		http.Error(w, "AssetID, Quantity, and Price must be provided and greater than 0", http.StatusBadRequest)
		return
	}

	if tx.AssetSymbol == "" || tx.AssetName == "" {
		if a, ok := h.collector.GetAsset(tx.AssetID); ok {
			tx.AssetSymbol = a.Symbol
			tx.AssetName = a.Name
		}
	}

	h.portfolio.AddTransaction(tx)

	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	newPortfolioSummary := h.portfolio.GetSummary(assetMap, summary.USDVNDExchange)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success":   true,
		"message":   "Transaction recorded successfully",
		"portfolio": newPortfolioSummary,
	})
}

// HandleDeleteTransaction xoá giao dịch theo ID
func (h *APIHandler) HandleDeleteTransaction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	deleted := h.portfolio.DeleteTransaction(id)
	if !deleted {
		http.Error(w, "Transaction not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Transaction deleted",
	})
}

// HandleResetPortfolio làm sạch danh mục trong SQLite database
func (h *APIHandler) HandleResetPortfolio(w http.ResponseWriter, r *http.Request) {
	h.portfolio.ResetPortfolio()
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	newPortfolioSummary := h.portfolio.GetSummary(assetMap, summary.USDVNDExchange)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":   true,
		"message":   "Portfolio reset successfully",
		"portfolio": newPortfolioSummary,
	})
}

// HandleGetAlerts danh sách cảnh báo giá
func (h *APIHandler) HandleGetAlerts(w http.ResponseWriter, r *http.Request) {
	alerts := h.alerts.GetAll()
	writeJSON(w, http.StatusOK, alerts)
}

// HandleAddAlert tạo cảnh báo mới
func (h *APIHandler) HandleAddAlert(w http.ResponseWriter, r *http.Request) {
	var req model.PriceAlert
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.AssetID == "" || req.TargetPrice <= 0 {
		http.Error(w, "AssetID and TargetPrice must be valid", http.StatusBadRequest)
		return
	}

	if req.Symbol == "" {
		if a, ok := h.collector.GetAsset(req.AssetID); ok {
			req.Symbol = a.Symbol
		}
	}

	created := h.alerts.AddAlert(req)
	writeJSON(w, http.StatusCreated, created)
}

// HandleDeleteAlert xoá cảnh báo
func (h *APIHandler) HandleDeleteAlert(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if h.alerts.DeleteAlert(id) {
		writeJSON(w, http.StatusOK, map[string]bool{"success": true})
	} else {
		http.Error(w, "Alert not found", http.StatusNotFound)
	}
}

// HandleGoldCalculator quy đổi lượng/chỉ và tính chênh lệch vàng
func (h *APIHandler) HandleGoldCalculator(w http.ResponseWriter, r *http.Request) {
	luongStr := r.URL.Query().Get("luong")
	luong := 1.0
	if l, err := strconv.ParseFloat(luongStr, 64); err == nil && l > 0 {
		luong = l
	}

	result := h.collector.ConvertGoldCalculator(luong)
	writeJSON(w, http.StatusOK, result)
}

// HandlePortfolioAnalytics phân tích sức khỏe danh mục và khuyến nghị tái cân bằng
func (h *APIHandler) HandlePortfolioAnalytics(w http.ResponseWriter, r *http.Request) {
	summary := h.collector.GetMarketSummary()
	assetMap := make(map[string]model.Asset)
	for _, a := range summary.AllAssets {
		assetMap[a.ID] = a
	}
	portfolioSummary := h.portfolio.GetSummary(assetMap, summary.USDVNDExchange)
	analytics := h.portfolio.ComputeAnalytics(portfolioSummary)
	writeJSON(w, http.StatusOK, analytics)
}

// HandleDCASimulator mô phỏng kế hoạch tích sản lãi kép
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

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
