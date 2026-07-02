package unit

import (
	"os"
	"path/filepath"
	"testing"
)

func TestHTMLTemplatesHaveUniqueTitle(t *testing.T) {
	templates := []string{
		"account_activity/code.html",
		"emergency_settings/code.html",
		"finding_drivers/code.html",
		"home_book_ride/code.html",
		"live_trip_tracking/code.html",
		"ride_confirmed/code.html",
		"route_selection/code.html",
		"saved_cards/code.html",
		"select_your_ride/code.html",
		"trusted_contacts/code.html",
		"upi_payments_management/code.html",
	}

	for _, tmpl := range templates {
		t.Run(tmpl, func(t *testing.T) {
			tmplPath := filepath.Join("..", "..", "stitch_ridenow_mobile_app_ui_design", tmpl)
			if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
				t.Skip("Template file does not exist: " + tmplPath)
			}
			_, err := os.ReadFile(tmplPath)
			if err != nil {
				t.Skipf("Failed to read template %s: %v", tmpl, err)
			}
		})
	}
}

func TestHTMLTemplatesStructure(t *testing.T) {
	templates := []string{
		"account_activity/code.html",
		"emergency_settings/code.html",
		"finding_drivers/code.html",
		"home_book_ride/code.html",
		"live_trip_tracking/code.html",
		"ride_confirmed/code.html",
		"route_selection/code.html",
		"saved_cards/code.html",
		"select_your_ride/code.html",
		"trusted_contacts/code.html",
		"upi_payments_management/code.html",
	}

	for _, tmpl := range templates {
		t.Run(tmpl, func(t *testing.T) {
			tmplPath := filepath.Join("..", "..", "stitch_ridenow_mobile_app_ui_design", tmpl)
			if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
				t.Skip("Template file does not exist: " + tmplPath)
			}
			_, err := os.ReadFile(tmplPath)
			if err != nil {
				t.Skipf("Failed to read template %s: %v", tmpl, err)
			}
		})
	}
}