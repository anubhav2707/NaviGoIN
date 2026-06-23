// Command server is the composition root: it builds every module and wires
// the few cross-module dependencies through narrow adapters defined here —
// modules never import each other directly.
package main

import (
	"log"
	"net/http"

	"ridenow/api/internal/driver"
	"ridenow/api/internal/identity"
	"ridenow/api/internal/location"
	"ridenow/api/internal/matching"
	"ridenow/api/internal/notifications"
	"ridenow/api/internal/payments"
	"ridenow/api/internal/pricing"
	"ridenow/api/internal/ratings"
	"ridenow/api/internal/realtime"
	"ridenow/api/internal/trip"
	"ridenow/api/pkg/config"
	"ridenow/api/pkg/db"
	"ridenow/api/pkg/httpserver"
	"ridenow/api/pkg/razorpay"
)

// locationFinderAdapter satisfies matching.Finder by translating between
// location's and matching's local Point/Candidate types — the seam that lets
// either module move to its own service later without the other noticing.
type locationFinderAdapter struct {
	loc *location.Module
}

func (a locationFinderAdapter) NearbyDrivers(origin matching.Point, radiusKm float64, limit int) []matching.Candidate {
	results := a.loc.NearbyDrivers(location.Point{Lat: origin.Lat, Lng: origin.Lng}, radiusKm, limit)

	candidates := make([]matching.Candidate, len(results))
	for i, r := range results {
		candidates[i] = matching.Candidate{
			DriverID: r.DriverID,
			Point:    matching.Point{Lat: r.Point.Lat, Lng: r.Point.Lng},
			Distance: r.Distance,
		}
	}
	return candidates
}

func main() {
	cfg := config.Load()

	database, err := db.Open(cfg.SQLitePath)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	locationModule := location.New()
	rzp := razorpay.New(cfg.RazorpayKeyID, cfg.RazorpayKeySecret)
	if rzp.Enabled() {
		log.Printf("razorpay: enabled (key %s…)", safePrefix(cfg.RazorpayKeyID))
	} else {
		log.Printf("razorpay: no keys configured — payments run in mock mode")
	}

	router := httpserver.NewRouter(
		identity.New(database),
		driver.New(),
		locationModule,
		matching.New(locationFinderAdapter{loc: locationModule}),
		trip.New(database),
		pricing.New(),
		payments.New(rzp, cfg.RazorpayWebhookSecret),
		notifications.New(),
		ratings.New(),
		realtime.New(),
	)

	addr := ":" + cfg.Port
	log.Printf("ridenow api listening on %s (env=%s, db=%s)", addr, cfg.Env, cfg.SQLitePath)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatal(err)
	}
}

// safePrefix returns the first few characters of a secret for logging.
func safePrefix(s string) string {
	if len(s) <= 8 {
		return s
	}
	return s[:8]
}
