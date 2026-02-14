package config

import (
	"log"
	"os"
	"time"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	RevenueCatWebhookAuth string
	AppleBundleID         string

	Port        string
	CORSOrigins string

	GLMApiURL string
	GLMApiKey string
	GLMModel  string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "app_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:        getEnv("JWT_SECRET", ""),
		JWTAccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
		JWTRefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),

		RevenueCatWebhookAuth: getEnv("REVENUECAT_WEBHOOK_AUTH", ""),
		AppleBundleID:         getEnv("APPLE_BUNDLE_ID", ""),

		Port:        getEnv("PORT", "8080"),
		CORSOrigins: getEnv("CORS_ORIGINS", "*"),

		GLMApiURL: getEnv("GLM_API_URL", "https://api.z.ai/api/paas/v4/chat/completions"),
		GLMApiKey: getEnv("GLM_API_KEY", ""),
		GLMModel:  getEnv("GLM_MODEL", "glm-5"),
	}
}

func (c *Config) Validate() error {
	if c.GLMApiKey == "" {
		log.Println("WARNING: GLM_API_KEY not set, AI generation disabled")
	}
	return nil
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=UTC"
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute
	}
	return d
}
