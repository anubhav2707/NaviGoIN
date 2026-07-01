package trip

// Unit tests: pure CSV rendering and the export handler with a mocked store
// (no database). Edge cases: empty history, missing driverId, missing riderId,
// and a store failure.

import (
	"bytes"
	"encoding/csv"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// fakeHistoryStore is a hand-rolled mock of historyStore for unit tests.
type fakeHistoryStore struct {
	trips     []Trip
	err       error
	gotRider  string
	callCount int
}

func (f *fakeHistoryStore) completedHistory(riderID string) ([]Trip, error) {
	f.callCount++
	f.gotRider = riderID
	return f.trips, f.err
}

func sampleTrip(id, rider string, status Status) Trip {
	ts := time.Date(2026, 7, 1, 10, 0, 0, 0, time.UTC)
	return Trip{
		ID:        id,
		RiderID:   rider,
		DriverID:  "drv_1",
		Pickup:    Point{Lat: 12.9716, Lng: 77.5946},
		Drop:      Point{Lat: 13.0827, Lng: 80.2707},
		Status:    status,
		CreatedAt: ts,
		UpdatedAt: ts.Add(30 * time.Minute),
	}
}

func parseCSV(t *testing.T, b []byte) [][]string {
	t.Helper()
	records, err := csv.NewReader(bytes.NewReader(b)).ReadAll()
	if err != nil {
		t.Fatalf("parse csv: %v", err)
	}
	return records
}

func TestWriteTripsCSV_EmptyWritesHeaderOnly(t *testing.T) {
	var buf bytes.Buffer
	if err := writeTripsCSV(&buf, nil); err != nil {
		t.Fatalf("writeTripsCSV: %v", err)
	}
	records := parseCSV(t, buf.Bytes())
	if len(records) != 1 {
		t.Fatalf("expected header only, got %d rows", len(records))
	}
	if strings.Join(records[0], ",") != strings.Join(tripHistoryCSVHeader, ",") {
		t.Fatalf("unexpected header: %v", records[0])
	}
}

func TestWriteTripsCSV_FormatsRows(t *testing.T) {
	trips := []Trip{sampleTrip("trip_1", "rider_1", StatusCompleted)}
	var buf bytes.Buffer
	if err := writeTripsCSV(&buf, trips); err != nil {
		t.Fatalf("writeTripsCSV: %v", err)
	}
	records := parseCSV(t, buf.Bytes())
	if len(records) != 2 {
		t.Fatalf("expected header + 1 row, got %d", len(records))
	}
	row := records[1]
	if row[0] != "trip_1" || row[1] != "rider_1" || row[2] != "drv_1" {
		t.Fatalf("unexpected id/rider/driver: %v", row)
	}
	if row[3] != "12.9716" {
		t.Fatalf("unexpected pickup lat: %q", row[3])
	}
	if row[7] != string(StatusCompleted) {
		t.Fatalf("unexpected status: %q", row[7])
	}
}

func TestWriteTripsCSV_EmptyDriverID(t *testing.T) {
	tr := sampleTrip("trip_2", "rider_1", StatusCompleted)
	tr.DriverID = ""
	var buf bytes.Buffer
	if err := writeTripsCSV(&buf, []Trip{tr}); err != nil {
		t.Fatalf("writeTripsCSV: %v", err)
	}
	records := parseCSV(t, buf.Bytes())
	if records[1][2] != "" {
		t.Fatalf("expected empty driverId column, got %q", records[1][2])
	}
}

func TestExportHistoryHandler_Success(t *testing.T) {
	store := &fakeHistoryStore{trips: []Trip{sampleTrip("trip_1", "rider_9", StatusCompleted)}}
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/v1/trips/export?riderId=rider_9", nil)

	exportHistoryHandler(store).ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if ct := rr.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/csv") {
		t.Fatalf("expected text/csv content-type, got %q", ct)
	}
	if cd := rr.Header().Get("Content-Disposition"); !strings.Contains(cd, "rider_9") {
		t.Fatalf("missing/incorrect Content-Disposition: %q", cd)
	}
	if store.gotRider != "rider_9" {
		t.Fatalf("handler passed wrong rider id to store: %q", store.gotRider)
	}
	if !strings.Contains(rr.Body.String(), "trip_1") {
		t.Fatalf("body missing trip row:\n%s", rr.Body.String())
	}
}

func TestExportHistoryHandler_MissingRiderID(t *testing.T) {
	store := &fakeHistoryStore{}
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/v1/trips/export", nil)

	exportHistoryHandler(store).ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
	if store.callCount != 0 {
		t.Fatalf("store must not be queried when riderId is missing")
	}
}

func TestExportHistoryHandler_StoreError(t *testing.T) {
	store := &fakeHistoryStore{err: errors.New("db down")}
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/v1/trips/export?riderId=rider_1", nil)

	exportHistoryHandler(store).ServeHTTP(rr, req)

	if rr.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rr.Code)
	}
}
