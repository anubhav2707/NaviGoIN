"""Tests for utility functions."""

import pytest

from devagent.utils import clamp


class TestClamp:
    """Tests for the clamp function."""
    
    def test_clamp_within_range(self):
        """Test clamping when value is within range."""
        assert clamp(5, 0, 10) == 5
        assert clamp(0.5, 0.0, 1.0) == 0.5
        
    def test_clamp_below_minimum(self):
        """Test clamping when value is below minimum."""
        assert clamp(-5, 0, 10) == 0
        assert clamp(-0.5, 0.0, 1.0) == 0.0
        
    def test_clamp_above_maximum(self):
        """Test clamping when value is above maximum."""
        assert clamp(15, 0, 10) == 10
        assert clamp(1.5, 0.0, 1.0) == 1.0
        
    def test_clamp_at_boundaries(self):
        """Test clamping at exact boundaries."""
        assert clamp(0, 0, 10) == 0
        assert clamp(10, 0, 10) == 10
        
    def test_clamp_inverted_range(self):
        """Test that inverted range (min > max) raises ValueError."""
        with pytest.raises(ValueError, match=r"Invalid range: min \(10\) cannot be greater than max \(5\)"):
            clamp(7, 10, 5)
            
        with pytest.raises(ValueError, match=r"Invalid range: min \(1\.0\) cannot be greater than max \(0\.0\)"):
            clamp(0.5, 1.0, 0.0)
