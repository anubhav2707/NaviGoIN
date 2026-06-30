"""Unit tests for utility functions."""

import pytest

from devagent.utils import (
    extract_ticket_key,
    format_fare,
    slugify,
    stable_id,
    truncate,
)


class TestFormatFare:
    """Unit tests for format_fare function."""
    
    def test_format_basic_amount(self):
        """Test formatting a basic whole number amount."""
        assert format_fare(250) == "₹250.00"
    
    def test_format_zero(self):
        """Test formatting zero amount."""
        assert format_fare(0) == "₹0.00"
    
    def test_format_decimal_amount(self):
        """Test formatting amounts with decimals."""
        assert format_fare(123.45) == "₹123.45"
        assert format_fare(99.99) == "₹99.99"
    
    def test_rounding_behavior(self):
        """Test that amounts are rounded to 2 decimal places."""
        # Standard rounding: .5 rounds to nearest even
        assert format_fare(123.456) == "₹123.46"
        assert format_fare(123.454) == "₹123.45"
        assert format_fare(999.999) == "₹1000.00"
        assert format_fare(0.001) == "₹0.00"
        assert format_fare(0.005) == "₹0.00"  # Rounds to nearest even
        assert format_fare(0.015) == "₹0.02"  # Rounds to nearest even
    
    def test_large_amounts(self):
        """Test formatting large amounts."""
        assert format_fare(10000) == "₹10000.00"
        assert format_fare(999999.99) == "₹999999.99"
        assert format_fare(1234567.89) == "₹1234567.89"
    
    def test_negative_amounts(self):
        """Test formatting negative amounts (edge case)."""
        assert format_fare(-100) == "₹-100.00"
        assert format_fare(-50.50) == "₹-50.50"
    
    def test_very_small_amounts(self):
        """Test formatting very small amounts."""
        assert format_fare(0.01) == "₹0.01"
        assert format_fare(0.10) == "₹0.10"
        assert format_fare(0.99) == "₹0.99"
    
    def test_single_decimal(self):
        """Test that single decimal places are padded with zero."""
        assert format_fare(10.5) == "₹10.50"
        assert format_fare(99.9) == "₹99.90"
        assert format_fare(0.1) == "₹0.10"
    
    def test_type_conversion(self):
        """Test that function handles integer input correctly."""
        assert format_fare(100) == "₹100.00"
        assert format_fare(0) == "₹0.00"


class TestExistingUtils:
    """Regression tests for existing utility functions."""
    
    def test_stable_id(self):
        """Test stable_id generates consistent hashes."""
        # Same inputs should produce same output
        assert stable_id("test", 123) == stable_id("test", 123)
        # Different inputs should produce different outputs
        assert stable_id("test", 123) != stable_id("test", 124)
        # Should always return 16 characters
        assert len(stable_id("a", "b", "c")) == 16
    
    def test_extract_ticket_key(self):
        """Test ticket key extraction."""
        assert extract_ticket_key("Fix issue SCRUM-123") == "SCRUM-123"
        assert extract_ticket_key("PLAT-4567: Update API") == "PLAT-4567"
        assert extract_ticket_key("no ticket here") is None
        assert extract_ticket_key("") is None
        assert extract_ticket_key(None) is None
    
    def test_slugify(self):
        """Test text slugification."""
        assert slugify("Hello World!") == "hello-world"
        assert slugify("Test 123 ABC") == "test-123-abc"
        assert slugify("Multiple   Spaces") == "multiple-spaces"
        assert slugify("@#$%Special&*()Chars") == "special-chars"
        # Test max length
        long_text = "a" * 100
        assert len(slugify(long_text, max_len=30)) <= 30
    
    def test_truncate(self):
        """Test text truncation."""
        assert truncate("short text", 20) == "short text"
        assert truncate("this is a longer text", 10) == "this is a…"
        assert truncate("exact", 5) == "exact"
        assert truncate("truncate this", 8) == "truncat…"
        # Default limit is 4000
        long_text = "x" * 5000
        result = truncate(long_text)
        assert len(result) == 4000
        assert result.endswith("…")
