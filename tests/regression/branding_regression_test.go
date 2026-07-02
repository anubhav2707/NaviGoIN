package tests

import (
	"io/ioutil"
	"path/filepath"
	"strings"
	"testing"
)

// TestNoRideNowReferences ensures no RideNow references exist anywhere
func TestNoRideNowReferences(t *testing.T) {
	templateDir := "../../stitch_ridenow_mobile_app_ui_design"
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

	for _, template := range templates {
		t.Run(template, func(t *testing.T) {
			path := filepath.Join(templateDir, template)
			content, err := ioutil.ReadFile(path)
			if err != nil {
				t.Fatalf("Failed to read template %s: %v", template, err)
			}

			contentStr := strings.ToLower(string(content))

			// Check for any case variation of RideNow
			if strings.Contains(contentStr, "ridenow") {
				// Find the exact occurrence for better error reporting
				lines := strings.Split(string(content), "\n")
				for i, line := range lines {
					if strings.Contains(strings.ToLower(line), "ridenow") {
						t.Errorf("Template %s contains 'RideNow' at line %d: %s", template, i+1, strings.TrimSpace(line))
					}
				}
			}

			// Check for ride_now or ride-now variations
			if strings.Contains(contentStr, "ride_now") || strings.Contains(contentStr, "ride-now") {
				t.Errorf("Template %s contains RideNow variation (ride_now or ride-now)", template)
			}
		})
	}
}

// TestNaviGoINBrandingPresent ensures NaviGoIN branding is present
func TestNaviGoINBrandingPresent(t *testing.T) {
	templateDir := "../../stitch_ridenow_mobile_app_ui_design"
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

	for _, template := range templates {
		t.Run(template, func(t *testing.T) {
			path := filepath.Join(templateDir, template)
			content, err := ioutil.ReadFile(path)
			if err != nil {
				t.Fatalf("Failed to read template %s: %v", template, err)
			}

			contentStr := string(content)

			// Must contain NaviGoIN in title
			if !strings.Contains(contentStr, "<title>NaviGoIN") {
				t.Errorf("Template %s missing NaviGoIN in title tag", template)
			}

			// Must contain at least one NaviGoIN reference
			navigoinCount := strings.Count(contentStr, "NaviGoIN")
			if navigoinCount < 1 {
				t.Errorf("Template %s does not contain NaviGoIN branding", template)
			} else {
				t.Logf("Template %s contains %d NaviGoIN references", template, navigoinCount)
			}
		})
	}
}

// TestRegressionTitleUniqueness ensures no duplicate titles after update
func TestRegressionTitleUniqueness(t *testing.T) {
	templateDir := "../../stitch_ridenow_mobile_app_ui_design"
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

	titleMap := make(map[string]string) // title -> template mapping

	for _, template := range templates {
		path := filepath.Join(templateDir, template)
		content, err := ioutil.ReadFile(path)
		if err != nil {
			t.Fatalf("Failed to read template %s: %v", template, err)
		}

		contentStr := string(content)

		// Extract title
		titleStart := strings.Index(contentStr, "<title>")
		titleEnd := strings.Index(contentStr, "</title>")
		if titleStart == -1 || titleEnd == -1 {
			t.Errorf("Template %s missing title tags", template)
			continue
		}

		title := contentStr[titleStart+7 : titleEnd]

		// Check for duplicate
		if existingTemplate, exists := titleMap[title]; exists {
			t.Errorf("Duplicate title '%s' found in templates: %s and %s", title, existingTemplate, template)
		}
		titleMap[title] = template
	}

	t.Logf("Verified %d unique titles", len(titleMap))
}

// TestRegressionConsistentNaming validates consistent NaviGoIN capitalization
func TestRegressionConsistentNaming(t *testing.T) {
	templateDir := "../../stitch_ridenow_mobile_app_ui_design"
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

	for _, template := range templates {
		t.Run(template, func(t *testing.T) {
			path := filepath.Join(templateDir, template)
			content, err := ioutil.ReadFile(path)
			if err != nil {
				t.Fatalf("Failed to read template %s: %v", template, err)
			}

			contentStr := string(content)

			// Check for incorrect capitalizations
			incorrectVariations := []string{
				"Navigoin", "navigoin", "NAVIGOIN",
				"NaviGoin", "Navi-Go-IN", "Navi_Go_IN",
			}

			for _, variation := range incorrectVariations {
				if strings.Contains(contentStr, variation) {
					t.Errorf("Template %s contains incorrect NaviGoIN capitalization: %s", template, variation)
				}
			}
		})
	}
}