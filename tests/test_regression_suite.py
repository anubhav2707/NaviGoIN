"""Regression test suite to ensure existing functionality is not broken."""

import subprocess
import sys
from pathlib import Path

import pytest

# Import all existing utilities to ensure they still work
from devagent.utils import (
    extract_ticket_key,
    format_fare,  # New function
    network_retry,
    slugify,
    stable_id,
    truncate,
)


class TestRegressionSuite:
    """Comprehensive regression tests to ensure no existing functionality is broken."""
    
    def test_all_utils_importable(self):
        """Test that all utility functions can be imported."""
        # This test will fail if any import is broken
        assert callable(stable_id)
        assert callable(extract_ticket_key)
        assert callable(slugify)
        assert callable(truncate)
        assert callable(format_fare)  # New function
        assert network_retry is not None
    
    def test_existing_stable_id_unchanged(self):
        """Test that stable_id function still works as expected."""
        # These should produce the same results as before
        id1 = stable_id("test", 123, "data")
        id2 = stable_id("test", 123, "data")
        id3 = stable_id("different")
        
        assert id1 == id2  # Same input = same output
        assert id1 != id3  # Different input = different output
        assert len(id1) == 16  # Always 16 characters
        assert all(c in "0123456789abcdef" for c in id1)  # Hex characters only
    
    def test_existing_extract_ticket_key_unchanged(self):
        """Test that extract_ticket_key function still works as expected."""
        # Standard ticket formats
        assert extract_ticket_key("Working on JIRA-123") == "JIRA-123"
        assert extract_ticket_key("PLAT-4567: Fix bug") == "PLAT-4567"
        assert extract_ticket_key("Multiple PROJ-111 and PROJ-222") == "PROJ-111"
        
        # Edge cases
        assert extract_ticket_key("no ticket here") is None
        assert extract_ticket_key("") is None
        assert extract_ticket_key(None) is None
        assert extract_ticket_key("lowercase jira-123") is None  # Must be uppercase
    
    def test_existing_slugify_unchanged(self):
        """Test that slugify function still works as expected."""
        # Basic slugification
        assert slugify("Hello World") == "hello-world"
        assert slugify("Test 123") == "test-123"
        assert slugify("UPPERCASE") == "uppercase"
        
        # Special characters
        assert slugify("email@example.com") == "email-example-com"
        assert slugify("price: $99.99") == "price-99-99"
        assert slugify("C++ Programming") == "c-programming"
        
        # Length limiting
        long_text = "this is a very long text that should be truncated"
        assert len(slugify(long_text, max_len=20)) <= 20
        assert slugify("test", max_len=10) == "test"
    
    def test_existing_truncate_unchanged(self):
        """Test that truncate function still works as expected."""
        # No truncation needed
        assert truncate("short", 10) == "short"
        assert truncate("exact fit", 9) == "exact fit"
        
        # Truncation required
        assert truncate("this is too long", 10) == "this is t…"
        assert truncate("truncate me", 8) == "truncat…"
        
        # Default limit (4000)
        long_text = "x" * 5000
        result = truncate(long_text)
        assert len(result) == 4000
        assert result[-1] == "…"
        assert result[:-1] == "x" * 3999
    
    def test_network_retry_decorator_exists(self):
        """Test that network_retry decorator is still available."""
        # Test that we can use the decorator
        @network_retry
        def dummy_function():
            return "success"
        
        assert callable(dummy_function)
        assert dummy_function() == "success"
    
    def test_no_import_errors(self):
        """Test that the module can be imported without errors."""
        # This simulates a fresh import
        import importlib
        import devagent.utils
        
        # Reload to ensure no import-time errors
        importlib.reload(devagent.utils)
        
        # Verify all expected functions are present
        assert hasattr(devagent.utils, "stable_id")
        assert hasattr(devagent.utils, "extract_ticket_key")
        assert hasattr(devagent.utils, "slugify")
        assert hasattr(devagent.utils, "truncate")
        assert hasattr(devagent.utils, "format_fare")  # New function
        assert hasattr(devagent.utils, "network_retry")
    
    def test_format_fare_does_not_affect_other_functions(self):
        """Test that adding format_fare doesn't interfere with other utilities."""
        # Run all utilities in sequence to ensure no interference
        id_result = stable_id("test")
        ticket_result = extract_ticket_key("PROJ-123")
        slug_result = slugify("Test String")
        truncate_result = truncate("Long text", 5)
        fare_result = format_fare(100)
        
        # All should work independently
        assert len(id_result) == 16
        assert ticket_result == "PROJ-123"
        assert slug_result == "test-string"
        assert truncate_result == "Long…"
        assert fare_result == "₹100.00"
    
    @pytest.mark.parametrize("amount,expected", [
        (250, "₹250.00"),
        (0, "₹0.00"),
        (123.456, "₹123.46"),
        (999.999, "₹1000.00"),
        (0.01, "₹0.01"),
        (50.5, "₹50.50"),
    ])
    def test_format_fare_specification_compliance(self, amount, expected):
        """Test that format_fare meets all specification requirements."""
        assert format_fare(amount) == expected


class TestBackwardCompatibility:
    """Ensure backward compatibility is maintained."""
    
    def test_utils_module_api_unchanged(self):
        """Test that the utils module API hasn't changed (except for additions)."""
        from devagent import utils
        
        # Original functions should still be present
        original_functions = [
            "stable_id",
            "extract_ticket_key",
            "slugify",
            "truncate",
            "network_retry"
        ]
        
        for func_name in original_functions:
            assert hasattr(utils, func_name), f"Missing function: {func_name}"
            assert callable(getattr(utils, func_name)) or func_name == "network_retry"
    
    def test_function_signatures_unchanged(self):
        """Test that existing function signatures haven't changed."""
        import inspect
        from devagent import utils
        
        # Check stable_id signature
        sig = inspect.signature(utils.stable_id)
        assert "parts" in sig.parameters
        
        # Check extract_ticket_key signature
        sig = inspect.signature(utils.extract_ticket_key)
        assert "text" in sig.parameters
        
        # Check slugify signature
        sig = inspect.signature(utils.slugify)
        assert "text" in sig.parameters
        assert "max_len" in sig.parameters
        
        # Check truncate signature
        sig = inspect.signature(utils.truncate)
        assert "text" in sig.parameters
        assert "limit" in sig.parameters
    
    def test_regex_patterns_unchanged(self):
        """Test that regex patterns still work correctly."""
        # The ticket regex should still match the same patterns
        test_cases = [
            ("ABC-123", "ABC-123"),
            ("PROJ-9999", "PROJ-9999"),
            ("XX-1", "XX-1"),
            ("A1B2-123", "A1B2-123"),
        ]
        
        for text, expected in test_cases:
            result = extract_ticket_key(f"Ticket {text} is ready")
            assert result == expected, f"Failed for {text}"
