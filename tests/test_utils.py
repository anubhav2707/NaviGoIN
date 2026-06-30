"""Tests for devagent.utils module."""

from __future__ import annotations

import math
from typing import Any

import pytest

from devagent.utils import (
    clamp,
    extract_ticket_key,
    slugify,
    stable_id,
    truncate,
)


class TestClamp:
    """Unit tests for the clamp function."""

    def test_clamp_within_range(self):
        """Test that values within range are returned unchanged."""
        assert clamp(5, 0, 10) == 5
        assert clamp(5.5, 0, 10) == 5.5
        assert clamp(0.5, 0, 1) == 0.5

    def test_clamp_below_min(self):
        """Test that values below min return min."""
        assert clamp(-5, 0, 10) == 0
        assert clamp(-100, -10, 10) == -10
        assert clamp(0, 1, 10) == 1

    def test_clamp_above_max(self):
        """Test that values above max return max."""
        assert clamp(15, 0, 10) == 10
        assert clamp(100, -10, 10) == 10
        assert clamp(11, 1, 10) == 10

    def test_clamp_at_boundaries(self):
        """Test edge cases at exact min and max values."""
        assert clamp(0, 0, 10) == 0
        assert clamp(10, 0, 10) == 10
        assert clamp(-10, -10, -5) == -10
        assert clamp(-5, -10, -5) == -5

    def test_clamp_negative_ranges(self):
        """Test clamping with negative number ranges."""
        assert clamp(-15, -20, -10) == -15
        assert clamp(-25, -20, -10) == -20
        assert clamp(-5, -20, -10) == -10

    def test_clamp_single_value_range(self):
        """Test when min equals max (single allowed value)."""
        assert clamp(5, 10, 10) == 10
        assert clamp(15, 10, 10) == 10
        assert clamp(10, 10, 10) == 10

    def test_clamp_floats(self):
        """Test clamping with floating point numbers."""
        assert clamp(3.14159, 0.0, 3.0) == 3.0
        assert clamp(2.71828, 0.0, 3.0) == 2.71828
        assert clamp(-0.5, 0.0, 1.0) == 0.0
        assert clamp(0.999, 0.0, 1.0) == 0.999

    def test_clamp_special_floats(self):
        """Test edge cases with special float values."""
        # Infinity
        assert clamp(float("inf"), 0, 10) == 10
        assert clamp(float("-inf"), 0, 10) == 0
        assert clamp(5, float("-inf"), float("inf")) == 5
        
        # Very large and small numbers
        assert clamp(1e100, 0, 10) == 10
        assert clamp(-1e100, 0, 10) == 0
        assert clamp(1e-100, 0, 1) == 1e-100

    def test_clamp_invalid_range(self):
        """Test that invalid ranges raise ValueError."""
        with pytest.raises(ValueError, match="min_val .* must be <= max_val"):
            clamp(5, 10, 0)
        with pytest.raises(ValueError):
            clamp(5, 100, 50)
        with pytest.raises(ValueError):
            clamp(0, 1, -1)

    def test_clamp_nan_handling(self):
        """Test behavior with NaN values."""
        # NaN input returns NaN (standard float comparison behavior)
        result = clamp(float("nan"), 0, 10)
        assert math.isnan(result)

    def test_clamp_type_coercion(self):
        """Test that integers and floats work together."""
        assert clamp(5, 0.0, 10.0) == 5
        assert clamp(5.0, 0, 10) == 5.0
        assert isinstance(clamp(5, 0.0, 10.0), float)


class TestClampIntegration:
    """Integration tests for clamp with other utilities."""

    def test_clamp_with_stable_id(self):
        """Test using clamp with stable_id hash values."""
        # stable_id returns a hex string, so we'll test clamping derived values
        id_hash = stable_id("test", "value")
        # Convert first 2 chars to int for testing
        hash_val = int(id_hash[:2], 16)
        clamped = clamp(hash_val, 0, 100)
        assert 0 <= clamped <= 100

    def test_clamp_in_truncate_context(self):
        """Test clamp used for constraining truncate limits."""
        text = "A" * 100
        # Use clamp to ensure limit stays within safe bounds
        limit = clamp(150, 10, 80)
        truncated = truncate(text, int(limit))
        assert len(truncated) == 80  # 79 chars + ellipsis

    def test_clamp_for_slugify_length(self):
        """Test using clamp to constrain slugify max_len parameter."""
        text = "This-Is-A-Very-Long-Text-That-Should-Be-Slugified"
        # Clamp max_len to reasonable bounds
        max_len = int(clamp(100, 10, 60))
        slug = slugify(text, max_len)
        assert len(slug) <= max_len

    def test_clamp_chain(self):
        """Test multiple clamp operations in sequence."""
        # Simulate progressive constraint narrowing
        value = 50
        value = clamp(value, 0, 100)  # First constraint
        assert value == 50
        value = clamp(value, 25, 75)  # Narrower constraint
        assert value == 50
        value = clamp(value, 60, 70)  # Even narrower, forces clamp
        assert value == 60


class TestClampFunctional:
    """Functional/E2E tests for business requirements."""

    def test_clamp_temperature_control(self):
        """Simulate temperature control system using clamp."""
        # Business requirement: Keep temperature between 18-26°C
        MIN_TEMP = 18.0
        MAX_TEMP = 26.0
        
        # Simulate various sensor readings
        readings = [15.5, 18.0, 22.3, 26.0, 30.2, -5.0]
        controlled = [clamp(temp, MIN_TEMP, MAX_TEMP) for temp in readings]
        
        assert controlled == [18.0, 18.0, 22.3, 26.0, 26.0, 18.0]
        assert all(MIN_TEMP <= temp <= MAX_TEMP for temp in controlled)

    def test_clamp_pagination_limits(self):
        """Simulate pagination limit enforcement."""
        # Business requirement: Page size must be between 1-100
        MIN_PAGE_SIZE = 1
        MAX_PAGE_SIZE = 100
        
        # Various user inputs
        user_requests = [0, 1, 50, 100, 200, -10]
        safe_sizes = [clamp(size, MIN_PAGE_SIZE, MAX_PAGE_SIZE) for size in user_requests]
        
        assert safe_sizes == [1, 1, 50, 100, 100, 1]
        assert all(MIN_PAGE_SIZE <= size <= MAX_PAGE_SIZE for size in safe_sizes)

    def test_clamp_score_normalization(self):
        """Simulate score normalization for ratings."""
        # Business requirement: Normalize scores to 0-100 range
        def normalize_score(score: float) -> float:
            return clamp(score, 0, 100)
        
        # Test various score inputs
        raw_scores = [-50, 0, 25.5, 75.8, 100, 150, 99.99]
        normalized = [normalize_score(s) for s in raw_scores]
        
        assert normalized == [0, 0, 25.5, 75.8, 100, 100, 99.99]
        assert all(0 <= score <= 100 for score in normalized)

    def test_clamp_volume_control(self):
        """Simulate audio volume control."""
        # Business requirement: Volume between 0-11 (it goes to 11!)
        MIN_VOLUME = 0
        MAX_VOLUME = 11
        
        def set_volume(level: float) -> float:
            return clamp(level, MIN_VOLUME, MAX_VOLUME)
        
        # User attempts to set various volumes
        assert set_volume(-5) == 0  # Muted
        assert set_volume(0) == 0    # Muted
        assert set_volume(5.5) == 5.5  # Mid-level
        assert set_volume(11) == 11   # Max volume
        assert set_volume(15) == 11   # Still max

    def test_clamp_coordinate_bounds(self):
        """Simulate map coordinate boundary enforcement."""
        # Business requirement: Keep coordinates within map bounds
        class MapBounds:
            def __init__(self, min_x: float, max_x: float, min_y: float, max_y: float):
                self.min_x = min_x
                self.max_x = max_x
                self.min_y = min_y
                self.max_y = max_y
            
            def constrain_point(self, x: float, y: float) -> tuple[float, float]:
                return (
                    clamp(x, self.min_x, self.max_x),
                    clamp(y, self.min_y, self.max_y)
                )
        
        # Create map with bounds
        game_map = MapBounds(0, 1024, 0, 768)
        
        # Test various positions
        assert game_map.constrain_point(512, 384) == (512, 384)  # In bounds
        assert game_map.constrain_point(-100, 400) == (0, 400)    # X too low
        assert game_map.constrain_point(500, 1000) == (500, 768)  # Y too high
        assert game_map.constrain_point(2000, -50) == (1024, 0)   # Both out


class TestRegressionSafety:
    """Ensure no regression in existing utility functions."""

    def test_existing_utils_still_work(self):
        """Verify existing utility functions are not broken."""
        # Test stable_id
        id1 = stable_id("test", 123)
        assert len(id1) == 16
        assert id1 == stable_id("test", 123)  # Deterministic
        
        # Test extract_ticket_key
        assert extract_ticket_key("Fix SCRUM-12 issue") == "SCRUM-12"
        assert extract_ticket_key("no ticket") is None
        
        # Test slugify
        assert slugify("Hello World!") == "hello-world"
        assert slugify("Test@#$123") == "test-123"
        
        # Test truncate
        assert truncate("short", 10) == "short"
        assert truncate("toolongtext", 5) == "tool…"

    def test_clamp_doesnt_break_imports(self):
        """Ensure adding clamp doesn't break module imports."""
        # This would fail at import time if there were issues
        from devagent.utils import clamp as imported_clamp
        
        assert imported_clamp(5, 0, 10) == 5

    def test_all_utils_importable(self):
        """Verify all utilities can be imported together."""
        from devagent.utils import (
            clamp,
            extract_ticket_key,
            network_retry,
            slugify,
            stable_id,
            truncate,
        )
        
        # Basic smoke test that all are callable
        assert callable(clamp)
        assert callable(extract_ticket_key)
        assert callable(network_retry)
        assert callable(slugify)
        assert callable(stable_id)
        assert callable(truncate)


@pytest.mark.parametrize(
    "n,min_val,max_val,expected",
    [
        (5, 0, 10, 5),
        (15, 0, 10, 10),
        (-5, 0, 10, 0),
        (0, 0, 0, 0),
        (2.5, 2.0, 3.0, 2.5),
        (1.9, 2.0, 3.0, 2.0),
        (3.1, 2.0, 3.0, 3.0),
    ],
)
def test_clamp_parameterized(n: float, min_val: float, max_val: float, expected: float):
    """Parameterized tests for various clamp scenarios."""
    assert clamp(n, min_val, max_val) == expected


@pytest.mark.parametrize(
    "min_val,max_val",
    [
        (10, 0),
        (5, 4),
        (-1, -2),
        (100, 99.99),
    ],
)
def test_clamp_invalid_ranges_parameterized(min_val: float, max_val: float):
    """Parameterized tests for invalid range errors."""
    with pytest.raises(ValueError):
        clamp(5, min_val, max_val)
