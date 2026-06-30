"""Integration tests for utils module with other DevAgent components."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

from devagent.config import Settings
from devagent.context import AgentContext
from devagent.models import Priority, Status, Ticket
from devagent.utils import clamp, slugify, stable_id, truncate


class TestClampWithTicketPriority:
    """Test clamp integration with ticket priority system."""

    def test_priority_score_clamping(self):
        """Test using clamp to normalize priority scores."""
        # Priority scores should be between 0-100
        def calculate_priority_score(severity: int, impact: int, urgency: int) -> float:
            """Calculate normalized priority score."""
            # Each factor is 0-10, so max raw score is 30
            raw_score = severity + impact + urgency
            # Normalize to 0-100 scale
            normalized = (raw_score / 30) * 100
            return clamp(normalized, 0, 100)
        
        # Test various scenarios
        assert calculate_priority_score(10, 10, 10) == 100  # Critical
        assert calculate_priority_score(5, 5, 5) == 50      # Medium
        assert calculate_priority_score(0, 0, 0) == 0       # Low
        assert calculate_priority_score(3, 7, 2) == 40      # Mixed

    def test_ticket_age_weight_clamping(self, ticket: Ticket):
        """Test clamping age-based priority weights."""
        def get_age_weight(days_old: int) -> float:
            """Get priority weight based on ticket age."""
            # Older tickets get higher weight, max at 30 days
            weight = days_old * 3.33  # Maps 0-30 days to 0-100
            return clamp(weight, 0, 100)
        
        assert get_age_weight(0) == 0
        assert get_age_weight(15) == 49.95
        assert get_age_weight(30) == 99.9
        assert get_age_weight(100) == 100  # Clamped at max


class TestClampWithAgentContext:
    """Test clamp integration with agent context operations."""

    def test_retry_delay_clamping(self, ctx: AgentContext):
        """Test using clamp for retry delay calculations."""
        def calculate_retry_delay(attempt: int, base_delay: float = 1.0) -> float:
            """Calculate exponential backoff with clamping."""
            # Exponential backoff: base * 2^attempt
            delay = base_delay * (2 ** attempt)
            # Clamp between min and max delays
            return clamp(delay, 0.5, 30.0)  # Min 0.5s, max 30s
        
        assert calculate_retry_delay(0) == 1.0
        assert calculate_retry_delay(1) == 2.0
        assert calculate_retry_delay(2) == 4.0
        assert calculate_retry_delay(5) == 30.0  # Would be 32, clamped to 30
        assert calculate_retry_delay(10) == 30.0  # Would be 1024, clamped

    def test_batch_size_clamping(self, ctx: AgentContext):
        """Test clamping batch sizes for processing."""
        def get_safe_batch_size(requested: int, items_count: int) -> int:
            """Get safe batch size for processing items."""
            # Ensure batch size is reasonable
            clamped_request = clamp(requested, 1, 100)
            # Don't exceed actual items
            return min(int(clamped_request), items_count)
        
        assert get_safe_batch_size(50, 1000) == 50
        assert get_safe_batch_size(0, 1000) == 1    # Min batch
        assert get_safe_batch_size(200, 1000) == 100  # Max batch
        assert get_safe_batch_size(50, 30) == 30     # Limited by items


class TestClampWithConfiguration:
    """Test clamp with Settings and configuration."""

    def test_rate_limit_clamping(self, settings: Settings):
        """Test using clamp for rate limit configuration."""
        class RateLimiter:
            def __init__(self, requests_per_second: float):
                # Ensure rate is within reasonable bounds
                self.rate = clamp(requests_per_second, 0.1, 100.0)
                self.interval = 1.0 / self.rate
        
        # Test various rate configurations
        limiter1 = RateLimiter(10)  # Normal rate
        assert limiter1.rate == 10
        assert limiter1.interval == 0.1
        
        limiter2 = RateLimiter(0)  # Too low, clamped
        assert limiter2.rate == 0.1
        assert limiter2.interval == 10.0
        
        limiter3 = RateLimiter(1000)  # Too high, clamped
        assert limiter3.rate == 100
        assert limiter3.interval == 0.01

    def test_timeout_clamping(self):
        """Test clamping timeout values from config."""
        def get_safe_timeout(configured: float, operation: str) -> float:
            """Get safe timeout for different operations."""
            limits = {
                "api": (0.5, 30.0),
                "db": (0.1, 10.0),
                "file": (0.1, 60.0),
                "network": (1.0, 120.0),
            }
            min_t, max_t = limits.get(operation, (0.1, 30.0))
            return clamp(configured, min_t, max_t)
        
        assert get_safe_timeout(5, "api") == 5
        assert get_safe_timeout(0, "api") == 0.5
        assert get_safe_timeout(100, "api") == 30.0
        assert get_safe_timeout(100, "network") == 100  # Higher limit


class TestClampWithTextProcessing:
    """Test clamp with text processing utilities."""

    def test_summary_length_clamping(self):
        """Test using clamp with text summarization."""
        def create_summary(text: str, target_length: int = 100) -> str:
            """Create summary with clamped length."""
            # Ensure target length is reasonable
            safe_length = int(clamp(target_length, 10, 500))
            return truncate(text, safe_length)
        
        long_text = "A" * 1000
        assert len(create_summary(long_text, 50)) == 50
        assert len(create_summary(long_text, 5)) == 10  # Clamped to min
        assert len(create_summary(long_text, 600)) == 500  # Clamped to max

    def test_slug_generation_with_clamping(self):
        """Test slug generation with clamped lengths."""
        def create_safe_slug(text: str, max_len: int | None = None) -> str:
            """Create slug with safe length limits."""
            if max_len is None:
                max_len = 60
            # Ensure slug length is within reasonable bounds
            safe_len = int(clamp(max_len, 5, 100))
            return slugify(text, safe_len)
        
        text = "This is a very long title that needs to be slugified"
        assert len(create_safe_slug(text, 20)) <= 20
        assert len(create_safe_slug(text, 3)) <= 5  # Clamped to min
        assert len(create_safe_slug(text, 200)) <= 100  # Clamped to max


class TestClampWithJSONProcessing:
    """Test clamp with JSON data processing."""

    def test_json_depth_limiting(self):
        """Test using clamp to limit JSON traversal depth."""
        def traverse_json(data: dict, max_depth: int = 10) -> list:
            """Traverse JSON with clamped depth limit."""
            safe_depth = int(clamp(max_depth, 1, 20))
            results = []
            
            def traverse(obj: Any, depth: int = 0):
                if depth >= safe_depth:
                    return
                if isinstance(obj, dict):
                    for key, value in obj.items():
                        results.append((depth, key))
                        traverse(value, depth + 1)
                elif isinstance(obj, list):
                    for item in obj:
                        traverse(item, depth + 1)
            
            traverse(data)
            return results
        
        nested = {"a": {"b": {"c": {"d": {"e": "value"}}}}}
        
        # Test with different depth limits
        assert len(traverse_json(nested, 2)) == 2  # Only a, b
        assert len(traverse_json(nested, 0)) == 1  # Clamped to 1
        assert len(traverse_json(nested, 100)) == 5  # All keys, clamped to max

    def test_json_array_size_clamping(self):
        """Test clamping array sizes in JSON responses."""
        def format_response(items: list, page_size: int = 10) -> dict:
            """Format API response with clamped page size."""
            safe_size = int(clamp(page_size, 1, 50))
            return {
                "items": items[:safe_size],
                "total": len(items),
                "page_size": safe_size,
                "truncated": len(items) > safe_size
            }
        
        items = list(range(100))
        
        response1 = format_response(items, 20)
        assert len(response1["items"]) == 20
        assert response1["truncated"] is True
        
        response2 = format_response(items, 0)
        assert len(response2["items"]) == 1  # Clamped to min
        
        response3 = format_response(items, 100)
        assert len(response3["items"]) == 50  # Clamped to max


class TestClampErrorScenarios:
    """Test error handling with clamp in integration scenarios."""

    def test_clamp_with_mock_failures(self):
        """Test clamp behavior when integrated with failing components."""
        mock_calculator = Mock()
        mock_calculator.calculate.side_effect = Exception("Calculation failed")
        
        def safe_calculate(value: float) -> float:
            """Calculate with fallback to clamped default."""
            try:
                return mock_calculator.calculate(value)
            except Exception:
                # Fallback to clamped default
                return clamp(value, 0, 100)
        
        assert safe_calculate(50) == 50
        assert safe_calculate(-10) == 0
        assert safe_calculate(200) == 100

    def test_clamp_with_none_handling(self):
        """Test clamp integration with None-returning functions."""
        def get_config_value(key: str) -> float | None:
            """Simulate config lookup that might return None."""
            configs = {"timeout": 5.0, "retry": 3.0}
            return configs.get(key)
        
        def get_safe_value(key: str, default: float = 1.0) -> float:
            """Get config value with clamped default."""
            value = get_config_value(key) or default
            return clamp(value, 0.1, 10.0)
        
        assert get_safe_value("timeout") == 5.0
        assert get_safe_value("missing") == 1.0
        assert get_safe_value("missing", 100) == 10.0  # Clamped


@pytest.mark.parametrize(
    "operation,value,expected",
    [
        ("percent", 150, 100),
        ("percent", -50, 0),
        ("percent", 75, 75),
        ("opacity", 1.5, 1.0),
        ("opacity", -0.5, 0.0),
        ("opacity", 0.5, 0.5),
        ("index", 15, 10),
        ("index", -5, 0),
        ("index", 5, 5),
    ],
)
def test_clamp_common_use_cases(operation: str, value: float, expected: float):
    """Test clamp for common integration use cases."""
    limits = {
        "percent": (0, 100),
        "opacity": (0.0, 1.0),
        "index": (0, 10),
    }
    min_val, max_val = limits[operation]
    assert clamp(value, min_val, max_val) == expected
