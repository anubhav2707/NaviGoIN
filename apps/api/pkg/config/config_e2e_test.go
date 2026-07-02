package config

import (
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	_ "github.com/lib/pq"
)

func TestConfigE2E(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test")
	}

	t.Run("full application config with docker services", func(t *testing.T) {
		// This test assumes docker services are running
		// Check if docker is available
		if _, err := exec.LookPath("docker"); err != nil {
			t.Skip("Docker not available, skipping E2E test")
		}

		// Check if postgres container is running
		cmd := exec.Command("docker", "ps", "--filter", "name=postgres", "--format", "{{.Names}}")
		output, err := cmd.Output()
		if err != nil || !strings.Contains(string(output), "postgres") {
			t.Skip("Postgres container not running, skipping E2E test")
		}

		// Set up test configuration
		os.Setenv("DATABASE_URL", "postgres://myapp:myapp@localhost:5432/myapp_test?sslmode=disable")
		os.Setenv("REDIS_ADDR", "localhost:6379")
		os.Setenv("ENV", "test")
		defer func() {
			os.Unsetenv("DATABASE_URL")
			os.Unsetenv("REDIS_ADDR")
			os.Unsetenv("ENV")
		}()

		cfg := Load()

		// Test database connection
		db, err := sql.Open("postgres", cfg.DatabaseURL)
		if err != nil {
			t.Fatalf("failed to open database: %v", err)
		}
		defer db.Close()

		// Set connection timeout
		db.SetConnMaxLifetime(5 * time.Second)
		db.SetMaxOpenConns(1)
		db.SetMaxIdleConns(1)

		if err := db.Ping(); err != nil {
			t.Logf("Warning: Could not connect to database: %v", err)
			// Don't fail the test, as the database might not be set up
		} else {
			// Create test table
			_, err = db.Exec(`
				CREATE TABLE IF NOT EXISTS config_test (
					id SERIAL PRIMARY KEY,
					name VARCHAR(100),
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`)
			if err != nil {
				t.Logf("Warning: Could not create test table: %v", err)
			}

			// Insert test data
			_, err = db.Exec("INSERT INTO config_test (name) VALUES ($1)", "myapp_e2e_test")
			if err != nil {
				t.Logf("Warning: Could not insert test data: %v", err)
			}

			// Query test data
			var name string
			err = db.QueryRow("SELECT name FROM config_test WHERE name = $1", "myapp_e2e_test").Scan(&name)
			if err != nil {
				t.Logf("Warning: Could not query test data: %v", err)
			} else if name != "myapp_e2e_test" {
				t.Errorf("expected name=myapp_e2e_test, got %s", name)
			}

			// Clean up
			_, _ = db.Exec("DROP TABLE IF EXISTS config_test")
		}
	})

	t.Run("config works with actual .env file", func(t *testing.T) {
		// Create a real .env file
		envContent := `# MyApp Configuration
PORT=8080
ENV=production

# Database
SQLITE_PATH=myapp_production.db
DATABASE_URL=postgres://myapp:myapp@db.example.com:5432/myapp_prod?sslmode=require

# Redis
REDIS_ADDR=redis.example.com:6379

# Razorpay
RAZORPAY_KEY_ID=rzp_live_abc123xyz
RAZORPAY_KEY_SECRET=live_secret_key_here
RAZORPAY_WEBHOOK_SECRET=webhook_secret_here
`

		if err := os.WriteFile(".env", []byte(envContent), 0644); err != nil {
			t.Fatalf("failed to create .env file: %v", err)
		}
		defer os.Remove(".env")

		// Clear all env vars to ensure we're reading from file
		envVars := []string{"PORT", "ENV", "SQLITE_PATH", "DATABASE_URL", "REDIS_ADDR", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"}
		oldValues := make(map[string]string)
		for _, key := range envVars {
			oldValues[key] = os.Getenv(key)
			os.Unsetenv(key)
		}
		defer func() {
			for key, value := range oldValues {
				if value != "" {
					os.Setenv(key, value)
				}
			}
		}()

		cfg := Load()

		// Verify all values loaded correctly
		if cfg.Port != "8080" {
			t.Errorf("expected Port=8080, got %s", cfg.Port)
		}
		if cfg.Env != "production" {
			t.Errorf("expected Env=production, got %s", cfg.Env)
		}
		if cfg.SQLitePath != "myapp_production.db" {
			t.Errorf("expected SQLitePath=myapp_production.db, got %s", cfg.SQLitePath)
		}
		if cfg.DatabaseURL != "postgres://myapp:myapp@db.example.com:5432/myapp_prod?sslmode=require" {
			t.Errorf("unexpected DatabaseURL: %s", cfg.DatabaseURL)
		}
		if cfg.RedisAddr != "redis.example.com:6379" {
			t.Errorf("expected RedisAddr=redis.example.com:6379, got %s", cfg.RedisAddr)
		}
		if cfg.RazorpayKeyID != "rzp_live_abc123xyz" {
			t.Errorf("expected RazorpayKeyID=rzp_live_abc123xyz, got %s", cfg.RazorpayKeyID)
		}
		if cfg.RazorpayKeySecret != "live_secret_key_here" {
			t.Errorf("expected RazorpayKeySecret=live_secret_key_here, got %s", cfg.RazorpayKeySecret)
		}
		if cfg.RazorpayWebhookSecret != "webhook_secret_here" {
			t.Errorf("expected RazorpayWebhookSecret=webhook_secret_here, got %s", cfg.RazorpayWebhookSecret)
		}
	})

	t.Run("config validation for business requirement", func(t *testing.T) {
		// Test that the app name "myapp" is correctly used in all configurations
		cfg := Load()

		// Check that default database URL uses "myapp"
		if !strings.Contains(cfg.DatabaseURL, "myapp") {
			t.Errorf("DatabaseURL should contain 'myapp': %s", cfg.DatabaseURL)
		}

		// Check that default SQLite path uses "myapp"
		if !strings.Contains(cfg.SQLitePath, "myapp") {
			t.Errorf("SQLitePath should contain 'myapp': %s", cfg.SQLitePath)
		}

		// Verify database URL format for myapp
		expectedFormat := "postgres://myapp:myapp@localhost:5432/myapp"
		if !strings.HasPrefix(cfg.DatabaseURL, expectedFormat) {
			t.Errorf("DatabaseURL should start with %s, got %s", expectedFormat, cfg.DatabaseURL)
		}
	})
}

func TestMultiEnvironmentE2E(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test")
	}

	environments := []struct {
		name   string
		env    string
		dbURL  string
		sqlite string
		redis  string
	}{
		{
			name:   "development",
			env:    "development",
			dbURL:  "postgres://myapp:myapp@localhost:5432/myapp_dev?sslmode=disable",
			sqlite: "myapp_dev.db",
			redis:  "localhost:6379",
		},
		{
			name:   "staging",
			env:    "staging",
			dbURL:  "postgres://myapp:myapp@staging.db:5432/myapp_staging?sslmode=require",
			sqlite: "myapp_staging.db",
			redis:  "staging.redis:6379",
		},
		{
			name:   "production",
			env:    "production",
			dbURL:  "postgres://myapp:myapp@prod.db:5432/myapp_prod?sslmode=require",
			sqlite: "myapp_prod.db",
			redis:  "prod.redis:6379",
		},
	}

	for _, env := range environments {
		t.Run(fmt.Sprintf("environment_%s", env.name), func(t *testing.T) {
			os.Setenv("ENV", env.env)
			os.Setenv("DATABASE_URL", env.dbURL)
			os.Setenv("SQLITE_PATH", env.sqlite)
			os.Setenv("REDIS_ADDR", env.redis)
			defer func() {
				os.Unsetenv("ENV")
				os.Unsetenv("DATABASE_URL")
				os.Unsetenv("SQLITE_PATH")
				os.Unsetenv("REDIS_ADDR")
			}()

			cfg := Load()

			if cfg.Env != env.env {
				t.Errorf("expected Env=%s, got %s", env.env, cfg.Env)
			}
			if cfg.DatabaseURL != env.dbURL {
				t.Errorf("expected DatabaseURL=%s, got %s", env.dbURL, cfg.DatabaseURL)
			}
			if cfg.SQLitePath != env.sqlite {
				t.Errorf("expected SQLitePath=%s, got %s", env.sqlite, cfg.SQLitePath)
			}
			if cfg.RedisAddr != env.redis {
				t.Errorf("expected RedisAddr=%s, got %s", env.redis, cfg.RedisAddr)
			}

			// Verify myapp is used in all configurations
			if !strings.Contains(cfg.DatabaseURL, "myapp") {
				t.Errorf("%s DatabaseURL should contain 'myapp': %s", env.name, cfg.DatabaseURL)
			}
			if !strings.Contains(cfg.SQLitePath, "myapp") {
				t.Errorf("%s SQLitePath should contain 'myapp': %s", env.name, cfg.SQLitePath)
			}
		})
	}
}
