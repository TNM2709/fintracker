package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"fin-tracker-backend/internal/database"
)

func main() {
	database.LoadEnv()

	flag.Usage = func() {
		fmt.Println("=======================================================")
		fmt.Println(" 🛠️  FinTracker Pro - Database Migration Management CLI")
		fmt.Println("=======================================================")
		fmt.Println("Usage:")
		fmt.Println("  go run ./cmd/migrate <command>")
		fmt.Println("  or migrate.bat <command>")
		fmt.Println("")
		fmt.Println("Commands:")
		fmt.Println("  up       Apply all pending database migrations")
		fmt.Println("  down     Rollback the most recent applied migration")
		fmt.Println("  status   Display current status of all migrations")
		fmt.Println("=======================================================")
	}

	if len(os.Args) < 2 {
		flag.Usage()
		os.Exit(1)
	}

	command := os.Args[1]

	db, driver, err := database.ConnectDB()
	if err != nil {
		log.Fatalf("❌ Failed to initialize database: %v", err)
	}
	defer db.Close()

	migrationsDir := database.LocateMigrationsDir()
	log.Printf("[CLI] Connected Database Engine: [%s]", driver)
	log.Printf("[CLI] Migration Files Directory: [%s]", migrationsDir)

	switch command {
	case "up":
		log.Println("[CLI] 🚀 Executing 'up' migrations...")
		if err := database.RunMigrations(db, migrationsDir); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
		log.Println("✨ All migrations are up to date!")

	case "down":
		log.Println("[CLI] ⏪ Executing 'down' rollback...")
		if err := database.RollbackLastMigration(db, migrationsDir); err != nil {
			log.Fatalf("❌ Rollback failed: %v", err)
		}
		log.Println("✨ Rollback complete!")

	case "status":
		log.Println("[CLI] 📋 Checking migration status...")
		report, err := database.GetMigrationReport(db, migrationsDir)
		if err != nil {
			log.Fatalf("❌ Failed to retrieve report: %v", err)
		}

		fmt.Println("\n+--------+------------------------------------+------------+-------------------------+")
		fmt.Println("| Version| Migration Name                     | Status     | Applied At              |")
		fmt.Println("+--------+------------------------------------+------------+-------------------------+")
		for _, item := range report {
			statusStr := "PENDING ⏳"
			appliedAtStr := "-"
			if item.Applied {
				statusStr = "APPLIED ✅"
				if item.AppliedAt != nil {
					appliedAtStr = item.AppliedAt.Format(time.RFC3339)
				}
			}
			fmt.Printf("| %-6s | %-34s | %-10s | %-23s |\n", item.Version, item.Name, statusStr, appliedAtStr)
		}
		fmt.Println("+--------+------------------------------------+------------+-------------------------+\n")

	default:
		log.Printf("❌ Unknown command: %s", command)
		flag.Usage()
		os.Exit(1)
	}
}
