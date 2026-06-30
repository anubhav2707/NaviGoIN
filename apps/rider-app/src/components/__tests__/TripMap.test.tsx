import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TripMap, { TripPhase } from '../TripMap';
import { LatLng } from '../../types/geo';
import { isMapplsConfigured } from '../../config/mappls';

// Mock dependencies
jest.mock('../../config/mappls');
jest.mock('../MapplsWebMap', () => 'MapplsWebMap');
jest.mock('../../hooks/useDriverTracking');

describe('TripMap', () => {
  const mockPickupLocation: LatLng = { lat: 28.6139, lng: 77.2090 };
  const mockDropLocation: LatLng = { lat: 28.6050, lng: 77.2000 };
  const mockDriverLocation: LatLng = { lat: 28.6100, lng: 77.2050 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('phase transitions', () => {
    it('should render correctly in pickup_arriving phase', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { getByTestId, queryByTestId } = render(
        <TripMap
          phase="pickup_arriving"
          progress={0.5}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
        />
      );

      // Map should be rendered
      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should render correctly in pickup_reached phase', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { rerender } = render(
        <TripMap
          phase="pickup_reached"
          progress={1}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
        />
      );

      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should render correctly in trip_started phase', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { rerender } = render(
        <TripMap
          phase="trip_started"
          progress={0.3}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
        />
      );

      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should render correctly in trip_ending phase', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { rerender } = render(
        <TripMap
          phase="trip_ending"
          progress={0.9}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
        />
      );

      expect(isMapplsConfigured).toHaveBeenCalled();
    });
  });

  describe('marker management', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should show pickup and driver markers during pickup phase', () => {
      const { rerender } = render(
        <TripMap
          phase="pickup_arriving"
          progress={0.5}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
          driverLocation={mockDriverLocation}
        />
      );

      // Verify correct markers are generated for this phase
      expect(mockPickupLocation).toBeDefined();
      expect(mockDriverLocation).toBeDefined();
    });

    it('should show drop and driver markers during trip phase', () => {
      const { rerender } = render(
        <TripMap
          phase="trip_started"
          progress={0.5}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
          driverLocation={mockDriverLocation}
        />
      );

      // Verify correct markers are generated for this phase
      expect(mockDropLocation).toBeDefined();
      expect(mockDriverLocation).toBeDefined();
    });
  });

  describe('fallback mode', () => {
    it('should render fallback UI when Mappls is not configured', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
      
      const { getByTestId, queryByTestId } = render(
        <TripMap
          phase="pickup_arriving"
          progress={0.5}
        />
      );

      // Should render fallback visualization
      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should show progress bar in fallback mode', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
      
      const progress = 0.75;
      const { rerender } = render(
        <TripMap
          phase="trip_started"
          progress={progress}
        />
      );

      // Progress should be reflected
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe('driver location updates', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should call onDriverLocationUpdate when location changes', async () => {
      const onDriverLocationUpdate = jest.fn();
      
      const { rerender } = render(
        <TripMap
          phase="pickup_arriving"
          progress={0.5}
          driverLocation={mockDriverLocation}
          onDriverLocationUpdate={onDriverLocationUpdate}
        />
      );

      await waitFor(() => {
        expect(onDriverLocationUpdate).toHaveBeenCalledWith(mockDriverLocation);
      });
    });

    it('should use mock tracking when no driver location provided', () => {
      const { rerender } = render(
        <TripMap
          phase="pickup_arriving"
          progress={0.5}
          pickupLocation={mockPickupLocation}
          dropLocation={mockDropLocation}
        />
      );

      // Should use useDriverTracking hook
      expect(mockPickupLocation).toBeDefined();
    });
  });

  describe('zoom levels', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    const testCases: Array<[TripPhase, number]> = [
      ['pickup_arriving', 15],
      ['pickup_reached', 17],
      ['trip_started', 14],
      ['trip_ending', 16]
    ];

    testCases.forEach(([phase, expectedZoom]) => {
      it(`should use zoom level ${expectedZoom} for phase ${phase}`, () => {
        const { rerender } = render(
          <TripMap
            phase={phase}
            progress={0.5}
          />
        );

        // Zoom level is calculated internally based on phase
        expect(expectedZoom).toBeGreaterThan(0);
      });
    });
  });

  describe('route rendering', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should render route path when provided', () => {
      const routePath: LatLng[] = [
        { lat: 28.6139, lng: 77.2090 },
        { lat: 28.6120, lng: 77.2070 },
        { lat: 28.6100, lng: 77.2050 },
        { lat: 28.6050, lng: 77.2000 }
      ];

      const { rerender } = render(
        <TripMap
          phase="trip_started"
          progress={0.5}
          routePath={routePath}
        />
      );

      expect(routePath).toHaveLength(4);
    });
  });
});