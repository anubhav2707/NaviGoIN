"""End-to-end tests for clamp function in real-world scenarios."""

from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from unittest.mock import Mock, patch

import pytest

from devagent.utils import clamp


@dataclass
class ProcessingMetrics:
    """Metrics for a processing operation."""
    items_processed: int
    success_rate: float
    processing_time: float
    memory_usage: float


class TestClampRealWorldScenarios:
    """E2E tests simulating real-world usage of clamp."""

    def test_api_rate_limiting_scenario(self):
        """Simulate API rate limiting with clamp."""
        class APIRateLimiter:
            def __init__(self, max_requests_per_second: float = 10.0):
                self.max_rps = max_requests_per_second
                self.request_times = []
            
            def can_make_request(self) -> bool:
                """Check if we can make a request within rate limits."""
                now = time.time()
                # Clean old requests
                self.request_times = [
                    t for t in self.request_times if now - t < 1.0
                ]
                
                # Calculate current rate
                current_rate = len(self.request_times)
                # Use clamp to ensure we don't exceed limits
                allowed_rate = clamp(current_rate + 1, 0, self.max_rps)
                
                if allowed_rate > current_rate:
                    self.request_times.append(now)
                    return True
                return False
            
            def get_delay_needed(self) -> float:
                """Get delay needed before next request."""
                if len(self.request_times) < self.max_rps:
                    return 0.0
                
                oldest = min(self.request_times)
                time_passed = time.time() - oldest
                delay_needed = 1.0 - time_passed
                
                # Clamp delay to reasonable bounds
                return clamp(delay_needed, 0.0, 1.0)
        
        # Test rate limiter
        limiter = APIRateLimiter(max_requests_per_second=5)
        
        # Should allow first 5 requests
        for _ in range(5):
            assert limiter.can_make_request() is True
        
        # 6th request should be denied
        assert limiter.can_make_request() is False
        
        # Delay should be between 0 and 1
        delay = limiter.get_delay_needed()
        assert 0.0 <= delay <= 1.0

    def test_data_processing_pipeline(self):
        """Simulate data processing pipeline with clamped parameters."""
        class DataProcessor:
            def __init__(self):
                self.batch_size = 100
                self.worker_threads = 4
                self.memory_limit_mb = 1024
            
            def process_dataset(self, data: list, config: dict) -> ProcessingMetrics:
                """Process dataset with clamped configuration."""
                # Apply safe limits to configuration
                safe_batch_size = int(clamp(
                    config.get("batch_size", self.batch_size),
                    1, 1000
                ))
                safe_workers = int(clamp(
                    config.get("workers", self.worker_threads),
                    1, 16
                ))
                safe_memory = clamp(
                    config.get("memory_mb", self.memory_limit_mb),
                    128, 4096
                )
                
                # Simulate processing
                total_items = len(data)
                batches = (total_items + safe_batch_size - 1) // safe_batch_size
                
                # Calculate metrics
                processing_time = batches / safe_workers * 0.1  # Simulated time
                memory_per_item = safe_memory / safe_batch_size
                success_rate = clamp(1.0 - (memory_per_item / 100), 0.5, 1.0)
                
                return ProcessingMetrics(
                    items_processed=total_items,
                    success_rate=success_rate,
                    processing_time=processing_time,
                    memory_usage=safe_memory
                )
        
        processor = DataProcessor()
        test_data = list(range(1000))
        
        # Test with various configurations
        configs = [
            {"batch_size": 50, "workers": 8, "memory_mb": 512},
            {"batch_size": 0, "workers": 0, "memory_mb": 0},  # Invalid, will be clamped
            {"batch_size": 10000, "workers": 100, "memory_mb": 10000},  # Too high
        ]
        
        for config in configs:
            metrics = processor.process_dataset(test_data, config)
            assert metrics.items_processed == 1000
            assert 0.5 <= metrics.success_rate <= 1.0
            assert metrics.processing_time > 0
            assert 128 <= metrics.memory_usage <= 4096

    def test_resource_allocation_system(self):
        """Simulate resource allocation with clamping."""
        class ResourceManager:
            def __init__(self, total_cpu: int = 100, total_memory: int = 8192):
                self.total_cpu = total_cpu
                self.total_memory = total_memory
                self.allocations = {}
            
            def allocate(self, service: str, cpu: float, memory: float) -> dict:
                """Allocate resources with clamping to available limits."""
                # Calculate already allocated resources
                allocated_cpu = sum(a["cpu"] for a in self.allocations.values())
                allocated_memory = sum(a["memory"] for a in self.allocations.values())
                
                # Calculate available resources
                available_cpu = self.total_cpu - allocated_cpu
                available_memory = self.total_memory - allocated_memory
                
                # Clamp requested resources to available limits
                safe_cpu = clamp(cpu, 0, available_cpu)
                safe_memory = clamp(memory, 0, available_memory)
                
                # Apply minimum resource guarantees
                safe_cpu = clamp(safe_cpu, 1, self.total_cpu) if safe_cpu > 0 else 0
                safe_memory = clamp(safe_memory, 64, self.total_memory) if safe_memory > 0 else 0
                
                allocation = {"cpu": safe_cpu, "memory": safe_memory}
                if safe_cpu > 0 and safe_memory > 0:
                    self.allocations[service] = allocation
                
                return allocation
            
            def get_usage_percentage(self) -> dict:
                """Get resource usage as percentages."""
                total_cpu_used = sum(a["cpu"] for a in self.allocations.values())
                total_memory_used = sum(a["memory"] for a in self.allocations.values())
                
                return {
                    "cpu": clamp((total_cpu_used / self.total_cpu) * 100, 0, 100),
                    "memory": clamp((total_memory_used / self.total_memory) * 100, 0, 100)
                }
        
        manager = ResourceManager()
        
        # Allocate resources for different services
        web = manager.allocate("web", 30, 2048)
        assert web["cpu"] == 30
        assert web["memory"] == 2048
        
        api = manager.allocate("api", 40, 3000)
        assert api["cpu"] == 40
        assert api["memory"] == 3000
        
        # Try to allocate more than available
        db = manager.allocate("db", 50, 4000)
        assert db["cpu"] == 30  # Only 30 CPU left
        assert db["memory"] == 3144  # Only 3144 memory left
        
        # Check usage percentages
        usage = manager.get_usage_percentage()
        assert usage["cpu"] == 100.0
        assert usage["memory"] == 100.0

    def test_load_balancer_simulation(self):
        """Simulate load balancer with clamped distribution."""
        class LoadBalancer:
            def __init__(self, servers: list[str]):
                self.servers = servers
                self.server_loads = {s: 0.0 for s in servers}
                self.max_load = 100.0
            
            def route_request(self, load_size: float) -> str | None:
                """Route request to server with capacity."""
                # Clamp load size to reasonable bounds
                safe_load = clamp(load_size, 0.1, 50.0)
                
                # Find server with lowest load
                sorted_servers = sorted(
                    self.servers,
                    key=lambda s: self.server_loads[s]
                )
                
                for server in sorted_servers:
                    current_load = self.server_loads[server]
                    new_load = current_load + safe_load
                    
                    # Check if server can handle load
                    if new_load <= self.max_load:
                        self.server_loads[server] = new_load
                        return server
                
                return None  # All servers at capacity
            
            def balance_load(self):
                """Rebalance load across servers."""
                total_load = sum(self.server_loads.values())
                avg_load = total_load / len(self.servers)
                
                # Clamp average to max load
                target_load = clamp(avg_load, 0, self.max_load)
                
                for server in self.servers:
                    # Gradually move toward target
                    current = self.server_loads[server]
                    diff = target_load - current
                    adjustment = clamp(diff * 0.1, -10, 10)  # Gradual adjustment
                    self.server_loads[server] = clamp(
                        current + adjustment,
                        0,
                        self.max_load
                    )
        
        # Test load balancer
        lb = LoadBalancer(["server1", "server2", "server3"])
        
        # Route multiple requests
        requests = [10, 20, 30, 25, 15, 40, 35]
        routed = []
        
        for req in requests:
            server = lb.route_request(req)
            if server:
                routed.append((req, server))
        
        assert len(routed) == 7  # All requests routed
        
        # Check load distribution
        for server, load in lb.server_loads.items():
            assert 0 <= load <= 100
        
        # Test rebalancing
        lb.balance_load()
        loads_after = list(lb.server_loads.values())
        assert all(30 <= l <= 70 for l in loads_after)  # More balanced

    def test_cache_management_system(self):
        """Simulate cache management with clamped parameters."""
        class CacheManager:
            def __init__(self, max_size_mb: int = 100):
                self.max_size = max_size_mb
                self.cache = {}
                self.access_counts = {}
                self.sizes = {}
            
            def add_item(self, key: str, data: Any, size_mb: float) -> bool:
                """Add item to cache with size constraints."""
                # Clamp item size
                safe_size = clamp(size_mb, 0.001, self.max_size * 0.5)  # Max 50% of cache
                
                # Check if we have space
                current_size = sum(self.sizes.values())
                if current_size + safe_size > self.max_size:
                    # Evict least recently used items
                    self._evict_lru(safe_size)
                
                self.cache[key] = data
                self.sizes[key] = safe_size
                self.access_counts[key] = 0
                return True
            
            def _evict_lru(self, needed_space: float):
                """Evict least recently used items."""
                sorted_items = sorted(
                    self.access_counts.items(),
                    key=lambda x: x[1]
                )
                
                freed_space = 0
                for key, _ in sorted_items:
                    if freed_space >= needed_space:
                        break
                    freed_space += self.sizes[key]
                    del self.cache[key]
                    del self.sizes[key]
                    del self.access_counts[key]
            
            def get_item(self, key: str) -> Any:
                """Get item and update access count."""
                if key in self.cache:
                    # Clamp access count to prevent overflow
                    self.access_counts[key] = clamp(
                        self.access_counts[key] + 1,
                        0,
                        1000000
                    )
                    return self.cache[key]
                return None
            
            def get_hit_rate(self, hits: int, misses: int) -> float:
                """Calculate cache hit rate."""
                total = hits + misses
                if total == 0:
                    return 0.0
                return clamp(hits / total, 0.0, 1.0)
        
        # Test cache manager
        cache = CacheManager(max_size_mb=10)
        
        # Add items
        items = [
            ("item1", "data1", 2.0),
            ("item2", "data2", 3.0),
            ("item3", "data3", 4.0),
            ("item4", "data4", 5.0),  # This will cause eviction
        ]
        
        for key, data, size in items:
            cache.add_item(key, data, size)
        
        # Check cache state
        assert len(cache.cache) <= 3  # Some items evicted
        assert sum(cache.sizes.values()) <= 10  # Within size limit
        
        # Test access and hit rate
        hits = 0
        misses = 0
        
        test_keys = ["item2", "item3", "item4", "item1", "item5"]
        for key in test_keys:
            if cache.get_item(key) is not None:
                hits += 1
            else:
                misses += 1
        
        hit_rate = cache.get_hit_rate(hits, misses)
        assert 0.0 <= hit_rate <= 1.0


class TestClampBusinessRequirements:
    """Test that clamp meets specific business requirements."""

    def test_financial_calculation_bounds(self):
        """Test financial calculations with regulatory bounds."""
        class FinancialCalculator:
            # Regulatory limits
            MIN_INTEREST_RATE = 0.0
            MAX_INTEREST_RATE = 30.0  # Legal maximum APR
            MIN_LOAN_AMOUNT = 100.0
            MAX_LOAN_AMOUNT = 1000000.0
            MIN_TERM_MONTHS = 1
            MAX_TERM_MONTHS = 360  # 30 years
            
            @staticmethod
            def calculate_loan_payment(
                principal: float,
                annual_rate: float,
                term_months: int
            ) -> float:
                """Calculate monthly loan payment with clamped parameters."""
                # Apply regulatory limits
                safe_principal = clamp(
                    principal,
                    FinancialCalculator.MIN_LOAN_AMOUNT,
                    FinancialCalculator.MAX_LOAN_AMOUNT
                )
                safe_rate = clamp(
                    annual_rate,
                    FinancialCalculator.MIN_INTEREST_RATE,
                    FinancialCalculator.MAX_INTEREST_RATE
                )
                safe_term = int(clamp(
                    term_months,
                    FinancialCalculator.MIN_TERM_MONTHS,
                    FinancialCalculator.MAX_TERM_MONTHS
                ))
                
                # Calculate payment
                if safe_rate == 0:
                    return safe_principal / safe_term
                
                monthly_rate = safe_rate / 100 / 12
                payment = safe_principal * (
                    monthly_rate * (1 + monthly_rate) ** safe_term
                ) / ((1 + monthly_rate) ** safe_term - 1)
                
                return payment
        
        calc = FinancialCalculator()
        
        # Test normal calculation
        payment1 = calc.calculate_loan_payment(10000, 5.0, 60)
        assert payment1 > 0
        
        # Test with out-of-bounds inputs
        payment2 = calc.calculate_loan_payment(50, 50.0, 500)
        assert payment2 > 0  # Still calculated with clamped values
        
        # Test edge cases
        payment3 = calc.calculate_loan_payment(100, 0, 12)
        assert payment3 == 100 / 12  # Zero interest

    def test_user_input_sanitization(self):
        """Test user input sanitization with clamp."""
        class FormValidator:
            @staticmethod
            def validate_age(age: Any) -> int:
                """Validate and clamp age input."""
                try:
                    age_num = float(age)
                except (TypeError, ValueError):
                    return 18  # Default
                
                return int(clamp(age_num, 0, 150))
            
            @staticmethod
            def validate_quantity(qty: Any) -> int:
                """Validate and clamp quantity input."""
                try:
                    qty_num = float(qty)
                except (TypeError, ValueError):
                    return 1  # Default
                
                return int(clamp(qty_num, 1, 999))
            
            @staticmethod
            def validate_percentage(pct: Any) -> float:
                """Validate and clamp percentage input."""
                try:
                    pct_num = float(pct)
                except (TypeError, ValueError):
                    return 0.0  # Default
                
                return clamp(pct_num, 0.0, 100.0)
        
        validator = FormValidator()
        
        # Test various user inputs
        test_cases = [
            (validator.validate_age, [
                ("25", 25),
                ("200", 150),
                ("-5", 0),
                ("abc", 18),
                (None, 18),
            ]),
            (validator.validate_quantity, [
                ("10", 10),
                ("1000", 999),
                ("0", 1),
                ("invalid", 1),
            ]),
            (validator.validate_percentage, [
                ("50", 50.0),
                ("150", 100.0),
                ("-10", 0.0),
                ("50.5", 50.5),
            ]),
        ]
        
        for validator_func, inputs in test_cases:
            for input_val, expected in inputs:
                assert validator_func(input_val) == expected

    def test_performance_monitoring(self):
        """Test performance monitoring with clamped metrics."""
        class PerformanceMonitor:
            def __init__(self):
                self.metrics = []
            
            def record_metric(self, name: str, value: float, unit: str):
                """Record performance metric with bounds."""
                bounds = {
                    "response_time_ms": (0, 10000),
                    "cpu_percent": (0, 100),
                    "memory_percent": (0, 100),
                    "error_rate": (0, 1),
                    "throughput_rps": (0, 100000),
                }
                
                min_val, max_val = bounds.get(name, (0, float("inf")))
                safe_value = clamp(value, min_val, max_val)
                
                self.metrics.append({
                    "name": name,
                    "value": safe_value,
                    "unit": unit,
                    "timestamp": time.time()
                })
            
            def get_health_score(self) -> float:
                """Calculate overall health score."""
                if not self.metrics:
                    return 100.0
                
                recent_metrics = self.metrics[-100:]  # Last 100 metrics
                
                # Calculate scores for different metrics
                scores = []
                for metric in recent_metrics:
                    if metric["name"] == "response_time_ms":
                        # Lower is better, normalize and invert
                        score = 100 * (1 - metric["value"] / 10000)
                    elif metric["name"] == "error_rate":
                        # Lower is better, normalize and invert
                        score = 100 * (1 - metric["value"])
                    elif metric["name"] == "cpu_percent":
                        # Lower is better, normalize and invert
                        score = 100 * (1 - metric["value"] / 100)
                    else:
                        score = 50  # Neutral score for unknown metrics
                    
                    scores.append(clamp(score, 0, 100))
                
                if scores:
                    avg_score = sum(scores) / len(scores)
                    return clamp(avg_score, 0, 100)
                return 100.0
        
        monitor = PerformanceMonitor()
        
        # Simulate recording metrics
        monitor.record_metric("response_time_ms", 150, "ms")
        monitor.record_metric("cpu_percent", 45, "%")
        monitor.record_metric("memory_percent", 60, "%")
        monitor.record_metric("error_rate", 0.02, "ratio")
        monitor.record_metric("throughput_rps", 5000, "rps")
        
        # Test with out-of-bounds values
        monitor.record_metric("response_time_ms", 20000, "ms")  # Clamped to 10000
        monitor.record_metric("cpu_percent", 150, "%")  # Clamped to 100
        monitor.record_metric("error_rate", 2.5, "ratio")  # Clamped to 1
        
        # Check health score
        health = monitor.get_health_score()
        assert 0 <= health <= 100
        
        # Verify all metrics are within bounds
        for metric in monitor.metrics:
            assert metric["value"] >= 0
            if metric["name"] == "cpu_percent":
                assert metric["value"] <= 100
            elif metric["name"] == "error_rate":
                assert metric["value"] <= 1
