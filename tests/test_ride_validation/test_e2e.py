"""End-to-end tests for ride booking validation scenarios."""

import json
import unittest
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from devagent.ride_validation import (
    FareDetails,
    GPSPoint,
    OutlierDetector,
    RideBooking,
    RideBookingValidator,
    RideState,
    RouteInfo,
    ValidationResult,
)


class TestE2ERideValidation(unittest.TestCase):
    """E2E tests covering the complete ride lifecycle validation."""

    def setUp(self):
        """Set up test environment."""
        self.validator = RideBookingValidator()
        self.base_time = datetime.now()

    def simulate_ride_lifecycle(
        self,
        booking_id: str,
        scenario: str = "normal",
    ) -> Tuple[RideBooking, ValidationResult]:
        """Simulate a complete ride lifecycle based on scenario."""
        
        # Base ride configuration
        booking = RideBooking(
            booking_id=booking_id,
            passenger_id="PASSENGER-E2E",
            driver_id="DRIVER-E2E",
            created_at=self.base_time,
            fare=FareDetails(
                base_fare=8.0,
                time_rate=0.35,
                distance_rate=2.0,
                surge_multiplier=1.0,
                tolls=0,
                upfront_quoted=38.25,  # 8 + (15 * 0.35) + (12.5 * 2) = 38.25
            ),
            route=RouteInfo(
                optimal_distance_km=12.5,
                optimal_duration_minutes=15,
            ),
        )

        # Apply scenario-specific modifications
        if scenario == "normal":
            self._apply_normal_scenario(booking)
        elif scenario == "gps_spoof":
            self._apply_gps_spoof_scenario(booking)
        elif scenario == "detour":
            self._apply_detour_scenario(booking)
        else:
            raise ValueError(f"Unknown scenario: {scenario}")

        # Run validation
        result = self.validator.validate_ride(booking)
        return booking, result

    def _apply_normal_scenario(self, booking: RideBooking) -> None:
        """Apply normal ride scenario."""
        # Normal state progression
        booking.add_state_transition(RideState.REQUESTED, self.base_time)
        booking.add_state_transition(
            RideState.ACCEPTED, self.base_time + timedelta(minutes=3)
        )
        booking.add_state_transition(
            RideState.ARRIVED, self.base_time + timedelta(minutes=8)
        )
        booking.add_state_transition(
            RideState.IN_PROGRESS, self.base_time + timedelta(minutes=9)
        )
        booking.add_state_transition(
            RideState.COMPLETED, self.base_time + timedelta(minutes=24)
        )

        # Normal route metrics
        booking.route.actual_distance_km = 12.8  # Slight variation
        booking.route.actual_duration_minutes = 15

        # Normal telemetry
        booking.telemetry = self._generate_normal_telemetry(
            self.base_time + timedelta(minutes=9), 15
        )

        # Normal fare
        booking.fare.final_paid = 38.50  # Very close to quoted

    def _apply_gps_spoof_scenario(self, booking: RideBooking) -> None:
        """Apply GPS spoofing scenario."""
        # Normal state progression
        booking.add_state_transition(RideState.REQUESTED, self.base_time)
        booking.add_state_transition(
            RideState.ACCEPTED, self.base_time + timedelta(minutes=2)
        )
        booking.add_state_transition(
            RideState.ARRIVED, self.base_time + timedelta(minutes=7)
        )
        booking.add_state_transition(
            RideState.IN_PROGRESS, self.base_time + timedelta(minutes=8)
        )
        booking.add_state_transition(
            RideState.COMPLETED, self.base_time + timedelta(minutes=23)
        )

        # Normal route metrics
        booking.route.actual_distance_km = 12.5
        booking.route.actual_duration_minutes = 15

        # Telemetry with 5km teleportation
        telemetry = self._generate_normal_telemetry(
            self.base_time + timedelta(minutes=8), 15
        )
        
        # Insert teleportation at minute 7 (mid-ride)
        telemetry[7] = GPSPoint(
            latitude=telemetry[6].latitude + 0.05,  # ~5.5km jump
            longitude=telemetry[6].longitude,
            timestamp=telemetry[6].timestamp + timedelta(minutes=1),
            accuracy=10,
        )
        booking.telemetry = telemetry

        # Normal fare despite GPS anomaly
        booking.fare.final_paid = 38.25

    def _apply_detour_scenario(self, booking: RideBooking) -> None:
        """Apply massive detour scenario."""
        # Extended state progression due to longer ride
        booking.add_state_transition(RideState.REQUESTED, self.base_time)
        booking.add_state_transition(
            RideState.ACCEPTED, self.base_time + timedelta(minutes=2)
        )
        booking.add_state_transition(
            RideState.ARRIVED, self.base_time + timedelta(minutes=7)
        )
        booking.add_state_transition(
            RideState.IN_PROGRESS, self.base_time + timedelta(minutes=8)
        )
        booking.add_state_transition(
            RideState.COMPLETED, self.base_time + timedelta(minutes=38)  # Much longer
        )

        # Excessive route metrics
        booking.route.actual_distance_km = 25.0  # 2x optimal!
        booking.route.actual_duration_minutes = 30  # 2x duration

        # Extended telemetry for longer ride
        booking.telemetry = self._generate_normal_telemetry(
            self.base_time + timedelta(minutes=8), 30
        )

        # Higher fare due to longer route
        booking.fare.final_paid = 68.0  # Much higher than quoted

    def _generate_normal_telemetry(
        self, start_time: datetime, duration_minutes: int
    ) -> List[GPSPoint]:
        """Generate normal GPS telemetry."""
        telemetry = []
        base_lat = 37.7749  # San Francisco
        base_lng = -122.4194
        
        for i in range(duration_minutes + 1):
            # Simulate movement at ~50 km/h average
            lat_delta = (i * 0.0015)  # Movement north
            lng_delta = (i * 0.0010)  # Movement east
            
            telemetry.append(
                GPSPoint(
                    latitude=base_lat + lat_delta,
                    longitude=base_lng + lng_delta,
                    timestamp=start_time + timedelta(minutes=i),
                    accuracy=12 + (i % 5),  # Varying accuracy 12-16m
                    speed=45 + (i % 20),  # Varying speed 45-65 km/h
                )
            )
        
        return telemetry

    def test_e2e_happy_path(self):
        """Test E2E validation: Normal ride with steady connectivity."""
        booking, result = self.simulate_ride_lifecycle(
            "E2E-HAPPY-001", scenario="normal"
        )

        # Verify successful validation
        self.assertEqual(result.status, "SUCCESS")
        self.assertEqual(len(result.flags), 0)
        
        # Verify all acceptance criteria
        self.assertIn("upfront_pricing", result.passed_checks)
        self.assertIn("state_machine_integrity", result.passed_checks)
        self.assertIn("receipt_generation", result.passed_checks)
        
        # Verify metrics
        self.assertLessEqual(result.metrics.get("route_deviation_ratio", 0), 1.1)
        self.assertLessEqual(result.metrics.get("fare_deviation_percent", 0), 5)

        # Log test result
        print(f"\n✅ Happy Path Test - Status: {result.status}, Flags: None")

    def test_e2e_gps_spoof(self):
        """Test E2E validation: GPS spoofing with 5km teleportation."""
        booking, result = self.simulate_ride_lifecycle(
            "E2E-SPOOF-001", scenario="gps_spoof"
        )

        # Verify ride completed but flagged
        self.assertEqual(result.status, "COMPLETED_WITH_FLAGS")
        
        # Verify telemetry anomaly detected
        telemetry_flags = [f for f in result.flags if "TELEMETRY" in f.type.value]
        self.assertGreater(len(telemetry_flags), 0)
        self.assertEqual(telemetry_flags[0].severity, "CRITICAL")
        
        # Verify other checks passed
        self.assertIn("state_machine_integrity", result.passed_checks)
        
        # Log test result
        print(
            f"\n✅ GPS Spoof Test - Status: {result.status}, "
            f"Flags: TELEMETRY_ANOMALY (CRITICAL)"
        )

    def test_e2e_detour(self):
        """Test E2E validation: Massive intentional detour."""
        booking, result = self.simulate_ride_lifecycle(
            "E2E-DETOUR-001", scenario="detour"
        )

        # Verify ride completed but flagged
        self.assertEqual(result.status, "COMPLETED_WITH_FLAGS")
        
        # Verify route deviation detected
        route_flags = [f for f in result.flags if "ROUTE_DEV" in f.type.value]
        self.assertGreater(len(route_flags), 0)
        self.assertIn(route_flags[0].severity, ["CRITICAL", "WARNING"])
        
        # Verify fare mismatch detected
        fare_flags = [f for f in result.flags if "FARE" in f.type.value]
        self.assertGreater(len(fare_flags), 0)
        
        # Verify metrics show deviation
        self.assertGreater(result.metrics.get("route_deviation_ratio", 0), 1.8)
        self.assertGreater(result.metrics.get("fare_deviation_percent", 0), 30)
        
        # Log test result
        print(
            f"\n✅ Detour Test - Status: {result.status}, "
            f"Flags: ROUTE_DEV_OUTLIER, FARE_MISMATCH"
        )

    def test_e2e_acceptance_criteria_coverage(self):
        """Verify all acceptance criteria are covered."""
        test_cases = [
            ("CRITERIA-PRICING", "normal"),
            ("CRITERIA-STATE", "normal"),
            ("CRITERIA-RECEIPT", "normal"),
            ("CRITERIA-TELEPORT", "gps_spoof"),
            ("CRITERIA-LOOP", "detour"),
        ]

        results_summary = []
        
        for booking_id, scenario in test_cases:
            booking, result = self.simulate_ride_lifecycle(booking_id, scenario)
            
            # Collect results
            results_summary.append({
                "booking_id": booking_id,
                "scenario": scenario,
                "status": result.status,
                "flags": [f.type.value for f in result.flags],
                "passed_checks": result.passed_checks,
                "failed_checks": result.failed_checks,
            })

        # Verify coverage
        print("\n📊 Acceptance Criteria Coverage Report:")
        print("="*50)
        
        # 1. Upfront Pricing
        pricing_verified = any(
            "upfront_pricing" in r["passed_checks"] 
            for r in results_summary
        )
        print(f"[{'✓' if pricing_verified else '✗'}] Upfront Pricing Verification")
        self.assertTrue(pricing_verified)
        
        # 2. State Machine Integrity
        state_verified = any(
            "state_machine_integrity" in r["passed_checks"] 
            for r in results_summary
        )
        print(f"[{'✓' if state_verified else '✗'}] State Machine Integrity")
        self.assertTrue(state_verified)
        
        # 3. Receipt Generation
        receipt_verified = any(
            "receipt_generation" in r["passed_checks"] 
            for r in results_summary
        )
        print(f"[{'✓' if receipt_verified else '✗'}] Receipt Generation")
        self.assertTrue(receipt_verified)
        
        # 4. Teleportation Outlier
        teleport_detected = any(
            "TELEMETRY_ANOMALY" in r["flags"] 
            for r in results_summary
        )
        print(f"[{'✓' if teleport_detected else '✗'}] GPS Teleportation Detection")
        self.assertTrue(teleport_detected)
        
        # 5. Route Deviation Outlier
        route_detected = any(
            "ROUTE_DEV_OUTLIER" in r["flags"] 
            for r in results_summary
        )
        print(f"[{'✓' if route_detected else '✗'}] Route Deviation Detection")
        self.assertTrue(route_detected)
        
        # 6. Fare Mismatch Outlier
        fare_detected = any(
            "FARE_MISMATCH" in r["flags"] 
            for r in results_summary
        )
        print(f"[{'✓' if fare_detected else '✗'}] Fare Mismatch Detection")
        self.assertTrue(fare_detected)
        
        print("="*50)
        print("✅ All acceptance criteria verified!")

    def test_e2e_performance_metrics(self):
        """Test validation performance with multiple rides."""
        import time
        
        # Generate batch of bookings
        bookings = []
        for i in range(100):
            scenario = ["normal", "gps_spoof", "detour"][i % 3]
            booking, _ = self.simulate_ride_lifecycle(f"PERF-{i:03d}", scenario)
            bookings.append(booking)
        
        # Measure validation performance
        start_time = time.time()
        results = self.validator.validate_batch(bookings)
        elapsed_time = time.time() - start_time
        
        # Performance assertions
        self.assertEqual(len(results), 100)
        self.assertLess(elapsed_time, 5.0)  # Should process 100 rides in < 5 seconds
        
        # Analyze results distribution
        status_counts = {}
        for result in results.values():
            status_counts[result.status] = status_counts.get(result.status, 0) + 1
        
        print(f"\n📈 Performance Test Results:")
        print(f"Processed {len(bookings)} rides in {elapsed_time:.2f} seconds")
        print(f"Average: {elapsed_time/len(bookings)*1000:.2f} ms per ride")
        print(f"Status distribution: {status_counts}")

    def test_e2e_edge_cases(self):
        """Test edge cases and boundary conditions."""
        edge_cases = [
            # Exactly at threshold (should not flag)
            {
                "id": "EDGE-THRESHOLD-EXACT",
                "route_deviation": 1.8,  # Exactly at threshold
                "fare_deviation": 30,  # Exactly at threshold
                "expected_flags": 0,
            },
            # Just below threshold (should not flag)
            {
                "id": "EDGE-THRESHOLD-BELOW",
                "route_deviation": 1.79,
                "fare_deviation": 29.9,
                "expected_flags": 0,
            },
            # Just above threshold (should flag)
            {
                "id": "EDGE-THRESHOLD-ABOVE",
                "route_deviation": 1.81,
                "fare_deviation": 30.1,
                "expected_flags": 2,
            },
        ]
        
        for case in edge_cases:
            booking = RideBooking(
                booking_id=case["id"],
                passenger_id="P-EDGE",
                state=RideState.COMPLETED,
                created_at=self.base_time,
                fare=FareDetails(
                    base_fare=10,
                    time_rate=0.5,
                    distance_rate=2,
                    upfront_quoted=100,
                    final_paid=100 * (1 + case["fare_deviation"] / 100),
                ),
                route=RouteInfo(
                    optimal_distance_km=20,
                    actual_distance_km=20 * case["route_deviation"],
                    optimal_duration_minutes=25,
                    actual_duration_minutes=25,
                ),
                state_transitions=[
                    (RideState.REQUESTED, self.base_time),
                    (RideState.ACCEPTED, self.base_time + timedelta(minutes=2)),
                    (RideState.IN_PROGRESS, self.base_time + timedelta(minutes=10)),
                    (RideState.COMPLETED, self.base_time + timedelta(minutes=35)),
                ],
            )
            
            result = self.validator.validate_ride(booking)
            
            # Filter to only deviation-related flags
            deviation_flags = [
                f for f in result.flags 
                if "ROUTE_DEV" in f.type.value or "FARE" in f.type.value
            ]
            
            print(
                f"\n{case['id']}: Expected {case['expected_flags']} flags, "
                f"Got {len(deviation_flags)}"
            )
            
            if case["expected_flags"] == 0:
                self.assertEqual(len(deviation_flags), 0)
            else:
                self.assertGreater(len(deviation_flags), 0)


if __name__ == "__main__":
    # Run with verbose output for acceptance criteria verification
    unittest.main(verbosity=2)
