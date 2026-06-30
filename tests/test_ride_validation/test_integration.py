"""Integration tests for ride validation system."""

import unittest
from datetime import datetime, timedelta
from typing import List

from devagent.ride_validation import (
    FareDetails,
    GPSPoint,
    OutlierDetector,
    RideBooking,
    RideBookingValidator,
    RideState,
    RouteInfo,
)


class TestRideValidationIntegration(unittest.TestCase):
    """Integration tests for the complete ride validation system."""

    def setUp(self):
        """Set up test environment."""
        self.detector = OutlierDetector()
        self.validator = RideBookingValidator(detector=self.detector)
        self.base_time = datetime.now()

    def create_normal_telemetry(self, start_time: datetime) -> List[GPSPoint]:
        """Create normal GPS telemetry simulating a regular ride."""
        telemetry = []
        lat = 40.7128
        lng = -74.0060
        
        # Simulate 15-minute ride at ~30 km/h average
        for i in range(16):  # One point per minute
            telemetry.append(
                GPSPoint(
                    latitude=lat + (i * 0.002),  # ~0.22km per minute
                    longitude=lng + (i * 0.001),
                    timestamp=start_time + timedelta(minutes=i),
                    accuracy=15,
                    speed=25 + (i % 10),  # Varying speed 25-35 km/h
                )
            )
        return telemetry

    def create_anomalous_telemetry(self, start_time: datetime) -> List[GPSPoint]:
        """Create telemetry with GPS teleportation."""
        telemetry = self.create_normal_telemetry(start_time)
        
        # Insert a teleportation event
        telemetry[8] = GPSPoint(
            latitude=40.8128,  # Jump 0.1 degrees (~11km)
            longitude=-74.0060,
            timestamp=start_time + timedelta(minutes=8),
            accuracy=10,
        )
        
        return telemetry

    def test_happy_path_normal_ride(self):
        """Test validation of a completely normal ride."""
        booking = RideBooking(
            booking_id="HAPPY-001",
            passenger_id="P-HAPPY",
            driver_id="D-HAPPY",
            state=RideState.COMPLETED,
            created_at=self.base_time,
            accepted_at=self.base_time + timedelta(minutes=2),
            arrived_at=self.base_time + timedelta(minutes=8),
            started_at=self.base_time + timedelta(minutes=10),
            completed_at=self.base_time + timedelta(minutes=25),
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.3,
                distance_rate=1.8,
                surge_multiplier=1.0,
                tolls=0,
                upfront_quoted=29.5,  # 5 + (15 * 0.3) + (10 * 1.8) = 27.5 (within tolerance)
                final_paid=29.5,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=10.2,
                optimal_duration_minutes=15,
                actual_duration_minutes=15,
                waypoints=[],
                mid_trip_changes=[],
            ),
            telemetry=self.create_normal_telemetry(self.base_time + timedelta(minutes=10)),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                (RideState.ARRIVED, self.base_time + timedelta(minutes=8)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=25)),
            ],
        )

        result = self.validator.validate_ride(booking)

        # Assertions for happy path
        self.assertEqual(result.status, "SUCCESS")
        self.assertEqual(len(result.flags), 0)
        self.assertIn("upfront_pricing", result.passed_checks)
        self.assertIn("state_machine_integrity", result.passed_checks)
        self.assertIn("receipt_generation", result.passed_checks)
        self.assertEqual(len(result.failed_checks), 0)

    def test_gps_spoof_detection(self):
        """Test detection of GPS spoofing/teleportation."""
        booking = RideBooking(
            booking_id="SPOOF-001",
            passenger_id="P-SPOOF",
            driver_id="D-SPOOF",
            state=RideState.COMPLETED,
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.3,
                distance_rate=1.8,
                upfront_quoted=30,
                final_paid=30,
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=10.5,
                optimal_duration_minutes=15,
                actual_duration_minutes=15,
            ),
            telemetry=self.create_anomalous_telemetry(self.base_time),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=25)),
            ],
        )

        result = self.validator.validate_ride(booking)

        # Should complete but with telemetry anomaly flag
        self.assertEqual(result.status, "COMPLETED_WITH_FLAGS")
        self.assertTrue(result.has_anomalies)
        
        telemetry_flags = [f for f in result.flags if "TELEMETRY" in f.type.value]
        self.assertGreater(len(telemetry_flags), 0)
        self.assertEqual(telemetry_flags[0].severity, "CRITICAL")

    def test_detour_detection(self):
        """Test detection of excessive route deviation."""
        booking = RideBooking(
            booking_id="DETOUR-001",
            passenger_id="P-DETOUR",
            driver_id="D-DETOUR",
            state=RideState.COMPLETED,
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.3,
                distance_rate=1.8,
                upfront_quoted=30,
                final_paid=55,  # Much higher due to longer route
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=22,  # 2.2x optimal distance
                optimal_duration_minutes=15,
                actual_duration_minutes=35,
                mid_trip_changes=[],  # No destination change to justify detour
            ),
            telemetry=self.create_normal_telemetry(self.base_time),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=45)),
            ],
        )

        result = self.validator.validate_ride(booking)

        # Should flag route deviation
        self.assertEqual(result.status, "COMPLETED_WITH_FLAGS")
        
        route_flags = [f for f in result.flags if "ROUTE_DEV" in f.type.value]
        self.assertGreater(len(route_flags), 0)
        self.assertIn("CRITICAL", [f.severity for f in route_flags])
        
        # Should also flag fare mismatch
        fare_flags = [f for f in result.flags if "FARE" in f.type.value]
        self.assertGreater(len(fare_flags), 0)

    def test_multiple_anomalies(self):
        """Test detection of multiple simultaneous anomalies."""
        booking = RideBooking(
            booking_id="MULTI-001",
            passenger_id="P-MULTI",
            driver_id="D-MULTI",
            state=RideState.COMPLETED,
            created_at=self.base_time,
            accepted_at=self.base_time - timedelta(minutes=5),  # Before creation!
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.3,
                distance_rate=1.8,
                upfront_quoted=30,
                final_paid=60,  # 100% deviation
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=25,  # 2.5x deviation
                optimal_duration_minutes=15,
                actual_duration_minutes=45,
            ),
            telemetry=self.create_anomalous_telemetry(self.base_time),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=45)),  # Skip states
            ],
        )

        result = self.validator.validate_ride(booking)

        # Should detect multiple issues
        self.assertIn(result.status, ["FAILED", "COMPLETED_WITH_FLAGS"])
        self.assertGreater(len(result.flags), 3)  # At least 3 different anomalies
        
        # Check for different anomaly types
        anomaly_types = {f.type.value for f in result.flags}
        self.assertIn("TELEMETRY_ANOMALY", anomaly_types)
        self.assertIn("ROUTE_DEV_OUTLIER", anomaly_types)
        self.assertIn("FARE_MISMATCH", anomaly_types)

    def test_mid_trip_destination_change(self):
        """Test that mid-trip changes don't trigger false positives."""
        booking = RideBooking(
            booking_id="CHANGE-001",
            passenger_id="P-CHANGE",
            driver_id="D-CHANGE",
            state=RideState.COMPLETED,
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=5.0,
                time_rate=0.3,
                distance_rate=1.8,
                upfront_quoted=30,
                final_paid=50,  # Higher due to destination change
            ),
            route=RouteInfo(
                optimal_distance_km=10,
                actual_distance_km=20,  # Longer due to destination change
                optimal_duration_minutes=15,
                actual_duration_minutes=30,
                mid_trip_changes=["Passenger updated destination"],
            ),
            telemetry=self.create_normal_telemetry(self.base_time),
            state_transitions=[
                (RideState.REQUESTED, self.base_time),
                (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                (RideState.COMPLETED, self.base_time + timedelta(minutes=40)),
            ],
        )

        result = self.validator.validate_ride(booking)

        # Should not flag route deviation or fare mismatch due to destination change
        route_flags = [f for f in result.flags if "ROUTE_DEV" in f.type.value]
        fare_flags = [f for f in result.flags if "FARE" in f.type.value and f.severity == "CRITICAL"]
        
        self.assertEqual(len(route_flags), 0)
        self.assertEqual(len(fare_flags), 0)

    def test_batch_validation_mixed_results(self):
        """Test batch validation with mixed results."""
        bookings = [
            # Normal ride
            RideBooking(
                booking_id="BATCH-NORMAL",
                passenger_id="P1",
                state=RideState.COMPLETED,
                created_at=self.base_time,
                fare=FareDetails(
                    base_fare=5,
                    time_rate=0.3,
                    distance_rate=1.8,
                    upfront_quoted=30,
                    final_paid=30,
                ),
                route=RouteInfo(
                    optimal_distance_km=10,
                    actual_distance_km=10.5,
                    optimal_duration_minutes=15,
                    actual_duration_minutes=16,
                ),
                state_transitions=[
                    (RideState.REQUESTED, self.base_time),
                    (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                    (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                    (RideState.COMPLETED, self.base_time + timedelta(minutes=26)),
                ],
            ),
            # Ride with GPS anomaly
            RideBooking(
                booking_id="BATCH-GPS",
                passenger_id="P2",
                state=RideState.COMPLETED,
                created_at=self.base_time,
                fare=FareDetails(
                    base_fare=5,
                    time_rate=0.3,
                    distance_rate=1.8,
                    upfront_quoted=30,
                    final_paid=30,
                ),
                route=RouteInfo(
                    optimal_distance_km=10,
                    actual_distance_km=10,
                    optimal_duration_minutes=15,
                    actual_duration_minutes=15,
                ),
                telemetry=self.create_anomalous_telemetry(self.base_time),
                state_transitions=[
                    (RideState.REQUESTED, self.base_time),
                    (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                    (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                    (RideState.COMPLETED, self.base_time + timedelta(minutes=25)),
                ],
            ),
            # Ride with fare mismatch
            RideBooking(
                booking_id="BATCH-FARE",
                passenger_id="P3",
                state=RideState.COMPLETED,
                created_at=self.base_time,
                fare=FareDetails(
                    base_fare=5,
                    time_rate=0.3,
                    distance_rate=1.8,
                    upfront_quoted=30,
                    final_paid=50,  # Large deviation
                ),
                route=RouteInfo(
                    optimal_distance_km=10,
                    actual_distance_km=10,
                    optimal_duration_minutes=15,
                    actual_duration_minutes=15,
                ),
                state_transitions=[
                    (RideState.REQUESTED, self.base_time),
                    (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                    (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                    (RideState.COMPLETED, self.base_time + timedelta(minutes=25)),
                ],
            ),
        ]

        results = self.validator.validate_batch(bookings)

        # Verify all bookings were validated
        self.assertEqual(len(results), 3)
        
        # Check individual results
        self.assertEqual(results["BATCH-NORMAL"].status, "SUCCESS")
        self.assertEqual(results["BATCH-GPS"].status, "COMPLETED_WITH_FLAGS")
        self.assertEqual(results["BATCH-FARE"].status, "COMPLETED_WITH_FLAGS")
        
        # Verify specific flags
        self.assertTrue(any("TELEMETRY" in f.type.value for f in results["BATCH-GPS"].flags))
        self.assertTrue(any("FARE" in f.type.value for f in results["BATCH-FARE"].flags))


if __name__ == "__main__":
    unittest.main()
