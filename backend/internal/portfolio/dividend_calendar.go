package portfolio

import (
	"math"
	"fin-tracker-backend/internal/model"
)

// GetDividendCalendar returns upcoming dividend events matched with user's holdings
func (ps *PortfolioStore) GetDividendCalendar(summary model.PortfolioSummary) []model.DividendEvent {
	// Map holdings quantity
	holdingQty := make(map[string]float64)
	for _, h := range summary.Holdings {
		holdingQty[h.AssetID] = h.TotalQuantity
	}

	events := []model.DividendEvent{
		{
			ID:             "div-1",
			AssetID:        "VN-FPT",
			Symbol:         "FPT",
			Name:           "CTCP FPT - Tạm ứng cổ tức đợt 2/2026",
			ExDate:         "25/10/2026",
			PayDate:        "15/11/2026",
			DividendAmount: 1000,
			DividendType:   "TIỀN MẶT",
			YieldPct:       2.2,
		},
		{
			ID:             "div-2",
			AssetID:        "VN-VCB",
			Symbol:         "VCB",
			Name:           "Ngân hàng Vietcombank - Cổ tức tiền mặt năm 2025",
			ExDate:         "10/11/2026",
			PayDate:        "05/12/2026",
			DividendAmount: 2500,
			DividendType:   "TIỀN MẶT",
			YieldPct:       2.7,
		},
		{
			ID:             "div-3",
			AssetID:        "VN-HPG",
			Symbol:         "HPG",
			Name:           "Tập đoàn Hòa Phát - Chi trả cổ tức tiền mặt",
			ExDate:         "02/12/2026",
			PayDate:        "24/12/2026",
			DividendAmount: 1000,
			DividendType:   "TIỀN MẶT",
			YieldPct:       3.8,
		},
		{
			ID:             "div-4",
			AssetID:        "US-NVDA",
			Symbol:         "NVDA",
			Name:           "NVIDIA Corp - Q3 Cash Dividend",
			ExDate:         "20/11/2026",
			PayDate:        "12/12/2026",
			DividendAmount: 0.10, // USD
			DividendType:   "TIỀN MẶT (USD)",
			YieldPct:       0.1,
		},
	}

	// Calculate estimated payout based on current holding quantity
	for i := range events {
		qty := holdingQty[events[i].AssetID]
		events[i].EstimatedCash = math.Round(qty * events[i].DividendAmount)
	}

	return events
}
