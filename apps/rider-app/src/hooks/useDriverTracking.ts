import { useState, useEffect, useRef } from 'react';
import { LatLng, interpolateLatLng } from '../types/geo';
import { TripPhase } from '../components/TripMap';

interface UseDriverTrackingProps {
  phase: TripPhase;
  progress: number;
  pickupLocation?: LatLng;
  dropLocation?: LatLng;
  enabled?: boolean;
}

interface UseDriverTrackingResult {
  driverLocation: LatLng;
  routePath: LatLng[];
  eta: number; // in minutes
}

// Mock route coordinates for demo
const MOCK_ROUTES = {
  pickup: [
    { lat: 28.6200, lng: 77.2100 },
    { lat: 28.6180, lng: 77.2110 },
    { lat: 28.6160, lng: 77.2100 },
    { lat: 28.6140, lng: 77.2090 }
  ],
  trip: [
    { lat: 28.6140, lng: 77.2090 },
    { lat: 28.6120, lng: 77.2070 },
    { lat: 28.6100, lng: 77.2050 },
    { lat: 28.6080, lng: 77.2030 },
    { lat: 28.6050, lng: 77.2000 }
  ]
};

export function useDriverTracking({
  phase,
  progress,
  pickupLocation = MOCK_ROUTES.pickup[MOCK_ROUTES.pickup.length - 1],
  dropLocation = MOCK_ROUTES.trip[MOCK_ROUTES.trip.length - 1],
  enabled = true
}: UseDriverTrackingProps): UseDriverTrackingResult {
  const [driverLocation, setDriverLocation] = useState<LatLng>(
    MOCK_ROUTES.pickup[0]
  );
  const animationRef = useRef<NodeJS.Timeout>();

  // Generate route path based on phase
  const routePath = (() => {
    if (phase === 'pickup_arriving' || phase === 'pickup_reached') {
      return MOCK_ROUTES.pickup;
    } else {
      return MOCK_ROUTES.trip;
    }
  })();

  // Calculate ETA based on progress and phase
  const eta = (() => {
    if (phase === 'pickup_arriving') {
      return Math.max(1, Math.round((1 - progress) * 8));
    } else if (phase === 'trip_started') {
      return Math.max(1, Math.round((1 - progress) * 15));
    }
    return 0;
  })();

  useEffect(() => {
    if (!enabled) return;

    // Clear previous animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Animate driver location along the route
    const route = phase === 'pickup_arriving' || phase === 'pickup_reached'
      ? MOCK_ROUTES.pickup
      : MOCK_ROUTES.trip;

    if (route.length < 2) return;

    // Calculate position based on progress
    const totalSegments = route.length - 1;
    const currentSegmentFloat = progress * totalSegments;
    const currentSegment = Math.floor(currentSegmentFloat);
    const segmentProgress = currentSegmentFloat - currentSegment;

    if (currentSegment < totalSegments) {
      const start = route[currentSegment];
      const end = route[Math.min(currentSegment + 1, route.length - 1)];
      const interpolated = interpolateLatLng(start, end, segmentProgress);
      setDriverLocation(interpolated);
    } else {
      // At destination
      setDriverLocation(route[route.length - 1]);
    }

    // Smooth animation for continuous movement
    const animateMovement = () => {
      animationRef.current = setInterval(() => {
        // This would normally receive real-time updates from backend
        // For demo, we just interpolate based on progress
      }, 1000);
    };

    if (phase === 'pickup_arriving' || phase === 'trip_started') {
      animateMovement();
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [phase, progress, enabled, pickupLocation, dropLocation]);

  return {
    driverLocation,
    routePath,
    eta
  };
}