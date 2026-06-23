// Package driver owns onboarding, vehicle details, and online/offline status.
// The matching module reads availability through this module's exported service —
// it never queries driver storage directly.
package driver

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
)

type Status string

const (
	StatusOffline Status = "offline"
	StatusOnline  Status = "online"
	StatusOnTrip  Status = "on_trip"
)

type Driver struct {
	ID      string `json:"id"`
	UserID  string `json:"userId"`
	Vehicle string `json:"vehicle"`
	Plate   string `json:"plate"`
	Status  Status `json:"status"`
}

type service struct {
	mu   sync.RWMutex
	byID map[string]*Driver
}

func newService() *service {
	return &service{byID: make(map[string]*Driver)}
}

func (s *service) upsert(d Driver) Driver {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.byID[d.ID] = &d
	return d
}

func (s *service) setStatus(id string, status Status) (Driver, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.byID[id]
	if !ok {
		return Driver{}, false
	}
	d.Status = status
	return *d, true
}

func (s *service) get(id string) (Driver, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.byID[id]
	if !ok {
		return Driver{}, false
	}
	return *d, true
}

type Module struct {
	svc *service
}

func New() *Module {
	return &Module{svc: newService()}
}

func (m *Module) Name() string { return "drivers" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/", m.handleOnboard)
	r.Get("/{id}", m.handleGet)
	r.Patch("/{id}/status", m.handleSetStatus)
}

func (m *Module) handleOnboard(w http.ResponseWriter, r *http.Request) {
	var d Driver
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.ID == "" || d.UserID == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "id, userId, vehicle and plate are required"})
		return
	}
	d.Status = StatusOffline
	httpserver.WriteJSON(w, http.StatusCreated, m.svc.upsert(d))
}

func (m *Module) handleGet(w http.ResponseWriter, r *http.Request) {
	d, ok := m.svc.get(chi.URLParam(r, "id"))
	if !ok {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "driver not found"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, d)
}

type setStatusRequest struct {
	Status Status `json:"status"`
}

func (m *Module) handleSetStatus(w http.ResponseWriter, r *http.Request) {
	var req setStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	switch req.Status {
	case StatusOnline, StatusOffline, StatusOnTrip:
	default:
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "status must be online, offline or on_trip"})
		return
	}

	d, ok := m.svc.setStatus(chi.URLParam(r, "id"), req.Status)
	if !ok {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "driver not found"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, d)
}
