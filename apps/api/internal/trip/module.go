// Package trip owns the ride lifecycle state machine: requested -> accepted ->
// in_progress -> completed (or cancelled). Pricing, payments and ratings react
// to trip state via events/IDs — they never mutate a Trip directly.
package trip

import (
	"database/sql"
	"encoding/json"
	"net/http"
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
	_, err := s.db.Exec(
		`INSERT INTO trips (`+selectTripColumns+`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		t.ID, t.RiderID, nil, t.Pickup.Lat, t.Pickup.Lng, t.Drop.Lat, t.Drop.Lng,
		string(t.Status), now.Format(time.RFC3339), now.Format(time.RFC3339),
	)
	return t, err
}

func (s *service) get(id string) (Trip, bool) {
	row := s.db.QueryRow(`SELECT `+selectTripColumns+` FROM trips WHERE id = ?`, id)
	t, err := scanTrip(row)
	return t, err == nil
}

var (
	errNotFound      = "trip not found"
	errBadTransition = "invalid status transition"
)

func (s *service) transition(id string, to Status, driverID string) (Trip, string) {
	current, ok := s.get(id)
	if !ok {
		return Trip{}, errNotFound
	}
	if !canTransition(current.Status, to) {
		return Trip{}, errBadTransition
	}

	current.Status = to
	current.UpdatedAt = time.Now().UTC()
	if to == StatusAccepted && driverID != "" {
		current.DriverID = driverID
	}

	var driverVal any
	if current.DriverID != "" {
		driverVal = current.DriverID
	}
	if _, err := s.db.Exec(
		`UPDATE trips SET status = ?, driver_id = ?, updated_at = ? WHERE id = ?`,
		string(current.Status), driverVal, current.UpdatedAt.Format(time.RFC3339), id,
	); err != nil {
		return Trip{}, errNotFound
	}
	return current, ""
}

type Module struct {
	svc *service
}

func New(db *sql.DB) *Module {
	return &Module{svc: newService(db)}
}

func (m *Module) Name() string { return "trips" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/", m.handleCreate)
	r.Get("/{id}", m.handleGet)
	r.Patch("/{id}/status", m.handleTransition)
}

type createRequest struct {
	RiderID string `json:"riderId"`
	Pickup  Point  `json:"pickup"`
	Drop    Point  `json:"drop"`
}

func (m *Module) handleCreate(w http.ResponseWriter, r *http.Request) {
	var req createRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RiderID == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "riderId, pickup and drop are required"})
		return
	}
	t, err := m.svc.create(req.RiderID, req.Pickup, req.Drop)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create trip"})
		return
	}
	httpserver.WriteJSON(w, http.StatusCreated, t)
}

func (m *Module) handleGet(w http.ResponseWriter, r *http.Request) {
	t, ok := m.svc.get(chi.URLParam(r, "id"))
	if !ok {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": errNotFound})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, t)
}

type transitionRequest struct {
	Status   Status `json:"status"`
	DriverID string `json:"driverId,omitempty"`
}

func (m *Module) handleTransition(w http.ResponseWriter, r *http.Request) {
	var req transitionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	t, errMsg := m.svc.transition(chi.URLParam(r, "id"), req.Status, req.DriverID)
	switch errMsg {
	case "":
		httpserver.WriteJSON(w, http.StatusOK, t)
	case errNotFound:
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": errMsg})
	default:
		httpserver.WriteJSON(w, http.StatusConflict, map[string]string{"error": errMsg})
	}
}
