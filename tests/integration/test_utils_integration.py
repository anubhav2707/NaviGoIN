import pytest
from devagent.utils import clamp_value


def test_clamp_value_exact_boundaries():
    """Test that clamp_value returns exact boundary values."""
    # Test lower boundary clamping
    assert clamp_value(-10, min_val=0, max_val=100) == 0
    assert clamp_value(-0.5, min_val=0, max_val=100) == 0
    assert clamp_value(0, min_val=0, max_val=100) == 0
    
    # Test upper boundary clamping
    assert clamp_value(150, min_val=0, max_val=100) == 100
    assert clamp_value(100.5, min_val=0, max_val=100) == 100
    assert clamp_value(100, min_val=0, max_val=100) == 100
    
    # Test values within range (no clamping)
    assert clamp_value(50, min_val=0, max_val=100) == 50
    assert clamp_value(25.5, min_val=0, max_val=100) == 25.5
    assert clamp_value(99.99, min_val=0, max_val=100) == 99.99
    
    # Test with negative ranges
    assert clamp_value(-50, min_val=-100, max_val=-10) == -50
    assert clamp_value(0, min_val=-100, max_val=-10) == -10
    assert clamp_value(-200, min_val=-100, max_val=-10) == -100
    
    # Test with float boundaries
    assert clamp_value(3.7, min_val=1.5, max_val=3.5) == 3.5
    assert clamp_value(0.5, min_val=1.5, max_val=3.5) == 1.5
    assert clamp_value(2.0, min_val=1.5, max_val=3.5) == 2.0


def test_clamp_value_edge_cases():
    """Test edge cases with exact boundary assertions."""
    # Test with zero-width range
    assert clamp_value(5, min_val=10, max_val=10) == 10
    assert clamp_value(15, min_val=10, max_val=10) == 10
    
    # Test with very large numbers
    assert clamp_value(1e10, min_val=0, max_val=1e9) == 1e9
    assert clamp_value(-1e10, min_val=-1e9, max_val=0) == -1e9
    
    # Test with very small differences
    assert clamp_value(1.0000001, min_val=0, max_val=1) == 1
    assert clamp_value(-0.0000001, min_val=0, max_val=1) == 0
