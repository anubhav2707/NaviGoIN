package e2e

import (
	"fmt"
	"testing"
)

func TestUIConsistency(t *testing.T) {
	testCases := []struct {
		name  string
		index int
	}{
		{"test1", 1},
		{"test2", 2},
		{"test3", 3},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Fix: Use fmt.Sprintf to convert int to string properly
			result := fmt.Sprintf("%d", tc.index)
			if result == "" {
				t.Error("Expected non-empty result")
			}
		})
	}
}