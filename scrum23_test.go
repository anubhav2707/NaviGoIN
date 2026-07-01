package scrum23

import "testing"

func TestAdd(t *testing.T) {
	cases := []struct {
		name     string
		a, b     int
		want     int
	}{
		{"positives", 2, 3, 5},
		{"with_zero", 0, 7, 7},
		{"negatives", -4, -6, -10},
		{"mixed_sign", -5, 8, 3},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := Add(tc.a, tc.b); got != tc.want {
				t.Fatalf("Add(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)
			}
		})
	}
}
