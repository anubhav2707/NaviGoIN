package identity

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var (
	// ErrInvalidToken indicates the token is invalid or expired
	ErrInvalidToken = errors.New("invalid or expired token")
	// ErrNoSessionsFound indicates no sessions were found for the user
	ErrNoSessionsFound = errors.New("no active sessions found")
)

// Session represents a user session
type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Token     string    `json:"-"`
	DeviceID  string    `json:"device_id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
}

// RevokeSessionsRequest represents the request to revoke sessions
type RevokeSessionsRequest struct {
	Scope string `json:"scope" binding:"required,oneof=all current"` // "all" or "current"
}

// RevokeUserSessions handles revoking user sessions based on scope
func (m *Module) RevokeUserSessions(c *gin.Context) {
	userID, _ := c.Get("userID")
	sessionID, _ := c.Get("sessionID")

	var req RevokeSessionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
		return
	}

	var revokedCount int
	var err error

	if req.Scope == "all" {
		revokedCount, err = m.revokeAllSessions(userID.(string))
	} else if req.Scope == "current" {
		revokedCount, err = m.revokeSession(sessionID.(string))
	}

	if err != nil {
		if errors.Is(err, ErrNoSessionsFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "no active sessions found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        fmt.Sprintf("Successfully revoked %d session(s)", revokedCount),
		"revoked_count": revokedCount,
		"scope":         req.Scope,
	})
}

// RevokeAllUserSessions revokes all active sessions for the authenticated user
func (m *Module) RevokeAllUserSessions(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	revokedCount, err := m.revokeAllSessions(userID.(string))
	if err != nil {
		if errors.Is(err, ErrNoSessionsFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "no active sessions found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to revoke sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        fmt.Sprintf("Successfully revoked all %d session(s)", revokedCount),
		"revoked_count": revokedCount,
	})
}

// revokeAllSessions revokes all active sessions for a user
func (m *Module) revokeAllSessions(userID string) (int, error) {
	query := `
		UPDATE sessions 
		SET revoked_at = NOW() 
		WHERE user_id = $1 AND revoked_at IS NULL
	`

	result, err := m.db.Exec(query, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to revoke sessions: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return 0, ErrNoSessionsFound
	}

	return int(rowsAffected), nil
}

// revokeSession revokes a specific session
func (m *Module) revokeSession(sessionID string) (int, error) {
	query := `
		UPDATE sessions 
		SET revoked_at = NOW() 
		WHERE id = $1 AND revoked_at IS NULL
	`

	result, err := m.db.Exec(query, sessionID)
	if err != nil {
		return 0, fmt.Errorf("failed to revoke session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return 0, ErrNoSessionsFound
	}

	return 1, nil
}

// validateToken validates JWT token and returns user ID and session ID
func (m *Module) validateToken(authHeader string) (string, string, error) {
	// Extract token from "Bearer <token>" format
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", "", ErrInvalidToken
	}

	tokenString := parts[1]

	// Parse and validate JWT
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		// TODO: Get secret from config
		return []byte("your-secret-key"), nil
	})

	if err != nil {
		return "", "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(string)
		if !ok {
			return "", "", ErrInvalidToken
		}
		sessionID, ok := claims["session_id"].(string)
		if !ok {
			return "", "", ErrInvalidToken
		}

		// Check if session is still valid in database
		var revokedAt sql.NullTime
		query := `SELECT revoked_at FROM sessions WHERE id = $1 AND user_id = $2`
		err := m.db.QueryRow(query, sessionID, userID).Scan(&revokedAt)
		if err != nil {
			return "", "", ErrInvalidToken
		}
		if revokedAt.Valid {
			return "", "", ErrInvalidToken
		}

		return userID, sessionID, nil
	}

	return "", "", ErrInvalidToken
}
