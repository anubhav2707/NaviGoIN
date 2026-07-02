package templates

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestRegression_ExistingTemplatesRemainValid ensures that updates don't break existing valid templates
func TestRegression_ExistingTemplatesRemainValid(t *testing.T) {
	// Define the existing valid templates before the update
	existingTemplates := map[string]string{
		"account_activity": `<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Account &amp; Activity - RideNow</title>`,
		"emergency_settings": `<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Emergency Settings - RideNow</title>`,
		"live_trip_tracking": `<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Live Trip Tracking - RideNow</title>`,
		"ride_confirmed": `<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>RideNow - Ride Confirmed</title>`,
		"route_selection": `<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>RideNow - Destination &amp; Route</title>`,
		"select_your_ride": `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>RideNow - Choose Your Ride</title>`,
	}

	testDir, err := ioutil.TempDir("", "regression_test")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	v := NewTemplateValidator("RideNow")

	for name, content := range existingTemplates {
		t.Run("Existing_"+name, func(t *testing.T) {
			dir := filepath.Join(testDir, name)
			if err := os.MkdirAll(dir, 0755); err != nil {
				t.Fatalf("failed to create directory: %v", err)
			}

			file := filepath.Join(dir, "code.html")
			// Complete the HTML for validation
			fullContent := content + `
</head>
<body>
	<h1>RideNow Content</h1>
</body>
</html>`

			if err := ioutil.WriteFile(file, []byte(fullContent), 0644); err != nil {
				t.Fatalf("failed to write file: %v", err)
			}

			// Validate that existing templates remain valid
			if err := v.ValidateFile(file); err != nil {
				t.Errorf("existing template %s should remain valid: %v", name, err)
			}
		})
	}
}

// TestRegression_FindingDriversTemplateFix tests that the finding_drivers template is fixed
func TestRegression_FindingDriversTemplateFix(t *testing.T) {
	testDir, err := ioutil.TempDir("", "regression_finding_drivers")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	// Original finding_drivers template (missing title)
	originalContent := `<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>`

	// Fixed finding_drivers template (with title)
	fixedContent := `<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Finding Drivers - RideNow</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>`

	v := NewTemplateValidator("RideNow")

	// Test original template should fail
	originalFile := filepath.Join(testDir, "original.html")
	if err := ioutil.WriteFile(originalFile, []byte(originalContent+"</head></html>"), 0644); err != nil {
		t.Fatalf("failed to write original file: %v", err)
	}

	if err := v.ValidateFile(originalFile); err == nil {
		t.Error("original finding_drivers template should fail validation (missing title)")
	}

	// Test fixed template should pass
	fixedFile := filepath.Join(testDir, "fixed.html")
	if err := ioutil.WriteFile(fixedFile, []byte(fixedContent+"</head></html>"), 0644); err != nil {
		t.Fatalf("failed to write fixed file: %v", err)
	}

	if err := v.ValidateFile(fixedFile); err != nil {
		t.Errorf("fixed finding_drivers template should pass validation: %v", err)
	}
}

// TestRegression_HomeBookRideTemplateFix tests that home_book_ride gets proper title
func TestRegression_HomeBookRideTemplateFix(t *testing.T) {
	testDir, err := ioutil.TempDir("", "regression_home_book_ride")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	// Test cases for home_book_ride title variations
	testCases := []struct {
		name      string
		title     string
		shouldPass bool
	}{
		{"missing_title", "", false},
		{"generic_title", "<title>Home</title>", false},
		{"correct_title", "<title>Book a Ride - RideNow</title>", true},
		{"alternative_title", "<title>RideNow - Book Your Ride</title>", true},
	}

	v := NewTemplateValidator("RideNow")

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			file := filepath.Join(testDir, tc.name+".html")
			content := `<!DOCTYPE html><html><head>` + tc.title + `</head><body>RideNow</body></html>`

			if err := ioutil.WriteFile(file, []byte(content), 0644); err != nil {
				t.Fatalf("failed to write file: %v", err)
			}

			err := v.ValidateFile(file)
			if tc.shouldPass && err != nil {
				t.Errorf("expected validation to pass: %v", err)
			} else if !tc.shouldPass && err == nil {
				t.Error("expected validation to fail")
			}
		})
	}
}

// TestRegression_ConsistencyAcrossAllTemplates ensures all templates have consistent structure
func TestRegression_ConsistencyAcrossAllTemplates(t *testing.T) {
	testDir, err := ioutil.TempDir("", "regression_consistency")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	// All template names that should exist
	expectedTemplates := []string{
		"account_activity",
		"emergency_settings",
		"finding_drivers",
		"home_book_ride",
		"live_trip_tracking",
		"ride_confirmed",
		"route_selection",
		"select_your_ride",
	}

	v := NewTemplateValidator("RideNow")

	// Create all templates with correct structure
	for _, tmplName := range expectedTemplates {
		dir := filepath.Join(testDir, tmplName)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed to create directory %s: %v", dir, err)
		}

		file := filepath.Join(dir, "code.html")

		// Generate appropriate title for each template
		var title string
		switch tmplName {
		case "home_book_ride":
			title = "Book a Ride - RideNow"
		case "account_activity":
			title = "Account & Activity - RideNow"
		case "emergency_settings":
			title = "Emergency Settings - RideNow"
		case "finding_drivers":
			title = "Finding Drivers - RideNow"
		case "live_trip_tracking":
			title = "Live Trip Tracking - RideNow"
		case "ride_confirmed":
			title = "RideNow - Ride Confirmed"
		case "route_selection":
			title = "RideNow - Destination & Route"
		case "select_your_ride":
			title = "RideNow - Choose Your Ride"
		}

		content := `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta content="width=device-width, initial-scale=1.0" name="viewport">
	<title>` + title + `</title>
</head>
<body>
	<h1>` + title + `</h1>
	<p>RideNow Application</p>
</body>
</html>`

		if err := ioutil.WriteFile(file, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write file %s: %v", file, err)
		}
	}

	// Validate all templates
	errors, err := v.ValidateDirectory(testDir)
	if err != nil {
		t.Fatalf("failed to validate directory: %v", err)
	}

	if len(errors) > 0 {
		t.Errorf("all templates should be valid, but got %d errors:", len(errors))
		for _, e := range errors {
			t.Logf("  - %v", e)
		}
	}

	// Verify all templates have RideNow in title
	for _, tmplName := range expectedTemplates {
		file := filepath.Join(testDir, tmplName, "code.html")
		content, err := ioutil.ReadFile(file)
		if err != nil {
			t.Errorf("failed to read %s: %v", file, err)
			continue
		}

		if !strings.Contains(string(content), "RideNow") {
			t.Errorf("template %s should contain 'RideNow' branding", tmplName)
		}

		if !strings.Contains(string(content), "<title>") {
			t.Errorf("template %s should have a title tag", tmplName)
		}
	}
}

// TestRegression_BackwardCompatibility ensures validator works with various HTML formats
func TestRegression_BackwardCompatibility(t *testing.T) {
	testCases := []struct {
		name      string
		content   string
		shouldPass bool
	}{
		{
			name:      "html5_doctype",
			content:   `<!DOCTYPE html><html><head><title>Test - RideNow</title></head></html>`,
			shouldPass: true,
		},
		{
			name:      "xhtml_format",
			content:   `<?xml version="1.0"?><!DOCTYPE html><html><head><title>Test - RideNow</title></head></html>`,
			shouldPass: true,
		},
		{
			name:      "html_with_lang",
			content:   `<!DOCTYPE html><html lang="en"><head><title>Test - RideNow</title></head></html>`,
			shouldPass: true,
		},
		{
			name:      "html_with_class",
			content:   `<!DOCTYPE html><html class="light"><head><title>Test - RideNow</title></head></html>`,
			shouldPass: true,
		},
		{
			name:      "minified_html",
			content:   `<!DOCTYPE html><html><head><title>Test-RideNow</title></head></html>`,
			shouldPass: true,
		},
	}

	v := NewTemplateValidator("RideNow")

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tmpFile, err := ioutil.TempFile("", "compat*.html")
			if err != nil {
				t.Fatalf("failed to create temp file: %v", err)
			}
			defer os.Remove(tmpFile.Name())

			if _, err := tmpFile.Write([]byte(tc.content)); err != nil {
				t.Fatalf("failed to write content: %v", err)
			}
			tmpFile.Close()

			err = v.ValidateFile(tmpFile.Name())
			if tc.shouldPass && err != nil {
				t.Errorf("expected validation to pass for %s: %v", tc.name, err)
			} else if !tc.shouldPass && err == nil {
				t.Errorf("expected validation to fail for %s", tc.name)
			}
		})
	}
}