package collector

import (
	"fmt"
	"math"
	"fin-tracker-backend/internal/model"
)

// GetBenchmarkComparison returns 12-month normalized performance comparison
func (cc *CentralCollector) GetBenchmarkComparison() []model.BenchmarkSeries {
	months := []string{
		"T11/25", "T12/25", "T01/26", "T02/26", "T03/26", "T04/26",
		"T05/26", "T06/26", "T07/26", "T08/26", "T09/26", "T10/26",
	}

	// Tỷ lệ tăng trưởng lũy kế (%) qua từng tháng
	goldReturns := []float64{0.0, 2.4, 5.1, 7.8, 12.5, 16.2, 18.0, 21.4, 23.8, 25.0, 27.2, 28.5}
	vnIndexReturns := []float64{0.0, 1.2, 3.5, 6.0, 9.2, 5.1, 8.4, 11.2, 13.5, 12.0, 14.2, 15.6}
	sp500Returns := []float64{0.0, 3.1, 4.8, 8.2, 11.5, 13.0, 15.8, 18.2, 20.1, 21.5, 23.0, 24.8}
	bankDepositReturns := []float64{0.0, 0.45, 0.9, 1.35, 1.8, 2.25, 2.7, 3.15, 3.6, 4.05, 4.5, 5.2}

	buildPoints := func(returns []float64) []model.BenchmarkPoint {
		pts := make([]model.BenchmarkPoint, len(months))
		for i := range months {
			pts[i] = model.BenchmarkPoint{
				Date:      months[i],
				ReturnPct: math.Round(returns[i]*10) / 10,
			}
		}
		return pts
	}

	return []model.BenchmarkSeries{
		{
			ID:        "BENCH-GOLD",
			Name:      "Vàng Miếng SJC (Tích sản)",
			AssetType: "GOLD",
			Color:     "#f59e0b",
			Points:    buildPoints(goldReturns),
		},
		{
			ID:        "BENCH-SP500",
			Name:      "Chỉ số S&P 500 (Mỹ)",
			AssetType: "STOCK_US",
			Color:     "#8b5cf6",
			Points:    buildPoints(sp500Returns),
		},
		{
			ID:        "BENCH-VNINDEX",
			Name:      "Chỉ số VN-Index (Việt Nam)",
			AssetType: "STOCK_VN",
			Color:     "#3b82f6",
			Points:    buildPoints(vnIndexReturns),
		},
		{
			ID:        "BENCH-SAVINGS",
			Name:      "Lãi Suất Tiết Kiệm Kỳ Hạn 12T",
			AssetType: "CASH",
			Color:     "#10b981",
			Points:    buildPoints(bankDepositReturns),
		},
	}
}

// ConvertGoldCalculator computes conversion between Chi/Luong/Gram and compares domestic vs world
func (cc *CentralCollector) ConvertGoldCalculator(quantityLuong float64) map[string]interface{} {
	goldDetails := cc.goldCollector.GetGoldDetails()
	sjcBuy := 83.5
	sjcSell := 85.5
	if len(goldDetails) > 0 {
		sjcBuy = goldDetails[0].BuyPrice
		sjcSell = goldDetails[0].SellPrice
	}

	worldVndLg := cc.goldCollector.ConvertWorldGoldToVNDLg()

	buyTotalVND := quantityLuong * sjcBuy * 1000000
	sellTotalVND := quantityLuong * sjcSell * 1000000
	spreadVND := sellTotalVND - buyTotalVND
	worldTotalVND := quantityLuong * worldVndLg * 1000000
	premiumVND := sellTotalVND - worldTotalVND

	return map[string]interface{}{
		"quantity_luong":     quantityLuong,
		"quantity_chi":       quantityLuong * 10,
		"quantity_grams":     quantityLuong * 37.5,
		"sjc_buy_price_lg":   sjcBuy,
		"sjc_sell_price_lg":  sjcSell,
		"total_buy_cost":     buyTotalVND,
		"total_sell_value":   sellTotalVND,
		"total_spread_vnd":   spreadVND,
		"world_equiv_value":  worldTotalVND,
		"domestic_premium":   premiumVND,
		"premium_pct":        math.Round((premiumVND/worldTotalVND*100)*100) / 100,
		"gold_price_per_chi": fmt.Sprintf("%.2f triệu VND", sjcSell/10.0),
	}
}
