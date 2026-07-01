package trip

// Regression: adding the static /export route must not shadow the existing
// /{id} wildcard route or otherwise disturb the trip lifecycle endpoints and
// the server health check.

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"ridenow/api/pkg/httpserver"
)

func TestRegression_LifecycleRoutesUnaffectedByExport(t *testing.T) {
	conn := newTripTestDB(t)
	mod := New(conn)
	srv := httptest.NewServer(httpserver.NewRouter(mod))
	defer srv.Close()

	if mod.Name() != "trips" {
		t.Fatalf("unexpected module name: %q", mod.Name())
	}

	// create — POST /v1/trips/
	body := `{"riderId":"rider_reg","pickup":{"lat":1,"lng":2},"drop":{"lat":3,"lng":4}}`
	createResp, err := http.Post(srv.URL+"/v1/trips/", "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatalf("POST create: %v", err)
	}
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 on create, got %d", createResp.StatusCode)
	}
	var created Trip
	if err := json.NewDecoder(createResp.Body).Decode(&created); err != nil {
		t.Fatalf("decode created trip: %v", err)
	}
	createResp.Body.Close()
	if created.Status != StatusRequested {
		t.Fatalf("expected new trip in requested state, got %s", created.Status)
	}

	// get — GET /v1/trips/{id} must still resolve to the wildcard handler,
	// not be captured by the new static /export route.
	getResp, err := http.Get(srv.URL + "/v1/trips/" + created.ID)
	if err != nil {
		t.Fatalf("GET trip: %v", err)
	}
	if getResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on get, got %d", getResp.StatusCode)
	}
	getResp.Body.Close()

	// export — GET /v1/trips/export resolves to the export handler (static wins).
	exportResp, err := http.Get(srv.URL + "/v1/trips/export?riderId=rider_reg")
	if err != nil {
		t.Fatalf("GET export: %v", err)
	}
	if exportResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on export, got %d", exportResp.StatusCode)
	}
	exportResp.Body.Close()

	// health check — unrelated route stays healthy.
	healthResp, err := http.Get(srv.URL + "/healthz")
	if err != nil {
		t.Fatalf("GET healthz: %v", err)
	}
	if healthResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on healthz, got %d", healthResp.StatusCode)
	}
	healthResp.Body.Close()
}
