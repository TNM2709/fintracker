package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"fin-tracker-backend/internal/model"
)

var (
	gormDB       *gorm.DB
	activeDriver string
	once         sync.Once
)

// LoadEnv loads .env from current or parent directories
func LoadEnv() {
	_ = godotenv.Load()
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("backend/.env")
}

// ConnectGORM connects to PostgreSQL or SQLite fallback using GORM ORM
func ConnectGORM() (*gorm.DB, string, error) {
	var initErr error
	once.Do(func() {
		LoadEnv()

		preferredDriver := stringsTrim(os.Getenv("DB_DRIVER"))
		if preferredDriver == "" {
			preferredDriver = "postgres"
		}

		sqlitePath := os.Getenv("SQLITE_PATH")
		if sqlitePath == "" {
			sqlitePath = filepath.Join("data", "fintracker.db")
		}

		gormConfig := &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		}

		if preferredDriver == "postgres" {
			db, err := connectGormPostgres(gormConfig)
			if err == nil {
				gormDB = db
				activeDriver = "postgres"
				log.Printf("[GORM] 🐘 Connected to PostgreSQL successfully via GORM.")
			} else {
				log.Printf("[GORM] ⚠️ PostgreSQL connection failed: %v", err)
				log.Printf("[GORM] 🔄 Falling back to pure Go SQLite at: %s", sqlitePath)
				dbLite, errLite := connectGormSQLite(sqlitePath, gormConfig)
				if errLite != nil {
					initErr = fmt.Errorf("both PostgreSQL and SQLite failed: %v / %v", err, errLite)
					return
				}
				gormDB = dbLite
				activeDriver = "sqlite"
			}
		} else {
			dbLite, errLite := connectGormSQLite(sqlitePath, gormConfig)
			if errLite != nil {
				initErr = fmt.Errorf("failed to open SQLite: %v", errLite)
				return
			}
			gormDB = dbLite
			activeDriver = "sqlite"
		}
	})

	if initErr != nil {
		return nil, "", initErr
	}
	return gormDB, activeDriver, nil
}

// InitGORM initializes connection and runs Auto-Migration across all Entities
func InitGORM() (*gorm.DB, string, error) {
	db, driver, err := ConnectGORM()
	if err != nil {
		return nil, "", err
	}

	log.Printf("[GORM] 🔄 Running GORM AutoMigrate for entity tracking & schema sync...")
	if err := db.AutoMigrate(
		&model.TransactionEntity{},
		&model.PriceAlertEntity{},
		&model.LiveAssetEntity{},
		&model.CandleHistoryEntity{},
	); err != nil {
		log.Printf("[GORM] ⚠️ AutoMigrate notice: %v", err)
		return db, driver, err
	}

	log.Printf("[GORM] ✅ All Entity schemas synchronized automatically (Transactions, Alerts, Assets, Candles)!")
	return db, driver, nil
}

func connectGormPostgres(cfg *gorm.Config) (*gorm.DB, error) {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		host := getEnvOrDefault("DB_HOST", "localhost")
		port := getEnvOrDefault("DB_PORT", "5432")
		user := getEnvOrDefault("DB_USER", "postgres")
		pass := getEnvOrDefault("DB_PASSWORD", "postgres")
		name := getEnvOrDefault("DB_NAME", "fintracker")
		ssl := getEnvOrDefault("DB_SSLMODE", "disable")

		connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Ho_Chi_Minh",
			host, port, user, pass, name, ssl)
	}

	db, err := gorm.Open(postgres.Open(connStr), cfg)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		sqlDB.Close()
		return nil, err
	}

	return db, nil
}

func connectGormSQLite(dbPath string, cfg *gorm.Config) (*gorm.DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("creating db dir: %w", err)
	}

	// Uses pure Go SQLite driver (no gcc or CGO needed)
	db, err := gorm.Open(sqlite.Open(dbPath), cfg)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err == nil {
		_, _ = sqlDB.Exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")
	}

	return db, nil
}

// GetGORM returns singleton instance
func GetGORM() *gorm.DB {
	return gormDB
}

// GetActiveDriver returns "postgres" or "sqlite"
func GetActiveDriver() string {
	return activeDriver
}

func getEnvOrDefault(key, def string) string {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	return v
}

func stringsTrim(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t' || s[0] == '\r' || s[0] == '\n') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t' || s[len(s)-1] == '\r' || s[len(s)-1] == '\n') {
		s = s[:len(s)-1]
	}
	return s
}
