// Package matching pairs a ride request with the best available driver.
// It depends on location.Finder and driver.Availability — narrow interfaces
// satisfied by those modules — rather than importing their concrete types,
// so each side of the boundary can evolve (or move to its own service) independently.
package matching

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
)

type Point struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Candidate struct {
	DriverID string  `json:"driverId"`
	Point    Point   `json:"point"`
	Distance float64 `json:"distanceKm"`
}

// Finder is satisfied by the location module's service.
type Finder interface {
	NearbyDrivers(origin Point, radiusKm float64, limit int) []Candidate
}

type service struct {
	finder Finder
}

func newService(finder Finder) *service {
	return &service{finder: finder}
}

func (s *service) findDriver(pickup Point) (Candidate, bool) {
	candidates := s.finder.NearbyDrivers(pickup, 5, 1)
	if len(candidates) == 0 {
		return Candidate{}, false
	}
	return candidates[0], true
}

type Module struct {
	svc *service
}

// New takes the location module's service through the narrow Finder interface —
// this is the seam along which matching could be split into its own deployable later.
func New(finder Finder) *Module {
	return &Module{svc: newService(finder)}
}

func (m *Module) Name() string { return "matching" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/request", m.handleRequest)
}

type matchRequest struct {
	RiderID string `json:"riderId"`
	Pickup  Point  `json:"pickup"`
}

func (m *Module) handleRequest(w http.ResponseWriter, r *http.Request) {
	var req matchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RiderID == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "riderId and pickup are required"})
		return
	}

	driver, ok := m.svc.findDriver(req.Pickup)
	if !ok {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "no drivers available nearby"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{"matchedDriver": driver})
}
