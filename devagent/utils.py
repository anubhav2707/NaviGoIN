"""Small shared utilities."""

from __future__ import annotations

import hashlib
import math
import re
from typing import Any

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

# Retry decorator for transient network failures, mirroring the operational
# guidance: up to 4 attempts with exponential backoff (2s, 4s, 8s, 16s).
network_retry = retry(
    reraise=True,
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=2, max=16),
    retry=retry_if_exception_type((ConnectionError, TimeoutError)),
)


def stable_id(*parts: Any) -> str:
    """Deterministic short id from arbitrary parts."""
    digest = hashlib.sha256("\x1f".join(str(p) for p in parts).encode()).hexdigest()
    return digest[:16]


_TICKET_RE = re.compile(r"\b([A-Z][A-Z0-9]+-\d+)\b")


def extract_ticket_key(text: str) -> str | None:
    """Find a Jira-style ticket key (e.g. PLAT-1234) in free text."""
    match = _TICKET_RE.search(text or "")
    return match.group(1) if match else None


def slugify(text: str, max_len: int = 60) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return slug[:max_len].strip("-")


def truncate(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def clamp(n: float, min_val: float, max_val: float) -> float:
    """Clamp a number between min and max values.
    
    Args:
        n: The number to clamp
        min_val: The minimum allowed value
        max_val: The maximum allowed value
    
    Returns:
        The clamped value between min_val and max_val
    
    Behavior for special cases:
        - If n is NaN, returns NaN (propagates NaN)
        - If min_val > max_val, returns min_val
        - If any boundary is NaN, returns NaN
    
    Examples:
        >>> clamp(5, 0, 10)
        5
        >>> clamp(-5, 0, 10)
        0
        >>> clamp(15, 0, 10)
        10
        >>> clamp(float('nan'), 0, 10)
        nan
    """
    # NaN handling: if any input is NaN, return NaN
    if math.isnan(n) or math.isnan(min_val) or math.isnan(max_val):
        return float('nan')
    
    # Handle case where min > max by returning min
    if min_val > max_val:
        return min_val
    
    return max(min_val, min(max_val, n))
