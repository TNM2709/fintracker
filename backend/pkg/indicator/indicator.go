package indicator

import (
	"math"
	"sort"
)

// CalculateSMA computes Simple Moving Average for a window period
func CalculateSMA(prices []float64, period int) []float64 {
	if len(prices) < period || period <= 0 {
		return nil
	}
	result := make([]float64, len(prices))
	var sum float64
	for i := 0; i < len(prices); i++ {
		sum += prices[i]
		if i >= period {
			sum -= prices[i-period]
		}
		if i >= period-1 {
			result[i] = sum / float64(period)
		} else {
			result[i] = prices[i] // fallback for early periods
		}
	}
	return result
}

// CalculateEMA computes Exponential Moving Average
func CalculateEMA(prices []float64, period int) []float64 {
	if len(prices) < period || period <= 0 {
		return nil
	}
	result := make([]float64, len(prices))
	multiplier := 2.0 / float64(period+1)

	// Seed EMA with first period's SMA
	var sum float64
	for i := 0; i < period; i++ {
		sum += prices[i]
		result[i] = prices[i]
	}
	result[period-1] = sum / float64(period)

	for i := period; i < len(prices); i++ {
		result[i] = (prices[i]-result[i-1])*multiplier + result[i-1]
	}
	return result
}

// CalculateRSI computes 14-period Relative Strength Index
func CalculateRSI(prices []float64, period int) []float64 {
	if len(prices) <= period || period <= 0 {
		return nil
	}
	result := make([]float64, len(prices))

	var gainSum, lossSum float64
	for i := 1; i <= period; i++ {
		diff := prices[i] - prices[i-1]
		if diff >= 0 {
			gainSum += diff
		} else {
			lossSum -= diff
		}
	}

	avgGain := gainSum / float64(period)
	avgLoss := lossSum / float64(period)

	if avgLoss == 0 {
		result[period] = 100
	} else {
		rs := avgGain / avgLoss
		result[period] = 100 - (100 / (1 + rs))
	}

	for i := period + 1; i < len(prices); i++ {
		diff := prices[i] - prices[i-1]
		var gain, loss float64
		if diff >= 0 {
			gain = diff
		} else {
			loss = -diff
		}

		avgGain = (avgGain*float64(period-1) + gain) / float64(period)
		avgLoss = (avgLoss*float64(period-1) + loss) / float64(period)

		if avgLoss == 0 {
			result[i] = 100
		} else {
			rs := avgGain / avgLoss
			result[i] = 100 - (100 / (1 + rs))
		}
	}

	// Fill initial values
	for i := 0; i < period; i++ {
		result[i] = 50.0
	}
	return result
}

// MACDResult holds MACD line, signal line and histogram
type MACDResult struct {
	MACD      []float64
	Signal    []float64
	Histogram []float64
}

// CalculateMACD calculates standard MACD (12, 26, 9)
func CalculateMACD(prices []float64, fastPeriod, slowPeriod, signalPeriod int) MACDResult {
	fastEMA := CalculateEMA(prices, fastPeriod)
	slowEMA := CalculateEMA(prices, slowPeriod)

	n := len(prices)
	macdLine := make([]float64, n)
	for i := 0; i < n; i++ {
		macdLine[i] = fastEMA[i] - slowEMA[i]
	}

	signalLine := CalculateEMA(macdLine, signalPeriod)
	histogram := make([]float64, n)
	for i := 0; i < n; i++ {
		histogram[i] = macdLine[i] - signalLine[i]
	}

	return MACDResult{
		MACD:      macdLine,
		Signal:    signalLine,
		Histogram: histogram,
	}
}

// BollingerBandsResult holds Upper, Middle, Lower bands
type BollingerBandsResult struct {
	Upper  []float64
	Middle []float64
	Lower  []float64
}

// CalculateBollingerBands calculates bands for given period and standard deviation multiplier
func CalculateBollingerBands(prices []float64, period int, k float64) BollingerBandsResult {
	middle := CalculateSMA(prices, period)
	n := len(prices)
	upper := make([]float64, n)
	lower := make([]float64, n)

	for i := 0; i < n; i++ {
		if i < period-1 {
			upper[i] = prices[i]
			lower[i] = prices[i]
			continue
		}
		var varianceSum float64
		for j := i - period + 1; j <= i; j++ {
			diff := prices[j] - middle[i]
			varianceSum += diff * diff
		}
		stdDev := math.Sqrt(varianceSum / float64(period))
		upper[i] = middle[i] + k*stdDev
		lower[i] = middle[i] - k*stdDev
	}

	return BollingerBandsResult{
		Upper:  upper,
		Middle: middle,
		Lower:  lower,
	}
}

// DetectSupportResistance extracts key horizontal support and resistance pivot levels
func DetectSupportResistance(highs, lows, closes []float64) ([]float64, []float64) {
	n := len(closes)
	if n < 10 {
		return nil, nil
	}

	var potentialSupports []float64
	var potentialResistances []float64

	// Detect local swing highs and lows with window of 4 bars
	window := 4
	for i := window; i < n-window; i++ {
		isHigh := true
		isLow := true
		for j := i - window; j <= i+window; j++ {
			if j == i {
				continue
			}
			if highs[i] < highs[j] {
				isHigh = false
			}
			if lows[i] > lows[j] {
				isLow = false
			}
		}
		if isHigh {
			potentialResistances = append(potentialResistances, highs[i])
		}
		if isLow {
			potentialSupports = append(potentialSupports, lows[i])
		}
	}

	currentPrice := closes[n-1]

	// Cluster and filter levels
	filterLevels := func(levels []float64, isResistance bool) []float64 {
		sort.Float64s(levels)
		var filtered []float64
		for _, lvl := range levels {
			if isResistance && lvl <= currentPrice {
				continue
			}
			if !isResistance && lvl >= currentPrice {
				continue
			}
			// Cluster proximity within 1.5%
			duplicate := false
			for _, f := range filtered {
				if math.Abs(lvl-f)/lvl < 0.015 {
					duplicate = true
					break
				}
			}
			if !duplicate {
				filtered = append(filtered, math.Round(lvl*100)/100)
			}
		}
		if len(filtered) > 3 {
			if isResistance {
				return filtered[:3] // 3 closest resistances
			}
			return filtered[len(filtered)-3:] // 3 closest supports
		}
		return filtered
	}

	supports := filterLevels(potentialSupports, false)
	resistances := filterLevels(potentialResistances, true)

	// Fallback if pivots are sparse
	if len(supports) == 0 {
		supports = []float64{math.Round(currentPrice*0.97*100) / 100, math.Round(currentPrice*0.94*100) / 100}
	}
	if len(resistances) == 0 {
		resistances = []float64{math.Round(currentPrice*1.03*100) / 100, math.Round(currentPrice*1.07*100) / 100}
	}

	return supports, resistances
}
