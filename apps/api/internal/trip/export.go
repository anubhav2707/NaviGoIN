// SCRUM-23: CSV export of a rider's completed trip history.
//
// Exposes GET /v1/trips/export?riderId=... which streams the rider's trip
// history as CSV. Per the product clarification the export includes ONLY
// completed trips — cancelled (and in-flight) trips are deliberately excluded.
// The status filter is applied in SQL so non-completed trips never leave the DB.
package trip

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ridenow/api/pkg/httpserver"
)

// historyStore is the narrow slice of the trip service the export handler
// depends on. Keeping it as an interface lets the handler be unit-tested with a
// fake instead of a real database.
type historyStore interface {
	completedHistory(riderID string) ([]Trip, error)
}

// completedHistory returns the rider's completed trips, oldest first. The status
// filter lives in SQL so cancelled/in-flight trips are never returned.
func (s *service) completedHistory(riderID string) ([]Trip, error) {
	rows, err := s.db.Query(
		`SELECT `+selectTripColumns+`
		 FROM trips
		 WHERE rider_id = ? AND status = ?
		 ORDER BY created_at ASC`,
		riderID, string(StatusCompleted),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	trips := make([]Trip, 0)
	for rows.Next() {
		t, err := scanTrip(rows)
		if err != nil {
			return nil, err
		}
		trips = append(trips, t)
	}
	return trips, rows.Err()
}

// tripHistoryCSVHeader keeps the handler and tests in agreement on column order.
var tripHistoryCSVHeader = []string{
	"id", "riderId", "driverId",
	"pickupLat", "pickupLng", "dropLat", "dropLng",
	"status", "createdAt", "updatedAt",
}

// writeTripsCSV renders trips as CSV (a header row followed by one row per trip)
// to w. An empty slice yields a header-only document.
func writeTripsCSV(w io.Writer, trips []Trip) error {
	cw := csv.NewWriter(w)
	if err := cw.Write(tripHistoryCSVHeader); err != nil {
		return err
	}
	for _, t := range trips {
		record := []string{
			t.ID,
			t.RiderID,
			t.DriverID,
			formatCoord(t.Pickup.Lat),
			formatCoord(t.Pickup.Lng),
			formatCoord(t.Drop.Lat),
			formatCoord(t.Drop.Lng),
			string(t.Status),
			t.CreatedAt.UTC().Format(time.RFC3339),
			t.UpdatedAt.UTC().Format(time.RFC3339),
		}
		if err := cw.Write(record); err != nil {
			return err
		}
	}
	cw.Flush()
	return cw.Error()
}

func formatCoord(v float64) string {
	return strconv.FormatFloat(v, 'f', -1, 64)
}

// exportHistoryHandler streams a rider's completed trip history as a CSV
// attachment. riderId is required; a store error surfaces as a 500.
func exportHistoryHandler(store historyStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		riderID := strings.TrimSpace(r.URL.Query().Get("riderId"))
		if riderID == "" {
			httpserver.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "riderId is required"})
			return
		}

		trips, err := store.completedHistory(riderID)
		if err != nil {
			httpserver.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to export trip history"})
			return
		}

		w.Header().Set("Content-Type", "text/csv; charset=utf-8")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", "trip-history-"+riderID+".csv"))
		w.WriteHeader(http.StatusOK)
		// Headers are already committed; a mid-stream write error can't change the
		// status, so there is nothing actionable to do but stop.
		_ = writeTripsCSV(w, trips)
	}
}
