"""Domain models for ride booking validation."""

from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class RideState(str, enum.Enum):
    """Ride lifecycle states."""

    REQUESTED = "requested"
    ACCEPTED = "accepted"
    ARRIVED = "arrived"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AnomalyType(str, enum.Enum):
    """Types of detected anomalies."""

    TELEMETRY_ANOMALY = "TELEMETRY_ANOMALY"  # GPS teleportation
    ROUTE_DEV_OUTLIER = "ROUTE_DEV_OUTLIER"  # Excessive route deviation
    FARE_MISMATCH = "FARE_MISMATCH"  # Large fare discrepancy
    STATE_VIOLATION = "STATE_VIOLATION"  # Invalid state transition
    TIME_ANOMALY = "TIME_ANOMALY"  # Unrealistic time metrics


class GPSPoint(BaseModel):
    """GPS telemetry point."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    timestamp: datetime
    accuracy: float = Field(ge=0)  # meters
    speed: Optional[float] = Field(default=None, ge=0)  # km/h

    @field_validator("latitude", "longitude")
    @classmethod
    def validate_coordinates(cls, v: float, info) -> float:
        if info.field_name == "latitude" and not (-90 <= v <= 90):
            raise ValueError(f"Invalid latitude: {v}")
        if info.field_name == "longitude" and not (-180 <= v <= 180):
            raise ValueError(f"Invalid longitude: {v}")
        return v


class FareDetails(BaseModel):
    """Fare calculation details."""

    base_fare: float = Field(ge=0)
    time_rate: float = Field(ge=0)  # per minute
    distance_rate: float = Field(ge=0)  # per km
    surge_multiplier: float = Field(default=1.0, ge=1.0)
    tolls: float = Field(default=0, ge=0)
    upfront_quoted: float = Field(ge=0)
    final_paid: Optional[float] = Field(default=None, ge=0)

    def calculate_base_fare(self, time_minutes: float, distance_km: float) -> float:
        """Calculate fare using standard formula."""
        return (
            self.base_fare
            + (time_minutes * self.time_rate)
            + (distance_km * self.distance_rate)
        ) * self.surge_multiplier + self.tolls


class RouteInfo(BaseModel):
    """Route information."""

    optimal_distance_km: float = Field(ge=0)
    actual_distance_km: Optional[float] = Field(default=None, ge=0)
    optimal_duration_minutes: float = Field(ge=0)
    actual_duration_minutes: Optional[float] = Field(default=None, ge=0)
    waypoints: List[GPSPoint] = Field(default_factory=list)
    mid_trip_changes: List[str] = Field(default_factory=list)


class RideBooking(BaseModel):
    """Complete ride booking data."""

    booking_id: str
    passenger_id: str
    driver_id: Optional[str] = None
    state: RideState = RideState.REQUESTED
    created_at: datetime
    accepted_at: Optional[datetime] = None
    arrived_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    fare: FareDetails
    route: RouteInfo
    telemetry: List[GPSPoint] = Field(default_factory=list)
    state_transitions: List[tuple[RideState, datetime]] = Field(default_factory=list)

    def add_state_transition(self, new_state: RideState, timestamp: datetime) -> None:
        """Record a state transition."""
        self.state_transitions.append((new_state, timestamp))
        self.state = new_state

        # Update relevant timestamps
        if new_state == RideState.ACCEPTED:
            self.accepted_at = timestamp
        elif new_state == RideState.ARRIVED:
            self.arrived_at = timestamp
        elif new_state == RideState.IN_PROGRESS:
            self.started_at = timestamp
        elif new_state == RideState.COMPLETED:
            self.completed_at = timestamp


class AnomalyFlag(BaseModel):
    """Detected anomaly details."""

    type: AnomalyType
    severity: str = Field(default="WARNING")  # INFO, WARNING, CRITICAL
    description: str
    detected_at: datetime
    evidence: dict = Field(default_factory=dict)
    confidence: float = Field(ge=0, le=1, default=1.0)


class ValidationResult(BaseModel):
    """Ride validation result."""

    booking_id: str
    status: str = "SUCCESS"  # SUCCESS, COMPLETED_WITH_FLAGS, FAILED
    flags: List[AnomalyFlag] = Field(default_factory=list)
    validation_timestamp: datetime
    metrics: dict = Field(default_factory=dict)
    passed_checks: List[str] = Field(default_factory=list)
    failed_checks: List[str] = Field(default_factory=list)

    @property
    def has_anomalies(self) -> bool:
        """Check if any anomalies were detected."""
        return len(self.flags) > 0

    @property
    def critical_anomalies(self) -> List[AnomalyFlag]:
        """Get critical severity anomalies."""
        return [f for f in self.flags if f.severity == "CRITICAL"]
