package config

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

func TestConfigIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Run("SQLite configuration works", func(t *testing.T) {
		tmpFile := "test_myapp.db"
		os.Setenv("SQLITE_PATH", tmpFile)
		defer func() {
			os.Unsetenv("SQLITE_PATH")
			os.Remove(tmpFile)
		}()

		cfg := Load()

		if cfg.SQLitePath != tmpFile {
			t.Errorf("expected SQLitePath=%s, got %s", tmpFile, cfg.SQLitePath)
		}

		// Test SQLite connection
		db, err := sql.Open("sqlite3", cfg.SQLitePath)
		if err != nil {
			t.Fatalf("failed to open SQLite: %v", err)
		}
		defer db.Close()

		if err := db.Ping(); err != nil {
			t.Fatalf("failed to ping SQLite: %v", err)
		}
	})

	t.Run("Postgres configuration format is valid", func(t *testing.T) {
		customURL := "postgres://testuser:testpass@testhost:5433/testdb?sslmode=require"
		os.Setenv("DATABASE_URL", customURL)
		defer os.Unsetenv("DATABASE_URL")

		cfg := Load()

		if cfg.DatabaseURL != customURL {
			t.Errorf("expected DatabaseURL=%s, got %s", customURL, cfg.DatabaseURL)
		}

		// Validate connection string format (won't actually connect)
		config, err := sql.Open("postgres", cfg.DatabaseURL)
		if err != nil {
			t.Fatalf("invalid postgres connection string format: %v", err)
		}
		defer config.Close()
	})

	t.Run("loads .env file if present", func(t *testing.T) {
		// Create a temporary .env file
		envContent := `PORT=7777
ENV=testing
SQLITE_PATH=from_env_file.db`
		if err := os.WriteFile(".env", []byte(envContent), 0644); err != nil {
			t.Fatalf("failed to create .env file: %v", err)
		}
		defer os.Remove(".env")

		// Clear existing env vars to ensure we're reading from file
		oldPort := os.Getenv("PORT")
		oldEnv := os.Getenv("ENV")
		oldSQLitePath := os.Getenv("SQLITE_PATH")
		os.Unsetenv("PORT")
		os.Unsetenv("ENV")
		os.Unsetenv("SQLITE_PATH")
		defer func() {
			if oldPort != "" {
				os.Setenv("PORT", oldPort)
			}
			if oldEnv != "" {
				os.Setenv("ENV", oldEnv)
			}
			if oldSQLitePath != "" {
				os.Setenv("SQLITE_PATH", oldSQLitePath)
			}
		}()

		cfg := Load()

		if cfg.Port != "7777" {
			t.Errorf("expected Port=7777 from .env file, got %s", cfg.Port)
		}
		if cfg.Env != "testing" {
			t.Errorf("expected Env=testing from .env file, got %s", cfg.Env)
		}
		if cfg.SQLitePath != "from_env_file.db" {
			t.Errorf("expected SQLitePath=from_env_file.db from .env file, got %s", cfg.SQLitePath)
		}
	})

	t.Run("environment variables override .env file", func(t *testing.T) {
		// Create a .env file
		envContent := `PORT=6666`
		if err := os.WriteFile(".env", []byte(envContent), 0644); err != nil {
			t.Fatalf("failed to create .env file: %v", err)
		}
		defer os.Remove(".env")

		// Set environment variable that should override .env
		os.Setenv("PORT", "8888")
		defer os.Unsetenv("PORT")

		cfg := Load()

		if cfg.Port != "8888" {
			t.Errorf("expected env var to override .env file, got Port=%s", cfg.Port)
		}
	})

	t.Run("redis address format validation", func(t *testing.T) {
		testCases := []struct {
			name     string
			addr     string
			expected string
		}{
			{"default", "", "localhost:6379"},
			{"custom host", "redis.example.com:6379", "redis.example.com:6379"},
			{"custom port", "localhost:16379", "localhost:16379"},
			{"IP address", "192.168.1.100:6379", "192.168.1.100:6379"},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				if tc.addr != "" {
					os.Setenv("REDIS_ADDR", tc.addr)
					defer os.Unsetenv("REDIS_ADDR")
				}

				cfg := Load()

				if cfg.RedisAddr != tc.expected {
					t.Errorf("expected RedisAddr=%s, got %s", tc.expected, cfg.RedisAddr)
				}
			})
		}
	})
}

func TestRazorpayConfigIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Run("Razorpay credentials format validation", func(t *testing.T) {
		testCases := []struct {
			name   string
			keyID  string
			secret string
			webhook string
		}{
			{
				name:   "test credentials",
				keyID:  "rzp_test_abcdef123456",
				secret: "testsecretkey123",
				webhook: "webhooksecret456",
			},
			{
				name:   "live credentials format",
				keyID:  "rzp_live_xyz789012345",
				secret: "livesecretkey789",
				webhook: "livewebhooksecret",
			},
			{
				name:   "empty credentials",
				keyID:  "",
				secret: "",
				webhook: "",
			},
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				os.Setenv("RAZORPAY_KEY_ID", tc.keyID)
				os.Setenv("RAZORPAY_KEY_SECRET", tc.secret)
				os.Setenv("RAZORPAY_WEBHOOK_SECRET", tc.webhook)
				defer func() {
					os.Unsetenv("RAZORPAY_KEY_ID")
					os.Unsetenv("RAZORPAY_KEY_SECRET")
					os.Unsetenv("RAZORPAY_WEBHOOK_SECRET")
				}()

				cfg := Load()

				if cfg.RazorpayKeyID != tc.keyID {
					t.Errorf("expected RazorpayKeyID=%s, got %s", tc.keyID, cfg.RazorpayKeyID)
				}
				if cfg.RazorpayKeySecret != tc.secret {
					t.Errorf("expected RazorpayKeySecret=%s, got %s", tc.secret, cfg.RazorpayKeySecret)
				}
				if cfg.RazorpayWebhookSecret != tc.webhook {
					t.Errorf("expected RazorpayWebhookSecret=%s, got %s", tc.webhook, cfg.RazorpayWebhookSecret)
				}
			})
		}
	})
}

func TestEnvironmentModeIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	t.Run("validates environment mode values", func(t *testing.T) {
		validModes := []string{"development", "staging", "production", "test"}

		for _, mode := range validModes {
			t.Run(fmt.Sprintf("mode_%s", mode), func(t *testing.T) {
				os.Setenv("ENV", mode)
				defer os.Unsetenv("ENV")

				cfg := Load()

				if cfg.Env != mode {
					t.Errorf("expected Env=%s, got %s", mode, cfg.Env)
				}
			})
		}
	})

	t.Run("defaults to development mode", func(t *testing.T) {
		os.Unsetenv("ENV")

		cfg := Load()

		if cfg.Env != "development" {
			t.Errorf("expected default Env=development, got %s", cfg.Env)
		}
	})
}
