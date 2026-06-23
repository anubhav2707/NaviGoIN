// Package pricing turns a route into a fare estimate, including surge.
// It has no storage of its own — it's a pure calculation service over inputs
// supplied by the caller (distance/duration come from a maps provider upstream).
package pricing

import (
	"encoding/json"
	"math"
	"net/http"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
)

// Tariff would normally be looked up per city/vehicle-type from config or DB;
// hardcoded here to keep the calculation contract concrete for the scaffold.
type Tariff struct {
	BaseFare      float64
	PerKmRate     float64
	PerMinuteRate float64
	SurgeMultiplier float64
}

var tariffs = map[string]Tariff{
	"auto":   {BaseFare: 25, PerKmRate: 11, PerMinuteRate: 1.0, SurgeMultiplier: 1.0},
	"bike":   {BaseFare: 15, PerKmRate: 6, PerMinuteRate: 0.5, SurgeMultiplier: 1.0},
	"sedan":  {BaseFare: 50, PerKmRate: 16, PerMinuteRate: 1.5, SurgeMultiplier: 1.0},
	"premier": {BaseFare: 80, PerKmRate: 22, PerMinuteRate: 2.0, SurgeMultiplier: 1.0},
}

type Estimate struct {
	VehicleType string  `json:"vehicleType"`
	Fare        float64 `json:"fare"`
	Currency    string  `json:"currency"`
	SurgeApplied bool   `json:"surgeApplied"`
}

func estimateFare(vehicleType string, distanceKm, durationMin, surgeMultiplier float64) (Estimate, bool) {
	tariff, ok := tariffs[vehicleType]
	if !ok {
		return Estimate{}, false
	}
	if surgeMultiplier <= 0 {
		surgeMultiplier = tariff.SurgeMultiplier
	}

	raw := tariff.BaseFare + tariff.PerKmRate*distanceKm + tariff.PerMinuteRate*durationMin
	fare := math.Round(raw*surgeMultiplier*100) / 100

	return Estimate{
		VehicleType:  vehicleType,
		Fare:         fare,
		Currency:     "INR",
		SurgeApplied: surgeMultiplier > 1.0,
	}, true
}

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string { return "pricing" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/estimate", m.handleEstimate)
}

type estimateRequest struct {
	DistanceKm      float64  `json:"distanceKm"`
	DurationMin     float64  `json:"durationMin"`
	SurgeMultiplier float64  `json:"surgeMultiplier,omitempty"`
	VehicleTypes    []string `json:"vehicleTypes,omitempty"`
}

func (m *Module) handleEstimate(w http.ResponseWriter, r *http.Request) {
	var req estimateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.DistanceKm <= 0 {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "distanceKm and durationMin are required"})
		return
	}

	types := req.VehicleTypes
	if len(types) == 0 {
		types = []string{"auto", "bike", "sedan", "premier"}
	}

	estimates := make([]Estimate, 0, len(types))
	for _, vt := range types {
		if est, ok := estimateFare(vt, req.DistanceKm, req.DurationMin, req.SurgeMultiplier); ok {
			estimates = append(estimates, est)
		}
	}
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{"estimates": estimates})
}
