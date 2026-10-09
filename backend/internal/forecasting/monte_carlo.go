package forecasting

import (
	"math"
	"math/rand"
	"runtime"
	"sort"
	"sync"
	"time"
)

// MonteCarloResult holds quantitative statistical outputs
type MonteCarloResult struct {
	HorizonDays      int
	CurrentPrice     float64
	DailyDrift       float64
	DailyVolatility  float64
	AnnualDrift      float64
	AnnualVolatility float64
	BearTarget10Pct  float64
	BaseTarget50Pct  float64
	BullTarget90Pct  float64
	ConfidenceLow95  float64
	ConfidenceHigh95 float64
	SamplePaths      [][]float64 // 7 sample paths to render visual fan chart
	AllFinalPrices   []float64
}

// RunParallelMonteCarlo runs Geometric Brownian Motion simulation across CPU cores
func RunParallelMonteCarlo(historicalCloses []float64, horizonDays int, numSimulations int) MonteCarloResult {
	if len(historicalCloses) < 5 {
		// Fallback for short histories
		current := 100.0
		if len(historicalCloses) > 0 {
			current = historicalCloses[len(historicalCloses)-1]
		}
		return MonteCarloResult{
			HorizonDays:      horizonDays,
			CurrentPrice:     current,
			BearTarget10Pct:  current * 0.95,
			BaseTarget50Pct:  current * 1.01,
			BullTarget90Pct:  current * 1.07,
			ConfidenceLow95:  current * 0.92,
			ConfidenceHigh95: current * 1.10,
		}
	}

	n := len(historicalCloses)
	currentPrice := historicalCloses[n-1]

	// 1. Calculate logarithmic daily returns
	returns := make([]float64, n-1)
	var sumReturn float64
	for i := 1; i < n; i++ {
		ret := math.Log(historicalCloses[i] / historicalCloses[i-1])
		returns[i-1] = ret
		sumReturn += ret
	}

	meanDailyReturn := sumReturn / float64(len(returns))

	// 2. Calculate daily volatility (sample standard deviation)
	var varianceSum float64
	for _, r := range returns {
		diff := r - meanDailyReturn
		varianceSum += diff * diff
	}
	dailyVol := math.Sqrt(varianceSum / float64(len(returns)-1))

	// Annualized metrics (assuming 252 trading days)
	annualDrift := meanDailyReturn * 252.0 * 100.0
	annualVol := dailyVol * math.Sqrt(252.0) * 100.0

	// Guard against zero volatility
	if dailyVol < 0.0001 {
		dailyVol = 0.01
	}

	// 3. Parallel Simulation with Goroutines
	numWorkers := runtime.NumCPU()
	if numWorkers < 1 {
		numWorkers = 4
	}
	simsPerWorker := numSimulations / numWorkers

	finalPrices := make([]float64, numSimulations)
	var wg sync.WaitGroup

	// Sample paths collection (we collect a few paths for visual rendering)
	var samplePathsMu sync.Mutex
	var samplePaths [][]float64
	maxSamplePaths := 8

	for w := 0; w < numWorkers; w++ {
		startIdx := w * simsPerWorker
		endIdx := startIdx + simsPerWorker
		if w == numWorkers-1 {
			endIdx = numSimulations
		}

		wg.Add(1)
		go func(workerID, start, end int) {
			defer wg.Done()
			// Seed dedicated PRNG per worker for thread safety & high speed
			rng := rand.New(rand.NewSource(time.Now().UnixNano() + int64(workerID)*1000003))

			driftComponent := (meanDailyReturn - 0.5*dailyVol*dailyVol)
			volComponent := dailyVol

			for sim := start; sim < end; sim++ {
				price := currentPrice
				var path []float64
				collectPath := false

				// Randomly sample a few paths from the first worker
				if workerID == 0 && sim-start < maxSamplePaths {
					collectPath = true
					path = make([]float64, horizonDays+1)
					path[0] = currentPrice
				}

				for day := 1; day <= horizonDays; day++ {
					// Standard normal random number Z ~ N(0, 1)
					z := rng.NormFloat64()
					price *= math.Exp(driftComponent + volComponent*z)
					if collectPath {
						path[day] = math.Round(price*100) / 100
					}
				}

				finalPrices[sim] = price

				if collectPath {
					samplePathsMu.Lock()
					samplePaths = append(samplePaths, path)
					samplePathsMu.Unlock()
				}
			}
		}(w, startIdx, endIdx)
	}

	wg.Wait()

	// 4. Calculate statistical percentiles
	sort.Float64s(finalPrices)

	getPercentile := func(p float64) float64 {
		idx := int(math.Floor(p * float64(len(finalPrices))))
		if idx >= len(finalPrices) {
			idx = len(finalPrices) - 1
		}
		if idx < 0 {
			idx = 0
		}
		return math.Round(finalPrices[idx]*100) / 100
	}

	bear10 := getPercentile(0.10)
	base50 := getPercentile(0.50)
	bull90 := getPercentile(0.90)
	low95 := getPercentile(0.025)
	high95 := getPercentile(0.975)

	return MonteCarloResult{
		HorizonDays:      horizonDays,
		CurrentPrice:     math.Round(currentPrice*100) / 100,
		DailyDrift:       meanDailyReturn,
		DailyVolatility:  dailyVol,
		AnnualDrift:      math.Round(annualDrift*100) / 100,
		AnnualVolatility: math.Round(annualVol*100) / 100,
		BearTarget10Pct:  bear10,
		BaseTarget50Pct:  base50,
		BullTarget90Pct:  bull90,
		ConfidenceLow95:  low95,
		ConfidenceHigh95: high95,
		SamplePaths:      samplePaths,
		AllFinalPrices:   finalPrices,
	}
}
