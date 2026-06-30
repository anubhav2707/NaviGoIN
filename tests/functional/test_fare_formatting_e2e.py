"""End-to-end functional tests for fare formatting feature."""

import json
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import pytest

from devagent.utils import format_fare


class RideSimulator:
    """Simulates a ride-hailing system for E2E testing."""
    
    def __init__(self):
        self.rides: List[Dict] = []
        self.current_ride: Optional[Dict] = None
    
    def start_ride(self, rider_id: str, driver_id: str, pickup: str, dropoff: str) -> Dict:
        """Start a new ride."""
        ride = {
            "id": f"RIDE-{len(self.rides) + 1:04d}",
            "rider_id": rider_id,
            "driver_id": driver_id,
            "pickup": pickup,
            "dropoff": dropoff,
            "start_time": datetime.now().isoformat(),
            "status": "in_progress",
            "fare_components": {}
        }
        self.current_ride = ride
        return ride
    
    def complete_ride(self, distance_km: float, duration_min: int) -> Dict:
        """Complete the current ride and calculate fare."""
        if not self.current_ride:
            raise ValueError("No active ride")
        
        # Base fare calculation
        base_fare = 40.0
        per_km = 12.0
        per_min = 1.5
        
        distance_charge = distance_km * per_km
        time_charge = duration_min * per_min
        subtotal = base_fare + distance_charge + time_charge
        
        # Apply taxes
        tax_rate = 0.18
        taxes = subtotal * tax_rate
        total = subtotal + taxes
        
        # Store fare components with formatting
        self.current_ride["fare_components"] = {
            "base_fare": format_fare(base_fare),
            "distance_charge": format_fare(distance_charge),
            "time_charge": format_fare(time_charge),
            "subtotal": format_fare(subtotal),
            "taxes": format_fare(taxes),
            "total": format_fare(total)
        }
        
        self.current_ride["status"] = "completed"
        self.current_ride["end_time"] = datetime.now().isoformat()
        self.current_ride["distance_km"] = distance_km
        self.current_ride["duration_min"] = duration_min
        
        self.rides.append(self.current_ride)
        completed_ride = self.current_ride
        self.current_ride = None
        
        return completed_ride
    
    def get_rider_history(self, rider_id: str) -> List[Dict]:
        """Get ride history for a rider."""
        return [r for r in self.rides if r["rider_id"] == rider_id]
    
    def get_driver_earnings(self, driver_id: str) -> Dict:
        """Calculate total earnings for a driver."""
        driver_rides = [r for r in self.rides if r["driver_id"] == driver_id]
        
        if not driver_rides:
            return {
                "driver_id": driver_id,
                "total_rides": 0,
                "total_earnings": format_fare(0),
                "rides": []
            }
        
        # Parse formatted fares back to calculate totals
        total = 0.0
        for ride in driver_rides:
            # Extract numeric value from formatted fare
            total_str = ride["fare_components"]["total"]
            # Remove ₹ symbol and convert to float
            total += float(total_str.replace("₹", ""))
        
        return {
            "driver_id": driver_id,
            "total_rides": len(driver_rides),
            "total_earnings": format_fare(total),
            "rides": driver_rides
        }


class TestFareFormattingE2E:
    """End-to-end tests for the fare formatting feature."""
    
    def test_complete_ride_booking_flow(self):
        """Test the complete ride booking and fare calculation flow."""
        simulator = RideSimulator()
        
        # Start a ride
        ride = simulator.start_ride(
            rider_id="RIDER-001",
            driver_id="DRIVER-001",
            pickup="Connaught Place, Delhi",
            dropoff="India Gate, Delhi"
        )
        
        assert ride["status"] == "in_progress"
        assert ride["rider_id"] == "RIDER-001"
        
        # Complete the ride
        completed = simulator.complete_ride(distance_km=8.5, duration_min=22)
        
        assert completed["status"] == "completed"
        assert completed["fare_components"]["base_fare"] == "₹40.00"
        assert completed["fare_components"]["distance_charge"] == "₹102.00"
        assert completed["fare_components"]["time_charge"] == "₹33.00"
        assert completed["fare_components"]["subtotal"] == "₹175.00"
        assert completed["fare_components"]["taxes"] == "₹31.50"
        assert completed["fare_components"]["total"] == "₹206.50"
    
    def test_multiple_rides_and_history(self):
        """Test handling multiple rides and viewing history."""
        simulator = RideSimulator()
        
        # Simulate multiple rides for the same rider
        rides_data = [
            (5.0, 15),   # Short ride
            (12.5, 30),  # Medium ride
            (20.0, 45),  # Long ride
        ]
        
        for distance, duration in rides_data:
            ride = simulator.start_ride(
                rider_id="RIDER-002",
                driver_id="DRIVER-002",
                pickup="Location A",
                dropoff="Location B"
            )
            simulator.complete_ride(distance_km=distance, duration_min=duration)
        
        # Get rider history
        history = simulator.get_rider_history("RIDER-002")
        
        assert len(history) == 3
        
        # Verify fare formatting in history
        assert history[0]["fare_components"]["total"] == "₹118.00"  # (40+60+22.5)*1.18
        assert history[1]["fare_components"]["total"] == "₹236.00"  # (40+150+45)*1.18
        assert history[2]["fare_components"]["total"] == "₹396.10"  # (40+240+67.5)*1.18
    
    def test_driver_earnings_summary(self):
        """Test driver earnings calculation with formatted fares."""
        simulator = RideSimulator()
        
        # Simulate rides for multiple drivers
        driver_rides = [
            ("DRIVER-003", [(6.0, 18), (8.0, 25), (10.0, 30)]),
            ("DRIVER-004", [(15.0, 35), (7.5, 20), (12.0, 28)])
        ]
        
        for driver_id, rides in driver_rides:
            for distance, duration in rides:
                ride = simulator.start_ride(
                    rider_id="RIDER-X",
                    driver_id=driver_id,
                    pickup="Pickup",
                    dropoff="Dropoff"
                )
                simulator.complete_ride(distance_km=distance, duration_min=duration)
        
        # Get earnings for first driver
        earnings1 = simulator.get_driver_earnings("DRIVER-003")
        assert earnings1["total_rides"] == 3
        assert earnings1["total_earnings"] == "₹489.00"  # Sum of all three rides
        
        # Get earnings for second driver
        earnings2 = simulator.get_driver_earnings("DRIVER-004")
        assert earnings2["total_rides"] == 3
        assert earnings2["total_earnings"] == "₹613.00"  # Sum of all three rides
        
        # Get earnings for non-existent driver
        earnings3 = simulator.get_driver_earnings("DRIVER-999")
        assert earnings3["total_rides"] == 0
        assert earnings3["total_earnings"] == "₹0.00"
    
    def test_fare_export_to_invoice(self):
        """Test exporting fare details to an invoice format."""
        simulator = RideSimulator()
        
        # Complete a ride
        ride = simulator.start_ride(
            rider_id="RIDER-005",
            driver_id="DRIVER-005",
            pickup="Saket, Delhi",
            dropoff="Hauz Khas, Delhi"
        )
        completed = simulator.complete_ride(distance_km=4.2, duration_min=12)
        
        # Generate invoice
        invoice = {
            "invoice_number": f"INV-{completed['id']}",
            "date": completed["end_time"],
            "rider_id": completed["rider_id"],
            "driver_id": completed["driver_id"],
            "trip_details": {
                "pickup": completed["pickup"],
                "dropoff": completed["dropoff"],
                "distance": f"{completed['distance_km']} km",
                "duration": f"{completed['duration_min']} minutes"
            },
            "fare_breakdown": completed["fare_components"],
            "payment_status": "pending"
        }
        
        # Export to JSON
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(invoice, f, indent=2)
            temp_path = f.name
        
        # Read back and verify
        with open(temp_path, 'r') as f:
            loaded_invoice = json.load(f)
        
        assert loaded_invoice["fare_breakdown"]["base_fare"] == "₹40.00"
        assert loaded_invoice["fare_breakdown"]["distance_charge"] == "₹50.40"
        assert loaded_invoice["fare_breakdown"]["time_charge"] == "₹18.00"
        assert loaded_invoice["fare_breakdown"]["total"] == "₹128.00"
        
        # Cleanup
        Path(temp_path).unlink()
    
    def test_surge_pricing_scenario(self):
        """Test fare formatting with surge pricing applied."""
        def calculate_fare_with_surge(distance_km: float, duration_min: int, surge_multiplier: float) -> Dict:
            """Calculate fare with surge pricing."""
            base_fare = 40.0
            per_km = 12.0
            per_min = 1.5
            
            distance_charge = distance_km * per_km
            time_charge = duration_min * per_min
            subtotal = base_fare + distance_charge + time_charge
            
            # Apply surge
            surged_subtotal = subtotal * surge_multiplier
            
            # Apply taxes on surged amount
            tax_rate = 0.18
            taxes = surged_subtotal * tax_rate
            total = surged_subtotal + taxes
            
            return {
                "base_calculation": {
                    "base_fare": format_fare(base_fare),
                    "distance_charge": format_fare(distance_charge),
                    "time_charge": format_fare(time_charge),
                    "subtotal": format_fare(subtotal)
                },
                "surge": {
                    "multiplier": f"{surge_multiplier}x",
                    "surged_subtotal": format_fare(surged_subtotal)
                },
                "final": {
                    "taxes": format_fare(taxes),
                    "total": format_fare(total)
                }
            }
        
        # Test different surge scenarios
        normal_fare = calculate_fare_with_surge(10.0, 25, 1.0)
        assert normal_fare["final"]["total"] == "₹224.00"
        
        moderate_surge = calculate_fare_with_surge(10.0, 25, 1.5)
        assert moderate_surge["surge"]["multiplier"] == "1.5x"
        assert moderate_surge["final"]["total"] == "₹336.00"
        
        high_surge = calculate_fare_with_surge(10.0, 25, 2.0)
        assert high_surge["surge"]["multiplier"] == "2.0x"
        assert high_surge["final"]["total"] == "₹448.00"
    
    def test_currency_consistency_across_system(self):
        """Test that currency formatting is consistent throughout the system."""
        # Test various fare amounts
        test_amounts = [
            0,      # Zero fare
            0.01,   # Minimum possible fare
            49.99,  # Just below 50
            50,     # Round number
            99.99,  # Maximum two-digit
            100,    # Three digits
            999.99, # Maximum three-digit
            1000,   # Four digits
            9999.99,  # Maximum four-digit
            10000,    # Five digits
        ]
        
        formatted_fares = [format_fare(amount) for amount in test_amounts]
        
        # All should start with ₹ symbol
        assert all(fare.startswith("₹") for fare in formatted_fares)
        
        # All should have exactly 2 decimal places
        for fare in formatted_fares:
            decimal_part = fare.split(".")[1] if "." in fare else ""
            assert len(decimal_part) == 2
        
        # Verify specific formats
        assert formatted_fares[0] == "₹0.00"
        assert formatted_fares[1] == "₹0.01"
        assert formatted_fares[2] == "₹49.99"
        assert formatted_fares[3] == "₹50.00"
        assert formatted_fares[4] == "₹99.99"
        assert formatted_fares[5] == "₹100.00"
        assert formatted_fares[6] == "₹999.99"
        assert formatted_fares[7] == "₹1000.00"
        assert formatted_fares[8] == "₹9999.99"
        assert formatted_fares[9] == "₹10000.00"


class TestFareFormattingBusinessRequirements:
    """Test that the fare formatting meets all business requirements from SCRUM-9."""
    
    def test_requirement_format_in_rupees(self):
        """Requirement: Format fare in Indian Rupees with ₹ symbol."""
        fare = format_fare(100)
        assert fare.startswith("₹")
        assert "₹" in fare
    
    def test_requirement_two_decimal_places(self):
        """Requirement: Round to 2 decimal places."""
        # Test exact two decimal places
        assert format_fare(100) == "₹100.00"
        assert format_fare(100.1) == "₹100.10"
        assert format_fare(100.99) == "₹100.99"
        
        # Test rounding
        assert format_fare(100.001) == "₹100.00"
        assert format_fare(100.005) == "₹100.00"
        assert format_fare(100.994) == "₹100.99"
        assert format_fare(100.995) == "₹101.00"
    
    def test_requirement_example_outputs(self):
        """Requirement: Specific examples from ticket."""
        # Example 1: formatFare(250) → "₹250.00"
        assert format_fare(250) == "₹250.00"
        
        # Example 2: formatFare(0) → "₹0.00"
        assert format_fare(0) == "₹0.00"
    
    def test_requirement_handles_edge_cases(self):
        """Additional requirement: Handle edge cases properly."""
        # Very large numbers
        assert format_fare(999999999.99) == "₹999999999.99"
        
        # Very small positive numbers
        assert format_fare(0.01) == "₹0.01"
        
        # Numbers that need rounding
        assert format_fare(123.456) == "₹123.46"
        assert format_fare(123.454) == "₹123.45"
        
        # Negative numbers (edge case)
        assert format_fare(-50) == "₹-50.00"
