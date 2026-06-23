// Package razorpay is a thin client for the Razorpay REST API: creating orders
// and verifying payment/webhook signatures. Only the pieces the rider flow needs.
package razorpay

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const ordersURL = "https://api.razorpay.com/v1/orders"

type Client struct {
	keyID     string
	keySecret string
	http      *http.Client
}

func New(keyID, keySecret string) *Client {
	return &Client{
		keyID:     keyID,
		keySecret: keySecret,
		http:      &http.Client{Timeout: 15 * time.Second},
	}
}

// Enabled reports whether real credentials are configured. When false, callers
// fall back to a mock so the app still works without keys.
func (c *Client) Enabled() bool { return c.keyID != "" && c.keySecret != "" }

func (c *Client) KeyID() string { return c.keyID }

type Order struct {
	ID       string `json:"id"`
	Amount   int    `json:"amount"` // in paise
	Currency string `json:"currency"`
	Status   string `json:"status"`
	Receipt  string `json:"receipt"`
}

// CreateOrder creates a Razorpay order. amountPaise is the charge in the
// smallest currency unit (₹1 = 100 paise).
func (c *Client) CreateOrder(amountPaise int, currency, receipt string) (Order, error) {
	if currency == "" {
		currency = "INR"
	}
	payload, _ := json.Marshal(map[string]any{
		"amount":   amountPaise,
		"currency": currency,
		"receipt":  receipt,
	})

	req, err := http.NewRequest(http.MethodPost, ordersURL, bytes.NewReader(payload))
	if err != nil {
		return Order{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(c.keyID, c.keySecret)

	res, err := c.http.Do(req)
	if err != nil {
		return Order{}, err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var apiErr struct {
			Error struct {
				Description string `json:"description"`
			} `json:"error"`
		}
		_ = json.NewDecoder(res.Body).Decode(&apiErr)
		return Order{}, fmt.Errorf("razorpay order failed (%d): %s", res.StatusCode, apiErr.Error.Description)
	}

	var order Order
	if err := json.NewDecoder(res.Body).Decode(&order); err != nil {
		return Order{}, err
	}
	return order, nil
}

// VerifyPaymentSignature checks the signature Razorpay Checkout returns after a
// successful payment: HMAC_SHA256(order_id + "|" + payment_id, key_secret).
func (c *Client) VerifyPaymentSignature(orderID, paymentID, signature string) bool {
	return c.verify(orderID+"|"+paymentID, signature, c.keySecret)
}

// VerifyWebhookSignature validates the X-Razorpay-Signature header against the
// raw request body using the configured webhook secret.
func (c *Client) VerifyWebhookSignature(body []byte, signature, webhookSecret string) bool {
	if webhookSecret == "" {
		return false
	}
	return c.verify(string(body), signature, webhookSecret)
}

func (c *Client) verify(message, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
