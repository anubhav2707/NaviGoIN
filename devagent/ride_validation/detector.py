"""Outlier and anomaly detection for ride bookings."""

from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from ..logging_config import get_logger
from .models import (
    AnomalyFlag,
    AnomalyType,
    GPSPoint,
    RideBooking,
    RideState,
)

log = get_logger("devagent.ride_validation.detector")


class OutlierDetector:
    """Detects outliers and anomalies in ride data."""

    # Configurable thresholds
    MAX_VELOCITY_KMH = 150  # Maximum realistic velocity
    ROUTE_DEVIATION_FACTOR = 1.8  # Max actual/optimal distance ratio
    FARE_DEVIATION_PERCENT = 30  # Max fare deviation without changes
    GPS_TELEPORT_THRESHOLD_KM = 5  # Sudden jump threshold
    MIN_GPS_ACCURACY_M = 500  # Minimum acceptable GPS accuracy

    def detect_telemetry_anomalies(
        self, telemetry: List[GPSPoint]
    ) -> List[AnomalyFlag]:
        """Detect GPS teleportation and unrealistic movement."""
        flags = []

        if len(telemetry) < 2:
            return flags

        for i in range(1, len(telemetry)):
            prev_point = telemetry[i - 1]
            curr_point = telemetry[i]

            # Calculate distance and velocity
            distance_km = self._calculate_distance(prev_point, curr_point)
            time_delta = (curr_point.timestamp - prev_point.timestamp).total_seconds()

            if time_delta > 0:
                velocity_kmh = (distance_km / time_delta) * 3600

                # Check for teleportation (GPS jumps)
                if velocity_kmh > self.MAX_VELOCITY_KMH:
                    flags.append(
                        AnomalyFlag(
                            type=AnomalyType.TELEMETRY_ANOMALY,
                            severity="CRITICAL",
                            description=f"GPS teleportation detected: {velocity_kmh:.1f} km/h between points",
                            detected_at=datetime.now(),
                            evidence={
                                "velocity_kmh": velocity_kmh,
                                "distance_km": distance_km,
                                "time_seconds": time_delta,
                                "from_point": {
                                    "lat": prev_point.latitude,
                                    "lng": prev_point.longitude,
                                    "time": prev_point.timestamp.isoformat(),
                                },
                                "to_point": {
                                    "lat": curr_point.latitude,
                                    "lng": curr_point.longitude,
                                    "time": curr_point.timestamp.isoformat(),
                                },
                            },
                            confidence=0.95,
                        )
                    )
                    log.warning(
                        f"Teleportation detected: {velocity_kmh:.1f} km/h at index {i}"
                    )

                # Check for sudden jumps even at lower velocities
                elif (
                    distance_km > self.GPS_TELEPORT_THRESHOLD_KM
                    and time_delta < 60
                ):  # Within 1 minute
                    flags.append(
                        AnomalyFlag(
                            type=AnomalyType.TELEMETRY_ANOMALY,
                            severity="WARNING",
                            description=f"Sudden GPS jump of {distance_km:.1f} km detected",
                            detected_at=datetime.now(),
                            evidence={
                                "jump_distance_km": distance_km,
                                "time_seconds": time_delta,
                            },
                            confidence=0.85,
                        )
                    )

            # Check GPS accuracy
            if curr_point.accuracy > self.MIN_GPS_ACCURACY_M:
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.TELEMETRY_ANOMALY,
                        severity="INFO",
                        description=f"Poor GPS accuracy: {curr_point.accuracy}m",
                        detected_at=datetime.now(),
                        evidence={"accuracy_meters": curr_point.accuracy},
                        confidence=0.7,
                    )
                )

        return flags

    def detect_route_deviation(self, booking: RideBooking) -> List[AnomalyFlag]:
        """Detect excessive route deviations (infinite loop pattern)."""
        flags = []

        if (
            booking.route.actual_distance_km is None
            or booking.route.optimal_distance_km <= 0
        ):
            return flags

        deviation_ratio = (
            booking.route.actual_distance_km / booking.route.optimal_distance_km
        )

        if deviation_ratio > self.ROUTE_DEVIATION_FACTOR:
            # Check if there were mid-trip changes that could explain the deviation
            has_destination_change = any(
                "destination" in change.lower()
                for change in booking.route.mid_trip_changes
            )

            if not has_destination_change:
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.ROUTE_DEV_OUTLIER,
                        severity="CRITICAL" if deviation_ratio > 2.5 else "WARNING",
                        description=f"Excessive route deviation: {deviation_ratio:.2f}x optimal distance",
                        detected_at=datetime.now(),
                        evidence={
                            "optimal_distance_km": booking.route.optimal_distance_km,
                            "actual_distance_km": booking.route.actual_distance_km,
                            "deviation_ratio": deviation_ratio,
                            "mid_trip_changes": booking.route.mid_trip_changes,
                        },
                        confidence=0.9,
                    )
                )
                log.warning(
                    f"Route deviation for {booking.booking_id}: {deviation_ratio:.2f}x"
                )

        # Also check time deviation
        if (
            booking.route.actual_duration_minutes is not None
            and booking.route.optimal_duration_minutes > 0
        ):
            time_deviation_ratio = (
                booking.route.actual_duration_minutes
                / booking.route.optimal_duration_minutes
            )

            if time_deviation_ratio > 2.0 and not has_destination_change:
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.TIME_ANOMALY,
                        severity="WARNING",
                        description=f"Excessive trip duration: {time_deviation_ratio:.2f}x expected",
                        detected_at=datetime.now(),
                        evidence={
                            "optimal_duration_min": booking.route.optimal_duration_minutes,
                            "actual_duration_min": booking.route.actual_duration_minutes,
                            "deviation_ratio": time_deviation_ratio,
                        },
                        confidence=0.85,
                    )
                )

        return flags

    def detect_fare_mismatch(self, booking: RideBooking) -> List[AnomalyFlag]:
        """Detect significant fare discrepancies."""
        flags = []

        if booking.fare.final_paid is None:
            return flags

        # Calculate deviation from upfront quote
        deviation = abs(booking.fare.final_paid - booking.fare.upfront_quoted)
        deviation_percent = (deviation / booking.fare.upfront_quoted) * 100

        # Check if deviation exceeds threshold
        if deviation_percent > self.FARE_DEVIATION_PERCENT:
            # Check for mid-trip changes that could justify the deviation
            has_destination_change = any(
                "destination" in change.lower()
                for change in booking.route.mid_trip_changes
            )

            if not has_destination_change:
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.FARE_MISMATCH,
                        severity="CRITICAL" if deviation_percent > 50 else "WARNING",
                        description=f"Fare mismatch: {deviation_percent:.1f}% deviation from quote",
                        detected_at=datetime.now(),
                        evidence={
                            "upfront_quoted": booking.fare.upfront_quoted,
                            "final_paid": booking.fare.final_paid,
                            "deviation": deviation,
                            "deviation_percent": deviation_percent,
                            "has_surge": booking.fare.surge_multiplier > 1.0,
                            "tolls": booking.fare.tolls,
                            "mid_trip_changes": booking.route.mid_trip_changes,
                        },
                        confidence=0.95,
                    )
                )
                log.warning(
                    f"Fare mismatch for {booking.booking_id}: {deviation_percent:.1f}% deviation"
                )

        # Also validate against calculated fare if we have the data
        if (
            booking.route.actual_distance_km is not None
            and booking.route.actual_duration_minutes is not None
        ):
            calculated_fare = booking.fare.calculate_base_fare(
                booking.route.actual_duration_minutes,
                booking.route.actual_distance_km,
            )
            calc_deviation = abs(booking.fare.final_paid - calculated_fare)
            calc_deviation_percent = (calc_deviation / calculated_fare) * 100

            if calc_deviation_percent > 40:  # Higher threshold for calculated fare
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.FARE_MISMATCH,
                        severity="INFO",
                        description=f"Fare differs from calculated: {calc_deviation_percent:.1f}% deviation",
                        detected_at=datetime.now(),
                        evidence={
                            "calculated_fare": calculated_fare,
                            "final_paid": booking.fare.final_paid,
                            "deviation_percent": calc_deviation_percent,
                        },
                        confidence=0.7,
                    )
                )

        return flags

    def detect_state_violations(self, booking: RideBooking) -> List[AnomalyFlag]:
        """Detect invalid state transitions or timing issues."""
        flags = []

        # Check state transition order
        expected_order = [
            RideState.REQUESTED,
            RideState.ACCEPTED,
            RideState.ARRIVED,
            RideState.IN_PROGRESS,
            RideState.COMPLETED,
        ]

        if booking.state_transitions:
            states = [state for state, _ in booking.state_transitions]

            # Check for backwards transitions
            for i in range(1, len(states)):
                prev_idx = expected_order.index(states[i - 1]) if states[i - 1] in expected_order else -1
                curr_idx = expected_order.index(states[i]) if states[i] in expected_order else -1

                if curr_idx < prev_idx and states[i] != RideState.CANCELLED:
                    flags.append(
                        AnomalyFlag(
                            type=AnomalyType.STATE_VIOLATION,
                            severity="CRITICAL",
                            description=f"Invalid state transition: {states[i-1]} -> {states[i]}",
                            detected_at=datetime.now(),
                            evidence={
                                "from_state": states[i - 1].value,
                                "to_state": states[i].value,
                                "transition_index": i,
                            },
                            confidence=1.0,
                        )
                    )

        # Check timing consistency
        if booking.accepted_at and booking.created_at:
            if booking.accepted_at < booking.created_at:
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.TIME_ANOMALY,
                        severity="CRITICAL",
                        description="Ride accepted before it was created",
                        detected_at=datetime.now(),
                        evidence={
                            "created_at": booking.created_at.isoformat(),
                            "accepted_at": booking.accepted_at.isoformat(),
                        },
                        confidence=1.0,
                    )
                )

        # Check for unrealistic wait times
        if booking.accepted_at and booking.arrived_at:
            wait_time = (booking.arrived_at - booking.accepted_at).total_seconds() / 60
            if wait_time > 60:  # More than 1 hour to arrive
                flags.append(
                    AnomalyFlag(
                        type=AnomalyType.TIME_ANOMALY,
                        severity="WARNING",
                        description=f"Excessive driver arrival time: {wait_time:.1f} minutes",
                        detected_at=datetime.now(),
                        evidence={"wait_time_minutes": wait_time},
                        confidence=0.8,
                    )
                )

        return flags

    def detect_all_anomalies(self, booking: RideBooking) -> List[AnomalyFlag]:
        """Run all anomaly detection checks."""
        all_flags = []

        # Run all detectors
        all_flags.extend(self.detect_telemetry_anomalies(booking.telemetry))
        all_flags.extend(self.detect_route_deviation(booking))
        all_flags.extend(self.detect_fare_mismatch(booking))
        all_flags.extend(self.detect_state_violations(booking))

        # Sort by severity (CRITICAL > WARNING > INFO)
        severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
        all_flags.sort(key=lambda f: severity_order.get(f.severity, 3))

        return all_flags

    @staticmethod
    def _calculate_distance(point1: GPSPoint, point2: GPSPoint) -> float:
        """Calculate distance between two GPS points using Haversine formula."""
        R = 6371  # Earth's radius in kilometers

        lat1, lon1 = math.radians(point1.latitude), math.radians(point1.longitude)
        lat2, lon2 = math.radians(point2.latitude), math.radians(point2.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))

        return R * c
