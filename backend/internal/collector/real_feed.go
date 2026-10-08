package collector

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"fin-tracker-backend/internal/model"
)

type RealMarketFeed struct {
	httpClient *http.Client
}

func NewRealMarketFeed() *RealMarketFeed {
	return &RealMarketFeed{
		httpClient: &http.Client{
			Timeout: 6 * time.Second,
		},
	}
}

// Binance 24hr ticker response
type binanceTicker struct {
	Symbol             string `json:"symbol"`
	LastPrice          string `json:"lastPrice"`
	PriceChange        string `json:"priceChange"`
	PriceChangePercent string `json:"priceChangePercent"`
	HighPrice          string `json:"highPrice"`
	LowPrice           string `json:"lowPrice"`
	Volume             string `json:"volume"`
}

// Exchange rate response
type exchangeRateResponse struct {
	Result string             `json:"result"`
	Rates  map[string]float64 `json:"rates"`
}

// Yahoo Finance chart response
type yahooChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Currency                   string  `json:"currency"`
				Symbol                     string  `json:"symbol"`
				RegularMarketPrice         float64 `json:"regularMarketPrice"`
				RegularMarketChangePercent float64 `json:"regularMarketChangePercent"`
				RegularMarketDayHigh       float64 `json:"regularMarketDayHigh"`
				RegularMarketDayLow        float64 `json:"regularMarketDayLow"`
				RegularMarketVolume        float64 `json:"regularMarketVolume"`
			} `json:"meta"`
			Timestamp []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Open   []float64 `json:"open"`
					High   []float64 `json:"high"`
					Low    []float64 `json:"low"`
					Close  []float64 `json:"close"`
					Volume []float64 `json:"volume"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error interface{} `json:"error"`
	} `json:"chart"`
}

// FetchLiveUSDVND gets real-time USD/VND rate
func (f *RealMarketFeed) FetchLiveUSDVND() (float64, error) {
	url := "https://open.er-api.com/v6/latest/USD"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("User-Agent", "FinTrackerPro/1.0")

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data exchangeRateResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return 0, err
	}

	vnd, ok := data.Rates["VND"]
	if !ok || vnd <= 0 {
		return 0, fmt.Errorf("VND rate not found")
	}
	return vnd, nil
}

// FetchBinanceCrypto gets real live price from Binance
func (f *RealMarketFeed) FetchBinanceCrypto(symbol string) (*model.Asset, error) {
	url := fmt.Sprintf("https://api.binance.com/api/v3/ticker/24hr?symbol=%s", symbol)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tick binanceTicker
	if err := json.Unmarshal(body, &tick); err != nil {
		return nil, err
	}

	price, _ := strconv.ParseFloat(tick.LastPrice, 64)
	chgPct, _ := strconv.ParseFloat(tick.PriceChangePercent, 64)
	chgAmt, _ := strconv.ParseFloat(tick.PriceChange, 64)
	high, _ := strconv.ParseFloat(tick.HighPrice, 64)
	low, _ := strconv.ParseFloat(tick.LowPrice, 64)
	vol, _ := strconv.ParseFloat(tick.Volume, 64)

	var assetID, assetName, coinSymbol string
	if symbol == "BTCUSDT" {
		assetID = "CRYPTO-BTC"
		assetName = "Bitcoin Realtime"
		coinSymbol = "BTC"
	} else {
		assetID = "CRYPTO-ETH"
		assetName = "Ethereum Realtime"
		coinSymbol = "ETH"
	}

	return &model.Asset{
		ID:            assetID,
		Symbol:        coinSymbol,
		Name:          assetName,
		AssetType:     model.AssetTypeCrypto,
		Currency:      "USD",
		Exchange:      "BINANCE",
		CurrentPrice:  price,
		ChangeAmount:  chgAmt,
		ChangePercent: chgPct,
		High24h:       high,
		Low24h:        low,
		Volume:        vol,
		UpdatedAt:     time.Now(),
	}, nil
}

// FetchYahooQuote gets real-time quotes for US stocks, Spot Gold, or VN stocks
func (f *RealMarketFeed) FetchYahooQuote(yahooSymbol string, assetID string, name string, assetType string, currency string) (*model.Asset, []model.Candle, error) {
	url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=30d", yahooSymbol)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

	resp, err := f.httpClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}

	var data yahooChartResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, nil, err
	}

	if len(data.Chart.Result) == 0 {
		return nil, nil, fmt.Errorf("no results for symbol %s", yahooSymbol)
	}

	meta := data.Chart.Result[0].Meta
	price := meta.RegularMarketPrice
	chgPct := meta.RegularMarketChangePercent
	high := meta.RegularMarketDayHigh
	low := meta.RegularMarketDayLow
	vol := meta.RegularMarketVolume

	symbol := meta.Symbol
	if assetID == "XAU-USD" {
		symbol = "XAU/USD"
	} else if len(symbol) > 3 && symbol[len(symbol)-3:] == ".VN" {
		symbol = symbol[:len(symbol)-3] // "FPT.VN" -> "FPT"
	}

	asset := &model.Asset{
		ID:            assetID,
		Symbol:        symbol,
		Name:          name,
		AssetType:     model.AssetType(assetType),
		Currency:      currency,
		Exchange:      "YAHOO",
		CurrentPrice:  price,
		ChangeAmount:  price * (chgPct / 100),
		ChangePercent: chgPct,
		High24h:       high,
		Low24h:        low,
		Volume:        vol,
		UpdatedAt:     time.Now(),
	}

	// Extract real candles
	var candles []model.Candle
	res := data.Chart.Result[0]
	if len(res.Timestamp) > 0 && len(res.Indicators.Quote) > 0 {
		q := res.Indicators.Quote[0]
		for i, t := range res.Timestamp {
			if i < len(q.Open) && i < len(q.High) && i < len(q.Low) && i < len(q.Close) && i < len(q.Volume) {
				if q.Close[i] > 0 {
					candles = append(candles, model.Candle{
						Timestamp: t,
						Open:      q.Open[i],
						High:      q.High[i],
						Low:       q.Low[i],
						Close:     q.Close[i],
						Volume:    q.Volume[i],
					})
				}
			}
		}
	}

	return asset, candles, nil
}
