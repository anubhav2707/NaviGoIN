package identity

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Module represents the identity module with all its handlers
type Module struct {
	db *sql.DB
}

// NewModule creates a new identity module instance
func NewModule(db *sql.DB) *Module {
	return &Module{
		db: db,
	}
}

// RegisterRoutes registers all identity-related routes
func (m *Module) RegisterRoutes(router *gin.RouterGroup) {
	identity := router.Group("/identity")
	{
		// Session management endpoints
		identity.POST("/sessions/revoke", m.authMiddleware(), m.RevokeUserSessions)
		identity.POST("/sessions/revoke-all", m.authMiddleware(), m.RevokeAllUserSessions)
	}
}

// authMiddleware validates JWT token and extracts user context
func (m *Module) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract bearer token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		// Validate token and extract user ID
		userID, sessionID, err := m.validateToken(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		// Set user context
		c.Set("userID", userID)
		c.Set("sessionID", sessionID)
		c.Next()
	}
}
