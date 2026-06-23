// Package payments owns charging riders and recording payouts to drivers.
// It fronts Razorpay: the rider flow creates an order, the app opens Razorpay
// Checkout, and the returned signature is verified here before a charge is
// marked succeeded. Charges are recorded in memory for the prototype.
//
// Supported methods: cash (settled with the driver), UPI/card via Razorpay, and
// a scan-to-pay UPI QR. A stored-value wallet is intentionally NOT offered — it
// would be a prepaid payment instrument requiring RBI authorisation and KYC.
package payments

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	qrcode "github.com/skip2/go-qrcode"

	"ridenow/api/pkg/httpserver"
	"ridenow/api/pkg/idgen"
	"ridenow/api/pkg/razorpay"
)

// payeeVPA is the UPI handle that collects ride payments. Configure per-merchant
// in production; static here for the prototype's scan-to-pay QR.
const payeeVPA = "ridenow@upi"

type Method string

const (
	MethodUPI  Method = "upi"
	MethodCard Method = "card"
	MethodCash Method = "cash"
)

type Status string

const (
	StatusPending   Status = "pending"
	StatusSucceeded Status = "succeeded"
	StatusFailed    Status = "failed"
)

type Charge struct {
	ID        string    `json:"id"`
	TripID    string    `json:"tripId"`
	RiderID   string    `json:"riderId"`
	Amount    float64   `json:"amount"`
	Currency  string    `json:"currency"`
	Method    Method    `json:"method"`
	Status    Status    `json:"status"`
	OrderID   string    `json:"orderId,omitempty"`
	PaymentID string    `json:"paymentId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

type service struct {
	mu    sync.RWMutex
	byID  map[string]*Charge
	nextN int
}

func newService() *service {
	return &service{byID: make(map[string]*Charge)}
}

func (s *service) save(c Charge) Charge {
	s.mu.Lock()
	defer s.mu.Unlock()
	stored := c
	s.byID[c.ID] = &stored
	return stored
}

func (s *service) nextID() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.nextN++
	return idgen.New("chg", s.nextN)
}

func (s *service) get(id string) (Charge, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c, ok := s.byID[id]
	if !ok {
		return Charge{}, false
	}
	return *c, true
}

func (s *service) setStatus(id string, status Status, paymentID string) (Charge, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.byID[id]
	if !ok {
		return Charge{}, false
	}
	c.Status = status
	if paymentID != "" {
		c.PaymentID = paymentID
	}
	return *c, true
}

// charge records an immediately-settled charge (e.g. cash). Online payments go
// through the Razorpay order/verify flow instead.
func (s *service) charge(tripID, riderID string, amount float64, method Method) Charge {
	return s.save(Charge{
		ID:        s.nextID(),
		TripID:    tripID,
		RiderID:   riderID,
		Amount:    amount,
		Currency:  "INR",
		Method:    method,
		Status:    StatusSucceeded,
		CreatedAt: time.Now().UTC(),
	})
}

type Module struct {
	svc           *service
	rzp           *razorpay.Client
	webhookSecret string
}

func New(rzp *razorpay.Client, webhookSecret string) *Module {
	return &Module{svc: newService(), rzp: rzp, webhookSecret: webhookSecret}
}

func (m *Module) Name() string { return "payments" }

func (m *Module) MountRoutes(r chi.Router) {
	r.Post("/charges", m.handleCharge)
	r.Post("/orders", m.handleCreateOrder)
	r.Post("/verify", m.handleVerify)
	r.Post("/webhook", m.handleWebhook)
	r.Post("/upi-qr", m.handleUpiQR)
}

type chargeRequest struct {
	TripID  string  `json:"tripId"`
	RiderID string  `json:"riderId"`
	Amount  float64 `json:"amount"`
	Method  Method  `json:"method"`
}

func (m *Module) handleCharge(w http.ResponseWriter, r *http.Request) {
	var req chargeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TripID == "" || req.Amount <= 0 {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "tripId, riderId, amount and method are required"})
		return
	}
	switch req.Method {
	case MethodUPI, MethodCard, MethodCash:
	default:
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "method must be upi, card or cash"})
		return
	}

	httpserver.WriteJSON(w, http.StatusCreated, m.svc.charge(req.TripID, req.RiderID, req.Amount, req.Method))
}

type createOrderRequest struct {
	TripID  string  `json:"tripId"`
	RiderID string  `json:"riderId"`
	Amount  float64 `json:"amount"` // in rupees
}

// handleCreateOrder creates a Razorpay order and a pending charge, returning the
// details the app's Razorpay Checkout needs (order id + public key).
func (m *Module) handleCreateOrder(w http.ResponseWriter, r *http.Request) {
	var req createOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "amount (in rupees) is required"})
		return
	}

	chargeID := m.svc.nextID()
	amountPaise := int(req.Amount*100 + 0.5)

	c := Charge{
		ID:        chargeID,
		TripID:    req.TripID,
		RiderID:   req.RiderID,
		Amount:    req.Amount,
		Currency:  "INR",
		Method:    MethodUPI,
		Status:    StatusPending,
		CreatedAt: time.Now().UTC(),
	}

	if !m.rzp.Enabled() {
		// No keys configured — return a mock order so the app flow still runs.
		c.OrderID = "order_mock_" + chargeID
		m.svc.save(c)
		httpserver.WriteJSON(w, http.StatusCreated, map[string]any{
			"chargeId": chargeID, "orderId": c.OrderID, "amount": amountPaise,
			"currency": "INR", "keyId": "", "mock": true,
		})
		return
	}

	order, err := m.rzp.CreateOrder(amountPaise, "INR", chargeID)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusBadGateway, map[string]string{"error": "could not create payment order: " + err.Error()})
		return
	}
	c.OrderID = order.ID
	m.svc.save(c)

	httpserver.WriteJSON(w, http.StatusCreated, map[string]any{
		"chargeId": chargeID,
		"orderId":  order.ID,
		"amount":   order.Amount,
		"currency": order.Currency,
		"keyId":    m.rzp.KeyID(),
	})
}

type verifyRequest struct {
	ChargeID  string `json:"chargeId"`
	OrderID   string `json:"orderId"`
	PaymentID string `json:"paymentId"`
	Signature string `json:"signature"`
}

// handleVerify validates the signature returned by Razorpay Checkout and marks
// the charge succeeded (or failed).
func (m *Module) handleVerify(w http.ResponseWriter, r *http.Request) {
	var req verifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ChargeID == "" {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "chargeId, orderId, paymentId and signature are required"})
		return
	}

	// With real keys, require a valid signature. In mock mode (no keys) accept it.
	ok := !m.rzp.Enabled() || m.rzp.VerifyPaymentSignature(req.OrderID, req.PaymentID, req.Signature)
	if !ok {
		m.svc.setStatus(req.ChargeID, StatusFailed, req.PaymentID)
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "payment signature verification failed"})
		return
	}

	charge, found := m.svc.setStatus(req.ChargeID, StatusSucceeded, req.PaymentID)
	if !found {
		httpserver.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "charge not found"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, charge)
}

// handleWebhook ingests Razorpay webhook events (payment.captured, etc.) and
// verifies them against the configured webhook secret.
func (m *Module) handleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "could not read body"})
		return
	}
	signature := r.Header.Get("X-Razorpay-Signature")
	if !m.rzp.VerifyWebhookSignature(body, signature, m.webhookSecret) {
		httpserver.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid webhook signature"})
		return
	}
	// A full implementation would update the charge from the event payload here.
	httpserver.WriteJSON(w, http.StatusOK, map[string]string{"status": "received"})
}

type upiQRRequest struct {
	Amount float64 `json:"amount"`
	TripID string  `json:"tripId"`
}

// handleUpiQR builds a UPI deep-link for the fare and returns it plus a PNG QR
// (base64) the rider can scan with any UPI app to pay into the merchant VPA.
func (m *Module) handleUpiQR(w http.ResponseWriter, r *http.Request) {
	var req upiQRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "amount is required"})
		return
	}

	note := "RideNow fare"
	if req.TripID != "" {
		note = "RideNow " + req.TripID
	}
	upiURI := fmt.Sprintf(
		"upi://pay?pa=%s&pn=%s&am=%s&cu=INR&tn=%s",
		url.QueryEscape(payeeVPA),
		url.QueryEscape("RideNow"),
		strconv.FormatFloat(req.Amount, 'f', 2, 64),
		url.QueryEscape(note),
	)

	png, err := qrcode.Encode(upiURI, qrcode.Medium, 512)
	if err != nil {
		httpserver.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not generate QR"})
		return
	}
	httpserver.WriteJSON(w, http.StatusOK, map[string]any{
		"upiUri":   upiURI,
		"payeeVpa": payeeVPA,
		"amount":   req.Amount,
		"qrPngB64": base64.StdEncoding.EncodeToString(png),
	})
}
