"""Small shared utilities."""

from __future__ import annotations

import hashlib
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


def format_fare(amount: float) -> str:
    """Format a ride fare in Indian Rupees.
    
    Args:
        amount: The fare amount to format.
        
    Returns:
        A formatted string with the rupee symbol and amount rounded to 2 decimals.
        
    Examples:
        >>> format_fare(250)
        '₹250.00'
        >>> format_fare(0)
        '₹0.00'
        >>> format_fare(123.456)
        '₹123.46'
        >>> format_fare(999.999)
        '₹1000.00'
    """
    # Round to 2 decimal places using standard rounding
    rounded_amount = round(amount, 2)
    # Format with exactly 2 decimal places
    return f"₹{rounded_amount:.2f}"
