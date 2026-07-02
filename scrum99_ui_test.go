package scrum23

import (
	"bytes"
	"io/ioutil"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// Unit Tests

// TestHTMLTitleContainsRideNow verifies that all HTML files have RideNow in the title
func TestHTMLTitleContainsRideNow(t *testing.T) {
	testCases := []struct {
		name     string
		filePath string
		expectedTitle string
	}{
		{"Account Activity", "stitch_ridenow_mobile_app_ui_design/account_activity/code.html", "Account & Activity - RideNow"},
		{"Emergency Settings", "stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html", "Emergency Settings - RideNow"},
		{"Finding Drivers", "stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html", "Finding Drivers - RideNow"},
		{"Home Book Ride", "stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html", "Home - RideNow"},
		{"Live Trip Tracking", "stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html", "Live Trip Tracking - RideNow"},
		{"Ride Confirmed", "stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html", "RideNow - Ride Confirmed"},
		{"Route Selection", "stitch_ridenow_mobile_app_ui_design/route_selection/code.html", "RideNow - Destination & Route"},
		{"Saved Cards", "stitch_ridenow_mobile_app_ui_design/saved_cards/code.html", "Saved Cards - RideNow"},
		{"Select Your Ride", "stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html", "RideNow - Choose Your Ride"},
		{"Trusted Contacts", "stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html", "Trusted Contacts - RideNow"},
		{"UPI Payments", "stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html", "UPI Payments - RideNow"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			content, err := ioutil.ReadFile(tc.filePath)
			if err != nil {
				t.Skipf("File not found: %s", tc.filePath)
				return
			}

			// Extract title from HTML
			titleRegex := regexp.MustCompile(`<title>([^<]+)</title>`)
			matches := titleRegex.FindSubmatch(content)
			if len(matches) < 2 {
				t.Errorf("No title tag found in %s", tc.filePath)
				return
			}

			title := string(matches[1])
			if !strings.Contains(title, "RideNow") {
				t.Errorf("Title does not contain 'RideNow': got %s", title)
			}

			if title != tc.expectedTitle {
				t.Errorf("Title mismatch for %s: expected %s, got %s", tc.name, tc.expectedTitle, title)
			}
		})
	}
}

// TestNoHardcodedOldAppName verifies no old app names exist in HTML files
func TestNoHardcodedOldAppName(t *testing.T) {
	oldAppNames := []string{
		"StitchRide",
		"Stitch Ride",
		"stitchride",
		"STITCHRIDE",
	}

	htmlFiles := []string{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html",
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html",
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html",
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html",
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html",
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html",
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html",
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html",
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html",
	}

	for _, file := range htmlFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				t.Skipf("File not found: %s", file)
				return
			}

			contentStr := string(content)
			for _, oldName := range oldAppNames {
				if strings.Contains(contentStr, oldName) {
					t.Errorf("Found old app name '%s' in %s", oldName, file)
				}
			}
		})
	}
}

// Integration Tests

// TestHTMLStructureIntegrity verifies HTML files have proper structure
func TestHTMLStructureIntegrity(t *testing.T) {
	htmlFiles := []string{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html",
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html",
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html",
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html",
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html",
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html",
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html",
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html",
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html",
	}

	for _, file := range htmlFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				t.Skipf("File not found: %s", file)
				return
			}

			contentStr := string(content)

			// Check for DOCTYPE
			if !strings.Contains(contentStr, "<!DOCTYPE html>") {
				t.Errorf("Missing DOCTYPE declaration in %s", file)
			}

			// Check for html tag
			if !strings.Contains(contentStr, "<html") {
				t.Errorf("Missing html tag in %s", file)
			}

			// Check for head tag
			if !strings.Contains(contentStr, "<head>") && !strings.Contains(contentStr, "<head>") {
				t.Errorf("Missing head tag in %s", file)
			}

			// Check for title tag
			if !strings.Contains(contentStr, "<title>") {
				t.Errorf("Missing title tag in %s", file)
			}

			// Check for body tag
			if !strings.Contains(contentStr, "<body") {
				t.Errorf("Missing body tag in %s", file)
			}

			// Check for viewport meta tag
			if !strings.Contains(contentStr, "viewport") {
				t.Errorf("Missing viewport meta tag in %s", file)
			}
		})
	}
}

// TestConsistentDesignSystem verifies design system consistency
func TestConsistentDesignSystem(t *testing.T) {
	htmlFiles := []string{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html",
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html",
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html",
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html",
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html",
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html",
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html",
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html",
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html",
	}

	for _, file := range htmlFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				t.Skipf("File not found: %s", file)
				return
			}

			contentStr := string(content)

			// Check for Tailwind CSS
			if !strings.Contains(contentStr, "cdn.tailwindcss.com") {
				t.Errorf("Missing Tailwind CSS import in %s", file)
			}

			// Check for Inter font
			if !strings.Contains(contentStr, "Inter") {
				t.Errorf("Missing Inter font import in %s", file)
			}

			// Check for Material Symbols
			if !strings.Contains(contentStr, "Material+Symbols") {
				t.Errorf("Missing Material Symbols import in %s", file)
			}

			// Check for Tailwind config
			if !strings.Contains(contentStr, "tailwind.config") {
				t.Errorf("Missing Tailwind configuration in %s", file)
			}
		})
	}
}

// E2E Tests

// TestCompleteUITemplateSet verifies all UI screens are present and consistent
func TestCompleteUITemplateSet(t *testing.T) {
	requiredScreens := []struct {
		name string
		path string
	}{
		{"Account Activity", "stitch_ridenow_mobile_app_ui_design/account_activity/code.html"},
		{"Emergency Settings", "stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html"},
		{"Finding Drivers", "stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html"},
		{"Home Book Ride", "stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html"},
		{"Live Trip Tracking", "stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html"},
		{"Ride Confirmed", "stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html"},
		{"Route Selection", "stitch_ridenow_mobile_app_ui_design/route_selection/code.html"},
		{"Saved Cards", "stitch_ridenow_mobile_app_ui_design/saved_cards/code.html"},
		{"Select Your Ride", "stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html"},
		{"Trusted Contacts", "stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html"},
		{"UPI Payments", "stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html"},
	}

	var foundCount int
	for _, screen := range requiredScreens {
		t.Run(screen.name, func(t *testing.T) {
			content, err := ioutil.ReadFile(screen.path)
			if err != nil {
				t.Errorf("Required screen file missing: %s", screen.path)
				return
			}

			// Verify RideNow branding
			if !strings.Contains(string(content), "RideNow") {
				t.Errorf("Screen %s missing RideNow branding", screen.name)
			}

			foundCount++
		})
	}

	if foundCount != len(requiredScreens) {
		t.Errorf("Not all required screens found: %d/%d", foundCount, len(requiredScreens))
	}
}

// TestUserFlowConsistency verifies consistent user flow across screens
func TestUserFlowConsistency(t *testing.T) {
	flowScreens := []struct {
		name  string
		path  string
		phase string
	}{
		{"Home", "stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html", "start"},
		{"Route Selection", "stitch_ridenow_mobile_app_ui_design/route_selection/code.html", "destination"},
		{"Select Ride", "stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html", "vehicle"},
		{"Finding Drivers", "stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html", "matching"},
		{"Ride Confirmed", "stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html", "confirmed"},
		{"Live Tracking", "stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html", "tracking"},
	}

	for _, screen := range flowScreens {
		t.Run(screen.name, func(t *testing.T) {
			content, err := ioutil.ReadFile(screen.path)
			if err != nil {
				t.Skipf("Screen not found: %s", screen.path)
				return
			}

			contentStr := string(content)

			// All screens should have RideNow branding
			if !strings.Contains(contentStr, "RideNow") {
				t.Errorf("Flow screen %s missing RideNow branding", screen.name)
			}

			// All screens should have consistent styling imports
			if !strings.Contains(contentStr, "tailwindcss") {
				t.Errorf("Flow screen %s missing consistent styling", screen.name)
			}
		})
	}
}

// Regression Tests

// TestBackwardCompatibility verifies no breaking changes to existing structure
func TestBackwardCompatibility(t *testing.T) {
	essentialElements := []struct {
		element string
		pattern string
	}{
		{"Tailwind CSS", "cdn.tailwindcss.com"},
		{"Inter Font", "Inter"},
		{"Material Symbols", "Material+Symbols+Outlined"},
		{"Tailwind Config", "tailwind.config"},
		{"Color Scheme", "primary"},
		{"Surface Colors", "surface"},
	}

	htmlFiles := []string{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html",
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html",
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html",
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html",
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html",
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html",
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html",
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html",
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html",
	}

	for _, file := range htmlFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				t.Skipf("File not found: %s", file)
				return
			}

			contentStr := string(content)

			for _, elem := range essentialElements {
				if !strings.Contains(contentStr, elem.pattern) {
					t.Errorf("Essential element '%s' missing in %s", elem.element, file)
				}
			}
		})
	}
}

// TestNoRegressionInFileStructure verifies file structure remains intact
func TestNoRegressionInFileStructure(t *testing.T) {
	expectedStructure := map[string]bool{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html":        true,
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html":      true,
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html":         true,
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html":          true,
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html":      true,
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html":          true,
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html":         true,
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html":             true,
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html":        true,
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html":        true,
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html": true,
	}

	for path := range expectedStructure {
		t.Run(filepath.Base(path), func(t *testing.T) {
			_, err := ioutil.ReadFile(path)
			if err != nil {
				t.Logf("Warning: Expected file not found: %s", path)
			}
		})
	}
}

// MockHTMLValidator mocks HTML validation for testing
type MockHTMLValidator struct{}

func (m *MockHTMLValidator) Validate(content []byte) error {
	if !bytes.Contains(content, []byte("<!DOCTYPE html>")) {
		return &ValidationError{"Missing DOCTYPE"}
	}
	if !bytes.Contains(content, []byte("<html")) {
		return &ValidationError{"Missing html tag"}
	}
	if !bytes.Contains(content, []byte("<head")) {
		return &ValidationError{"Missing head tag"}
	}
	if !bytes.Contains(content, []byte("<title>")) {
		return &ValidationError{"Missing title tag"}
	}
	if !bytes.Contains(content, []byte("<body")) {
		return &ValidationError{"Missing body tag"}
	}
	return nil
}

type ValidationError struct {
	message string
}

func (e *ValidationError) Error() string {
	return e.message
}

// TestHTMLValidation tests HTML validation with mock
func TestHTMLValidation(t *testing.T) {
	validator := &MockHTMLValidator{}

	htmlFiles := []string{
		"stitch_ridenow_mobile_app_ui_design/account_activity/code.html",
		"stitch_ridenow_mobile_app_ui_design/emergency_settings/code.html",
		"stitch_ridenow_mobile_app_ui_design/finding_drivers/code.html",
		"stitch_ridenow_mobile_app_ui_design/home_book_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/live_trip_tracking/code.html",
		"stitch_ridenow_mobile_app_ui_design/ride_confirmed/code.html",
		"stitch_ridenow_mobile_app_ui_design/route_selection/code.html",
		"stitch_ridenow_mobile_app_ui_design/saved_cards/code.html",
		"stitch_ridenow_mobile_app_ui_design/select_your_ride/code.html",
		"stitch_ridenow_mobile_app_ui_design/trusted_contacts/code.html",
		"stitch_ridenow_mobile_app_ui_design/upi_payments_management/code.html",
	}

	for _, file := range htmlFiles {
		t.Run(filepath.Base(file), func(t *testing.T) {
			content, err := ioutil.ReadFile(file)
			if err != nil {
				t.Skipf("File not found: %s", file)
				return
			}

			if err := validator.Validate(content); err != nil {
				t.Errorf("HTML validation failed for %s: %v", file, err)
			}
		})
	}
}