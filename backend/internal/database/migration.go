package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type MigrationStatus struct {
	Version   string
	Name      string
	Applied   bool
	AppliedAt *time.Time
}

// ConnectDB connects to database and returns *sql.DB for raw migration CLI
func ConnectDB() (*sql.DB, string, error) {
	dbGorm, driver, err := ConnectGORM()
	if err != nil {
		return nil, "", err
	}
	sqlDB, err := dbGorm.DB()
	if err != nil {
		return nil, "", err
	}
	return sqlDB, driver, nil
}

// LocateMigrationsDir locates the migrations directory across working directories
func LocateMigrationsDir() string {
	candidates := []string{
		"migrations",
		"backend/migrations",
		"../migrations",
		"../../migrations",
	}
	for _, dir := range candidates {
		if stat, err := os.Stat(dir); err == nil && stat.IsDir() {
			return dir
		}
	}
	return "migrations"
}

// ensureMigrationTable creates the schema_migrations table if not exists
func ensureMigrationTable(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(64) PRIMARY KEY,
		applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err := db.Exec(query)
	return err
}

func parseTimeFlexible(val interface{}) time.Time {
	if val == nil {
		return time.Now()
	}
	switch v := val.(type) {
	case time.Time:
		return v
	case string:
		formats := []string{
			time.RFC3339Nano,
			time.RFC3339,
			"2006-01-02 15:04:05-07",
			"2006-01-02 15:04:05",
			"2006-01-02",
		}
		for _, f := range formats {
			if t, err := time.Parse(f, v); err == nil {
				return t
			}
		}
	case []byte:
		return parseTimeFlexible(string(v))
	}
	return time.Now()
}

// GetAppliedMigrations returns a map of applied version numbers to applied time
func GetAppliedMigrations(db *sql.DB) (map[string]time.Time, error) {
	if err := ensureMigrationTable(db); err != nil {
		return nil, err
	}

	rows, err := db.Query("SELECT version, applied_at FROM schema_migrations ORDER BY version ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]time.Time)
	for rows.Next() {
		var ver string
		var rawVal interface{}
		if err := rows.Scan(&ver, &rawVal); err != nil {
			return nil, err
		}
		applied[ver] = parseTimeFlexible(rawVal)
	}
	return applied, nil
}

// RunMigrations applies all pending .up.sql migrations in order
func RunMigrations(db *sql.DB, migrationsDir string) error {
	if err := ensureMigrationTable(db); err != nil {
		return fmt.Errorf("failed to ensure migration table: %w", err)
	}

	applied, err := GetAppliedMigrations(db)
	if err != nil {
		return fmt.Errorf("failed to fetch applied migrations: %w", err)
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("reading migrations directory '%s': %w", migrationsDir, err)
	}

	var upFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".up.sql") {
			upFiles = append(upFiles, f.Name())
		}
	}
	sort.Strings(upFiles)

	if len(upFiles) == 0 {
		log.Printf("[Migration] No migration files found in %s", migrationsDir)
		return nil
	}

	appliedCount := 0
	for _, filename := range upFiles {
		version := strings.Split(filename, "_")[0]
		if _, ok := applied[version]; ok {
			continue // Already applied
		}

		fullPath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			return fmt.Errorf("reading migration file %s: %w", filename, err)
		}

		log.Printf("[Migration] 🔄 Applying: %s ...", filename)
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("beginning transaction for %s: %w", filename, err)
		}

		if _, err := tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("executing migration %s: %w", filename, err)
		}

		// Record applied migration version
		if _, err := tx.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES ($1, CURRENT_TIMESTAMP)", version); err != nil {
			if _, err2 := tx.Exec("INSERT INTO schema_migrations (version, applied_at) VALUES (?, CURRENT_TIMESTAMP)", version); err2 != nil {
				tx.Rollback()
				return fmt.Errorf("recording migration %s: %v / %v", filename, err, err2)
			}
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("committing migration %s: %w", filename, err)
		}

		log.Printf("[Migration] ✅ Successfully applied: %s", filename)
		appliedCount++
	}

	if appliedCount == 0 {
		log.Printf("[Migration] Database schema is already up to date. (0 pending)")
	} else {
		log.Printf("[Migration] Successfully applied %d new migration(s).", appliedCount)
	}

	return nil
}

// RollbackLastMigration rolls back the most recent applied migration using .down.sql
func RollbackLastMigration(db *sql.DB, migrationsDir string) error {
	if err := ensureMigrationTable(db); err != nil {
		return err
	}

	applied, err := GetAppliedMigrations(db)
	if err != nil {
		return err
	}

	if len(applied) == 0 {
		log.Printf("[Migration] No applied migrations to rollback.")
		return nil
	}

	// Find highest version
	var versions []string
	for v := range applied {
		versions = append(versions, v)
	}
	sort.Strings(versions)
	lastVersion := versions[len(versions)-1]

	// Find down file
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return err
	}

	var downFilename string
	for _, f := range files {
		if strings.HasPrefix(f.Name(), lastVersion+"_") && strings.HasSuffix(f.Name(), ".down.sql") {
			downFilename = f.Name()
			break
		}
	}

	if downFilename == "" {
		return fmt.Errorf("down migration file not found for version %s", lastVersion)
	}

	fullPath := filepath.Join(migrationsDir, downFilename)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return fmt.Errorf("reading file %s: %w", downFilename, err)
	}

	log.Printf("[Migration] 🔄 Rolling back: %s ...", downFilename)
	tx, err := db.Begin()
	if err != nil {
		return err
	}

	if _, err := tx.Exec(string(content)); err != nil {
		tx.Rollback()
		return fmt.Errorf("executing rollback %s: %w", downFilename, err)
	}

	// Delete from schema_migrations
	if _, err := tx.Exec("DELETE FROM schema_migrations WHERE version = $1", lastVersion); err != nil {
		if _, err2 := tx.Exec("DELETE FROM schema_migrations WHERE version = ?", lastVersion); err2 != nil {
			tx.Rollback()
			return fmt.Errorf("deleting migration record %s: %v / %v", lastVersion, err, err2)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	log.Printf("[Migration] ⏪ Successfully rolled back: %s", downFilename)
	return nil
}

// GetMigrationReport returns details of all available migrations and statuses
func GetMigrationReport(db *sql.DB, migrationsDir string) ([]MigrationStatus, error) {
	applied, err := GetAppliedMigrations(db)
	if err != nil {
		return nil, err
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return nil, err
	}

	var upFiles []string
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".up.sql") {
			upFiles = append(upFiles, f.Name())
		}
	}
	sort.Strings(upFiles)

	var list []MigrationStatus
	for _, f := range upFiles {
		parts := strings.Split(f, "_")
		version := parts[0]
		name := strings.TrimSuffix(strings.Join(parts[1:], "_"), ".up.sql")

		st := MigrationStatus{
			Version: version,
			Name:    name,
		}
		if t, ok := applied[version]; ok {
			st.Applied = true
			st.AppliedAt = &t
		}
		list = append(list, st)
	}

	return list, nil
}
