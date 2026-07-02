package templates

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
)

// TemplateValidator validates HTML templates for consistent branding
type TemplateValidator struct {
	AppName string
}

// NewTemplateValidator creates a new template validator
func NewTemplateValidator(appName string) *TemplateValidator {
	return &TemplateValidator{
		AppName: appName,
	}
}

// ValidateFile validates a single HTML template file
func (tv *TemplateValidator) ValidateFile(filePath string) error {
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file %s: %w", filePath, err)
	}

	contentStr := string(content)

	// Check for title tag presence
	if !strings.Contains(contentStr, "<title>") {
		return fmt.Errorf("missing <title> tag in %s", filePath)
	}

	// Check for app name in title
	if !strings.Contains(contentStr, fmt.Sprintf("<title>")) || !strings.Contains(contentStr, tv.AppName) {
		return fmt.Errorf("title does not contain app name '%s' in %s", tv.AppName, filePath)
	}

	return nil
}

// ValidateDirectory validates all HTML files in a directory
func (tv *TemplateValidator) ValidateDirectory(dirPath string) ([]error, error) {
	pattern := filepath.Join(dirPath, "**/*.html")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to find HTML files: %w", err)
	}

	var validationErrors []error
	for _, file := range files {
		if err := tv.ValidateFile(file); err != nil {
			validationErrors = append(validationErrors, err)
		}
	}

	return validationErrors, nil
}

// HasConsistentBranding checks if all templates have consistent app branding
func (tv *TemplateValidator) HasConsistentBranding(files []string) bool {
	for _, file := range files {
		content, err := ioutil.ReadFile(file)
		if err != nil {
			return false
		}

		if !strings.Contains(string(content), tv.AppName) {
			return false
		}
	}
	return true
}