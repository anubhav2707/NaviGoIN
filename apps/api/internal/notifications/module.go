// Package notifications fans out push/SMS/in-app messages triggered by other
// modules' events (driver matched, trip status changed, payment confirmed).
// The /send endpoint here is the internal contract those modules call into;
// the body would later be replaced by an async consumer reading off a queue.
package notifications

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
)

type Channel string

const (
	ChannelPush Channel = "push"
	ChannelSMS  Channel = "sms"
	ChannelInApp Channel = "in_app"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string { return "notifications" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/send", m.handleSend)
}

type sendRequest struct {
	UserID  string  `json:"userId"`
	Channel Channel `json:"channel"`
	Title   string  `json:"title"`
	Body    string  `json:"body"`
}

func (m *Module) handleSend(w http.ResponseWriter, r *http.Request) {
	var req sendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || req.Title == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "userId, channel and title are required"})
		return
	}

	// Stand-in for a provider call (FCM/APNs/Twilio) — logging makes the
	// fan-out point visible until a real provider client is wired in.
	log.Printf("[notifications] -> user=%s channel=%s title=%q", req.UserID, req.Channel, req.Title)

	httpserver.WriteJSON(w, http.StatusAccepted, map[string]string{"status": "queued"})
}
