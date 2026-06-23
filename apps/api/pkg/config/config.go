package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port              string
	DatabaseURL       string
	SQLitePath        string
	RedisAddr         string
	Env               string
	RazorpayKeyID     string
	RazorpayKeySecret string
	RazorpayWebhookSecret string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://ridenow:ridenow@localhost:5432/ridenow?sslmode=disable"),
		SQLitePath:        getEnv("SQLITE_PATH", "ridenow.db"),
		RedisAddr:         getEnv("REDIS_ADDR", "localhost:6379"),
		Env:               getEnv("ENV", "development"),
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),
		RazorpayWebhookSecret: getEnv("RAZORPAY_WEBHOOK_SECRET", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
