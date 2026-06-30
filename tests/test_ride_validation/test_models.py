"""Unit tests for ride validation models."""

import unittest
from datetime import datetime, timedelta

from pydantic import ValidationError

from devagent.ride_validation.models import (
    AnomalyFlag,
    AnomalyType,
    FareDetails,
    GPSPoint,
    RideBooking,
    RideState,
    RouteInfo,
    ValidationResult,
)


class TestGPSPoint(unittest.TestCase):
    """Test GPSPoint model."""

    def test_valid_gps_point(self):
        """Test creating valid GPS point."""
        point = GPSPoint(
            latitude=40.7128,
            longitude=-74.0060,
            timestamp=datetime.now(),
            accuracy=10.5,
            speed=50.0,
        )
        self.assertEqual(point.latitude, 40.7128)
        self.assertEqual(point.longitude, -74.0060)
        self.assertEqual(point.accuracy, 10.5)
        self.assertEqual(point.speed, 50.0)

    def test_invalid_latitude(self):
        """Test invalid latitude raises error."""
        with self.assertRaises(ValidationError):
            GPSPoint(
                latitude=91,  # Invalid: > 90
                longitude=0,
                timestamp=datetime.now(),
                accuracy=10,
            )

    def test_invalid_longitude(self):
        """Test invalid longitude raises error."""
        with self.assertRaises(ValidationError):
            GPSPoint(
                latitude=0,
                longitude=181,  # Invalid: > 180
                timestamp=datetime.now(),
                accuracy=10,
            )

    def test_negative_accuracy(self):
        """Test negative accuracy raises error."""
        with self.assertRaises(ValidationError):
            GPSPoint(
                latitude=0,
                longitude=0,
                timestamp=datetime.now(),
                accuracy=-5,  # Invalid: negative
            )


class TestFareDetails(unittest.TestCase):
    """Test FareDetails model."""

    def test_calculate_base_fare(self):
        """Test fare calculation."""
        fare = FareDetails(
            base_fare=5.0,
            time_rate=0.25,  # per minute
            distance_rate=1.5,  # per km
            surge_multiplier=1.0,
            tolls=0,
            upfront_quoted=50,
        )

        # 20 minutes, 10 km
        calculated = fare.calculate_base_fare(20, 10)
        expected = 5.0 + (20 * 0.25) + (10 * 1.5)  # 5 + 5 + 15 = 25
        self.assertEqual(calculated, expected)

    def test_calculate_fare_with_surge(self):
        """Test fare calculation with surge pricing."""
        fare = FareDetails(
            base_fare=5.0,
            time_rate=0.25,
            distance_rate=1.5,
            surge_multiplier=2.0,  # 2x surge
            tolls=3.0,
            upfront_quoted=50,
        )

        calculated = fare.calculate_base_fare(20, 10)
        expected = (5.0 + (20 * 0.25) + (10 * 1.5)) * 2.0 + 3.0  # 50 + 3 = 53
        self.assertEqual(calculated, expected)

    def test_negative_fare_components(self):
        """Test that negative fare components raise errors."""
        with self.assertRaises(ValidationError):
            FareDetails(
                base_fare=-5,  # Invalid: negative
                time_rate=0.25,
                distance_rate=1.5,
                upfront_quoted=50,
            )


class TestRideBooking(unittest.TestCase):
    """Test RideBooking model."""

    def test_create_booking(self):
        """Test creating a basic ride booking."""
        booking = RideBooking(
            booking_id="TEST-001",
            passenger_id="P123",
            created_at=datetime.now(),
            fare=FareDetails(
                base_fare=5,
                time_rate=0.25,
                distance_rate=1.5,
                upfront_quoted=30,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
            ),
        )

        self.assertEqual(booking.booking_id, "TEST-001")
        self.assertEqual(booking.state, RideState.REQUESTED)
        self.assertIsNone(booking.driver_id)

    def test_add_state_transition(self):
        """Test adding state transitions."""
        base_time = datetime.now()
        booking = RideBooking(
            booking_id="TEST-002",
            passenger_id="P123",
            created_at=base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.25,
                distance_rate=1.5,
                upfront_quoted=30,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                optimal_duration_minutes=15,
            ),
        )

        # Add transitions
        booking.add_state_transition(RideState.ACCEPTED, base_time + timedelta(minutes=2))
        booking.add_state_transition(RideState.ARRIVED, base_time + timedelta(minutes=10))
        booking.add_state_transition(RideState.IN_PROGRESS, base_time + timedelta(minutes=12))
        booking.add_state_transition(RideState.COMPLETED, base_time + timedelta(minutes=30))

        # Verify state and timestamps
        self.assertEqual(booking.state, RideState.COMPLETED)
        self.assertIsNotNone(booking.accepted_at)
        self.assertIsNotNone(booking.arrived_at)
        self.assertIsNotNone(booking.started_at)
        self.assertIsNotNone(booking.completed_at)
        self.assertEqual(len(booking.state_transitions), 4)


class TestValidationResult(unittest.TestCase):
    """Test ValidationResult model."""

    def test_create_validation_result(self):
        """Test creating validation result."""
        result = ValidationResult(
            booking_id="TEST-001",
            validation_timestamp=datetime.now(),
        )

        self.assertEqual(result.status, "SUCCESS")
        self.assertFalse(result.has_anomalies)
        self.assertEqual(len(result.critical_anomalies), 0)

    def test_validation_with_anomalies(self):
        """Test validation result with anomalies."""
        result = ValidationResult(
            booking_id="TEST-002",
            validation_timestamp=datetime.now(),
            flags=[
                AnomalyFlag(
                    type=AnomalyType.TELEMETRY_ANOMALY,
                    severity="WARNING",
                    description="GPS jump detected",
                    detected_at=datetime.now(),
                ),
                AnomalyFlag(
                    type=AnomalyType.FARE_MISMATCH,
                    severity="CRITICAL",
                    description="Large fare discrepancy",
                    detected_at=datetime.now(),
                ),
            ],
        )

        self.assertTrue(result.has_anomalies)
        self.assertEqual(len(result.critical_anomalies), 1)
        self.assertEqual(result.critical_anomalies[0].type, AnomalyType.FARE_MISMATCH)

    def test_passed_failed_checks(self):
        """Test tracking passed and failed checks."""
        result = ValidationResult(
            booking_id="TEST-003",
            validation_timestamp=datetime.now(),
            passed_checks=["upfront_pricing", "state_machine_integrity"],
            failed_checks=["receipt_generation"],
        )

        self.assertEqual(len(result.passed_checks), 2)
        self.assertEqual(len(result.failed_checks), 1)
        self.assertIn("upfront_pricing", result.passed_checks)
        self.assertIn("receipt_generation", result.failed_checks)


if __name__ == "__main__":
    unittest.main()
