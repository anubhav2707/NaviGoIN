package integration

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"anubhav2707/NaviGoIn/apps/api/internal/identity"
)

var testDB *sql.DB

func TestMain(m *testing.M) {
	// Setup test database
	var err error
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://testuser:testpass@localhost:5432/testdb?sslmode=disable"
	}

	testDB, err = sql.Open("postgres", dbURL)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to test database: %v", err))
	}

	// Create sessions table for testing
	createTables()

	// Run tests
	code := m.Run()

	// Cleanup
	dropTables()
	testDB.Close()

	os.Exit(code)
}

func createTables() {
	query := `
	CREATE TABLE IF NOT EXISTS sessions (
		id VARCHAR(255) PRIMARY KEY,
		user_id VARCHAR(255) NOT NULL,
		token TEXT NOT NULL,
		device_id VARCHAR(255),
		created_at TIMESTAMP DEFAULT NOW(),
		expires_at TIMESTAMP NOT NULL,
		revoked_at TIMESTAMP,
		INDEX idx_user_sessions (user_id),
		INDEX idx_session_expiry (expires_at),
		INDEX idx_revoked_sessions (revoked_at)
	);
	`
	_, err := testDB.Exec(query)
	if err != nil {
		panic(fmt.Sprintf("Failed to create test tables: %v", err))
	}
}

func dropTables() {
	_, _ = testDB.Exec("DROP TABLE IF EXISTS sessions")
}

func setupTestData(t *testing.T) (string, string) {
	// Clear existing data
	_, err := testDB.Exec("DELETE FROM sessions")
	require.NoError(t, err)

	// Insert test sessions
	userID := "test-user-123"
	sessions := []struct {
		id        string
		userID    string
		deviceID  string
		expiresAt time.Time
		revokedAt *time.Time
	}{
		{"session-1", userID, "device-1", time.Now().Add(24 * time.Hour), nil},
		{"session-2", userID, "device-2", time.Now().Add(24 * time.Hour), nil},
		{"session-3", userID, "device-3", time.Now().Add(24 * time.Hour), nil},
		{"session-4", "other-user", "device-4", time.Now().Add(24 * time.Hour), nil},
		{"session-5", userID, "device-5", time.Now().Add(24 * time.Hour), &time.Time{}}, // Already revoked
	}

	for _, s := range sessions {
		token := generateToken(s.userID, s.id)
		query := `
			INSERT INTO sessions (id, user_id, token, device_id, expires_at, revoked_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`
		_, err := testDB.Exec(query, s.id, s.userID, token, s.deviceID, s.expiresAt, s.revokedAt)
		require.NoError(t, err)
	}

	return userID, "session-1"
}

func TestIntegrationRevokeAllSessions(t *testing.T) {
	userID, sessionID := setupTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := identity.NewModule(testDB)

	api := router.Group("/api")
	module.RegisterRoutes(api)

	// Test revoking all sessions
	reqBody := identity.RevokeSessionsRequest{Scope: "all"}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/identity/sessions/revoke", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+generateToken(userID, sessionID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Successfully revoked 3 session(s)", response["message"])
	assert.Equal(t, float64(3), response["revoked_count"])
	assert.Equal(t, "all", response["scope"])

	// Verify sessions are revoked in database
	var activeCount int
	err = testDB.QueryRow("SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NULL", userID).Scan(&activeCount)
	require.NoError(t, err)
	assert.Equal(t, 0, activeCount)
}

func TestIntegrationRevokeCurrentSession(t *testing.T) {
	userID, sessionID := setupTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := identity.NewModule(testDB)

	api := router.Group("/api")
	module.RegisterRoutes(api)

	// Test revoking current session only
	reqBody := identity.RevokeSessionsRequest{Scope: "current"}
	body, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/identity/sessions/revoke", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+generateToken(userID, sessionID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Successfully revoked 1 session(s)", response["message"])
	assert.Equal(t, float64(1), response["revoked_count"])
	assert.Equal(t, "current", response["scope"])

	// Verify only current session is revoked
	var revokedCount int
	err = testDB.QueryRow("SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NOT NULL AND id = $2", userID, sessionID).Scan(&revokedCount)
	require.NoError(t, err)
	assert.Equal(t, 1, revokedCount)

	// Verify other sessions are still active
	var activeCount int
	err = testDB.QueryRow("SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND revoked_at IS NULL", userID).Scan(&activeCount)
	require.NoError(t, err)
	assert.Equal(t, 2, activeCount) // 2 other sessions should still be active
}

func TestIntegrationRevokeAllSessionsEndpoint(t *testing.T) {
	userID, sessionID := setupTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := identity.NewModule(testDB)

	api := router.Group("/api")
	module.RegisterRoutes(api)

	// Test dedicated revoke-all endpoint
	req := httptest.NewRequest("POST", "/api/identity/sessions/revoke-all", nil)
	req.Header.Set("Authorization", "Bearer "+generateToken(userID, sessionID))

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "Successfully revoked all 3 session(s)", response["message"])
	assert.Equal(t, float64(3), response["revoked_count"])
}

func TestIntegrationUnauthorizedAccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := identity.NewModule(testDB)

	api := router.Group("/api")
	module.RegisterRoutes(api)

	tests := []struct {
		name     string
		endpoint string
		token    string
	}{
		{
			name:     "missing token",
			endpoint: "/api/identity/sessions/revoke",
			token:    "",
		},
		{
			name:     "invalid token",
			endpoint: "/api/identity/sessions/revoke",
			token:    "Bearer invalid-token",
		},
		{
			name:     "revoked session token",
			endpoint: "/api/identity/sessions/revoke-all",
			token:    "Bearer " + generateToken("test-user-123", "session-5"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reqBody := identity.RevokeSessionsRequest{Scope: "all"}
			body, _ := json.Marshal(reqBody)
			req := httptest.NewRequest("POST", tt.endpoint, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			if tt.token != "" {
				req.Header.Set("Authorization", tt.token)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusUnauthorized, w.Code)
		})
	}
}

func TestIntegrationInvalidRequest(t *testing.T) {
	userID, sessionID := setupTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	module := identity.NewModule(testDB)

	api := router.Group("/api")
	module.RegisterRoutes(api)

	tests := []struct {
		name        string
		reqBody     string
		expectedMsg string
	}{
		{
			name:        "invalid scope",
			reqBody:     `{"scope": "invalid"}`,
			expectedMsg: "invalid request",
		},
		{
			name:        "missing scope",
			reqBody:     `{}`,
			expectedMsg: "invalid request",
		},
		{
			name:        "invalid json",
			reqBody:     `{invalid json}`,
			expectedMsg: "invalid request",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/identity/sessions/revoke", bytes.NewBufferString(tt.reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+generateToken(userID, sessionID))

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Contains(t, response["error"], tt.expectedMsg)
		})
	}
}

// Helper function to generate JWT tokens for testing
func generateToken(userID, sessionID string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    userID,
		"session_id": sessionID,
		"exp":        time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("your-secret-key"))
	return tokenString
}
