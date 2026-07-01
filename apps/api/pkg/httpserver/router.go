package httpserver

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	
	"anubhav2707/NaviGoIn/apps/api/internal/identity"
	"anubhav2707/NaviGoIn/apps/api/internal/driver"
	"anubhav2707/NaviGoIn/apps/api/internal/location"
	"anubhav2707/NaviGoIn/apps/api/internal/matching"
	"anubhav2707/NaviGoIn/apps/api/internal/notifications"
	"anubhav2707/NaviGoIn/apps/api/internal/payments"
	"anubhav2707/NaviGoIn/apps/api/internal/pricing"
	"anubhav2707/NaviGoIn/apps/api/internal/ratings"
	"anubhav2707/NaviGoIn/apps/api/internal/realtime"
	"anubhav2707/NaviGoIn/apps/api/internal/trip"
)

// Router represents the HTTP router with all modules
type Router struct {
	engine *gin.Engine
	db     *sql.DB
}

// NewRouter creates a new HTTP router with all modules initialized
func NewRouter(db *sql.DB) *Router {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()
	
	// Add middleware
	engine.Use(gin.Logger())
	engine.Use(gin.Recovery())
	engine.Use(cors.Default())
	
	return &Router{
		engine: engine,
		db:     db,
	}
}

// SetupRoutes initializes all API routes
func (r *Router) SetupRoutes() {
	// Health check endpoint
	r.engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})
	
	// API v1 routes
	v1 := r.engine.Group("/api/v1")
	{
		// Initialize and register all modules
		identityModule := identity.NewModule(r.db)
		identityModule.RegisterRoutes(v1)
		
		driverModule := driver.NewModule(r.db)
		driverModule.RegisterRoutes(v1)
		
		locationModule := location.NewModule(r.db)
		locationModule.RegisterRoutes(v1)
		
		matchingModule := matching.NewModule(r.db)
		matchingModule.RegisterRoutes(v1)
		
		notificationsModule := notifications.NewModule(r.db)
		notificationsModule.RegisterRoutes(v1)
		
		paymentsModule := payments.NewModule(r.db)
		paymentsModule.RegisterRoutes(v1)
		
		pricingModule := pricing.NewModule(r.db)
		pricingModule.RegisterRoutes(v1)
		
		ratingsModule := ratings.NewModule(r.db)
		ratingsModule.RegisterRoutes(v1)
		
		realtimeModule := realtime.NewModule(r.db)
		realtimeModule.RegisterRoutes(v1)
		
		tripModule := trip.NewModule(r.db)
		tripModule.RegisterRoutes(v1)
	}
}

// Run starts the HTTP server
func (r *Router) Run(addr string) error {
	return r.engine.Run(addr)
}

// GetEngine returns the underlying gin engine (useful for testing)
func (r *Router) GetEngine() *gin.Engine {
	return r.engine
}
