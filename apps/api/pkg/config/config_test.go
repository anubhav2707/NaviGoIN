package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	t.Run("loads default values when env vars not set", func(t *testing.T) {
		// Clear all env vars
		os.Clearenv()

		cfg := Load()

		if cfg.Port != "8080" {
			t.Errorf("expected Port=8080, got %s", cfg.Port)
		}
		if cfg.DatabaseURL != "postgres://myapp:myapp@localhost:5432/myapp?sslmode=disable" {
			t.Errorf("expected default DatabaseURL, got %s", cfg.DatabaseURL)
		}
		if cfg.SQLitePath != "myapp.db" {
			t.Errorf("expected SQLitePath=myapp.db, got %s", cfg.SQLitePath)
		}
		if cfg.RedisAddr != "localhost:6379" {
			t.Errorf("expected RedisAddr=localhost:6379, got %s", cfg.RedisAddr)
		}
		if cfg.Env != "development" {
			t.Errorf("expected Env=development, got %s", cfg.Env)
		}
	})

	t.Run("loads values from environment variables", func(t *testing.T) {
		os.Setenv("PORT", "9090")
		os.Setenv("DATABASE_URL", "postgres://custom:custom@db:5432/customdb")
		os.Setenv("SQLITE_PATH", "custom.db")
		os.Setenv("REDIS_ADDR", "redis:6379")
		os.Setenv("ENV", "production")
		os.Setenv("RAZORPAY_KEY_ID", "rzp_test_123")
		os.Setenv("RAZORPAY_KEY_SECRET", "secret123")
		os.Setenv("RAZORPAY_WEBHOOK_SECRET", "webhook123")
		defer os.Clearenv()

		cfg := Load()

		if cfg.Port != "9090" {
			t.Errorf("expected Port=9090, got %s", cfg.Port)
		}
		if cfg.DatabaseURL != "postgres://custom:custom@db:5432/customdb" {
			t.Errorf("expected custom DatabaseURL, got %s", cfg.DatabaseURL)
		}
		if cfg.SQLitePath != "custom.db" {
			t.Errorf("expected SQLitePath=custom.db, got %s", cfg.SQLitePath)
		}
		if cfg.RedisAddr != "redis:6379" {
			t.Errorf("expected RedisAddr=redis:6379, got %s", cfg.RedisAddr)
		}
		if cfg.Env != "production" {
			t.Errorf("expected Env=production, got %s", cfg.Env)
		}
		if cfg.RazorpayKeyID != "rzp_test_123" {
			t.Errorf("expected RazorpayKeyID=rzp_test_123, got %s", cfg.RazorpayKeyID)
		}
		if cfg.RazorpayKeySecret != "secret123" {
			t.Errorf("expected RazorpayKeySecret=secret123, got %s", cfg.RazorpayKeySecret)
		}
		if cfg.RazorpayWebhookSecret != "webhook123" {
			t.Errorf("expected RazorpayWebhookSecret=webhook123, got %s", cfg.RazorpayWebhookSecret)
		}
	})

	t.Run("handles empty string env vars as unset", func(t *testing.T) {
		os.Setenv("PORT", "")
		defer os.Unsetenv("PORT")

		cfg := Load()

		if cfg.Port != "8080" {
			t.Errorf("expected default Port=8080 when env var is empty, got %s", cfg.Port)
		}
	})
}

func TestGetEnv(t *testing.T) {
	t.Run("returns env value when set", func(t *testing.T) {
		os.Setenv("TEST_VAR", "test_value")
		defer os.Unsetenv("TEST_VAR")

		result := getEnv("TEST_VAR", "fallback")

		if result != "test_value" {
			t.Errorf("expected test_value, got %s", result)
		}
	})

	t.Run("returns fallback when env var not set", func(t *testing.T) {
		result := getEnv("NON_EXISTENT_VAR", "fallback")

		if result != "fallback" {
			t.Errorf("expected fallback, got %s", result)
		}
	})

	t.Run("returns fallback when env var is empty string", func(t *testing.T) {
		os.Setenv("EMPTY_VAR", "")
		defer os.Unsetenv("EMPTY_VAR")

		result := getEnv("EMPTY_VAR", "fallback")

		if result != "fallback" {
			t.Errorf("expected fallback for empty string, got %s", result)
		}
	})
}
