// +build integration

package templates

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

func TestTemplateValidator_IntegrationValidateDirectory(t *testing.T) {
	// Create temp directory structure
	tmpDir, err := ioutil.TempDir("", "integration_test_templates")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create subdirectories
	subDirs := []string{
		"home_book_ride",
		"account_activity",
		"emergency_settings",
		"finding_drivers",
		"live_trip_tracking",
		"ride_confirmed",
		"route_selection",
		"select_your_ride",
	}

	for _, dir := range subDirs {
		dirPath := filepath.Join(tmpDir, dir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			t.Fatalf("failed to create dir %s: %v", dir, err)
		}

		// Create HTML file in each directory
		htmlFile := filepath.Join(dirPath, "code.html")
		content := `<!DOCTYPE html>
<html>
<head>
	<title>` + dir + ` - RideNow</title>
</head>
<body>
	<h1>Welcome to RideNow</h1>
</body>
</html>`

		if err := ioutil.WriteFile(htmlFile, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write HTML file in %s: %v", dir, err)
		}
	}

	// Add one file without proper branding
	badFile := filepath.Join(tmpDir, "finding_drivers", "code.html")
	badContent := `<!DOCTYPE html>
<html>
<head>
	<!-- Missing title tag -->
</head>
<body>
	<h1>Finding Drivers</h1>
</body>
</html>`
	if err := ioutil.WriteFile(badFile, []byte(badContent), 0644); err != nil {
		t.Fatalf("failed to write bad HTML file: %v", err)
	}

	// Validate directory
	v := NewTemplateValidator("RideNow")
	errors, err := v.ValidateDirectory(tmpDir)
	if err != nil {
		t.Fatalf("failed to validate directory: %v", err)
	}

	// Should have at least one validation error (the bad file)
	if len(errors) == 0 {
		t.Errorf("expected validation errors but got none")
	}

	// Verify the error is for the correct file
	foundBadFileError := false
	for _, e := range errors {
		if e != nil && (contains(e.Error(), "finding_drivers") || contains(e.Error(), "missing <title>")) {
			foundBadFileError = true
			break
		}
	}

	if !foundBadFileError {
		t.Errorf("expected error for finding_drivers file but not found")
	}
}

func TestTemplateValidator_IntegrationMultipleAppNames(t *testing.T) {
	// Test that validator can handle different app names
	appNames := []string{"RideNow", "UberClone", "TaxiApp"}

	for _, appName := range appNames {
		t.Run("AppName_"+appName, func(t *testing.T) {
			tmpFile, err := ioutil.TempFile("", "test*.html")
			if err != nil {
				t.Fatalf("failed to create temp file: %v", err)
			}
			defer os.Remove(tmpFile.Name())

			content := `<!DOCTYPE html><html><head><title>Home - ` + appName + `</title></head><body>` + appName + ` App</body></html>`
			if _, err := tmpFile.Write([]byte(content)); err != nil {
				t.Fatalf("failed to write content: %v", err)
			}
			tmpFile.Close()

			v := NewTemplateValidator(appName)
			if err := v.ValidateFile(tmpFile.Name()); err != nil {
				t.Errorf("validation failed for app name %s: %v", appName, err)
			}
		})
	}
}

func TestTemplateValidator_IntegrationConcurrentValidation(t *testing.T) {
	// Create temp directory with multiple files
	tmpDir, err := ioutil.TempDir("", "concurrent_test")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create 20 HTML files
	for i := 0; i < 20; i++ {
		fileName := filepath.Join(tmpDir, fmt.Sprintf("page%d.html", i))
		content := fmt.Sprintf(`<!DOCTYPE html><html><head><title>Page %d - RideNow</title></head><body>RideNow Page %d</body></html>`, i, i)
		if err := ioutil.WriteFile(fileName, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write file %d: %v", i, err)
		}
	}

	v := NewTemplateValidator("RideNow")

	// Validate concurrently
	done := make(chan bool, 20)
	for i := 0; i < 20; i++ {
		go func(index int) {
			fileName := filepath.Join(tmpDir, fmt.Sprintf("page%d.html", index))
			err := v.ValidateFile(fileName)
			if err != nil {
				t.Errorf("validation failed for file %d: %v", index, err)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 20; i++ {
		<-done
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[len(s)-len(substr):] == substr || len(s) >= len(substr) && s[:len(substr)] == substr || len(s) > len(substr) && containsMiddle(s, substr)
}

func containsMiddle(s, substr string) bool {
	for i := 1; i < len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}