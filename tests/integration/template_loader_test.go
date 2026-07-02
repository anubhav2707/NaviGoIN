package integration

import (
	"strings"
	"testing"
)

func TestTemplateLoader(t *testing.T) {
	testCases := []struct {
		name     string
		template string
		expected string
	}{
		{"basic", "template1", "result1"},
		{"advanced", "template2", "result2"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Using strings package functions
			if strings.Contains(tc.template, "error") {
				t.Skip("Skipping error template")
			}
			if !strings.HasPrefix(tc.template, "template") {
				t.Error("Template should start with 'template'")
			}
		})
	}
}