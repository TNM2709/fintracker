package forecasting

import (
	"math"
	"time"

	"fin-tracker-backend/internal/model"
	"fin-tracker-backend/pkg/indicator"
)

// GenerateForecast produces comprehensive technical + Monte Carlo predictive analysis
func GenerateForecast(asset model.Asset, candles []model.Candle, horizonDays int) model.ForecastResult {
	if horizonDays <= 0 {
		horizonDays = 30
	}

	n := len(candles)
	closes := make([]float64, n)
	highs := make([]float64, n)
	lows := make([]float64, n)

	for i, c := range candles {
		closes[i] = c.Close
		highs[i] = c.High
		lows[i] = c.Low
	}

	currentPrice := asset.CurrentPrice
	if n > 0 && currentPrice == 0 {
		currentPrice = closes[n-1]
	}

	// 1. Run Parallel Monte Carlo Simulation (5,000 paths across CPU cores)
	mcResult := RunParallelMonteCarlo(closes, horizonDays, 5000)

	// 2. Compute Technical Indicators
	var rsiVal float64 = 50.0
	if n >= 15 {
		rsiSeries := indicator.CalculateRSI(closes, 14)
		if len(rsiSeries) > 0 {
			rsiVal = rsiSeries[len(rsiSeries)-1]
		}
	}

	var macdSignal = "NEUTRAL"
	var macdHistVal float64 = 0
	if n >= 30 {
		macdRes := indicator.CalculateMACD(closes, 12, 26, 9)
		lastIdx := len(macdRes.Histogram) - 1
		if lastIdx > 0 {
			macdHistVal = macdRes.Histogram[lastIdx]
			prevHist := macdRes.Histogram[lastIdx-1]
			if prevHist < 0 && macdHistVal >= 0 {
				macdSignal = "BULLISH_CROSS"
			} else if prevHist > 0 && macdHistVal <= 0 {
				macdSignal = "BEARISH_CROSS"
			} else if macdHistVal > 0 {
				macdSignal = "BULLISH_MOMENTUM"
			} else {
				macdSignal = "BEARISH_MOMENTUM"
			}
		}
	}

	// Moving Average trend analysis
	ma20 := currentPrice
	ma50 := currentPrice
	if n >= 20 {
		ma20Arr := indicator.CalculateSMA(closes, 20)
		ma20 = ma20Arr[len(ma20Arr)-1]
	}
	if n >= 50 {
		ma50Arr := indicator.CalculateSMA(closes, 50)
		ma50 = ma50Arr[len(ma50Arr)-1]
	}

	// Support and Resistance pivots
	supports, resistances := indicator.DetectSupportResistance(highs, lows, closes)

	// 3. Quantitative Scoring (0 to 100)
	score := 50.0

	// RSI factor
	if rsiVal > 70 {
		score -= 15 // Overbought
	} else if rsiVal < 30 {
		score += 20 // Oversold, potential bounce
	} else if rsiVal >= 45 && rsiVal <= 65 {
		score += 10 // Healthy bullish zone
	}

	// MACD factor
	if macdSignal == "BULLISH_CROSS" || macdSignal == "BULLISH_MOMENTUM" {
		score += 15
	} else if macdSignal == "BEARISH_CROSS" || macdSignal == "BEARISH_MOMENTUM" {
		score -= 15
	}

	// MA Trend factor
	if currentPrice > ma20 && ma20 > ma50 {
		score += 15 // Strong uptrend
	} else if currentPrice < ma20 && ma20 < ma50 {
		score -= 15 // Strong downtrend
	}

	// Drift factor from Monte Carlo
	if mcResult.AnnualDrift > 15 {
		score += 10
	} else if mcResult.AnnualDrift < -10 {
		score -= 10
	}

	// Clamp score between 10 and 95
	score = math.Max(10, math.Min(95, score))

	// Trend Signal classification
	trendSignal := "NEUTRAL"
	if score >= 75 {
		trendSignal = "STRONG_BUY"
	} else if score >= 60 {
		trendSignal = "BUY"
	} else if score <= 35 {
		trendSignal = "SELL"
	}

	return model.ForecastResult{
		AssetID:              asset.ID,
		Symbol:               asset.Symbol,
		Name:                 asset.Name,
		CurrentPrice:         currentPrice,
		HorizonDays:          horizonDays,
		ExpectedDrift:        mcResult.AnnualDrift,
		AnnualVolatility:     mcResult.AnnualVolatility,
		BearTarget:           mcResult.BearTarget10Pct,
		BaseTarget:           mcResult.BaseTarget50Pct,
		BullTarget:           mcResult.BullTarget90Pct,
		ConfidenceLow95:      mcResult.ConfidenceLow95,
		ConfidenceHigh95:     mcResult.ConfidenceHigh95,
		TrendSignal:          trendSignal,
		TechnicalScore:       math.Round(score),
		RSI14:                math.Round(rsiVal*10) / 10,
		MACDSignal:           macdSignal,
		SupportLevels:        supports,
		ResistanceLevels:     resistances,
		SimulationSampleCone: mcResult.SamplePaths,
		GeneratedAt:          time.Now(),
	}
}
