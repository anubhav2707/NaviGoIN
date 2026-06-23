// Package identity owns auth and rider/driver profile data.
// Other modules reference users only by ID — never by reaching into this module's storage.
package identity

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"

	"ridenow/api/pkg/httpserver"
	"ridenow/api/pkg/idgen"
)

type Role string

const (
	RoleRider  Role = "rider"
	RoleDriver Role = "driver"
)

const otpTTL = 5 * time.Minute

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Role      Role      `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type otpEntry struct {
	code      string
	expiresAt time.Time
}

// service persists users and sessions in SQLite. OTP codes are short-lived and
// kept in memory — losing them on restart just means re-requesting a code.
type service struct {
	db   *sql.DB
	mu   sync.Mutex
	otps map[string]otpEntry
}

func newService(db *sql.DB) *service {
	return &service{db: db, otps: make(map[string]otpEntry)}
}

func scanUser(row interface{ Scan(...any) error }) (User, error) {
	var u User
	var createdAt string
	if err := row.Scan(&u.ID, &u.Name, &u.Phone, &u.Role, &createdAt); err != nil {
		return User{}, err
	}
	u.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return u, nil
}

func (s *service) insertUser(name, phone string, role Role) (User, error) {
	user := User{
		ID:        idgen.Random("usr"),
		Name:      name,
		Phone:     phone,
		Role:      role,
		CreatedAt: time.Now().UTC(),
	}
	_, err := s.db.Exec(
		`INSERT INTO users (id, name, phone, role, created_at) VALUES (?, ?, ?, ?, ?)`,
		user.ID, user.Name, user.Phone, string(user.Role), user.CreatedAt.Format(time.RFC3339),
	)
	return user, err
}

func (s *service) register(name, phone string, role Role) (User, error) {
	return s.insertUser(name, phone, role)
}

func (s *service) get(id string) (User, bool) {
	row := s.db.QueryRow(`SELECT id, name, phone, role, created_at FROM users WHERE id = ?`, id)
	user, err := scanUser(row)
	return user, err == nil
}

func (s *service) byPhone(phone string) (User, bool) {
	row := s.db.QueryRow(`SELECT id, name, phone, role, created_at FROM users WHERE phone = ?`, phone)
	user, err := scanUser(row)
	return user, err == nil
}

// requestOTP generates a fresh code for a phone and reports whether the phone
// already belongs to a user (so the client can ask new users for their name).
func (s *service) requestOTP(phone string) (code string, existing bool) {
	s.mu.Lock()
	code = randomOTP()
	s.otps[phone] = otpEntry{code: code, expiresAt: time.Now().Add(otpTTL)}
	s.mu.Unlock()

	_, existing = s.byPhone(phone)
	return code, existing
}

var errInvalidCode = "invalid or expired code"

// verifyOTP checks the code and returns a session token + user, creating the
// user on first successful login. name is used only when creating a new user.
func (s *service) verifyOTP(phone, code, name string) (token string, user User, errMsg string) {
	s.mu.Lock()
	entry, ok := s.otps[phone]
	valid := ok && time.Now().Before(entry.expiresAt) && entry.code == code
	if valid {
		delete(s.otps, phone)
	}
	s.mu.Unlock()

	if !valid {
		return "", User{}, errInvalidCode
	}

	existing, ok := s.byPhone(phone)
	if ok {
		user = existing
	} else {
		if name == "" {
			name = "Rider"
		}
		created, err := s.insertUser(name, phone, RoleRider)
		if err != nil {
			return "", User{}, "could not create account"
		}
		user = created
	}

	token = randomToken()
	if _, err := s.db.Exec(
		`INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)`,
		token, user.ID, time.Now().UTC().Format(time.RFC3339),
	); err != nil {
		return "", User{}, "could not start session"
	}
	return token, user, ""
}

func (s *service) userForToken(token string) (User, bool) {
	row := s.db.QueryRow(
		`SELECT u.id, u.name, u.phone, u.role, u.created_at
		 FROM sessions s JOIN users u ON u.id = s.user_id
		 WHERE s.token = ?`, token,
	)
	user, err := scanUser(row)
	return user, err == nil
}

func randomOTP() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "000000"
	}
	return strings.TrimSpace(padLeft(n.Int64() + 100000))
}

func padLeft(n int64) string {
	// n is already in [100000, 999999], so it's always 6 digits.
	digits := []byte{}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}

func randomToken() string {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return idgen.New("tok", int(time.Now().UnixNano()%1e6))
	}
	return hex.EncodeToString(b)
}

type Module struct {
	svc *service
}

func New(db *sql.DB) *Module {
	return &Module{svc: newService(db)}
}

func (m *Module) Name() string { return "identity" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/register", m.handleRegister)
	r.Post("/otp/request", m.handleRequestOTP)
	r.Post("/otp/verify", m.handleVerifyOTP)
	r.Get("/me", m.handleMe)
	r.Get("/{id}", m.handleGet)
}

type registerRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
	Role  Role   `json:"role"`
}

func (m *Module) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.Name == "" || req.Phone == "" || (req.Role != RoleRider && req.Role != RoleDriver) {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "name, phone and a valid role are required"})
		return
	}

	user, err := m.svc.register(req.Name, req.Phone, req.Role)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusConflict, map[string]string{"error": "could not register user (phone may already exist)"})
		return
	}
	httpserver.WriteJSON(w, http.StatusCreated, user)
}

type otpRequestBody struct {
	Phone string `json:"phone"`
}

func (m *Module) handleRequestOTP(w http.ResponseWriter, r *http.Request) {
	var req otpRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Phone) == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "phone is required"})
		return
	}

	code, existing := m.svc.requestOTP(strings.TrimSpace(req.Phone))
	// devCode is returned only so the prototype can auto-fill the code without a
	// real SMS provider. Remove this field once SMS delivery (Twilio/MSG91) is wired in.
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{
		"otpSent":      true,
		"existingUser": existing,
		"devCode":      code,
	})
}

type otpVerifyBody struct {
	Phone string `json:"phone"`
	Code  string `json:"code"`
	Name  string `json:"name"`
}

func (m *Module) handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req otpVerifyBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	phone := strings.TrimSpace(req.Phone)
	code := strings.TrimSpace(req.Code)
	if phone == "" || code == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "phone and code are required"})
		return
	}

	token, user, errMsg := m.svc.verifyOTP(phone, code, strings.TrimSpace(req.Name))
	if errMsg != "" {
		httpserver.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": errMsg})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}

func (m *Module) handleMe(w http.ResponseWriter, r *http.Request) {
	token := bearerToken(r)
	if token == "" {
		httpserver.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing bearer token"})
		return
	}
	user, ok := m.svc.userForToken(token)
	if !ok {
		httpserver.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid session"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, user)
}

func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}

func (m *Module) handleGet(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	user, ok := m.svc.get(id)
	if !ok {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, user)
}
