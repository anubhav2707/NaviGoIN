package identity

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRevokeAllSessions(t *testing.T) {
	tests := []struct {
		name           string
		userID         string
		mockSetup      func(sqlmock.Sqlmock)
		expectedCount  int
		expectedError  error
	}{
		{
			name:   "successful revocation of multiple sessions",
			userID: "user123",
			mockSetup: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE user_id = \\$1 AND revoked_at IS NULL").
					WithArgs("user123").
					WillReturnResult(sqlmock.NewResult(0, 3))
			},
			expectedCount: 3,
			expectedError: nil,
		},
		{
			name:   "no active sessions found",
			userID: "user456",
			mockSetup: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE user_id = \\$1 AND revoked_at IS NULL").
					WithArgs("user456").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			expectedCount: 0,
			expectedError: ErrNoSessionsFound,
		},
		{
			name:   "database error",
			userID: "user789",
			mockSetup: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE user_id = \\$1 AND revoked_at IS NULL").
					WithArgs("user789").
					WillReturnError(errors.New("database connection failed"))
			},
			expectedCount: 0,
			expectedError: errors.New("failed to revoke sessions"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockSetup(mock)

			module := NewModule(db)
			count, err := module.revokeAllSessions(tt.userID)

			assert.Equal(t, tt.expectedCount, count)
			if tt.expectedError != nil {
				assert.Error(t, err)
				if tt.expectedError == ErrNoSessionsFound {
					assert.ErrorIs(t, err, ErrNoSessionsFound)
				}
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestRevokeSession(t *testing.T) {
	tests := []struct {
		name          string
		sessionID     string
		mockSetup     func(sqlmock.Sqlmock)
		expectedCount int
		expectedError error
	}{
		{
			name:      "successful single session revocation",
			sessionID: "session123",
			mockSetup: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE id = \\$1 AND revoked_at IS NULL").
					WithArgs("session123").
					WillReturnResult(sqlmock.NewResult(0, 1))
			},
			expectedCount: 1,
			expectedError: nil,
		},
		{
			name:      "session not found or already revoked",
			sessionID: "session456",
			mockSetup: func(mock sqlmock.Sqlmock) {
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE id = \\$1 AND revoked_at IS NULL").
					WithArgs("session456").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			expectedCount: 0,
			expectedError: ErrNoSessionsFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockSetup(mock)

			module := NewModule(db)
			count, err := module.revokeSession(tt.sessionID)

			assert.Equal(t, tt.expectedCount, count)
			if tt.expectedError != nil {
				assert.Error(t, err)
				if tt.expectedError == ErrNoSessionsFound {
					assert.ErrorIs(t, err, ErrNoSessionsFound)
				}
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestValidateToken(t *testing.T) {
	tests := []struct {
		name           string
		authHeader     string
		mockSetup      func(sqlmock.Sqlmock)
		expectedUserID string
		expectedSessID string
		expectedError  bool
	}{
		{
			name:       "valid token with active session",
			authHeader: "Bearer " + generateTestToken("user123", "session123"),
			mockSetup: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"revoked_at"}).
					AddRow(sql.NullTime{Valid: false})
				mock.ExpectQuery("SELECT revoked_at FROM sessions WHERE id = \\$1 AND user_id = \\$2").
					WithArgs("session123", "user123").
					WillReturnRows(rows)
			},
			expectedUserID: "user123",
			expectedSessID: "session123",
			expectedError:  false,
		},
		{
			name:       "revoked session",
			authHeader: "Bearer " + generateTestToken("user456", "session456"),
			mockSetup: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"revoked_at"}).
					AddRow(sql.NullTime{Valid: true, Time: time.Now()})
				mock.ExpectQuery("SELECT revoked_at FROM sessions WHERE id = \\$1 AND user_id = \\$2").
					WithArgs("session456", "user456").
					WillReturnRows(rows)
			},
			expectedUserID: "",
			expectedSessID: "",
			expectedError:  true,
		},
		{
			name:           "invalid token format",
			authHeader:     "InvalidToken",
			mockSetup:      func(mock sqlmock.Sqlmock) {},
			expectedUserID: "",
			expectedSessID: "",
			expectedError:  true,
		},
		{
			name:           "missing bearer prefix",
			authHeader:     generateTestToken("user789", "session789"),
			mockSetup:      func(mock sqlmock.Sqlmock) {},
			expectedUserID: "",
			expectedSessID: "",
			expectedError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockSetup(mock)

			module := NewModule(db)
			userID, sessionID, err := module.validateToken(tt.authHeader)

			assert.Equal(t, tt.expectedUserID, userID)
			assert.Equal(t, tt.expectedSessID, sessionID)
			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestRevokeUserSessionsEndpoint(t *testing.T) {
	tests := []struct {
		name           string
		request        RevokeSessionsRequest
		mockSetup      func(sqlmock.Sqlmock)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:    "revoke all sessions successfully",
			request: RevokeSessionsRequest{Scope: "all"},
			mockSetup: func(mock sqlmock.Sqlmock) {
				// Mock for auth middleware
				rows := sqlmock.NewRows([]string{"revoked_at"}).
					AddRow(sql.NullTime{Valid: false})
				mock.ExpectQuery("SELECT revoked_at FROM sessions WHERE id = \\$1 AND user_id = \\$2").
					WithArgs("session123", "user123").
					WillReturnRows(rows)
				// Mock for revoking sessions
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE user_id = \\$1 AND revoked_at IS NULL").
					WithArgs("user123").
					WillReturnResult(sqlmock.NewResult(0, 5))
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message":       "Successfully revoked 5 session(s)",
				"revoked_count": float64(5),
				"scope":         "all",
			},
		},
		{
			name:    "revoke current session successfully",
			request: RevokeSessionsRequest{Scope: "current"},
			mockSetup: func(mock sqlmock.Sqlmock) {
				// Mock for auth middleware
				rows := sqlmock.NewRows([]string{"revoked_at"}).
					AddRow(sql.NullTime{Valid: false})
				mock.ExpectQuery("SELECT revoked_at FROM sessions WHERE id = \\$1 AND user_id = \\$2").
					WithArgs("session123", "user123").
					WillReturnRows(rows)
				// Mock for revoking current session
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE id = \\$1 AND revoked_at IS NULL").
					WithArgs("session123").
					WillReturnResult(sqlmock.NewResult(0, 1))
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message":       "Successfully revoked 1 session(s)",
				"revoked_count": float64(1),
				"scope":         "current",
			},
		},
		{
			name:    "no sessions found",
			request: RevokeSessionsRequest{Scope: "all"},
			mockSetup: func(mock sqlmock.Sqlmock) {
				// Mock for auth middleware
				rows := sqlmock.NewRows([]string{"revoked_at"}).
					AddRow(sql.NullTime{Valid: false})
				mock.ExpectQuery("SELECT revoked_at FROM sessions WHERE id = \\$1 AND user_id = \\$2").
					WithArgs("session123", "user123").
					WillReturnRows(rows)
				// Mock for revoking sessions
				mock.ExpectExec("UPDATE sessions SET revoked_at = NOW\\(\\) WHERE user_id = \\$1 AND revoked_at IS NULL").
					WithArgs("user123").
					WillReturnResult(sqlmock.NewResult(0, 0))
			},
			expectedStatus: http.StatusNotFound,
			expectedBody: map[string]interface{}{
				"error": "no active sessions found",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockSetup(mock)

			gin.SetMode(gin.TestMode)
			router := gin.New()
			module := NewModule(db)

			api := router.Group("/api")
			module.RegisterRoutes(api)

			body, _ := json.Marshal(tt.request)
			req := httptest.NewRequest("POST", "/api/identity/sessions/revoke", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+generateTestToken("user123", "session123"))

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			for key, expectedValue := range tt.expectedBody {
				assert.Equal(t, expectedValue, response[key])
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

// Helper function to generate test JWT tokens
func generateTestToken(userID, sessionID string) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    userID,
		"session_id": sessionID,
		"exp":        time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("your-secret-key"))
	return tokenString
}
