

def clamp(n: float, min_val: float, max_val: float) -> float:
    """Clamp a number to be within a given range.
    
    Args:
        n: The number to clamp
        min_val: The minimum allowed value
        max_val: The maximum allowed value
        
    Returns:
        The clamped value
        
    Raises:
        ValueError: If min_val > max_val (inverted range)
    """
    if min_val > max_val:
        raise ValueError(f"Invalid range: min ({min_val}) cannot be greater than max ({max_val})")
    return max(min_val, min(n, max_val))
