package trip

// Integration tests: the service's completedHistory query wired to a real
// SQLite database (schema applied by pkg/db). Verifies the completed-only
// filter and rider scoping against actual persisted rows.
//
// The shared helpers below (newTripTestDB / mustTransition / seed*) are also
// used by the e2e and regression suites in this package.

import (
	"database/sql"
	"path/filepath"
	"testing"

	"ridenow/api/pkg/db"
)

func newTripTestDB(t *testing.T) *sql.DB {
	t.Helper()
	path := filepath.Join(t.TempDir(), "trips_test.db")
	conn, err := db.Open(path)
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	// Single connection keeps a deterministic view of the schema/data for tests.
	conn.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = conn.Close() })
	return conn
}

func mustTransition(t *testing.T, s *service, id string, to Status) Trip {
	t.Helper()
	tr, err := s.transition(id, to)
	if err != nil {
		t.Fatalf("transition %s -> %s: %v", id, to, err)
	}
	return tr
}

func seedCompletedTrip(t *testing.T, s *service, rider string) Trip {
	t.Helper()
	tr, err := s.create(rider, Point{Lat: 1, Lng: 2}, Point{Lat: 3, Lng: 4})
	if err != nil {
		t.Fatalf("create trip: %v", err)
	}
	mustTransition(t, s, tr.ID, StatusAccepted)
	mustTransition(t, s, tr.ID, StatusInProgress)
	return mustTransition(t, s, tr.ID, StatusCompleted)
}

func seedCancelledTrip(t *testing.T, s *service, rider string) Trip {
	t.Helper()
	tr, err := s.create(rider, Point{Lat: 1, Lng: 2}, Point{Lat: 3, Lng: 4})
	if err != nil {
		t.Fatalf("create trip: %v", err)
	}
	return mustTransition(t, s, tr.ID, StatusCancelled)
}

func TestCompletedHistory_ExcludesNonCompleted(t *testing.T) {
	s := newService(newTripTestDB(t))

	completed := seedCompletedTrip(t, s, "rider_1")
	cancelled := seedCancelledTrip(t, s, "rider_1")

	// An in-flight trip for the same rider must also be excluded.
	inflight, err := s.create("rider_1", Point{}, Point{})
	if err != nil {
		t.Fatalf("create inflight: %v", err)
	}
	mustTransition(t, s, inflight.ID, StatusAccepted)
	mustTransition(t, s, inflight.ID, StatusInProgress)

	// A completed trip for a different rider must not leak across riders.
	seedCompletedTrip(t, s, "rider_2")

	history, err := s.completedHistory("rider_1")
	if err != nil {
		t.Fatalf("completedHistory: %v", err)
	}
	if len(history) != 1 {
		t.Fatalf("expected exactly 1 completed trip, got %d", len(history))
	}
	if history[0].ID != completed.ID {
		t.Fatalf("expected trip %s, got %s", completed.ID, history[0].ID)
	}
	if history[0].Status != StatusCompleted {
		t.Fatalf("non-completed status leaked: %s", history[0].Status)
	}
	if history[0].ID == cancelled.ID {
		t.Fatalf("cancelled trip leaked into export")
	}
}

func TestCompletedHistory_EmptyWhenNoCompleted(t *testing.T) {
	s := newService(newTripTestDB(t))
	seedCancelledTrip(t, s, "rider_1")

	history, err := s.completedHistory("rider_1")
	if err != nil {
		t.Fatalf("completedHistory: %v", err)
	}
	if len(history) != 0 {
		t.Fatalf("expected empty history, got %d", len(history))
	}
}

func TestCompletedHistory_ReturnsAllCompletedForRider(t *testing.T) {
	s := newService(newTripTestDB(t))
	a := seedCompletedTrip(t, s, "rider_1")
	b := seedCompletedTrip(t, s, "rider_1")

	history, err := s.completedHistory("rider_1")
	if err != nil {
		t.Fatalf("completedHistory: %v", err)
	}
	if len(history) != 2 {
		t.Fatalf("expected 2 completed trips, got %d", len(history))
	}
	seen := map[string]bool{}
	for _, tr := range history {
		seen[tr.ID] = true
	}
	if !seen[a.ID] || !seen[b.ID] {
		t.Fatalf("expected both %s and %s in history, got %v", a.ID, b.ID, seen)
	}
}
