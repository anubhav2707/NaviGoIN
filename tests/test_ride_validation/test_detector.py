"""Unit tests for outlier detection."""

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from devagent.ride_validation.detector import OutlierDetector
from devagent.ride_validation.models import (
    AnomalyType,
    FareDetails,
    GPSPoint,
    RideBooking,
    RideState,
    RouteInfo,
)


class TestOutlierDetector(unittest.TestCase):
    """Test OutlierDetector functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.detector = OutlierDetector()
        self.base_time = datetime.now()

    def test_detect_gps_teleportation(self):
        """Test detection of GPS teleportation (impossible velocity)."""
        # Create telemetry with teleportation
        telemetry = [
            GPSPoint(
                latitude=40.7128,
                longitude=-74.0060,
                timestamp=self.base_time,
                accuracy=10,
            ),
            GPSPoint(
                latitude=40.8128,  # ~11km jump in 10 seconds
                longitude=-74.0060,
                timestamp=self.base_time + timedelta(seconds=10),
                accuracy=10,
            ),
        ]

        flags = self.detector.detect_telemetry_anomalies(telemetry)

        self.assertEqual(len(flags), 1)
        self.assertEqual(flags[0].type, AnomalyType.TELEMETRY_ANOMALY)
        self.assertEqual(flags[0].severity, "CRITICAL")
        self.assertIn("teleportation", flags[0].description.lower())
        self.assertGreater(flags[0].evidence["velocity_kmh"], 150)

    def test_detect_gps_jump_within_threshold(self):
        """Test detection of sudden GPS jumps."""
        telemetry = [
            GPSPoint(
                latitude=40.7128,
                longitude=-74.0060,
                timestamp=self.base_time,
                accuracy=10,
            ),
            GPSPoint(
                latitude=40.7628,  # ~5.5km jump in 30 seconds
                longitude=-74.0060,
                timestamp=self.base_time + timedelta(seconds=30),
                accuracy=10,
            ),
        ]

        flags = self.detector.detect_telemetry_anomalies(telemetry)

        self.assertEqual(len(flags), 1)
        self.assertEqual(flags[0].type, AnomalyType.TELEMETRY_ANOMALY)
        self.assertEqual(flags[0].severity, "WARNING")
        self.assertIn("jump", flags[0].description.lower())

    def test_normal_movement_no_anomaly(self):
        """Test that normal movement doesn't trigger anomalies."""
        # Simulate normal driving at ~50 km/h
        telemetry = []
        for i in range(5):
            telemetry.append(
                GPSPoint(
                    latitude=40.7128 + (i * 0.001),  # ~0.11km per minute
                    longitude=-74.0060,
                    timestamp=self.base_time + timedelta(minutes=i),
                    accuracy=15,
                )
            )

        flags = self.detector.detect_telemetry_anomalies(telemetry)
        self.assertEqual(len(flags), 0)

    def test_detect_route_deviation(self):
        """Test detection of excessive route deviation."""
        booking = RideBooking(
            booking_id="TEST-001",
            passenger_id="P123",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=20,  # 2x deviation
                optimal_duration_minutes=15,
                actual_duration_minutes=35,
                mid_trip_changes=[],
            ),
        )

        flags = self.detector.detect_route_deviation(booking)

        self.assertGreater(len(flags), 0)
        route_flags = [f for f in flags if f.type == AnomalyType.ROUTE_DEV_OUTLIER]
        self.assertEqual(len(route_flags), 1)
        self.assertEqual(route_flags[0].severity, "WARNING")
        self.assertAlmostEqual(route_flags[0].evidence["deviation_ratio"], 2.0)

    def test_route_deviation_with_destination_change(self):
        """Test that mid-trip destination changes don't trigger deviation flags."""
        booking = RideBooking(
            booking_id="TEST-002",
            passenger_id="P123",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=20,
                optimal_duration_minutes=15,
                actual_duration_minutes=35,
                mid_trip_changes=["Destination updated by passenger"],
            ),
        )

        flags = self.detector.detect_route_deviation(booking)
        route_flags = [f for f in flags if f.type == AnomalyType.ROUTE_DEV_OUTLIER]
        self.assertEqual(len(route_flags), 0)

    def test_detect_fare_mismatch(self):
        """Test detection of fare mismatches."""
        booking = RideBooking(
            booking_id="TEST-003",
            passenger_id="P123",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
                final_paid=70,  # 40% deviation
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
                mid_trip_changes=[],
            ),
        )

        flags = self.detector.detect_fare_mismatch(booking)

        self.assertGreater(len(flags), 0)
        fare_flags = [f for f in flags if f.type == AnomalyType.FARE_MISMATCH]
        self.assertEqual(len(fare_flags), 1)
        self.assertEqual(fare_flags[0].severity, "WARNING")
        self.assertAlmostEqual(fare_flags[0].evidence["deviation_percent"], 40.0)

    def test_fare_within_tolerance(self):
        """Test that small fare variations don't trigger anomalies."""
        booking = RideBooking(
            booking_id="TEST-004",
            passenger_id="P123",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
                final_paid=52,  # 4% deviation
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
            ),
        )

        flags = self.detector.detect_fare_mismatch(booking)
        fare_flags = [f for f in flags if f.type == AnomalyType.FARE_MISMATCH]
        self.assertEqual(len(fare_flags), 0)

    def test_detect_state_violations(self):
        """Test detection of invalid state transitions."""
        booking = RideBooking(
            booking_id="TEST-005",
            passenger_id="P123",
            created_at=self.base_time,
            accepted_at=self.base_time - timedelta(minutes=5),  # Before creation!
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
            ),
        )

        # Add invalid state transition
        booking.state_transitions = [
            (RideState.REQUESTED, self.base_time),
            (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=5)),  # Skip ACCEPTED
            (RideState.ACCEPTED, self.base_time + timedelta(minutes=10)),  # Backwards!
        ]

        flags = self.detector.detect_state_violations(booking)

        self.assertGreater(len(flags), 0)
        time_anomalies = [f for f in flags if f.type == AnomalyType.TIME_ANOMALY]
        state_violations = [f for f in flags if f.type == AnomalyType.STATE_VIOLATION]
        
        self.assertGreater(len(time_anomalies), 0)
        self.assertGreater(len(state_violations), 0)

    def test_detect_excessive_wait_time(self):
        """Test detection of excessive driver wait times."""
        booking = RideBooking(
            booking_id="TEST-006",
            passenger_id="P123",
            created_at=self.base_time,
            accepted_at=self.base_time + timedelta(minutes=5),
            arrived_at=self.base_time + timedelta(minutes=75),  # 70 minutes to arrive!
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
            ),
        )

        flags = self.detector.detect_state_violations(booking)
        
        time_anomalies = [f for f in flags if f.type == AnomalyType.TIME_ANOMALY]
        self.assertGreater(len(time_anomalies), 0)
        self.assertIn("arrival time", time_anomalies[0].description.lower())

    def test_detect_all_anomalies(self):
        """Test comprehensive anomaly detection."""
        booking = RideBooking(
            booking_id="TEST-007",
            passenger_id="P123",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=1.5,
                upfront_quoted=50,
                final_paid=75,  # Fare mismatch
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=20,  # Route deviation
                optimal_duration_minutes=15,
                actual_duration_minutes=35,
            ),
            telemetry=[
                GPSPoint(
                    latitude=40.7128,
                    longitude=-74.0060,
                    timestamp=self.base_time,
                    accuracy=10,
                ),
                GPSPoint(
                    latitude=40.8128,  # GPS teleportation
                    longitude=-74.0060,
                    timestamp=self.base_time + timedelta(seconds=10),
                    accuracy=10,
                ),
            ],
        )

        flags = self.detector.detect_all_anomalies(booking)

        # Should detect multiple anomaly types
        anomaly_types = {f.type for f in flags}
        self.assertIn(AnomalyType.TELEMETRY_ANOMALY, anomaly_types)
        self.assertIn(AnomalyType.ROUTE_DEV_OUTLIER, anomaly_types)
        self.assertIn(AnomalyType.FARE_MISMATCH, anomaly_types)

        # Should be sorted by severity
        if len(flags) > 1:
            severities = [f.severity for f in flags]
            self.assertEqual(
                severities,
                sorted(severities, key=lambda s: {"CRITICAL": 0, "WARNING": 1, "INFO": 2}.get(s, 3)),
            )


if __name__ == "__main__":
    unittest.main()
