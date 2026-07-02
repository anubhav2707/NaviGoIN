// +build e2e

package templates

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestE2E_FullTemplateUpdateWorkflow tests the complete workflow of updating templates
func TestE2E_FullTemplateUpdateWorkflow(t *testing.T) {
	// Simulate the actual stitch_ridenow_mobile_app_ui_design directory structure
	testDir, err := ioutil.TempDir("", "e2e_template_update")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	// Define the template structure as per SCRUM-99 requirements
	templates := map[string]struct {
		title   string
		content string
	}{
		"home_book_ride/code.html": {
			title:   "Book a Ride - RideNow",
			content: "Welcome to RideNow - Book your ride now!",
		},
		"account_activity/code.html": {
			title:   "Account & Activity - RideNow",
			content: "RideNow Account Management",
		},
		"emergency_settings/code.html": {
			title:   "Emergency Settings - RideNow",
			content: "Configure your RideNow emergency contacts",
		},
		"finding_drivers/code.html": {
			title:   "Finding Drivers - RideNow",
			content: "RideNow is finding the best driver for you",
		},
		"live_trip_tracking/code.html": {
			title:   "Live Trip Tracking - RideNow",
			content: "Track your RideNow trip in real-time",
		},
		"ride_confirmed/code.html": {
			title:   "RideNow - Ride Confirmed",
			content: "Your RideNow ride is confirmed",
		},
		"route_selection/code.html": {
			title:   "RideNow - Destination & Route",
			content: "Select your RideNow destination",
		},
		"select_your_ride/code.html": {
			title:   "RideNow - Choose Your Ride",
			content: "Choose your preferred RideNow vehicle",
		},
	}

	// Step 1: Create all template files
	t.Log("Step 1: Creating template files...")
	for path, tmpl := range templates {
		fullPath := filepath.Join(testDir, path)
		dir := filepath.Dir(fullPath)

		// Create directory if it doesn't exist
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed to create directory %s: %v", dir, err)
		}

		// Create HTML content
		htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>%s</title>
</head>
<body>
	<div class="container">
		<h1>%s</h1>
		<p>%s</p>
	</div>
</body>
</html>`, tmpl.title, tmpl.title, tmpl.content)

		if err := ioutil.WriteFile(fullPath, []byte(htmlContent), 0644); err != nil {
			t.Fatalf("failed to write file %s: %v", path, err)
		}
	}

	// Step 2: Validate all templates have RideNow branding
	t.Log("Step 2: Validating RideNow branding...")
	v := NewTemplateValidator("RideNow")

	for path := range templates {
		fullPath := filepath.Join(testDir, path)
		if err := v.ValidateFile(fullPath); err != nil {
			t.Errorf("validation failed for %s: %v", path, err)
		}
	}

	// Step 3: Simulate an update where one file loses branding
	t.Log("Step 3: Simulating branding inconsistency...")
	badFile := filepath.Join(testDir, "finding_drivers/code.html")
	badContent := `<!DOCTYPE html>
<html>
<head>
	<title>Finding Drivers</title>
</head>
<body>
	<h1>Finding Drivers</h1>
</body>
</html>`

	if err := ioutil.WriteFile(badFile, []byte(badContent), 0644); err != nil {
		t.Fatalf("failed to write bad file: %v", err)
	}

	// Step 4: Detect the inconsistency
	t.Log("Step 4: Detecting inconsistency...")
	if err := v.ValidateFile(badFile); err == nil {
		t.Error("expected validation to fail for file without RideNow branding")
	} else if !strings.Contains(err.Error(), "RideNow") {
		t.Errorf("error message should mention missing RideNow branding: %v", err)
	}

	// Step 5: Fix the file and revalidate
	t.Log("Step 5: Fixing branding and revalidating...")
	fixedContent := `<!DOCTYPE html>
<html>
<head>
	<title>Finding Drivers - RideNow</title>
</head>
<body>
	<h1>RideNow - Finding Drivers</h1>
</body>
</html>`

	if err := ioutil.WriteFile(badFile, []byte(fixedContent), 0644); err != nil {
		t.Fatalf("failed to write fixed file: %v", err)
	}

	if err := v.ValidateFile(badFile); err != nil {
		t.Errorf("validation should pass after fixing branding: %v", err)
	}

	// Step 6: Validate entire directory
	t.Log("Step 6: Validating entire directory...")
	errors, err := v.ValidateDirectory(testDir)
	if err != nil {
		t.Fatalf("failed to validate directory: %v", err)
	}

	if len(errors) > 0 {
		t.Errorf("expected no validation errors, got %d errors", len(errors))
		for _, e := range errors {
			t.Logf("  Error: %v", e)
		}
	}

	t.Log("✅ E2E Template Update Workflow completed successfully")
}

// TestE2E_PerformanceWithLargeTemplateSet tests performance with many templates
func TestE2E_PerformanceWithLargeTemplateSet(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance test in short mode")
	}

	testDir, err := ioutil.TempDir("", "e2e_performance")
	if err != nil {
		t.Fatalf("failed to create test directory: %v", err)
	}
	defer os.RemoveAll(testDir)

	// Create 100 template files
	numTemplates := 100
	t.Logf("Creating %d template files...", numTemplates)

	for i := 0; i < numTemplates; i++ {
		dir := filepath.Join(testDir, fmt.Sprintf("screen_%d", i))
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatalf("failed to create directory: %v", err)
		}

		file := filepath.Join(dir, "code.html")
		content := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<title>Screen %d - RideNow</title>
</head>
<body>
	<h1>RideNow Screen %d</h1>
</body>
</html>`, i, i)

		if err := ioutil.WriteFile(file, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write file: %v", err)
		}
	}

	// Measure validation time
	v := NewTemplateValidator("RideNow")
	start := time.Now()

	errors, err := v.ValidateDirectory(testDir)
	if err != nil {
		t.Fatalf("failed to validate directory: %v", err)
	}

	duration := time.Since(start)
	t.Logf("Validated %d templates in %v", numTemplates, duration)

	if len(errors) > 0 {
		t.Errorf("unexpected validation errors: %d", len(errors))
	}

	// Performance threshold (should validate 100 files in under 1 second)
	if duration > time.Second {
		t.Logf("Warning: Validation took longer than expected: %v", duration)
	}
}

// TestE2E_RealWorldScenarios tests real-world update scenarios
func TestE2E_RealWorldScenarios(t *testing.T) {
	scenarios := []struct {
		name        string
		oldAppName  string
		newAppName  string
		expectValid bool
	}{
		{
			name:        "Update from generic to RideNow",
			oldAppName:  "App",
			newAppName:  "RideNow",
			expectValid: true,
		},
		{
			name:        "Maintain RideNow branding",
			oldAppName:  "RideNow",
			newAppName:  "RideNow",
			expectValid: true,
		},
		{
			name:        "Rebrand from RideNow to NewBrand",
			oldAppName:  "RideNow",
			newAppName:  "NewBrand",
			expectValid: true,
		},
	}

	for _, scenario := range scenarios {
		t.Run(scenario.name, func(t *testing.T) {
			testDir, err := ioutil.TempDir("", "e2e_scenario")
			if err != nil {
				t.Fatalf("failed to create test directory: %v", err)
			}
			defer os.RemoveAll(testDir)

			// Create initial template with old branding
			file := filepath.Join(testDir, "template.html")
			initialContent := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
	<title>Home - %s</title>
</head>
<body>
	<h1>Welcome to %s</h1>
</body>
</html>`, scenario.oldAppName, scenario.oldAppName)

			if err := ioutil.WriteFile(file, []byte(initialContent), 0644); err != nil {
				t.Fatalf("failed to write initial file: %v", err)
			}

			// Update to new branding
			updatedContent := strings.ReplaceAll(initialContent, scenario.oldAppName, scenario.newAppName)
			if err := ioutil.WriteFile(file, []byte(updatedContent), 0644); err != nil {
				t.Fatalf("failed to update file: %v", err)
			}

			// Validate with new app name
			v := NewTemplateValidator(scenario.newAppName)
			err = v.ValidateFile(file)

			if scenario.expectValid && err != nil {
				t.Errorf("expected validation to pass but got error: %v", err)
			} else if !scenario.expectValid && err == nil {
				t.Error("expected validation to fail but it passed")
			}
		})
	}
}