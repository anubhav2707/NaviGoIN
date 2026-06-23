// Package realtime streams live trip telemetry (driver location, ETA, phase) to
// the rider over a WebSocket. Until a driver app exists, the driver's movement
// is simulated server-side; the wire format is exactly what a real driver-app
// feed would produce, so the rider UI won't change when that's swapped in.
package realtime

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Dev: allow any origin (Expo Go / browser). Lock down per-origin in prod.
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Point struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// Update is one telemetry frame pushed to the rider.
type Update struct {
	Phase    string  `json:"phase"` // arriving | arrived | on_trip | completed
	Progress float64 `json:"progress"`
	ETAMin   int     `json:"etaMin"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Bearing  float64 `json:"bearing"`
}

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string { return "realtime" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Get("/track/{tripId}", m.handleTrack)
}

// handleTrack upgrades to a WebSocket and streams the trip's telemetry. Query
// params seed the simulated path: pickup (plat,plng), drop (dlat,dlng), and an
// optional driver start (slat,slng) a short distance from pickup.
func (m *Module) handleTrack(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	q := r.URL.Query()
	pickup := Point{Lat: qf(q.Get("plat"), 28.6139), Lng: qf(q.Get("plng"), 77.2090)}
	drop := Point{Lat: qf(q.Get("dlat"), 28.5562), Lng: qf(q.Get("dlng"), 77.1000)}
	// Driver starts offset from pickup unless told otherwise.
	start := Point{Lat: qf(q.Get("slat"), pickup.Lat+0.012), Lng: qf(q.Get("slng"), pickup.Lng+0.012)}

	// Detect client disconnect so we stop the writer goroutine.
	done := make(chan struct{})
	go func() {
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				close(done)
				return
			}
		}
	}()

	ticker := time.NewTicker(1200 * time.Millisecond)
	defer ticker.Stop()

	const arrivingSteps = 10 // ~12s to reach pickup
	const tripSteps = 16     // ~19s pickup -> drop
	step := 0

	send := func(u Update) bool {
		_ = conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
		return conn.WriteJSON(u) == nil
	}

	// Initial frame so the UI renders immediately.
	if !send(buildUpdate("arriving", 0, start, pickup, arrivingSteps)) {
		return
	}

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			step++
			switch {
			case step <= arrivingSteps:
				p := float64(step) / float64(arrivingSteps)
				if !send(buildUpdate("arriving", p, start, pickup, arrivingSteps-step)) {
					return
				}
				if step == arrivingSteps {
					_ = send(Update{Phase: "arrived", Progress: 1, ETAMin: 0, Lat: pickup.Lat, Lng: pickup.Lng})
				}
			case step <= arrivingSteps+tripSteps:
				ts := step - arrivingSteps
				p := float64(ts) / float64(tripSteps)
				if !send(buildUpdate("on_trip", p, pickup, drop, tripSteps-ts)) {
					return
				}
			default:
				_ = send(Update{Phase: "completed", Progress: 1, ETAMin: 0, Lat: drop.Lat, Lng: drop.Lng})
				return
			}
		}
	}
}

// buildUpdate interpolates the driver between from→to at fraction p and derives
// a coarse ETA from the remaining steps.
func buildUpdate(phase string, p float64, from, to Point, remainingSteps int) Update {
	lat := from.Lat + (to.Lat-from.Lat)*p
	lng := from.Lng + (to.Lng-from.Lng)*p
	etaMin := remainingSteps * 1 // ~1 min per remaining step (illustrative)
	if etaMin < 1 && phase != "completed" {
		etaMin = 1
	}
	return Update{
		Phase:    phase,
		Progress: p,
		ETAMin:   etaMin,
		Lat:      lat,
		Lng:      lng,
		Bearing:  bearing(from, to),
	}
}

func bearing(from, to Point) float64 {
	y := to.Lng - from.Lng
	x := to.Lat - from.Lat
	deg := math.Atan2(y, x) * 180 / math.Pi
	if deg < 0 {
		deg += 360
	}
	return deg
}

func qf(s string, fallback float64) float64 {
	if s == "" {
		return fallback
	}
	if v, err := strconv.ParseFloat(s, 64); err == nil {
		return v
	}
	return fallback
}
