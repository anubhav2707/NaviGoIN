package config

import (
	"os"
	"strings"
	"testing"
)

func TestConfigRegression(t *testing.T) {
	t.Run("preserves backward compatibility with ridenow configs", func(t *testing.T) {
		// Test that old ridenow configs still work if explicitly set
		os.Setenv("DATABASE_URL", "postgres://ridenow:ridenow@localhost:5432/ridenow?sslmode=disable")
		os.Setenv("SQLITE_PATH", "ridenow.db")
		defer func() {
			os.Unsetenv("DATABASE_URL")
			os.Unsetenv("SQLITE_PATH")
		}()

		cfg := Load()

		// Should use the explicitly set values, not defaults
		if cfg.DatabaseURL != "postgres://ridenow:ridenow@localhost:5432/ridenow?sslmode=disable" {
			t.Errorf("should accept old ridenow database URL when explicitly set")
		}
		if cfg.SQLitePath != "ridenow.db" {
			t.Errorf("should accept old ridenow.db when explicitly set")
		}
	})

	t.Run("defaults use myapp not ridenow", func(t *testing.T) {
		// Clear all env vars to test defaults
		os.Clearenv()

		cfg := Load()

		// Defaults should now use myapp
		if !strings.Contains(cfg.DatabaseURL, "myapp") {
			t.Errorf("default DatabaseURL should contain 'myapp', got %s", cfg.DatabaseURL)
		}
		if !strings.Contains(cfg.SQLitePath, "myapp") {
			t.Errorf("default SQLitePath should contain 'myapp', got %s", cfg.SQLitePath)
		}

		// Should NOT contain ridenow in defaults
		if strings.Contains(cfg.DatabaseURL, "ridenow") {
			t.Errorf("default DatabaseURL should not contain 'ridenow', got %s", cfg.DatabaseURL)
		}
		if strings.Contains(cfg.SQLitePath, "ridenow") {
			t.Errorf("default SQLitePath should not contain 'ridenow', got %s", cfg.SQLitePath)
		}
	})

	t.Run("maintains port and redis defaults", func(t *testing.T) {
		// These should remain unchanged
		os.Clearenv()

		cfg := Load()

		if cfg.Port != "8080" {
			t.Errorf("default Port should remain 8080, got %s", cfg.Port)
		}
		if cfg.RedisAddr != "localhost:6379" {
			t.Errorf("default RedisAddr should remain localhost:6379, got %s", cfg.RedisAddr)
		}
		if cfg.Env != "development" {
			t.Errorf("default Env should remain development, got %s", cfg.Env)
		}
	})

	t.Run("razorpay config unchanged", func(t *testing.T) {
		// Razorpay configs should work exactly as before
		os.Setenv("RAZORPAY_KEY_ID", "rzp_test_123")
		os.Setenv("RAZORPAY_KEY_SECRET", "secret123")
		os.Setenv("RAZORPAY_WEBHOOK_SECRET", "webhook123")
		defer func() {
			os.Unsetenv("RAZORPAY_KEY_ID")
			os.Unsetenv("RAZORPAY_KEY_SECRET")
			os.Unsetenv("RAZORPAY_WEBHOOK_SECRET")
		}()

		cfg := Load()

		if cfg.RazorpayKeyID != "rzp_test_123" {
			t.Errorf("RazorpayKeyID should work as before")
		}
		if cfg.RazorpayKeySecret != "secret123" {
			t.Errorf("RazorpayKeySecret should work as before")
		}
		if cfg.RazorpayWebhookSecret != "webhook123" {
			t.Errorf("RazorpayWebhookSecret should work as before")
		}
	})

	t.Run(".env file format compatibility", func(t *testing.T) {
		// Test both old and new .env formats work
		oldEnvContent := `# Old format with ridenow
DATABASE_URL=postgres://ridenow:ridenow@localhost:5432/ridenow
SQLITE_PATH=ridenow.db
`
		newEnvContent := `# New format with myapp
DATABASE_URL=postgres://myapp:myapp@localhost:5432/myapp
SQLITE_PATH=myapp.db
`

		// Test old format
		if err := os.WriteFile(".env", []byte(oldEnvContent), 0644); err != nil {
			t.Fatalf("failed to create .env file: %v", err)
		}

		os.Clearenv()
		cfg := Load()

		if !strings.Contains(cfg.DatabaseURL, "ridenow") {
			t.Errorf("should load old ridenow format from .env file")
		}

		// Test new format
		if err := os.WriteFile(".env", []byte(newEnvContent), 0644); err != nil {
			t.Fatalf("failed to update .env file: %v", err)
		}

		os.Clearenv()
		cfg = Load()

		if !strings.Contains(cfg.DatabaseURL, "myapp") {
			t.Errorf("should load new myapp format from .env file")
		}

		// Clean up
		os.Remove(".env")
	})

	t.Run("connection string format unchanged", func(t *testing.T) {
		// The format of connection strings should be identical, just with different names
		os.Clearenv()
		cfg := Load()

		// Check that the format matches expected pattern
		expectedPattern := "postgres://myapp:myapp@localhost:5432/myapp?sslmode=disable"
		if cfg.DatabaseURL != expectedPattern {
			t.Errorf("DatabaseURL format changed, expected %s, got %s", expectedPattern, cfg.DatabaseURL)
		}

		// SQLite path should just be the name change
		if cfg.SQLitePath != "myapp.db" {
			t.Errorf("SQLitePath format changed, expected myapp.db, got %s", cfg.SQLitePath)
		}
	})

	t.Run("environment variable precedence unchanged", func(t *testing.T) {
		// Create .env file
		envContent := `PORT=7777
DATABASE_URL=postgres://myapp:myapp@fromfile:5432/myapp`
		if err := os.WriteFile(".env", []byte(envContent), 0644); err != nil {
			t.Fatalf("failed to create .env file: %v", err)
		}
		defer os.Remove(".env")

		// Set environment variable that should override
		os.Setenv("PORT", "8888")
		defer os.Unsetenv("PORT")

		cfg := Load()

		// Env var should override .env file
		if cfg.Port != "8888" {
			t.Errorf("environment variable precedence changed, should be 8888, got %s", cfg.Port)
		}

		// Non-overridden value should come from .env
		if !strings.Contains(cfg.DatabaseURL, "fromfile") {
			t.Errorf(".env file loading broken, should contain 'fromfile', got %s", cfg.DatabaseURL)
		}
	})

	t.Run("empty string handling unchanged", func(t *testing.T) {
		// Empty strings should still fall back to defaults
		os.Setenv("PORT", "")
		os.Setenv("DATABASE_URL", "")
		defer func() {
			os.Unsetenv("PORT")
			os.Unsetenv("DATABASE_URL")
		}()

		cfg := Load()

		if cfg.Port != "8080" {
			t.Errorf("empty string handling changed for Port, expected default 8080, got %s", cfg.Port)
		}
		if cfg.DatabaseURL != "postgres://myapp:myapp@localhost:5432/myapp?sslmode=disable" {
			t.Errorf("empty string handling changed for DatabaseURL, should use default")
		}
	})

	t.Run("all config fields present", func(t *testing.T) {
		// Ensure no fields were removed or renamed
		cfg := Load()

		// All these fields should exist and be accessible
		_ = cfg.Port
		_ = cfg.DatabaseURL
		_ = cfg.SQLitePath
		_ = cfg.RedisAddr
		_ = cfg.Env
		_ = cfg.RazorpayKeyID
		_ = cfg.RazorpayKeySecret
		_ = cfg.RazorpayWebhookSecret

		// If we got here, all fields are still present
	})
}

func TestDockerComposeCompatibility(t *testing.T) {
	t.Run("docker service names updated", func(t *testing.T) {
		// The docker-compose.yml should use myapp for:
		// - postgres user/password/database
		// - healthcheck commands
		// This is tested by the actual file content in the implementation

		// Test that config matches docker-compose expectations
		os.Clearenv()
		cfg := Load()

		// Default should match docker-compose postgres settings
		if !strings.Contains(cfg.DatabaseURL, "postgres://myapp:myapp") {
			t.Errorf("DatabaseURL should match docker-compose postgres credentials")
		}
		if !strings.Contains(cfg.DatabaseURL, "/myapp?") {
			t.Errorf("DatabaseURL should use myapp database name to match docker-compose")
		}
	})
}
