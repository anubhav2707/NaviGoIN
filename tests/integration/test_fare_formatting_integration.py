"""Integration tests for fare formatting functionality."""

import json
import tempfile
from pathlib import Path
from typing import Dict, List

import pytest

from devagent.utils import format_fare


class TestFareFormattingIntegration:
    """Integration tests for fare formatting with other components."""
    
    def test_fare_formatting_with_json_serialization(self):
        """Test that formatted fares can be properly serialized to JSON."""
        fare_data = {
            "ride_id": "RIDE-001",
            "base_fare": format_fare(150),
            "surge_charge": format_fare(25.50),
            "taxes": format_fare(18.75),
            "total": format_fare(194.25)
        }
        
        # Should serialize without issues
        json_data = json.dumps(fare_data)
        loaded_data = json.loads(json_data)
        
        assert loaded_data["base_fare"] == "₹150.00"
        assert loaded_data["surge_charge"] == "₹25.50"
        assert loaded_data["taxes"] == "₹18.75"
        assert loaded_data["total"] == "₹194.25"
    
    def test_fare_formatting_with_file_operations(self):
        """Test writing and reading formatted fares to/from files."""
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False) as f:
            fare_lines = [
                f"Base Fare: {format_fare(200)}",
                f"Distance Charge: {format_fare(45.75)}",
                f"Time Charge: {format_fare(12.25)}",
                f"Total: {format_fare(258)}"
            ]
            f.write("\n".join(fare_lines))
            temp_path = f.name
        
        # Read back and verify
        with open(temp_path, 'r') as f:
            content = f.read()
        
        assert "Base Fare: ₹200.00" in content
        assert "Distance Charge: ₹45.75" in content
        assert "Time Charge: ₹12.25" in content
        assert "Total: ₹258.00" in content
        
        # Cleanup
        Path(temp_path).unlink()
    
    def test_fare_calculations_with_formatting(self):
        """Test fare calculations integrated with formatting."""
        # Simulate a ride fare calculation
        base_rate = 50.0
        per_km_rate = 12.5
        per_min_rate = 2.0
        
        distance_km = 15.5
        time_minutes = 25
        
        # Calculate components
        base_fare = base_rate
        distance_charge = distance_km * per_km_rate
        time_charge = time_minutes * per_min_rate
        subtotal = base_fare + distance_charge + time_charge
        
        # Apply surge pricing (1.5x)
        surge_multiplier = 1.5
        surge_total = subtotal * surge_multiplier
        
        # Format all components
        fare_breakdown = {
            "base": format_fare(base_fare),
            "distance": format_fare(distance_charge),
            "time": format_fare(time_charge),
            "subtotal": format_fare(subtotal),
            "surge_multiplier": f"{surge_multiplier}x",
            "final_total": format_fare(surge_total)
        }
        
        assert fare_breakdown["base"] == "₹50.00"
        assert fare_breakdown["distance"] == "₹193.75"
        assert fare_breakdown["time"] == "₹50.00"
        assert fare_breakdown["subtotal"] == "₹293.75"
        assert fare_breakdown["final_total"] == "₹440.62"
    
    def test_batch_fare_processing(self):
        """Test processing multiple fares in batch operations."""
        # Simulate batch processing of multiple rides
        rides = [
            {"id": "R001", "amount": 125.50},
            {"id": "R002", "amount": 89.99},
            {"id": "R003", "amount": 256.75},
            {"id": "R004", "amount": 0},
            {"id": "R005", "amount": 1000.01}
        ]
        
        # Process and format all fares
        processed_rides = [
            {
                "ride_id": ride["id"],
                "formatted_fare": format_fare(ride["amount"]),
                "raw_amount": ride["amount"]
            }
            for ride in rides
        ]
        
        assert len(processed_rides) == 5
        assert processed_rides[0]["formatted_fare"] == "₹125.50"
        assert processed_rides[1]["formatted_fare"] == "₹89.99"
        assert processed_rides[2]["formatted_fare"] == "₹256.75"
        assert processed_rides[3]["formatted_fare"] == "₹0.00"
        assert processed_rides[4]["formatted_fare"] == "₹1000.01"
    
    def test_fare_aggregation_and_formatting(self):
        """Test aggregating multiple fares and formatting totals."""
        # Daily earnings aggregation
        daily_rides = [
            85.50, 120.00, 45.75, 200.00, 67.25,
            150.00, 95.50, 180.75, 55.00, 125.25
        ]
        
        total_earnings = sum(daily_rides)
        average_fare = total_earnings / len(daily_rides)
        min_fare = min(daily_rides)
        max_fare = max(daily_rides)
        
        summary = {
            "total_rides": len(daily_rides),
            "total_earnings": format_fare(total_earnings),
            "average_fare": format_fare(average_fare),
            "min_fare": format_fare(min_fare),
            "max_fare": format_fare(max_fare)
        }
        
        assert summary["total_rides"] == 10
        assert summary["total_earnings"] == "₹1125.00"
        assert summary["average_fare"] == "₹112.50"
        assert summary["min_fare"] == "₹45.75"
        assert summary["max_fare"] == "₹200.00"


class TestFareFormattingErrorHandling:
    """Test error handling in fare formatting integration scenarios."""
    
    def test_invalid_fare_types(self):
        """Test handling of invalid input types."""
        # Should handle string numbers
        assert format_fare(float("123.45")) == "₹123.45"
        
        # Test with very large numbers
        assert format_fare(1e10) == "₹10000000000.00"
        
        # Test with very small precision
        assert format_fare(0.001) == "₹0.00"
        assert format_fare(0.009) == "₹0.01"
    
    def test_fare_formatting_in_error_messages(self):
        """Test that formatted fares work correctly in error scenarios."""
        def validate_minimum_fare(amount: float, minimum: float = 50.0) -> Dict[str, any]:
            """Validate if fare meets minimum requirements."""
            if amount < minimum:
                return {
                    "valid": False,
                    "error": f"Fare {format_fare(amount)} is below minimum {format_fare(minimum)}",
                    "fare": format_fare(amount),
                    "minimum": format_fare(minimum)
                }
            return {
                "valid": True,
                "fare": format_fare(amount)
            }
        
        # Test validation with various amounts
        result1 = validate_minimum_fare(25.50)
        assert result1["valid"] is False
        assert "₹25.50" in result1["error"]
        assert "₹50.00" in result1["error"]
        
        result2 = validate_minimum_fare(75.00)
        assert result2["valid"] is True
        assert result2["fare"] == "₹75.00"
