package portfolio

import (
	"log"
	"math"
	"sync"
	"time"

	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/model"
)

type PortfolioStore struct {
	mu           sync.RWMutex
	repo         *database.Repository
	transactions []model.Transaction
}

func NewPortfolioStore(repo *database.Repository) *PortfolioStore {
	store := &PortfolioStore{
		repo:         repo,
		transactions: []model.Transaction{},
	}

	// Đọc toàn bộ dữ liệu giao dịch thực tế từ SQLite database
	if repo != nil {
		if txs, err := repo.GetTransactions(); err == nil {
			store.transactions = txs
			log.Printf("[Portfolio] Loaded %d real transactions from SQLite database", len(txs))
		} else {
			log.Printf("[Portfolio] Error loading transactions from SQLite: %v", err)
		}
	}

	return store
}

// AddTransaction thêm giao dịch mới vào sổ cái và lưu vào SQLite Database
func (ps *PortfolioStore) AddTransaction(tx model.Transaction) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if tx.ID == "" {
		tx.ID = "tx-" + time.Now().Format("20060102150405111")
	}
	if tx.TransactionDate.IsZero() {
		tx.TransactionDate = time.Now()
	}
	if tx.TotalAmount == 0 {
		tx.TotalAmount = tx.Quantity*tx.Price + tx.Fee + tx.Tax
	}

	if ps.repo != nil {
		if err := ps.repo.InsertTransaction(&tx); err != nil {
			log.Printf("[Portfolio] SQLite InsertTransaction error: %v", err)
		}
	}

	ps.transactions = append([]model.Transaction{tx}, ps.transactions...)
}

// DeleteTransaction xóa giao dịch khỏi sổ cái và SQLite Database
func (ps *PortfolioStore) DeleteTransaction(id string) bool {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if ps.repo != nil {
		if err := ps.repo.DeleteTransaction(id); err != nil {
			log.Printf("[Portfolio] SQLite DeleteTransaction error: %v", err)
		}
	}

	for i, tx := range ps.transactions {
		if tx.ID == id {
			ps.transactions = append(ps.transactions[:i], ps.transactions[i+1:]...)
			return true
		}
	}
	return false
}

// ResetPortfolio xóa sạch toàn bộ sổ cái trong SQLite Database
func (ps *PortfolioStore) ResetPortfolio() {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if ps.repo != nil {
		if err := ps.repo.ClearTransactions(); err != nil {
			log.Printf("[Portfolio] SQLite ClearTransactions error: %v", err)
		}
	}
	ps.transactions = []model.Transaction{}
}

// GetTransactions lấy danh sách giao dịch thực tế
func (ps *PortfolioStore) GetTransactions() []model.Transaction {
	ps.mu.RLock()
	defer ps.mu.RUnlock()
	return ps.transactions
}

// GetSummary tính toán tài sản ròng, PnL, DCA, cổ tức và tỷ trọng thực tế
func (ps *PortfolioStore) GetSummary(assetMap map[string]model.Asset, usdVndRate float64) model.PortfolioSummary {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	if len(ps.transactions) == 0 {
		return model.PortfolioSummary{
			TotalNetWorth:      0,
			TotalCostBasis:     0,
			TotalUnrealizedPnL: 0,
			TotalPnLRate:       0,
			TotalDividends:     0,
			EstimatedYield:     0,
			AssetAllocation:    make(map[string]float64),
			Holdings:           []model.Holding{},
			RecentTransactions: []model.Transaction{},
			UpdatedAt:          time.Now(),
		}
	}

	type assetCalc struct {
		symbol        string
		name          string
		assetType     string
		currency      string
		totalQty      float64
		totalCost     float64
		dividendTotal float64
	}

	grouped := make(map[string]*assetCalc)

	for _, tx := range ps.transactions {
		calc, exists := grouped[tx.AssetID]
		if !exists {
			calc = &assetCalc{
				symbol:    tx.AssetSymbol,
				name:      tx.AssetName,
				assetType: "STOCK_VN",
				currency:  "VND",
			}
			if a, ok := assetMap[tx.AssetID]; ok {
				calc.assetType = string(a.AssetType)
				calc.currency = a.Currency
			}
			grouped[tx.AssetID] = calc
		}

		switch tx.Type {
		case "BUY":
			calc.totalQty += tx.Quantity
			calc.totalCost += tx.TotalAmount
		case "SELL":
			if calc.totalQty > 0 {
				ratio := tx.Quantity / calc.totalQty
				if ratio > 1 {
					ratio = 1
				}
				calc.totalCost -= calc.totalCost * ratio
				calc.totalQty -= tx.Quantity
			}
			if calc.totalQty < 0 {
				calc.totalQty = 0
			}
		case "DIVIDEND":
			calc.dividendTotal += tx.TotalAmount
		}
	}

	var holdings []model.Holding
	totalNetWorthVND := 0.0
	totalCostBasisVND := 0.0
	totalDividendsVND := 0.0

	allocationVND := map[string]float64{
		"Vàng (Gold)":               0,
		"Cổ phiếu VN (Stock VN)":    0,
		"Cổ phiếu Mỹ (Stock US)":    0,
		"Crypto":                    0,
		"Tiền mặt & Cổ tức":         0,
	}

	for assetID, c := range grouped {
		if c.totalQty <= 0 && c.dividendTotal == 0 {
			continue
		}

		currentPrice := 0.0
		if a, ok := assetMap[assetID]; ok {
			currentPrice = a.CurrentPrice
		}

		avgBuyPrice := 0.0
		if c.totalQty > 0 {
			avgBuyPrice = math.Round((c.totalCost/c.totalQty)*100) / 100
		}

		currentVal := math.Round(c.totalQty*currentPrice*100) / 100
		unrealizedPnL := currentVal - c.totalCost
		unrealizedRate := 0.0
		if c.totalCost > 0 {
			unrealizedRate = math.Round((unrealizedPnL/c.totalCost*100)*100) / 100
		}

		// Quy đổi ra VND nếu tài sản là USD
		multiplier := 1.0
		if c.currency == "USD" {
			multiplier = usdVndRate
		}

		currentValVND := currentVal * multiplier
		totalCostVND := c.totalCost * multiplier
		dividendsVND := c.dividendTotal * multiplier

		totalNetWorthVND += currentValVND
		totalCostBasisVND += totalCostVND
		totalDividendsVND += dividendsVND

		// Phân loại phân bổ
		switch c.assetType {
		case string(model.AssetTypeGoldVN), string(model.AssetTypeGoldWorld):
			allocationVND["Vàng (Gold)"] += currentValVND
		case string(model.AssetTypeStockVN):
			allocationVND["Cổ phiếu VN (Stock VN)"] += currentValVND
		case string(model.AssetTypeStockUS):
			allocationVND["Cổ phiếu Mỹ (Stock US)"] += currentValVND
		case string(model.AssetTypeCrypto):
			allocationVND["Crypto"] += currentValVND
		default:
			allocationVND["Tiền mặt & Cổ tức"] += currentValVND
		}

		holdings = append(holdings, model.Holding{
			AssetID:            assetID,
			Symbol:             c.symbol,
			Name:               c.name,
			AssetType:          c.assetType,
			Currency:           c.currency,
			TotalQuantity:      c.totalQty,
			AvgBuyPrice:        avgBuyPrice,
			CurrentPrice:       currentPrice,
			TotalCost:          c.totalCost,
			CurrentValue:       currentVal,
			UnrealizedPnL:      unrealizedPnL,
			UnrealizedPnLRate:  unrealizedRate,
			DividendsCollected: c.dividendTotal,
		})
	}

	// Cộng cổ tức tiền mặt vào tổng tài sản
	totalNetWorthVND += totalDividendsVND
	allocationVND["Tiền mặt & Cổ tức"] += totalDividendsVND

	// Tính tỷ trọng phân bổ % và tỷ trọng từng holding
	allocationPct := make(map[string]float64)
	if totalNetWorthVND > 0 {
		for k, v := range allocationVND {
			if v > 0 {
				allocationPct[k] = math.Round((v/totalNetWorthVND*100)*10) / 10
			}
		}
		for i := range holdings {
			mult := 1.0
			if holdings[i].Currency == "USD" {
				mult = usdVndRate
			}
			hVND := holdings[i].CurrentValue * mult
			holdings[i].PortfolioWeight = math.Round((hVND/totalNetWorthVND*100)*10) / 10
		}
	}

	totalPnL := totalNetWorthVND - totalCostBasisVND
	totalPnLRate := 0.0
	if totalCostBasisVND > 0 {
		totalPnLRate = math.Round((totalPnL/totalCostBasisVND*100)*100) / 100
	}

	estYield := 0.0
	if totalCostBasisVND > 0 {
		estYield = math.Round((totalDividendsVND/totalCostBasisVND*100)*100) / 100
	}

	recent := ps.transactions
	if len(recent) > 10 {
		recent = recent[:10]
	}

	return model.PortfolioSummary{
		TotalNetWorth:      math.Round(totalNetWorthVND),
		TotalCostBasis:     math.Round(totalCostBasisVND),
		TotalUnrealizedPnL: math.Round(totalPnL),
		TotalPnLRate:       totalPnLRate,
		TotalDividends:     math.Round(totalDividendsVND),
		EstimatedYield:     estYield,
		AssetAllocation:    allocationPct,
		Holdings:           holdings,
		RecentTransactions: recent,
		UpdatedAt:          time.Now(),
	}
}
