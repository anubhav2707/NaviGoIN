"""Unit tests for ride booking validator."""

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, Mock, patch

from devagent.ride_validation.detector import OutlierDetector
from devagent.ride_validation.models import (
    AnomalyFlag,
    AnomalyType,
    FareDetails,
    GPSPoint,
    RideBooking,
    RideState,
    RouteInfo,
)
from devagent.ride_validation.validator import RideBookingValidator


class TestRideBookingValidator(unittest.TestCase):
    """Test RideBookingValidator functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.validator = RideBookingValidator()
        self.base_time = datetime.now()

    def create_valid_booking(self) -> RideBooking:
        """Create a valid booking for testing."""
        booking = RideBooking(
            booking_id="TEST-001",
            passenger_id="P123",
            driver_id="D456",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.25,
                distance_rate=1.5,
                upfront_quoted=27.5,  # Matches calculated: 5 + (15 * 0.25) + (10 * 1.5) = 23.75
                final_paid=27.5,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=10.5,
                optimal_duration_minutes=15,
                actual_duration_minutes=16,
            ),
        )

        # Add proper state transitions
        booking.state_transitions = [
            (RideState.REQUESTED, self.base_time),
            (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
            (RideState.ARRIVED, self.base_time + timedelta(minutes=8)),
            (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
            (RideState.COMPLETED, self.base_time + timedelta(minutes=26)),
        ]
        booking.state = RideState.COMPLETED
        booking.accepted_at = self.base_time + timedelta(minutes=2)
        booking.arrived_at = self.base_time + timedelta(minutes=8)
        booking.started_at = self.base_time + timedelta(minutes=10)
        booking.completed_at = self.base_time + timedelta(minutes=26)

        return booking

    def test_validate_successful_ride(self):
        """Test validation of a successful ride with no anomalies."""
        booking = self.create_valid_booking()
        result = self.validator.validate_ride(booking)

        self.assertEqual(result.status, "SUCCESS")
        self.assertEqual(result.booking_id, "TEST-001")
        self.assertFalse(result.has_anomalies)
        self.assertIn("state_machine_integrity", result.passed_checks)
        self.assertIn("receipt_generation", result.passed_checks)

    def test_validate_ride_with_anomalies(self):
        """Test validation of ride with anomalies."""
        booking = self.create_valid_booking()
        
        # Add GPS teleportation
        booking.telemetry = [
            GPSPoint(
                latitude=40.7128,
                longitude=-74.0060,
                timestamp=self.base_time,
                accuracy=10,
            ),
            GPSPoint(
                latitude=40.8128,  # Large jump
                longitude=-74.0060,
                timestamp=self.base_time + timedelta(seconds=10),
                accuracy=10,
            ),
        ]

        # Add fare mismatch
        booking.fare.final_paid = 40  # Much higher than quoted

        result = self.validator.validate_ride(booking)

        self.assertEqual(result.status, "COMPLETED_WITH_FLAGS")
        self.assertTrue(result.has_anomalies)
        self.assertGreater(len(result.flags), 0)

        # Check for specific anomaly types
        anomaly_types = {f.type for f in result.flags}
        self.assertIn(AnomalyType.TELEMETRY_ANOMALY, anomaly_types)
        self.assertIn(AnomalyType.FARE_MISMATCH, anomaly_types)

    def test_check_upfront_pricing(self):
        """Test upfront pricing verification."""
        booking = self.create_valid_booking()
        
        # Test with matching fare
        self.assertTrue(self.validator._check_upfront_pricing(booking))

        # Test with mismatched fare
        booking.fare.upfront_quoted = 100  # Way off from calculated
        self.assertFalse(self.validator._check_upfront_pricing(booking))

    def test_check_state_machine_integrity(self):
        """Test state machine integrity check."""
        booking = self.create_valid_booking()
        
        # Test complete ride with all states
        self.assertTrue(self.validator._check_state_machine_integrity(booking))

        # Test incomplete state transitions
        booking.state_transitions = [
            (RideState.REQUESTED, self.base_time),
            (RideState.COMPLETED, self.base_time + timedelta(minutes=30)),
        ]
        self.assertFalse(self.validator._check_state_machine_integrity(booking))

        # Test cancelled ride
        booking.state = RideState.CANCELLED
        booking.state_transitions = [
            (RideState.REQUESTED, self.base_time),
            (RideState.CANCELLED, self.base_time + timedelta(minutes=5)),
        ]
        self.assertTrue(self.validator._check_state_machine_integrity(booking))

    def test_check_receipt_generation(self):
        """Test receipt generation check."""
        booking = self.create_valid_booking()
        
        # Test with matching payment
        booking.fare.final_paid = booking.fare.upfront_quoted * 1.03  # Within 5% tolerance
        self.assertTrue(self.validator._check_receipt_generation(booking))

        # Test with large deviation
        booking.fare.final_paid = booking.fare.upfront_quoted * 1.2  # 20% deviation
        self.assertFalse(self.validator._check_receipt_generation(booking))

        # Test with mid-trip changes (should pass even with deviation)
        booking.route.mid_trip_changes = ["Destination updated"]
        self.assertTrue(self.validator._check_receipt_generation(booking))

        # Test incomplete ride (should pass)
        booking.state = RideState.IN_PROGRESS
        self.assertTrue(self.validator._check_receipt_generation(booking))

    def test_validate_batch(self):
        """Test batch validation of multiple bookings."""
        bookings = [
            self.create_valid_booking(),
            self.create_valid_booking(),
        ]
        bookings[0].booking_id = "BATCH-001"
        bookings[1].booking_id = "BATCH-002"
        
        # Make second booking have anomalies
        bookings[1].fare.final_paid = 100  # Large deviation

        results = self.validator.validate_batch(bookings)

        self.assertEqual(len(results), 2)
        self.assertIn("BATCH-001", results)
        self.assertIn("BATCH-002", results)
        
        self.assertEqual(results["BATCH-001"].status, "SUCCESS")
        self.assertEqual(results["BATCH-002"].status, "COMPLETED_WITH_FLAGS")

    def test_validation_with_exception(self):
        """Test validation handles exceptions gracefully."""
        booking = self.create_valid_booking()
        
        # Mock a check to raise an exception
        with patch.object(self.validator, "_check_upfront_pricing") as mock_check:
            mock_check.side_effect = Exception("Test error")
            
            result = self.validator.validate_ride(booking)
            
            self.assertIn("upfront_pricing", result.failed_checks)
            # Other checks should still run
            self.assertIn("state_machine_integrity", result.passed_checks)

    def test_calculate_metrics(self):
        """Test metrics calculation."""
        booking = self.create_valid_booking()
        result = self.validator.validate_ride(booking)

        self.assertIn("total_checks", result.metrics)
        self.assertIn("passed_checks", result.metrics)
        self.assertIn("failed_checks", result.metrics)
        self.assertIn("anomaly_count", result.metrics)
        self.assertIn("route_deviation_ratio", result.metrics)
        self.assertIn("fare_deviation_percent", result.metrics)
        self.assertIn("trip_duration_minutes", result.metrics)

        # Check calculated values
        self.assertAlmostEqual(result.metrics["route_deviation_ratio"], 1.05, places=2)
        self.assertAlmostEqual(result.metrics["trip_duration_minutes"], 16, places=1)

    @patch("devagent.ride_validation.validator.log")
    def test_logging(self, mock_log):
        """Test that appropriate logs are generated."""
        booking = self.create_valid_booking()
        result = self.validator.validate_ride(booking)

        # Check that info logs were called
        self.assertTrue(mock_log.info.called)
        call_args = [call[0][0] for call in mock_log.info.call_args_list]
        
        # Should log start and completion
        self.assertTrue(any("Starting validation" in arg for arg in call_args))
        self.assertTrue(any("Validation complete" in arg for arg in call_args))


if __name__ == "__main__":
    unittest.main()
