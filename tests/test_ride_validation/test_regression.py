"""Regression tests to ensure existing functionality remains intact."""

import unittest
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

from devagent.ride_validation import (
    FareDetails,
    GPSPoint,
    OutlierDetector,
    RideBooking,
    RideBookingValidator,
    RideState,
    RouteInfo,
)


class TestRegressionCompatibility(unittest.TestCase):
    """Ensure new ride validation doesn't break existing systems."""

    def setUp(self):
        """Set up test environment."""
        self.validator = RideBookingValidator()
        self.detector = OutlierDetector()
        self.base_time = datetime.now()

    def test_backward_compatibility_with_missing_fields(self):
        """Test that validation handles bookings with missing optional fields."""
        # Minimal booking with only required fields
        booking = RideBooking(
            booking_id="REGRESSION-001",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                optimal_duration_minutes=12,
            ),
        )

        # Should not raise exceptions
        result = self.validator.validate_ride(booking)
        
        self.assertIsNotNone(result)
        self.assertEqual(result.booking_id, "REGRESSION-001")
        # Should handle gracefully even with missing data
        self.assertIn(result.status, ["SUCCESS", "FAILED", "COMPLETED_WITH_FLAGS"])

    def test_detector_thresholds_configurable(self):
        """Test that detector thresholds can be customized without breaking."""
        # Create detector with custom thresholds
        custom_detector = OutlierDetector()
        custom_detector.MAX_VELOCITY_KMH = 200  # Higher threshold
        custom_detector.ROUTE_DEVIATION_FACTOR = 2.5  # More lenient
        custom_detector.FARE_DEVIATION_PERCENT = 50  # More lenient

        validator = RideBookingValidator(detector=custom_detector)

        # Create booking that would normally trigger flags
        booking = RideBooking(
            booking_id="REGRESSION-002",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=2,
                upfront_quoted=50,
                final_paid=70,  # 40% deviation - would flag with default
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=22,  # 2.2x - would flag with default
                optimal_duration_minutes=15,
                actual_duration_minutes=30,
            ),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=40)),
            ],
        )

        result = validator.validate_ride(booking)
        
        # Should not flag with custom thresholds
        route_flags = [f for f in result.flags if "ROUTE_DEV" in f.type.value]
        fare_flags = [f for f in result.flags if "FARE" in f.type.value]
        
        self.assertEqual(len(route_flags), 0)  # 2.2x < 2.5x threshold
        self.assertEqual(len(fare_flags), 0)  # 40% < 50% threshold

    def test_empty_telemetry_handling(self):
        """Test that empty telemetry doesn't cause errors."""
        booking = RideBooking(
            booking_id="REGRESSION-003",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                optimal_duration_minutes=12,
            ),
            telemetry=[],  # Empty telemetry
        )

        # Should handle empty telemetry gracefully
        flags = self.detector.detect_telemetry_anomalies(booking.telemetry)
        self.assertEqual(len(flags), 0)

        # Full validation should also work
        result = self.validator.validate_ride(booking)
        self.assertIsNotNone(result)

    def test_null_fare_paid_handling(self):
        """Test handling of rides without final payment (e.g., cancelled)."""
        booking = RideBooking(
            booking_id="REGRESSION-004",
            passenger_id="P-REG",
            state=RideState.CANCELLED,
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
                final_paid=None,  # No payment for cancelled ride
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                optimal_duration_minutes=12,
            ),
        )

        # Should handle null final_paid gracefully
        flags = self.detector.detect_fare_mismatch(booking)
        self.assertEqual(len(flags), 0)

        result = self.validator.validate_ride(booking)
        self.assertIsNotNone(result)

    def test_invalid_state_sequence_recovery(self):
        """Test that invalid state sequences don't crash the system."""
        booking = RideBooking(
            booking_id="REGRESSION-005",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                optimal_duration_minutes=12,
            ),
            state_transitions=[
                (RideState.COMPLETED, self.base_time),  # Invalid: starts with COMPLETED
                (RideState.REQUESTED, self.base_time + timedelta(minutes=5)),
            ],
        )

        # Should detect the violation but not crash
        flags = self.detector.detect_state_violations(booking)
        self.assertGreater(len(flags), 0)

        result = self.validator.validate_ride(booking)
        self.assertIsNotNone(result)
        self.assertTrue(any("STATE" in f.type.value for f in result.flags))

    def test_extreme_values_handling(self):
        """Test handling of extreme but valid values."""
        # Very long distance ride
        booking = RideBooking(
            booking_id="REGRESSION-006",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=10,
                time_rate=0.5,
                distance_rate=3,
                upfront_quoted=1000,  # Very high fare
                final_paid=1000,
            ),
            route=RouteInfo(
                optimal_distance_km=300,  # Very long distance
                actual_distance_km=305,
                optimal_duration_minutes=240,  # 4 hours
                actual_duration_minutes=245,
            ),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=5)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=15)),
                (RideState.COMPLETED, self.base_time + timedelta(hours=4)),
            ],
        )

        result = self.validator.validate_ride(booking)
        
        # Should handle extreme values without errors
        self.assertIsNotNone(result)
        # Reasonable deviation should not flag
        route_flags = [f for f in result.flags if "ROUTE_DEV" in f.type.value]
        self.assertEqual(len(route_flags), 0)  # 305/300 = 1.017, well below threshold

    def test_concurrent_validation_safety(self):
        """Test that validator can handle concurrent validations."""
        import threading
        import time
        
        results = {}
        errors = []
        
        def validate_booking(booking_id: str):
            try:
                booking = RideBooking(
                    booking_id=booking_id,
                    passenger_id=f"P-{booking_id}",
                    created_at=self.base_time,
                    fare=FareDetails(
                        base_fare=5,
                        time_rate=0.3,
                        distance_rate=1.5,
                        upfront_quoted=25,
                        final_paid=25,
                    ),
                    route=RouteInfo(
                        optimal_distance_km=8,
                        actual_distance_km=8,
                        optimal_duration_minutes=12,
                        actual_duration_minutes=12,
                    ),
                )
                result = self.validator.validate_ride(booking)
                results[booking_id] = result
            except Exception as e:
                errors.append((booking_id, str(e)))
        
        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(
                target=validate_booking,
                args=(f"CONCURRENT-{i:03d}",)
            )
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=5)
        
        # Verify all validations completed successfully
        self.assertEqual(len(errors), 0, f"Errors occurred: {errors}")
        self.assertEqual(len(results), 10)
        
        # All should have valid results
        for booking_id, result in results.items():
            self.assertIsNotNone(result)
            self.assertEqual(result.booking_id, booking_id)

    @patch("devagent.ride_validation.validator.log")
    def test_logging_doesnt_break_validation(self, mock_log):
        """Test that logging failures don't break validation."""
        # Make logging raise an exception
        mock_log.info.side_effect = Exception("Logging failed")
        mock_log.error.side_effect = Exception("Logging failed")
        
        booking = RideBooking(
            booking_id="REGRESSION-LOG",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
                final_paid=25,
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                actual_distance_km=8,
                optimal_duration_minutes=12,
                actual_duration_minutes=12,
            ),
        )
        
        # Should complete validation despite logging errors
        try:
            result = self.validator.validate_ride(booking)
            self.assertIsNotNone(result)
        except Exception as e:
            self.fail(f"Validation failed due to logging: {e}")

    def test_metric_calculation_edge_cases(self):
        """Test metric calculations with edge cases."""
        booking = RideBooking(
            booking_id="REGRESSION-METRICS",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
                final_paid=0,  # Free ride (promo code?)
            ),
            route=RouteInfo(
                optimal_distance_km=0,  # Zero distance (cancelled immediately?)
                actual_distance_km=0,
                optimal_duration_minutes=0,
                actual_duration_minutes=0,
            ),
        )
        
        result = self.validator.validate_ride(booking)
        
        # Should handle zero values in metrics
        self.assertIsNotNone(result.metrics)
        # Should not have division by zero errors
        self.assertNotIn(float('inf'), result.metrics.values())
        self.assertNotIn(float('nan'), str(result.metrics.values()))

    def test_serialization_compatibility(self):
        """Test that results can be serialized for storage/transmission."""
        import json
        
        booking = RideBooking(
            booking_id="REGRESSION-SERIAL",
            passenger_id="P-REG",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5,
                time_rate=0.3,
                distance_rate=1.5,
                upfront_quoted=25,
                final_paid=26,
            ),
            route=RouteInfo(
                optimal_distance_km=8,
                actual_distance_km=8.2,
                optimal_duration_minutes=12,
                actual_duration_minutes=13,
            ),
        )
        
        result = self.validator.validate_ride(booking)
        
        # Should be serializable to JSON
        try:
            json_str = result.model_dump_json()
            self.assertIsNotNone(json_str)
            
            # Should be deserializable
            parsed = json.loads(json_str)
            self.assertEqual(parsed["booking_id"], "REGRESSION-SERIAL")
            
        except Exception as e:
            self.fail(f"Serialization failed: {e}")


if __name__ == "__main__":
    unittest.main()
