package portfolio

import (
	"fmt"
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

	// Đọc toàn bộ dữ liệu giao dịch thực tế từ Database
	if repo != nil {
		if txs, err := repo.GetTransactions(); err == nil {
			store.transactions = txs
			log.Printf("[Portfolio] Loaded %d real transactions from Database", len(txs))
		} else {
			log.Printf("[Portfolio] Error loading transactions: %v", err)
		}
	}

	return store
}

// AddTransaction thêm giao dịch mới vào sổ cái và lưu vào Database
func (ps *PortfolioStore) AddTransaction(tx model.Transaction) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if tx.ID == "" {
		tx.ID = fmt.Sprintf("tx-%d", time.Now().UnixNano())
	}
	if tx.TransactionDate.IsZero() {
		tx.TransactionDate = time.Now()
	}
	if tx.TotalAmount == 0 {
		tx.TotalAmount = tx.Quantity*tx.Price + tx.Fee + tx.Tax
	}

	if ps.repo != nil {
		if err := ps.repo.InsertTransaction(&tx); err != nil {
			log.Printf("[Portfolio] InsertTransaction error: %v", err)
		}
	}

	ps.transactions = append([]model.Transaction{tx}, ps.transactions...)
}

// DeleteTransaction xóa giao dịch theo ID với kiểm tra quyền sở hữu (hoặc admin nếu userID="")
func (ps *PortfolioStore) DeleteTransaction(id string) bool {
	return ps.DeleteTransactionForUser(id, "")
}

func (ps *PortfolioStore) DeleteTransactionForUser(id string, userID string) bool {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if ps.repo != nil {
		if err := ps.repo.DeleteTransactionForUser(id, userID); err != nil {
			log.Printf("[Portfolio] DeleteTransactionForUser error: %v", err)
			return false
		}
	}

	for i, tx := range ps.transactions {
		if tx.ID == id && (userID == "" || tx.UserID == userID || tx.UserID == "") {
			ps.transactions = append(ps.transactions[:i], ps.transactions[i+1:]...)
			return true
		}
	}
	return false
}

// ResetPortfolio xóa sạch toàn bộ sổ cái của một người dùng
func (ps *PortfolioStore) ResetPortfolio() {
	ps.ResetPortfolioForUser("")
}

func (ps *PortfolioStore) ResetPortfolioForUser(userID string) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	if ps.repo != nil {
		if err := ps.repo.ClearTransactionsByUser(userID); err != nil {
			log.Printf("[Portfolio] ClearTransactionsByUser error: %v", err)
		}
	}

	if userID == "" {
		ps.transactions = []model.Transaction{}
	} else {
		var remaining []model.Transaction
		for _, tx := range ps.transactions {
			if tx.UserID != userID {
				remaining = append(remaining, tx)
			}
		}
		ps.transactions = remaining
	}
}

// GetTransactions lấy danh sách giao dịch thực tế
func (ps *PortfolioStore) GetTransactions() []model.Transaction {
	return ps.GetTransactionsByUser("")
}

func (ps *PortfolioStore) GetTransactionsByUser(userID string) []model.Transaction {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	if userID == "" {
		res := make([]model.Transaction, len(ps.transactions))
		copy(res, ps.transactions)
		return res
	}

	var res []model.Transaction
	for _, tx := range ps.transactions {
		if tx.UserID == userID {
			res = append(res, tx)
		}
	}
	return res
}

// GetSummary tính toán tài sản ròng, PnL, DCA, cổ tức và tỷ trọng toàn bộ
func (ps *PortfolioStore) GetSummary(assetMap map[string]model.Asset, usdVndRate float64) model.PortfolioSummary {
	return ps.GetSummaryByUser("", assetMap, usdVndRate)
}

// GetSummaryByUser tính toán danh mục cho một user cụ thể (nếu userID=="" là Guest mode)
func (ps *PortfolioStore) GetSummaryByUser(userID string, assetMap map[string]model.Asset, usdVndRate float64) model.PortfolioSummary {
	ps.mu.RLock()
	defer ps.mu.RUnlock()

	var userTxs []model.Transaction
	if userID == "" {
		// Guest mode: Không có user đăng nhập
		// Nếu có giao dịch demo (usr-demo) hoặc không, hiển thị mẫu hoặc trống
		for _, tx := range ps.transactions {
			if tx.UserID == "usr-demo" || tx.UserID == "" {
				userTxs = append(userTxs, tx)
			}
		}
	} else {
		for _, tx := range ps.transactions {
			if tx.UserID == userID {
				userTxs = append(userTxs, tx)
			}
		}
	}

	if len(userTxs) == 0 {
		return model.PortfolioSummary{
			IsGuest:            userID == "",
			UserID:             userID,
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

	for _, tx := range userTxs {
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
		"Vàng (Gold)":            0,
		"Cổ phiếu VN (Stock VN)": 0,
		"Cổ phiếu Mỹ (Stock US)": 0,
		"Crypto":                 0,
		"Tiền mặt & Cổ tức":      0,
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

	recent := userTxs
	if len(recent) > 10 {
		recent = recent[:10]
	}

	return model.PortfolioSummary{
		IsGuest:            userID == "",
		UserID:             userID,
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
