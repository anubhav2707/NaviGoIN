

def clamp(value: float, min_value: float, max_value: float) -> float:
    """Clamp a value between min and max bounds (inclusive).
    
    This is a pure function that does not mutate any inputs.
    
    Args:
        value: The value to clamp
        min_value: The minimum allowed value
        max_value: The maximum allowed value
        
    Returns:
        The clamped value between min_value and max_value
        
    Examples:
        >>> clamp(5, 0, 10)
        5
        >>> clamp(-5, 0, 10)
        0
        >>> clamp(15, 0, 10)
        10
        >>> clamp(0.5, 0.0, 1.0)
        0.5
        >>> clamp(1.5, 0.0, 1.0)
        1.0
    """
    return max(min_value, min(value, max_value))
