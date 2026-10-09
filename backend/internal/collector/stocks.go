package collector

import (
	"math"
	"math/rand"
	"sync"
	"time"

	"fin-tracker-backend/internal/model"
)

type StockCollector struct {
	mu     sync.RWMutex
	assets map[string]*model.Asset
}

func NewStockCollector() *StockCollector {
	now := time.Now()
	assets := map[string]*model.Asset{
		// 1. Chỉ số thị trường
		"VN-INDEX": {
			ID:            "VN-INDEX",
			Symbol:        "VNINDEX",
			Name:          "Chỉ số VN-Index (Việt Nam)",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  1285.60,
			ChangeAmount:  12.40,
			ChangePercent: 0.97,
			High24h:       1292.00,
			Low24h:        1278.30,
			Volume:        720000000,
			UpdatedAt:     now,
		},
		"US-SP500": {
			ID:            "US-SP500",
			Symbol:        "SPX",
			Name:          "S&P 500 Index (Hoa Kỳ)",
			AssetType:     model.AssetTypeStockUS,
			Currency:      "USD",
			Exchange:      "NYSE",
			CurrentPrice:  5782.50,
			ChangeAmount:  38.20,
			ChangePercent: 0.66,
			High24h:       5795.00,
			Low24h:        5740.10,
			Volume:        2400000000,
			UpdatedAt:     now,
		},

		// 2. Cổ phiếu Việt Nam
		"VN-VCB": {
			ID:            "VN-VCB",
			Symbol:        "VCB",
			Name:          "Ngân hàng TMCP Ngoại thương VN",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  92500,
			ChangeAmount:  1100,
			ChangePercent: 1.20,
			High24h:       93000,
			Low24h:        91200,
			Volume:        1820000,
			UpdatedAt:     now,
		},
		"VN-FPT": {
			ID:            "VN-FPT",
			Symbol:        "FPT",
			Name:          "Tập đoàn FPT (Công nghệ)",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  136800,
			ChangeAmount:  2800,
			ChangePercent: 2.09,
			High24h:       137500,
			Low24h:        133500,
			Volume:        4200000,
			UpdatedAt:     now,
		},
		"VN-HPG": {
			ID:            "VN-HPG",
			Symbol:        "HPG",
			Name:          "Tập đoàn Hoà Phát (Thép)",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  26400,
			ChangeAmount:  300,
			ChangePercent: 1.15,
			High24h:       26700,
			Low24h:        26100,
			Volume:        22500000,
			UpdatedAt:     now,
		},
		"VN-VHM": {
			ID:            "VN-VHM",
			Symbol:        "VHM",
			Name:          "CTCP Vinhomes (Bất động sản)",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  44500,
			ChangeAmount:  -400,
			ChangePercent: -0.89,
			High24h:       45200,
			Low24h:        44100,
			Volume:        8600000,
			UpdatedAt:     now,
		},
		"VN-MWG": {
			ID:            "VN-MWG",
			Symbol:        "MWG",
			Name:          "CTCP Thế Giới Di Động (Bán lẻ)",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  67200,
			ChangeAmount:  900,
			ChangePercent: 1.36,
			High24h:       67800,
			Low24h:        66100,
			Volume:        5800000,
			UpdatedAt:     now,
		},
		"VN-TCB": {
			ID:            "VN-TCB",
			Symbol:        "TCB",
			Name:          "Ngân hàng Kỹ thương Techcombank",
			AssetType:     model.AssetTypeStockVN,
			Currency:      "VND",
			Exchange:      "HOSE",
			CurrentPrice:  24850,
			ChangeAmount:  250,
			ChangePercent: 1.02,
			High24h:       25100,
			Low24h:        24500,
			Volume:        14500000,
			UpdatedAt:     now,
		},

		// 3. Cổ phiếu Mỹ & Công nghệ quốc tế
		"US-AAPL": {
			ID:            "US-AAPL",
			Symbol:        "AAPL",
			Name:          "Apple Inc.",
			AssetType:     model.AssetTypeStockUS,
			Currency:      "USD",
			Exchange:      "NASDAQ",
			CurrentPrice:  232.50,
			ChangeAmount:  2.10,
			ChangePercent: 0.91,
			High24h:       234.00,
			Low24h:        230.20,
			Volume:        48000000,
			UpdatedAt:     now,
		},
		"US-NVDA": {
			ID:            "US-NVDA",
			Symbol:        "NVDA",
			Name:          "NVIDIA Corporation (AI Chips)",
			AssetType:     model.AssetTypeStockUS,
			Currency:      "USD",
			Exchange:      "NASDAQ",
			CurrentPrice:  132.80,
			ChangeAmount:  4.60,
			ChangePercent: 3.59,
			High24h:       134.50,
			Low24h:        127.80,
			Volume:        65000000,
			UpdatedAt:     now,
		},
		"US-TSLA": {
			ID:            "US-TSLA",
			Symbol:        "TSLA",
			Name:          "Tesla, Inc. (Xe điện & AI)",
			AssetType:     model.AssetTypeStockUS,
			Currency:      "USD",
			Exchange:      "NASDAQ",
			CurrentPrice:  248.60,
			ChangeAmount:  -3.20,
			ChangePercent: -1.27,
			High24h:       254.10,
			Low24h:        245.50,
			Volume:        54000000,
			UpdatedAt:     now,
		},

		// 4. Tiền điện tử Crypto
		"CRYPTO-BTC": {
			ID:            "CRYPTO-BTC",
			Symbol:        "BTC",
			Name:          "Bitcoin (Kỹ thuật số)",
			AssetType:     model.AssetTypeCrypto,
			Currency:      "USD",
			Exchange:      "BINANCE",
			CurrentPrice:  63450.00,
			ChangeAmount:  1280.00,
			ChangePercent: 2.06,
			High24h:       64200.00,
			Low24h:        61800.00,
			Volume:        28000000000,
			UpdatedAt:     now,
		},
		"CRYPTO-ETH": {
			ID:            "CRYPTO-ETH",
			Symbol:        "ETH",
			Name:          "Ethereum",
			AssetType:     model.AssetTypeCrypto,
			Currency:      "USD",
			Exchange:      "BINANCE",
			CurrentPrice:  2480.00,
			ChangeAmount:  54.00,
			ChangePercent: 2.22,
			High24h:       2515.00,
			Low24h:        2410.00,
			Volume:        14000000000,
			UpdatedAt:     now,
		},
	}

	return &StockCollector{
		assets: assets,
	}
}

// UpdateTickers applies real-time micro fluctuations
func (sc *StockCollector) UpdateTickers() {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	now := time.Now()

	for _, a := range sc.assets {
		// Fluctuates slightly between -0.3% and +0.35%
		pct := (rng.Float64() - 0.47) * 0.007
		newPrice := a.CurrentPrice * (1.0 + pct)
		if a.Currency == "VND" {
			newPrice = math.Round(newPrice/100) * 100 // Làm tròn bước giá VND
		} else {
			newPrice = math.Round(newPrice*100) / 100
		}

		a.ChangeAmount = math.Round((newPrice-a.CurrentPrice+a.ChangeAmount)*100) / 100
		a.ChangePercent = math.Round((a.ChangeAmount/(a.CurrentPrice-a.ChangeAmount)*100)*100) / 100
		a.CurrentPrice = newPrice
		if newPrice > a.High24h {
			a.High24h = newPrice
		}
		if newPrice < a.Low24h {
			a.Low24h = newPrice
		}
		a.UpdatedAt = now
	}
}

func (sc *StockCollector) GetAllAssets() []model.Asset {
	sc.mu.RLock()
	defer sc.mu.RUnlock()

	res := make([]model.Asset, 0, len(sc.assets))
	for _, a := range sc.assets {
		res = append(res, *a)
	}
	return res
}

func (sc *StockCollector) GetAsset(id string) (model.Asset, bool) {
	sc.mu.RLock()
	defer sc.mu.RUnlock()

	a, found := sc.assets[id]
	if !found {
		return model.Asset{}, false
	}
	return *a, true
}

func (sc *StockCollector) SetAsset(a model.Asset) {
	sc.mu.Lock()
	defer sc.mu.Unlock()
	sc.assets[a.ID] = &a
}
