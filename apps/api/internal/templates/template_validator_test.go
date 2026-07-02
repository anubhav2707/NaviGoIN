package templates

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

func TestTemplateValidator_ValidateFile(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		appName     string
		wantError   bool
		errorMsg   string
	}{
		{
			name:    "valid template with app name in title",
			content: `<!DOCTYPE html><html><head><title>Home - RideNow</title></head><body></body></html>`,
			appName: "RideNow",
			wantError: false,
		},
		{
			name:    "missing title tag",
			content: `<!DOCTYPE html><html><head></head><body></body></html>`,
			appName: "RideNow",
			wantError: true,
			errorMsg: "missing <title> tag",
		},
		{
			name:    "title without app name",
			content: `<!DOCTYPE html><html><head><title>Home Page</title></head><body></body></html>`,
			appName: "RideNow",
			wantError: true,
			errorMsg: "title does not contain app name",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create temp file
			tmpFile, err := ioutil.TempFile("", "test*.html")
			if err != nil {
				t.Fatalf("failed to create temp file: %v", err)
			}
			defer os.Remove(tmpFile.Name())

			// Write content
			if _, err := tmpFile.Write([]byte(tt.content)); err != nil {
				t.Fatalf("failed to write content: %v", err)
			}
			tmpFile.Close()

			// Validate
			v := NewTemplateValidator(tt.appName)
			err = v.ValidateFile(tmpFile.Name())

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func TestTemplateValidator_HasConsistentBranding(t *testing.T) {
	// Create temp directory
	tmpDir, err := ioutil.TempDir("", "test_templates")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create test files
	testFiles := map[string]string{
		"page1.html": `<!DOCTYPE html><html><head><title>Page 1 - RideNow</title></head><body>RideNow Content</body></html>`,
		"page2.html": `<!DOCTYPE html><html><head><title>Page 2 - RideNow</title></head><body>Welcome to RideNow</body></html>`,
	}

	var filePaths []string
	for name, content := range testFiles {
		filePath := filepath.Join(tmpDir, name)
		if err := ioutil.WriteFile(filePath, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write file %s: %v", name, err)
		}
		filePaths = append(filePaths, filePath)
	}

	v := NewTemplateValidator("RideNow")
	if !v.HasConsistentBranding(filePaths) {
		t.Errorf("expected consistent branding but validation failed")
	}

	// Test with inconsistent branding
	inconsistentFile := filepath.Join(tmpDir, "page3.html")
	if err := ioutil.WriteFile(inconsistentFile, []byte(`<!DOCTYPE html><html><head><title>Page 3</title></head><body>No branding</body></html>`), 0644); err != nil {
		t.Fatalf("failed to write inconsistent file: %v", err)
	}
	filePaths = append(filePaths, inconsistentFile)

	if v.HasConsistentBranding(filePaths) {
		t.Errorf("expected inconsistent branding but validation passed")
	}
}

// Edge cases
func TestTemplateValidator_EdgeCases(t *testing.T) {
	v := NewTemplateValidator("RideNow")

	// Test with non-existent file
	err := v.ValidateFile("/non/existent/file.html")
	if err == nil {
		t.Errorf("expected error for non-existent file")
	}

	// Test with empty app name
	vEmpty := NewTemplateValidator("")
	tmpFile, _ := ioutil.TempFile("", "test*.html")
	defer os.Remove(tmpFile.Name())
	tmpFile.Write([]byte(`<html><head><title>Test</title></head></html>`))
	tmpFile.Close()

	err = vEmpty.ValidateFile(tmpFile.Name())
	if err == nil {
		t.Errorf("expected error for empty app name validation")
	}
}