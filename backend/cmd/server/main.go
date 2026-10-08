package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"fin-tracker-backend/internal/alert"
	"fin-tracker-backend/internal/collector"
	"fin-tracker-backend/internal/database"
	"fin-tracker-backend/internal/handler"
	"fin-tracker-backend/internal/model"
	"fin-tracker-backend/internal/notification"
	"fin-tracker-backend/internal/portfolio"
	"fin-tracker-backend/internal/swagger"
)

func main() {
	database.LoadEnv()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("=====================================================")
	log.Printf("🚀 Starting High-Performance Golang Financial Engine")
	log.Printf("   Port: %s", port)
	log.Printf("=====================================================")

	// 1. Khởi tạo Database (PostgreSQL với SQLite fallback & GORM Auto-Migration)
	db, driver, err := database.InitGORM()
	if err != nil {
		log.Fatalf("Fatal: failed to initialize database: %v", err)
	}
	sqlDB, _ := db.DB()
	if sqlDB != nil {
		defer sqlDB.Close()
	}
	repo := database.NewRepository(db, driver)

	// 2. Khởi tạo các Core Services kết nối với Database & Live Market Feed
	centralCollector := collector.NewCentralCollector(repo)
	portfolioStore := portfolio.NewPortfolioStore(repo)
	alertStore := alert.NewAlertStore(repo)
	notificationStore := notification.NewService(repo)
	wsHub := handler.NewHub()

	// Chạy WebSocket Hub trong Goroutine riêng
	go wsHub.Run()

	// Kết nối Notification Service với WebSocket Hub để push thông báo realtime
	notificationStore.RegisterListener(func(notif model.Notification) {
		data, err := json.Marshal(map[string]interface{}{
			"type":         "NOTIFICATION_RECEIVED",
			"notification": notif,
		})
		if err == nil {
			wsHub.BroadcastJSON(data)
		}
	})

	// Kết nối Collector với WebSocket để đẩy dữ liệu giá nhảy realtime & kiểm tra cảnh báo
	centralCollector.RegisterListener(func(summary model.MarketSummary) {
		// Broadcast bảng giá realtime
		data, err := json.Marshal(map[string]interface{}{
			"type": "MARKET_UPDATE",
			"data": summary,
		})
		if err == nil {
			wsHub.BroadcastJSON(data)
		}

		// Kiểm tra ngưỡng cảnh báo giá
		priceMap := make(map[string]float64)
		for _, a := range summary.AllAssets {
			priceMap[a.ID] = a.CurrentPrice
		}
		newTriggers := alertStore.CheckTriggers(priceMap)
		for _, alt := range newTriggers {
			// Kích hoạt thông báo trong notificationStore
			currentPrice := priceMap[alt.AssetID]
			notificationStore.HandlePriceAlertTriggered(alt, currentPrice)

			altData, err := json.Marshal(map[string]interface{}{
				"type":  "ALERT_TRIGGERED",
				"alert": alt,
			})
			if err == nil {
				wsHub.BroadcastJSON(altData)
			}
		}

		// Kiểm tra biến động mạnh thị trường theo tùy biến thông báo của người dùng
		notificationStore.CheckMarketVolatility(summary)
	})

	// Bắt đầu vòng lặp cào và cập nhật giá mỗi 6 giây
	centralCollector.StartUpdateLoop(6 * time.Second)

	// 2. Khởi tạo Chi Router & Middleware
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","engine":"Golang High-Throughput Service","time":"` + time.Now().Format(time.RFC3339) + `"}`))
	})

	// 3. Đăng ký REST API & WebSocket handlers
	apiHandler := handler.NewAPIHandler(centralCollector, portfolioStore, alertStore, notificationStore, repo, wsHub)
	apiHandler.RegisterRoutes(r)
	swagger.RegisterRoutes(r)

	// 4. Phục vụ Static Single-Page App nếu frontend/dist tồn tại
	distDir := "../frontend/dist"
	if fi, err := os.Stat(distDir); err != nil || !fi.IsDir() {
		distDir = "./frontend/dist"
	}
	if fi, err := os.Stat(distDir); err == nil && fi.IsDir() {
		log.Printf("📦 Serving static frontend SPA from %s", distDir)
		fs := http.FileServer(http.Dir(distDir))
		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			target := distDir + r.URL.Path
			if fi, err := os.Stat(target); os.IsNotExist(err) || fi.IsDir() {
				http.ServeFile(w, r, distDir+"/index.html")
				return
			}
			fs.ServeHTTP(w, r)
		})
	}

	// 5. Khởi chạy HTTP Server với Graceful Shutdown
	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Printf("⚠️ Port %s unavailable (%v), attempting fallback to port 8081...", port, err)
		port = "8081"
		listener, err = net.Listen("tcp", ":"+port)
		if err != nil {
			log.Fatalf("Fatal: failed to listen on port %s: %v", port, err)
		}
	}

	server := &http.Server{
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("⚡ Go Backend HTTP & WebSocket Server listening on http://localhost:%s", port)
		log.Printf("📖 Swagger UI & API Schema Docs available at: http://localhost:%s/swagger", port)
		serverErrors <- server.Serve(listener)
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	case sig := <-shutdown:
		log.Printf("Received signal %v, gracefully shutting down...", sig)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown failed: %v", err)
			server.Close()
		}
		log.Printf("Server stopped safely.")
	}

	fmt.Println("Backend finished.")
}
