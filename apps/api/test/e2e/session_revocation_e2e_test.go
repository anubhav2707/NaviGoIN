package e2e

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test configuration
var (
	baseURL = getEnvOrDefault("E2E_API_URL", "http://localhost:8080/api")
)

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

type TestUser struct {
	UserID      string
	PhoneNumber string
	Tokens      []string // Multiple session tokens
}

type SessionRevokeRequest struct {
	Scope string `json:"scope"`
}

type SessionRevokeResponse struct {
	Message      string `json:"message"`
	RevokedCount int    `json:"revoked_count"`
	Scope        string `json:"scope,omitempty"`
	Error        string `json:"error,omitempty"`
}

// TestE2ECompleteSessionRevocationFlow tests the complete user journey for session management
func TestE2ECompleteSessionRevocationFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Step 1: Create a test user and login from multiple devices
	user := createTestUserWithMultipleSessions(t)

	// Step 2: Verify all sessions are active
	for i, token := range user.Tokens {
		t.Run(fmt.Sprintf("VerifySession%d", i+1), func(t *testing.T) {
			resp := makeAuthenticatedRequest(t, "GET", "/identity/me", nil, token)
			assert.Equal(t, http.StatusOK, resp.StatusCode)
		})
	}

	// Step 3: Revoke current session only
	t.Run("RevokeCurrentSession", func(t *testing.T) {
		reqBody := SessionRevokeRequest{Scope: "current"}
		body, _ := json.Marshal(reqBody)

		resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke", body, user.Tokens[0])
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var revokeResp SessionRevokeResponse
		decodeResponse(t, resp, &revokeResp)
		assert.Equal(t, 1, revokeResp.RevokedCount)
		assert.Equal(t, "current", revokeResp.Scope)

		// Verify revoked session cannot access protected endpoints
		resp = makeAuthenticatedRequest(t, "GET", "/identity/me", nil, user.Tokens[0])
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)

		// Verify other sessions are still active
		for i := 1; i < len(user.Tokens); i++ {
			resp = makeAuthenticatedRequest(t, "GET", "/identity/me", nil, user.Tokens[i])
			assert.Equal(t, http.StatusOK, resp.StatusCode)
		}
	})

	// Step 4: Revoke all remaining sessions
	t.Run("RevokeAllSessions", func(t *testing.T) {
		reqBody := SessionRevokeRequest{Scope: "all"}
		body, _ := json.Marshal(reqBody)

		resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke", body, user.Tokens[1])
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var revokeResp SessionRevokeResponse
		decodeResponse(t, resp, &revokeResp)
		assert.GreaterOrEqual(t, revokeResp.RevokedCount, 2) // At least 2 sessions should be revoked
		assert.Equal(t, "all", revokeResp.Scope)

		// Verify all sessions are now revoked
		for i := 1; i < len(user.Tokens); i++ {
			resp = makeAuthenticatedRequest(t, "GET", "/identity/me", nil, user.Tokens[i])
			assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		}
	})

	// Step 5: Test edge case - attempting to revoke already revoked sessions
	t.Run("RevokeAlreadyRevokedSessions", func(t *testing.T) {
		// Create new session for this test
		newToken := loginUser(t, user.PhoneNumber)

		// First revocation should succeed
		resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke-all", nil, newToken)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Same token should now be unauthorized
		resp = makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke-all", nil, newToken)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}

// TestE2EConcurrentSessionRevocation tests race conditions with concurrent revocations
func TestE2EConcurrentSessionRevocation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	user := createTestUserWithMultipleSessions(t)

	// Create channels to coordinate concurrent requests
	type result struct {
		token      string
		statusCode int
		revoked    int
	}

	resultChan := make(chan result, len(user.Tokens))

	// Launch concurrent revocation requests from all sessions
	for _, token := range user.Tokens {
		go func(tk string) {
			reqBody := SessionRevokeRequest{Scope: "all"}
			body, _ := json.Marshal(reqBody)

			resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke", body, tk)
			defer resp.Body.Close()

			res := result{token: tk, statusCode: resp.StatusCode}

			if resp.StatusCode == http.StatusOK {
				var revokeResp SessionRevokeResponse
				decodeResponse(t, resp, &revokeResp)
				res.revoked = revokeResp.RevokedCount
			}

			resultChan <- res
		}(token)
	}

	// Collect results
	var results []result
	for i := 0; i < len(user.Tokens); i++ {
		results = append(results, <-resultChan)
	}

	// At least one request should succeed
	successCount := 0
	totalRevoked := 0
	for _, res := range results {
		if res.statusCode == http.StatusOK {
			successCount++
			totalRevoked += res.revoked
		}
	}

	assert.GreaterOrEqual(t, successCount, 1, "At least one revocation should succeed")
	assert.GreaterOrEqual(t, totalRevoked, len(user.Tokens), "All sessions should be revoked")

	// Verify all sessions are now invalid
	for _, token := range user.Tokens {
		resp := makeAuthenticatedRequest(t, "GET", "/identity/me", nil, token)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	}
}

// TestE2ESessionRevocationSecurityScenarios tests various security scenarios
func TestE2ESessionRevocationSecurityScenarios(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Scenario 1: Account takeover prevention
	t.Run("AccountTakeoverPrevention", func(t *testing.T) {
		user := createTestUserWithMultipleSessions(t)

		// Simulate suspicious activity detection - revoke all sessions
		reqBody := SessionRevokeRequest{Scope: "all"}
		body, _ := json.Marshal(reqBody)

		resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke", body, user.Tokens[0])
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify all sessions are revoked (forcing re-authentication)
		for _, token := range user.Tokens {
			resp = makeAuthenticatedRequest(t, "GET", "/identity/me", nil, token)
			assert.Equal(t, http.StatusUnauthorized, resp.StatusCode, "All sessions should be invalidated for security")
		}
	})

	// Scenario 2: Lost device handling
	t.Run("LostDeviceHandling", func(t *testing.T) {
		user := createTestUserWithMultipleSessions(t)

		// User logs in from trusted device and revokes all other sessions
		trustedToken := user.Tokens[0]

		// Use the dedicated revoke-all endpoint
		resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke-all", nil, trustedToken)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify the trusted device session is also revoked (for complete security)
		resp = makeAuthenticatedRequest(t, "GET", "/identity/me", nil, trustedToken)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	// Scenario 3: Invalid request handling
	t.Run("InvalidRequestHandling", func(t *testing.T) {
		user := createTestUserWithMultipleSessions(t)

		tests := []struct {
			name         string
			reqBody      string
			expectedCode int
		}{
			{"InvalidScope", `{"scope": "invalid"}`, http.StatusBadRequest},
			{"MissingScope", `{}`, http.StatusBadRequest},
			{"MalformedJSON", `{invalid json}`, http.StatusBadRequest},
			{"ExtraFields", `{"scope": "all", "extra": "field"}`, http.StatusOK}, // Should ignore extra fields
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				resp := makeAuthenticatedRequest(t, "POST", "/identity/sessions/revoke", []byte(tt.reqBody), user.Tokens[0])
				assert.Equal(t, tt.expectedCode, resp.StatusCode)
			})
		}
	})
}

// Helper functions

func createTestUserWithMultipleSessions(t *testing.T) TestUser {
	phoneNumber := fmt.Sprintf("+1555%07d", time.Now().UnixNano()%10000000)

	// Register user
	registerUser(t, phoneNumber)

	// Login from multiple "devices" to create multiple sessions
	var tokens []string
	for i := 0; i < 3; i++ {
		token := loginUser(t, phoneNumber)
		tokens = append(tokens, token)
		time.Sleep(100 * time.Millisecond) // Small delay between logins
	}

	return TestUser{
		UserID:      "", // Will be populated if needed
		PhoneNumber: phoneNumber,
		Tokens:      tokens,
	}
}

func registerUser(t *testing.T, phoneNumber string) {
	reqBody := map[string]string{"phone_number": phoneNumber}
	body, _ := json.Marshal(reqBody)

	resp, err := http.Post(baseURL+"/auth/register", "application/json", bytes.NewBuffer(body))
	require.NoError(t, err)
	defer resp.Body.Close()

	// For E2E testing, we expect either 200 (new user) or 409 (existing user)
	assert.Contains(t, []int{http.StatusOK, http.StatusConflict}, resp.StatusCode)
}

func loginUser(t *testing.T, phoneNumber string) string {
	// Step 1: Request OTP
	reqBody := map[string]string{"phone_number": phoneNumber}
	body, _ := json.Marshal(reqBody)

	resp, err := http.Post(baseURL+"/auth/login", "application/json", bytes.NewBuffer(body))
	require.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Step 2: Verify OTP (using test OTP)
	otpBody := map[string]string{
		"phone_number": phoneNumber,
		"otp":          "123456", // Test OTP
	}
	body, _ = json.Marshal(otpBody)

	resp, err = http.Post(baseURL+"/auth/verify", "application/json", bytes.NewBuffer(body))
	require.NoError(t, err)
	defer resp.Body.Close()
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var loginResp map[string]interface{}
	decodeResponse(t, resp, &loginResp)

	token, ok := loginResp["token"].(string)
	require.True(t, ok, "Token should be present in login response")

	return token
}

func makeAuthenticatedRequest(t *testing.T, method, path string, body []byte, token string) *http.Response {
	req, err := http.NewRequest(method, baseURL+path, bytes.NewBuffer(body))
	require.NoError(t, err)

	req.Header.Set("Authorization", "Bearer "+token)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	require.NoError(t, err)

	return resp
}

func decodeResponse(t *testing.T, resp *http.Response, v interface{}) {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	err = json.Unmarshal(body, v)
	require.NoError(t, err, "Failed to decode response: %s", string(body))
}
