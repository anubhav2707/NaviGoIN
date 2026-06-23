package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Module is anything that owns a slice of the API surface (one per service
// boundary: identity, driver, location, matching, trip, ...). Each module
// mounts its own routes under its own prefix and only talks to other modules
// through their exported service interfaces — never through shared tables.
type Module interface {
	Name() string
	MountRoutes(r chi.Router)
}

func NewRouter(modules ...Module) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/healthz", healthCheck)

	r.Route("/v1", func(api chi.Router) {
		for _, m := range modules {
			api.Route("/"+m.Name(), m.MountRoutes)
		}
	})

	return r
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
