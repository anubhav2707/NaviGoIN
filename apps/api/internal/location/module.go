// Package location ingests live driver GPS pings and answers nearby-driver
// queries. The in-memory index here is a stand-in for Redis GEOADD/GEOSEARCH —
// swap service's internals for Redis calls without changing the HTTP contract.
package location

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
)

type Point struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type driverLocation struct {
	DriverID string
	Point    Point
	UpdatedAt time.Time
}

type service struct {
	mu  sync.RWMutex
	byID map[string]driverLocation
}

func newService() *service {
	return &service{byID: make(map[string]driverLocation)}
}

func (s *service) ping(driverID string, p Point) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.byID[driverID] = driverLocation{DriverID: driverID, Point: p, UpdatedAt: time.Now().UTC()}
}

// NearbyDriver is the result shape returned to both the HTTP layer and to other
// modules (e.g. matching, via the adapter wired up in cmd/server) — keeping this
// exported here avoids those callers needing to know about location's internals.
type NearbyDriver struct {
	DriverID string  `json:"driverId"`
	Point    Point   `json:"point"`
	Distance float64 `json:"distanceKm"`
}

func (s *service) nearby(origin Point, radiusKm float64, limit int) []NearbyDriver {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := make([]NearbyDriver, 0, len(s.byID))
	for _, loc := range s.byID {
		d := haversineKm(origin, loc.Point)
		if d <= radiusKm {
			results = append(results, NearbyDriver{DriverID: loc.DriverID, Point: loc.Point, Distance: d})
		}
	}
	sort.Slice(results, func(i, j int) bool { return results[i].Distance < results[j].Distance })
	if limit > 0 && len(results) > limit {
		results = results[:limit]
	}
	return results
}

// haversineKm computes great-circle distance — adequate for short urban hops.
// Uber-scale systems use a spatial index (H3/S2 + Redis Geo) instead of
// scanning every driver; this is here purely to make the contract concrete.
func haversineKm(a, b Point) float64 {
	const earthRadiusKm = 6371.0
	lat1, lat2 := toRadians(a.Lat), toRadians(b.Lat)
	dLat := toRadians(b.Lat - a.Lat)
	dLng := toRadians(b.Lng - a.Lng)

	h := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthRadiusKm * math.Asin(math.Sqrt(h))
}

func toRadians(deg float64) float64 { return deg * math.Pi / 180 }

type Module struct {
	svc *service
}

func New() *Module {
	return &Module{svc: newService()}
}

// NearbyDrivers is the cross-module entry point — e.g. matching's Finder adapter
// (wired in cmd/server) calls through here rather than touching svc directly.
func (m *Module) NearbyDrivers(origin Point, radiusKm float64, limit int) []NearbyDriver {
	return m.svc.nearby(origin, radiusKm, limit)
}

func (m *Module) Name() string { return "location" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/ping", m.handlePing)
	r.Get("/nearby", m.handleNearby)
}

type pingRequest struct {
	DriverID string `json:"driverId"`
	Point    Point  `json:"point"`
}

func (m *Module) handlePing(w http.ResponseWriter, r *http.Request) {
	var req pingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.DriverID == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "driverId and point are required"})
		return
	}
	m.svc.ping(req.DriverID, req.Point)
	httpserver.WriteJSON(w, http.StatusAccepted, map[string]string{"status": "received"})
}

func (m *Module) handleNearby(w http.ResponseWriter, r *http.Request) {
	lat, latErr := parseFloatQuery(r, "lat")
	lng, lngErr := parseFloatQuery(r, "lng")
	if latErr != nil || lngErr != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "lat and lng query params are required"})
		return
	}

	radiusKm := 5.0
	if v, err := parseFloatQuery(r, "radiusKm"); err == nil {
		radiusKm = v
	}

	results := m.NearbyDrivers(Point{Lat: lat, Lng: lng}, radiusKm, 20)
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{"drivers": results})
}

var errMissingParam = errors.New("missing query parameter")

func parseFloatQuery(r *http.Request, key string) (float64, error) {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return 0, errMissingParam
	}
	return strconv.ParseFloat(raw, 64)
}
