"""Core ride booking validation logic."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from ..logging_config import get_logger
from .detector import OutlierDetector
from .models import (
    AnomalyFlag,
    RideBooking,
    RideState,
    ValidationResult,
)

log = get_logger("devagent.ride_validation.validator")


class RideBookingValidator:
    """Validates ride booking lifecycle and detects anomalies."""

    def __init__(self, detector: Optional[OutlierDetector] = None):
        """Initialize validator with optional custom detector."""
        self.detector = detector or OutlierDetector()
        self.validation_checks = [
            self._check_upfront_pricing,
            self._check_state_machine_integrity,
            self._check_receipt_generation,
        ]

    def validate_ride(self, booking: RideBooking) -> ValidationResult:
        """Validate complete ride booking lifecycle."""
        log.info(f"Starting validation for booking {booking.booking_id}")

        result = ValidationResult(
            booking_id=booking.booking_id,
            validation_timestamp=datetime.now(),
        )

        # Run functional checks
        for check in self.validation_checks:
            check_name = check.__name__.replace("_check_", "")
            try:
                if check(booking):
                    result.passed_checks.append(check_name)
                else:
                    result.failed_checks.append(check_name)
            except Exception as e:
                log.error(f"Check {check_name} failed with error: {e}")
                result.failed_checks.append(check_name)

        # Run anomaly detection
        anomalies = self.detector.detect_all_anomalies(booking)
        result.flags.extend(anomalies)

        # Determine overall status
        if result.failed_checks:
            result.status = "FAILED"
        elif result.flags:
            if any(f.severity == "CRITICAL" for f in result.flags):
                result.status = "COMPLETED_WITH_FLAGS"
            else:
                result.status = "COMPLETED_WITH_FLAGS"
        else:
            result.status = "SUCCESS"

        # Add metrics
        result.metrics = self._calculate_metrics(booking, result)

        log.info(
            f"Validation complete for {booking.booking_id}: {result.status} "
            f"with {len(result.flags)} flags"
        )

        return result

    def validate_batch(
        self, bookings: List[RideBooking]
    ) -> Dict[str, ValidationResult]:
        """Validate multiple ride bookings."""
        results = {}
        for booking in bookings:
            try:
                results[booking.booking_id] = self.validate_ride(booking)
            except Exception as e:
                log.error(f"Failed to validate booking {booking.booking_id}: {e}")
                results[booking.booking_id] = ValidationResult(
                    booking_id=booking.booking_id,
                    status="FAILED",
                    validation_timestamp=datetime.now(),
                    failed_checks=["validation_error"],
                )
        return results

    def _check_upfront_pricing(self, booking: RideBooking) -> bool:
        """Verify upfront pricing matches baseline formula."""
        if not booking.fare.upfront_quoted:
            return False

        # Calculate expected fare using baseline formula
        if (
            booking.route.optimal_distance_km
            and booking.route.optimal_duration_minutes
        ):
            expected = booking.fare.calculate_base_fare(
                booking.route.optimal_duration_minutes,
                booking.route.optimal_distance_km,
            )

            # Allow 10% tolerance for rounding and estimation
            tolerance = expected * 0.1
            return abs(booking.fare.upfront_quoted - expected) <= tolerance

        return True  # Pass if we don't have enough data to verify

    def _check_state_machine_integrity(self, booking: RideBooking) -> bool:
        """Ensure ride transitions through states without hanging."""
        # For completed rides, check all required states were visited
        if booking.state == RideState.COMPLETED:
            required_states = {
                RideState.REQUESTED,
                RideState.ACCEPTED,
                RideState.IN_PROGRESS,
                RideState.COMPLETED,
            }
            visited_states = {state for state, _ in booking.state_transitions}
            return required_states.issubset(visited_states)

        # For cancelled rides, just check it started properly
        if booking.state == RideState.CANCELLED:
            return RideState.REQUESTED in {
                state for state, _ in booking.state_transitions
            }

        return True

    def _check_receipt_generation(self, booking: RideBooking) -> bool:
        """Confirm final payment matches upfront quote (excluding dynamic changes)."""
        if booking.state != RideState.COMPLETED:
            return True  # Only check completed rides

        if not booking.fare.final_paid:
            return False  # Completed ride must have final payment

        # If there were no mid-trip changes, payment should match quote closely
        if not booking.route.mid_trip_changes:
            deviation_percent = (
                abs(booking.fare.final_paid - booking.fare.upfront_quoted)
                / booking.fare.upfront_quoted
                * 100
            )
            return deviation_percent <= 5  # Allow 5% tolerance

        return True  # Pass if there were mid-trip changes

    def _calculate_metrics(self, booking: RideBooking, result: ValidationResult) -> dict:
        """Calculate validation metrics."""
        metrics = {
            "total_checks": len(result.passed_checks) + len(result.failed_checks),
            "passed_checks": len(result.passed_checks),
            "failed_checks": len(result.failed_checks),
            "anomaly_count": len(result.flags),
            "critical_anomalies": len(result.critical_anomalies),
        }

        # Add ride-specific metrics if available
        if booking.route.actual_distance_km and booking.route.optimal_distance_km:
            metrics["route_deviation_ratio"] = (
                booking.route.actual_distance_km / booking.route.optimal_distance_km
            )

        if booking.fare.final_paid and booking.fare.upfront_quoted:
            metrics["fare_deviation_percent"] = (
                abs(booking.fare.final_paid - booking.fare.upfront_quoted)
                / booking.fare.upfront_quoted
                * 100
            )

        # Calculate trip duration if available
        if booking.started_at and booking.completed_at:
            duration = (booking.completed_at - booking.started_at).total_seconds() / 60
            metrics["trip_duration_minutes"] = duration

        return metrics
