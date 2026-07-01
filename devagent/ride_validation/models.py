"""Data models for ride validation system."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


class AnomalyType(Enum):
    """Types of anomalies detected in ride data."""
    FARE_ANOMALY = "fare_anomaly"
    ROUTE_ANOMALY = "route_anomaly"
    DISTANCE_ANOMALY = "distance_anomaly"
    DURATION_ANOMALY = "duration_anomaly"
    SPEED_ANOMALY = "speed_anomaly"
    DUPLICATE_REQUEST = "duplicate_request"
    

class ValidationStatus(Enum):
    """Validation status for rides."""
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"
    FLAGGED = "flagged"
    

class AnomalyFlag(Enum):
    """Flags for different types of anomalies."""
    HIGH_FARE = "high_fare"
    LOW_FARE = "low_fare"
    IMPOSSIBLE_SPEED = "impossible_speed"
    CIRCULAR_ROUTE = "circular_route"
    EXCESSIVE_DISTANCE = "excessive_distance"
    SHORT_DURATION = "short_duration"
    LONG_DURATION = "long_duration"
    SUSPICIOUS_PATTERN = "suspicious_pattern"


@dataclass
class Location:
    """Geographic location with coordinates."""
    latitude: float
    longitude: float
    address: Optional[str] = None
    
    def __post_init__(self):
        """Validate coordinates."""
        if not -90 <= self.latitude <= 90:
            raise ValueError(f"Invalid latitude: {self.latitude}")
        if not -180 <= self.longitude <= 180:
            raise ValueError(f"Invalid longitude: {self.longitude}")


@dataclass
class RideRequest:
    """Ride request data model."""
    ride_id: str
    user_id: str
    driver_id: Optional[str]
    pickup_location: Location
    dropoff_location: Location
    requested_at: datetime
    fare_amount: float
    distance_km: float
    duration_minutes: float
    payment_method: str
    vehicle_type: str = "standard"
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate ride request data."""
        if self.fare_amount < 0:
            raise ValueError(f"Invalid fare amount: {self.fare_amount}")
        if self.distance_km < 0:
            raise ValueError(f"Invalid distance: {self.distance_km}")
        if self.duration_minutes < 0:
            raise ValueError(f"Invalid duration: {self.duration_minutes}")


@dataclass
class ValidationResult:
    """Result of ride validation."""
    ride_id: str
    status: ValidationStatus
    anomalies: List[AnomalyType] = field(default_factory=list)
    flags: List[AnomalyFlag] = field(default_factory=list)
    confidence_score: float = 1.0
    validated_at: datetime = field(default_factory=datetime.now)
    details: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate result data."""
        if not 0 <= self.confidence_score <= 1:
            raise ValueError(f"Invalid confidence score: {self.confidence_score}")
    
    def is_valid(self) -> bool:
        """Check if validation passed."""
        return self.status == ValidationStatus.VALID
    
    def has_anomalies(self) -> bool:
        """Check if any anomalies were detected."""
        return len(self.anomalies) > 0 or len(self.flags) > 0


@dataclass
class AnomalyDetection:
    """Anomaly detection result."""
    anomaly_type: AnomalyType
    severity: float  # 0.0 to 1.0
    description: str
    detected_value: Any
    expected_range: Optional[tuple] = None
    confidence: float = 0.5
    
    def __post_init__(self):
        """Validate anomaly data."""
        if not 0 <= self.severity <= 1:
            raise ValueError(f"Invalid severity: {self.severity}")
        if not 0 <= self.confidence <= 1:
            raise ValueError(f"Invalid confidence: {self.confidence}")
    
    def is_critical(self) -> bool:
        """Check if anomaly is critical."""
        return self.severity >= 0.8


@dataclass
class ValidationMetrics:
    """Metrics for validation performance."""
    total_rides: int = 0
    valid_rides: int = 0
    invalid_rides: int = 0
    flagged_rides: int = 0
    anomaly_counts: Dict[str, int] = field(default_factory=dict)
    processing_time_ms: float = 0.0
    
    def get_validation_rate(self) -> float:
        """Calculate validation success rate."""
        if self.total_rides == 0:
            return 0.0
        return self.valid_rides / self.total_rides
    
    def get_anomaly_rate(self) -> float:
        """Calculate anomaly detection rate."""
        if self.total_rides == 0:
            return 0.0
        total_anomalies = sum(self.anomaly_counts.values())
        return total_anomalies / self.total_rides


@dataclass
class RidePattern:
    """Pattern analysis for ride behavior."""
    user_id: str
    pattern_type: str
    frequency: int
    time_window_hours: int
    locations: List[Location] = field(default_factory=list)
    average_fare: float = 0.0
    total_distance: float = 0.0
    
    def is_suspicious(self) -> bool:
        """Check if pattern is suspicious."""
        # High frequency in short time window
        if self.time_window_hours > 0:
            rides_per_hour = self.frequency / self.time_window_hours
            if rides_per_hour > 10:  # More than 10 rides per hour
                return True
        return False


@dataclass 
class ValidationConfig:
    """Configuration for validation rules."""
    max_fare_per_km: float = 10.0
    min_fare_per_km: float = 0.5
    max_speed_kmh: float = 200.0
    min_speed_kmh: float = 5.0
    max_distance_km: float = 500.0
    min_distance_km: float = 0.1
    max_duration_hours: float = 12.0
    min_duration_minutes: float = 1.0
    anomaly_threshold: float = 0.7
    enable_ml_detection: bool = True
    enable_pattern_analysis: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary."""
        return {
            "max_fare_per_km": self.max_fare_per_km,
            "min_fare_per_km": self.min_fare_per_km,
            "max_speed_kmh": self.max_speed_kmh,
            "min_speed_kmh": self.min_speed_kmh,
            "max_distance_km": self.max_distance_km,
            "min_distance_km": self.min_distance_km,
            "max_duration_hours": self.max_duration_hours,
            "min_duration_minutes": self.min_duration_minutes,
            "anomaly_threshold": self.anomaly_threshold,
            "enable_ml_detection": self.enable_ml_detection,
            "enable_pattern_analysis": self.enable_pattern_analysis
        }