// Package ratings records post-trip reviews for riders and drivers.
// It only needs the trip ID and the two participant IDs — it never reaches
// into trip storage to validate them (that's the trip module's job, via an
// event or a lookup through its exported service when this grows beyond a stub).
package ratings

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
	"ridenow/api/pkg/idgen"
)

type Rating struct {
	ID        string    `json:"id"`
	TripID    string    `json:"tripId"`
	FromUserID string   `json:"fromUserId"`
	ToUserID  string    `json:"toUserId"`
	Stars     int       `json:"stars"`
	Comment   string    `json:"comment,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type service struct {
	mu    sync.Mutex
	items []Rating
	nextN int
}

func newService() *service { return &service{} }

func (s *service) submit(tripID, from, to string, stars int, comment string) Rating {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextN++
	now := time.Now().UTC()
	r := Rating{
		ID:         idgen.New("rtg", s.nextN),
		TripID:     tripID,
		FromUserID: from,
		ToUserID:   to,
		Stars:      stars,
		Comment:    comment,
		CreatedAt:  now,
	}
	s.items = append(s.items, r)
	return r
}

type Module struct {
	svc *service
}

func New() *Module {
	return &Module{svc: newService()}
}

func (m *Module) Name() string { return "ratings" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/", m.handleSubmit)
}

type submitRequest struct {
	TripID  string `json:"tripId"`
	FromUserID string `json:"fromUserId"`
	ToUserID   string `json:"toUserId"`
	Stars   int    `json:"stars"`
	Comment string `json:"comment,omitempty"`
}

func (m *Module) handleSubmit(w http.ResponseWriter, r *http.Request) {
	var req submitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TripID == "" || req.Stars < 1 || req.Stars > 5 {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "tripId, fromUserId, toUserId and stars (1-5) are required"})
		return
	}
	httpserver.WriteJSON(w, http.StatusCreated, m.svc.submit(req.TripID, req.FromUserID, req.ToUserID, req.Stars, req.Comment))
}
