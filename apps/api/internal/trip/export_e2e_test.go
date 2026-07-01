package trip

// Functional/e2e test: the ticket's business requirement exercised end-to-end
// through the real HTTP router — GET /v1/trips/export?riderId=... returns CSV
// containing the rider's completed trips and excluding cancelled ones.

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"ridenow/api/pkg/httpserver"
)

func TestExportEndpoint_E2E_CSVCompletedOnly(t *testing.T) {
	conn := newTripTestDB(t)
	mod := New(conn)
	srv := httptest.NewServer(httpserver.NewRouter(mod))
	defer srv.Close()

	completed := seedCompletedTrip(t, mod.svc, "rider_e2e")
	cancelled := seedCancelledTrip(t, mod.svc, "rider_e2e")

	resp, err := http.Get(srv.URL + "/v1/trips/export?riderId=rider_e2e")
	if err != nil {
		t.Fatalf("GET export: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/csv") {
		t.Fatalf("expected text/csv, got %q", ct)
	}
	if cd := resp.Header.Get("Content-Disposition"); !strings.Contains(cd, "attachment") {
		t.Fatalf("expected attachment disposition, got %q", cd)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	got := string(body)
	if !strings.Contains(got, "id,riderId,driverId") {
		t.Fatalf("missing CSV header:\n%s", got)
	}
	if !strings.Contains(got, completed.ID) {
		t.Fatalf("completed trip %s missing from export:\n%s", completed.ID, got)
	}
	if strings.Contains(got, cancelled.ID) {
		t.Fatalf("cancelled trip %s must be excluded from export:\n%s", cancelled.ID, got)
	}
}

func TestExportEndpoint_E2E_MissingRiderID(t *testing.T) {
	conn := newTripTestDB(t)
	srv := httptest.NewServer(httpserver.NewRouter(New(conn)))
	defer srv.Close()

	resp, err := http.Get(srv.URL + "/v1/trips/export")
	if err != nil {
		t.Fatalf("GET export: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 when riderId missing, got %d", resp.StatusCode)
	}
}
