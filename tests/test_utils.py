"""Tests for utility functions."""

import math
import pytest

from devagent.utils import clamp


class TestClamp:
    """Test cases for the clamp function."""
    
    def test_clamp_within_range(self):
        """Test value already within range."""
        assert clamp(5, 0, 10) == 5
        assert clamp(5.5, 0.0, 10.0) == 5.5
        assert clamp(0, -10, 10) == 0
    
    def test_clamp_below_min(self):
        """Test value below minimum."""
        assert clamp(-5, 0, 10) == 0
        assert clamp(-100, -10, 10) == -10
        assert clamp(-0.5, 0.0, 1.0) == 0.0
    
    def test_clamp_above_max(self):
        """Test value above maximum."""
        assert clamp(15, 0, 10) == 10
        assert clamp(100, -10, 10) == 10
        assert clamp(1.5, 0.0, 1.0) == 1.0
    
    def test_clamp_at_boundaries(self):
        """Test value exactly at boundaries."""
        assert clamp(0, 0, 10) == 0
        assert clamp(10, 0, 10) == 10
        assert clamp(-10, -10, 10) == -10
    
    def test_clamp_nan_input(self):
        """Test NaN input handling."""
        # NaN as value
        result = clamp(float('nan'), 0, 10)
        assert math.isnan(result)
        
        # NaN as min
        result = clamp(5, float('nan'), 10)
        assert math.isnan(result)
        
        # NaN as max
        result = clamp(5, 0, float('nan'))
        assert math.isnan(result)
        
        # Multiple NaN values
        result = clamp(float('nan'), float('nan'), float('nan'))
        assert math.isnan(result)
    
    def test_clamp_infinity(self):
        """Test infinity values."""
        assert clamp(float('inf'), 0, 10) == 10
        assert clamp(float('-inf'), 0, 10) == 0
        assert clamp(5, float('-inf'), float('inf')) == 5
        assert clamp(5, float('-inf'), 10) == 5
        assert clamp(5, 0, float('inf')) == 5
    
    def test_clamp_min_greater_than_max(self):
        """Test when min > max (returns min)."""
        assert clamp(5, 10, 0) == 10
        assert clamp(-5, 10, 0) == 10
        assert clamp(15, 10, 0) == 10
    
    def test_clamp_negative_ranges(self):
        """Test with negative ranges."""
        assert clamp(-5, -10, -1) == -5
        assert clamp(0, -10, -1) == -1
        assert clamp(-15, -10, -1) == -10
    
    def test_clamp_zero_range(self):
        """Test when min equals max."""
        assert clamp(5, 10, 10) == 10
        assert clamp(-5, 10, 10) == 10
        assert clamp(10, 10, 10) == 10
