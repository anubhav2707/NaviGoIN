"""E2E tests for clamp function scenarios."""

import pytest
import sys


def clamp(value, min_val, max_val):
    """Clamp a value between min and max bounds."""
    return max(min_val, min(value, max_val))


class TestClampScenarios:
    """End-to-end tests for clamp function."""

    def test_basic_clamping(self):
        """Test basic clamping behavior."""
        assert clamp(5, 0, 10) == 5
        assert clamp(-5, 0, 10) == 0
        assert clamp(15, 0, 10) == 10

    def test_edge_cases(self):
        """Test edge cases."""
        assert clamp(0, 0, 10) == 0
        assert clamp(10, 0, 10) == 10
        assert clamp(5, 5, 5) == 5

    def test_very_large_numbers(self):
        """Test with very large numbers in MAX_SAFE_INTEGER range."""
        # JavaScript's Number.MAX_SAFE_INTEGER equivalent in Python
        MAX_SAFE_INTEGER = 2**53 - 1  # 9007199254740991
        MIN_SAFE_INTEGER = -(2**53 - 1)  # -9007199254740991
        
        # Test clamping at the upper bound
        assert clamp(MAX_SAFE_INTEGER + 1000, 0, MAX_SAFE_INTEGER) == MAX_SAFE_INTEGER
        assert clamp(MAX_SAFE_INTEGER, 0, MAX_SAFE_INTEGER) == MAX_SAFE_INTEGER
        assert clamp(MAX_SAFE_INTEGER - 1, 0, MAX_SAFE_INTEGER) == MAX_SAFE_INTEGER - 1
        
        # Test clamping at the lower bound
        assert clamp(MIN_SAFE_INTEGER - 1000, MIN_SAFE_INTEGER, 0) == MIN_SAFE_INTEGER
        assert clamp(MIN_SAFE_INTEGER, MIN_SAFE_INTEGER, 0) == MIN_SAFE_INTEGER
        assert clamp(MIN_SAFE_INTEGER + 1, MIN_SAFE_INTEGER, 0) == MIN_SAFE_INTEGER + 1
        
        # Test with very large range
        mid_value = 0
        assert clamp(mid_value, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER) == mid_value
        assert clamp(MAX_SAFE_INTEGER * 2, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER) == MAX_SAFE_INTEGER
        assert clamp(MIN_SAFE_INTEGER * 2, MIN_SAFE_INTEGER, MAX_SAFE_INTEGER) == MIN_SAFE_INTEGER
        
        # Test with large positive numbers
        large_val = 2**52
        assert clamp(large_val, 0, MAX_SAFE_INTEGER) == large_val
        assert clamp(large_val * 2, 0, large_val) == large_val
        
        # Test precision near MAX_SAFE_INTEGER
        near_max = MAX_SAFE_INTEGER - 100
        assert clamp(near_max, near_max - 50, near_max + 50) == near_max
        assert clamp(MAX_SAFE_INTEGER, near_max, near_max + 10) == near_max + 10
