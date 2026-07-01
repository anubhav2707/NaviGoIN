// Package trip owns the ride lifecycle state machine: requested -> accepted ->
// in_progress -> completed (or cancelled). Pricing, payments and ratings react
// to trip state via events/IDs — they never mutate a Trip directly.
package trip

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
	"ridenow/api/pkg/idgen"
)

type Status string

const (
	StatusRequested  Status = "requested"
	StatusAccepted   Status = "accepted"
	StatusInProgress Status = "in_progress"
	StatusCompleted  Status = "completed"
	StatusCancelled  Status = "cancelled"
)

type Point struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Trip struct {
	ID        string    `json:"id"`
	RiderID   string    `json:"riderId"`
	DriverID  string    `json:"driverId,omitempty"`
	Pickup    Point     `json:"pickup"`
	Drop      Point     `json:"drop"`
	Status    Status    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// allowedTransitions encodes the lifecycle state machine in one place so the
// handler layer can't accidentally skip or reverse a step.
var allowedTransitions = map[Status][]Status{
	StatusRequested:  {StatusAccepted, StatusCancelled},
	StatusAccepted:   {StatusInProgress, StatusCancelled},
	StatusInProgress: {StatusCompleted, StatusCancelled},
}

func canTransition(from, to Status) bool {
	for _, allowed := range allowedTransitions[from] {
		if allowed == to {
			return true
		}
	}
	return false
}

// errInvalidTransition is returned when a status change violates the lifecycle
// state machine (e.g. requested -> completed).
var errInvalidTransition = errors.New("invalid trip status transition")

type service struct {
	db *sql.DB
}

func newService(db *sql.DB) *service {
	return &service{db: db}
}

func scanTrip(row interface{ Scan(...any) error }) (Trip, error) {
	var t Trip
	var driverID sql.NullString
	var createdAt, updatedAt string
	if err := row.Scan(
		&t.ID, &t.RiderID, &driverID,
		&t.Pickup.Lat, &t.Pickup.Lng, &t.Drop.Lat, &t.Drop.Lng,
		&t.Status, &createdAt, &updatedAt,
	); err != nil {
		return Trip{}, err
	}
	t.DriverID = driverID.String
	t.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	t.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
	return t, nil
}

const selectTripColumns = `id, rider_id, driver_id, pickup_lat, pickup_lng, drop_lat, drop_lng, status, created_at, updated_at`

func (s *service) create(riderID string, pickup, drop Point) (Trip, error) {
	now := time.Now().UTC()
	t := Trip{
		ID:        idgen.Random("trip"),
		RiderID:   riderID,
		Pickup:    pickup,
		Drop:      drop,
		Status:    StatusRequested,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if _, err := s.db.Exec(
		`INSERT INTO trips (`+selectTripColumns+`)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.RiderID, sql.NullString{String: t.DriverID, Valid: t.DriverID != ""},
		t.Pickup.Lat, t.Pickup.Lng, t.Drop.Lat, t.Drop.Lng,
		string(t.Status), t.CreatedAt.Format(time.RFC3339), t.UpdatedAt.Format(time.RFC3339),
	); err != nil {
		return Trip{}, err
	}
	return t, nil
}

func (s *service) get(id string) (Trip, error) {
	row := s.db.QueryRow(`SELECT `+selectTripColumns+` FROM trips WHERE id = ?`, id)
	return scanTrip(row)
}

// transition moves a trip to a new status, refusing moves the state machine
// disallows so callers can't corrupt the lifecycle.
func (s *service) transition(id string, to Status) (Trip, error) {
	t, err := s.get(id)
	if err != nil {
		return Trip{}, err
	}
	if !canTransition(t.Status, to) {
		return Trip{}, errInvalidTransition
	}
	t.Status = to
	t.UpdatedAt = time.Now().UTC()
	if _, err := s.db.Exec(
		`UPDATE trips SET status = ?, updated_at = ? WHERE id = ?`,
		string(t.Status), t.UpdatedAt.Format(time.RFC3339), t.ID,
	); err != nil {
		return Trip{}, err
	}
	return t, nil
}

// Module wires the trip service into the HTTP router. It implements
// httpserver.Module so the server mounts it under /v1/trips.
type Module struct {
	svc *service
}

func New(db *sql.DB) *Module {
	return &Module{svc: newService(db)}
}

func (m *Module) Name() string { return "trips" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/", m.handleCreate)
	// Static "/export" is registered alongside the "/{id}" wildcard; chi matches
	// static segments before params, so the export route is not shadowed.
	r.Get("/export", exportHistoryHandler(m.svc))
	r.Get("/{id}", m.handleGet)
	r.Post("/{id}/status", m.handleTransition)
}

type createRequest struct {
	RiderID string `json:"riderId"`
	Pickup  Point  `json:"pickup"`
	Drop    Point  `json:"drop"`
}

func (m *Module) handleCreate(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if strings.TrimSpace(req.RiderID) == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "riderId is required"})
		return
	}
	t, err := m.svc.create(req.RiderID, req.Pickup, req.Drop)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create trip"})
		return
	}
	httpserver.WriteJSON(w, http.StatusCreated, t)
}

func (m *Module) handleGet(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	t, err := m.svc.get(id)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "trip not found"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, t)
}

type transitionRequest struct {
	Status Status `json:"status"`
}

func (m *Module) handleTransition(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req transitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	t, err := m.svc.transition(id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, errInvalidTransition):
			httpserver.WriteJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
		case errors.Is(err, sql.ErrNoRows):
			httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "trip not found"})
		default:
			httpserver.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update trip"})
		}
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, t)
}
