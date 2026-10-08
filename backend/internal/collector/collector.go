package collector

import (
	"log"
	"math"
	"math/rand"
	"sort"
	"sync"
	"time"

	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/model"
)

type CentralCollector struct {
	mu             sync.RWMutex
	repo           *database.Repository
	realFeed       *RealMarketFeed
	goldCollector  *GoldCollector
	stockCollector *StockCollector
	candleCache    map[string][]model.Candle
	listeners      []func(summary model.MarketSummary)
}

func NewCentralCollector(repo *database.Repository) *CentralCollector {
	c := &CentralCollector{
		repo:           repo,
		realFeed:       NewRealMarketFeed(),
		goldCollector:  NewGoldCollector(),
		stockCollector: NewStockCollector(),
		candleCache:    make(map[string][]model.Candle),
	}

	// 1. Phục hồi dữ liệu thị trường từ SQLite database nếu có
	if repo != nil {
		if cachedAssets, err := repo.GetLiveAssets(); err == nil && len(cachedAssets) > 0 {
			log.Printf("[Collector] Restored %d cached live assets from SQLite", len(cachedAssets))
			for _, a := range cachedAssets {
				c.stockCollector.SetAsset(a)
			}
		}
	}

	// 2. Khởi tạo chuỗi nến lịch sử
	c.initHistoricalCandles()

	// 3. Chạy cập nhật giá thực tế ngay lập tức trong background
	go c.fetchRealMarket()

	return c
}

func (cc *CentralCollector) RegisterListener(callback func(summary model.MarketSummary)) {
	cc.mu.Lock()
	defer cc.mu.Unlock()
	cc.listeners = append(cc.listeners, callback)
}

// StartUpdateLoop runs the continuous background update
func (cc *CentralCollector) StartUpdateLoop(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		counter := 0
		for range ticker.C {
			counter++
			// Mỗi 3 nhịp (khoảng 18-20 giây) gọi API thị trường thực tế một lần để cập nhật số liệu mới
			if counter%3 == 0 {
				go cc.fetchRealMarket()
			} else {
				// Giữa các nhịp, tạo vi biến động vi mô cho bảng giá sống động
				cc.goldCollector.FetchGoldPrices()
				cc.stockCollector.UpdateTickers()
			}

			summary := cc.GetMarketSummary()
			cc.mu.RLock()
			for _, cb := range cc.listeners {
				go cb(summary)
			}
			cc.mu.RUnlock()
		}
	}()
}

// fetchRealMarket kết nối các API tài chính thực tế và lưu vào SQLite Database
func (cc *CentralCollector) fetchRealMarket() {
	// A. Tỷ giá USD/VND thời gian thực
	usdRate, err := cc.realFeed.FetchLiveUSDVND()
	if err == nil && usdRate > 0 {
		cc.goldCollector.SetLiveWorldGold(0, usdRate)
	}

	// B. Crypto thực tế từ Binance API (BTC, ETH)
	if btc, err := cc.realFeed.FetchBinanceCrypto("BTCUSDT"); err == nil && btc != nil {
		cc.stockCollector.SetAsset(*btc)
		if cc.repo != nil {
			_ = cc.repo.UpsertLiveAsset(*btc, "BINANCE_REALTIME")
		}
	}
	if eth, err := cc.realFeed.FetchBinanceCrypto("ETHUSDT"); err == nil && eth != nil {
		cc.stockCollector.SetAsset(*eth)
		if cc.repo != nil {
			_ = cc.repo.UpsertLiveAsset(*eth, "BINANCE_REALTIME")
		}
	}

	// C. Vàng Spot quốc tế (GC=F) & Cổ phiếu Mỹ từ Yahoo Finance API
	if goldAsset, candles, err := cc.realFeed.FetchYahooQuote("GC=F", "XAU-USD", "Vàng thế giới giao ngay (Ounce)", "GOLD_WORLD", "USD"); err == nil && goldAsset != nil {
		cc.goldCollector.SetLiveWorldGold(goldAsset.CurrentPrice, 0)
		if cc.repo != nil {
			_ = cc.repo.UpsertLiveAsset(*goldAsset, "YAHOO_REALTIME")
			if len(candles) > 0 {
				_ = cc.repo.SaveCandles("XAU-USD", candles)
			}
		}
	}

	// Cổ phiếu Mỹ: AAPL, NVDA, TSLA, S&P 500
	usStocks := []struct {
		ticker, id, name string
	}{
		{"AAPL", "US-AAPL", "Apple Inc."},
		{"NVDA", "US-NVDA", "NVIDIA Corporation"},
		{"TSLA", "US-TSLA", "Tesla, Inc."},
		{"^GSPC", "US-SP500", "S&P 500 Index"},
	}
	for _, s := range usStocks {
		if asset, candles, err := cc.realFeed.FetchYahooQuote(s.ticker, s.id, s.name, "STOCK_US", "USD"); err == nil && asset != nil {
			cc.stockCollector.SetAsset(*asset)
			if cc.repo != nil {
				_ = cc.repo.UpsertLiveAsset(*asset, "YAHOO_REALTIME")
				if len(candles) > 0 {
					_ = cc.repo.SaveCandles(s.id, candles)
				}
			}
		}
	}

	// D. Cổ phiếu Việt Nam thực tế từ Yahoo Finance: FPT.VN, VCB.VN, HPG.VN, VHM.VN, MWG.VN, TCB.VN
	vnStocks := []struct {
		ticker, id, name string
	}{
		{"FPT.VN", "VN-FPT", "Tập đoàn FPT (Công nghệ)"},
		{"VCB.VN", "VN-VCB", "Ngân hàng TMCP Ngoại thương VN"},
		{"HPG.VN", "VN-HPG", "Tập đoàn Hòa Phát (Thép)"},
		{"VHM.VN", "VN-VHM", "Vinhomes (Bất động sản)"},
		{"MWG.VN", "VN-MWG", "Thế Giới Di Động (Bán lẻ)"},
		{"TCB.VN", "VN-TCB", "Ngân hàng Techcombank"},
	}
	for _, s := range vnStocks {
		if asset, candles, err := cc.realFeed.FetchYahooQuote(s.ticker, s.id, s.name, "STOCK_VN", "VND"); err == nil && asset != nil {
			cc.stockCollector.SetAsset(*asset)
			if cc.repo != nil {
				_ = cc.repo.UpsertLiveAsset(*asset, "YAHOO_HOSE_REALTIME")
				if len(candles) > 0 {
					_ = cc.repo.SaveCandles(s.id, candles)
				}
			}
		}
	}
}

// GetMarketSummary returns full overview of gold, stocks, indices
func (cc *CentralCollector) GetMarketSummary() model.MarketSummary {
	goldDetails := cc.goldCollector.GetGoldDetails()
	worldGoldUSD := cc.goldCollector.GetWorldGoldUSD()
	usdVndRate := cc.goldCollector.GetUSDVNDRate()
	worldGoldVNDLg := cc.goldCollector.ConvertWorldGoldToVNDLg()

	// Tính chênh lệch giá vàng SJC trong nước so với vàng thế giới quy đổi
	var sjcSell float64 = 85.50
	if len(goldDetails) > 0 {
		sjcSell = goldDetails[0].SellPrice
	}
	goldSpread := math.Round((sjcSell-worldGoldVNDLg)*100) / 100

	assets := cc.stockCollector.GetAllAssets()

	// Thêm Vàng SJC và Vàng Thế Giới vào danh sách tài sản
	goldSJCAsset := model.Asset{
		ID:            "XAU-SJC",
		Symbol:        "SJC",
		Name:          "Vàng miếng SJC 999.9 (Lượng)",
		AssetType:     model.AssetTypeGoldVN,
		Currency:      "VND",
		Exchange:      "SJC",
		CurrentPrice:  sjcSell * 1000000,
		ChangeAmount:  300000,
		ChangePercent: 0.35,
		High24h:       sjcSell * 1000000,
		Low24h:        (sjcSell - 0.5) * 1000000,
		Volume:        1250,
		UpdatedAt:     time.Now(),
	}

	goldWorldAsset := model.Asset{
		ID:            "XAU-USD",
		Symbol:        "XAU/USD",
		Name:          "Vàng thế giới giao ngay (Ounce)",
		AssetType:     model.AssetTypeGoldWorld,
		Currency:      "USD",
		Exchange:      "COMEX",
		CurrentPrice:  worldGoldUSD,
		ChangeAmount:  14.20,
		ChangePercent: 0.54,
		High24h:       worldGoldUSD + 12.0,
		Low24h:        worldGoldUSD - 15.0,
		Volume:        185000,
		UpdatedAt:     time.Now(),
	}

	allAssets := append([]model.Asset{goldSJCAsset, goldWorldAsset}, assets...)

	// Lưu Vàng SJC vào SQLite cache nếu repo tồn tại
	if cc.repo != nil {
		_ = cc.repo.UpsertLiveAsset(goldSJCAsset, "DOMESTIC_CALCULATED")
	}

	// Tìm Top Gainers và Top Losers
	sorted := make([]model.Asset, len(allAssets))
	copy(sorted, allAssets)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].ChangePercent > sorted[j].ChangePercent
	})

	topGainers := sorted
	if len(topGainers) > 4 {
		topGainers = topGainers[:4]
	}

	topLosers := make([]model.Asset, 0)
	for i := len(sorted) - 1; i >= 0 && len(topLosers) < 4; i-- {
		topLosers = append(topLosers, sorted[i])
	}

	var vnIndexPrice float64 = 1285.60
	var vnIndexChange float64 = 0.97
	if vni, ok := cc.stockCollector.GetAsset("VN-INDEX"); ok {
		vnIndexPrice = vni.CurrentPrice
		vnIndexChange = vni.ChangePercent
	}

	var sp500Price float64 = 5782.50
	var sp500Change float64 = 0.66
	if sp, ok := cc.stockCollector.GetAsset("US-SP500"); ok {
		sp500Price = sp.CurrentPrice
		sp500Change = sp.ChangePercent
	}

	return model.MarketSummary{
		GoldVNSpread:   goldSpread,
		WorldGoldUSD:   worldGoldUSD,
		USDVNDExchange: usdVndRate,
		VNIndex:        vnIndexPrice,
		VNIndexChange:  vnIndexChange,
		SP500:          sp500Price,
		SP500Change:    sp500Change,
		TopGainers:     topGainers,
		TopLosers:      topLosers,
		FeaturedGold:   goldDetails,
		AllAssets:      allAssets,
		LastUpdated:    time.Now(),
	}
}

// GetHistoricalCandles returns OHLCV series, prioritizing real candles from SQLite
func (cc *CentralCollector) GetHistoricalCandles(assetID string, timeframe string) []model.Candle {
	cc.mu.RLock()
	defer cc.mu.RUnlock()

	// 1. Kiểm tra SQLite Database trước
	if cc.repo != nil {
		if dbCandles, err := cc.repo.GetCandles(assetID, 120); err == nil && len(dbCandles) >= 15 {
			return cc.aggregateCandles(dbCandles, timeframe)
		}
	}

	// 2. Kiểm tra bộ nhớ cache
	if candles, ok := cc.candleCache[assetID]; ok && len(candles) > 0 {
		return cc.aggregateCandles(candles, timeframe)
	}

	// Fallback mặc định
	return cc.generateHistoricalCandles(assetID, 120)
}

func (cc *CentralCollector) aggregateCandles(candles []model.Candle, timeframe string) []model.Candle {
	if len(candles) == 0 {
		return candles
	}

	switch timeframe {
	case "1D":
		if len(candles) > 30 {
			return candles[len(candles)-30:]
		}
		return candles
	case "1W":
		if len(candles) > 60 {
			return candles[len(candles)-60:]
		}
		return candles
	case "1M":
		if len(candles) > 90 {
			return candles[len(candles)-90:]
		}
		return candles
	case "ALL":
		return candles
	default:
		return candles
	}
}

func (cc *CentralCollector) initHistoricalCandles() {
	assets := []string{
		"XAU-SJC", "XAU-USD", "VN-INDEX", "US-SP500",
		"VN-VCB", "VN-FPT", "VN-HPG", "VN-VHM",
		"US-AAPL", "US-NVDA", "US-TSLA",
		"CRYPTO-BTC", "CRYPTO-ETH",
	}

	for _, id := range assets {
		// Kiểm tra SQLite trước
		if cc.repo != nil {
			if dbCandles, err := cc.repo.GetCandles(id, 120); err == nil && len(dbCandles) >= 15 {
				cc.candleCache[id] = dbCandles
				continue
			}
		}

		// Nếu SQLite chưa có thì tạo seed ban đầu và lưu vào SQLite
		candles := cc.generateHistoricalCandles(id, 120)
		cc.candleCache[id] = candles
		if cc.repo != nil {
			_ = cc.repo.SaveCandles(id, candles)
		}
	}
}

func (cc *CentralCollector) generateHistoricalCandles(assetID string, count int) []model.Candle {
	basePrice := 85000000.0
	volatility := 0.01

	switch assetID {
	case "XAU-SJC":
		basePrice = 85500000
		volatility = 0.006
	case "XAU-USD":
		basePrice = 2658.00
		volatility = 0.009
	case "VN-INDEX":
		basePrice = 1285.60
		volatility = 0.008
	case "US-SP500":
		basePrice = 5782.50
		volatility = 0.007
	case "VN-VCB":
		basePrice = 92500
		volatility = 0.012
	case "VN-FPT":
		basePrice = 136800
		volatility = 0.015
	case "VN-HPG":
		basePrice = 26400
		volatility = 0.018
	case "VN-VHM":
		basePrice = 44500
		volatility = 0.016
	case "US-AAPL":
		basePrice = 232.50
		volatility = 0.014
	case "US-NVDA":
		basePrice = 132.80
		volatility = 0.028
	case "US-TSLA":
		basePrice = 248.60
		volatility = 0.032
	case "CRYPTO-BTC":
		basePrice = 63450.00
		volatility = 0.035
	case "CRYPTO-ETH":
		basePrice = 2480.00
		volatility = 0.040
	default:
		basePrice = 100000
		volatility = 0.015
	}

	candles := make([]model.Candle, count)
	now := time.Now()
	rng := rand.New(rand.NewSource(1337 + int64(len(assetID))))

	price := basePrice * 0.82
	startTime := now.AddDate(0, 0, -count)

	for i := 0; i < count; i++ {
		candleTime := startTime.AddDate(0, 0, i).Unix()
		change := (rng.Float64() - 0.485) * volatility
		open := price
		close := math.Round(open*(1.0+change)*100) / 100
		high := math.Round(math.Max(open, close)*(1.0+rng.Float64()*volatility*0.7)*100) / 100
		low := math.Round(math.Min(open, close)*(1.0-rng.Float64()*volatility*0.7)*100) / 100
		volume := math.Round(100000 + rng.Float64()*500000)

		if basePrice > 10000 {
			open = math.Round(open/100) * 100
			close = math.Round(close/100) * 100
			high = math.Round(high/100) * 100
			low = math.Round(low/100) * 100
		}

		candles[i] = model.Candle{
			Timestamp: candleTime,
			Open:      open,
			High:      high,
			Low:       low,
			Close:     close,
			Volume:    volume,
		}
		price = close
	}

	candles[count-1].Close = basePrice
	candles[count-1].Timestamp = now.Unix()

	return candles
}

func (cc *CentralCollector) GetAsset(id string) (model.Asset, bool) {
	summary := cc.GetMarketSummary()
	for _, a := range summary.AllAssets {
		if a.ID == id {
			return a, true
		}
	}
	return model.Asset{}, false
}
