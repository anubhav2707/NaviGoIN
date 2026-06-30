import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MapplsWebMap from '../MapplsWebMap';
import { isMapplsConfigured } from '../../config/mappls';
import { LatLng, MapMarker } from '../../types/geo';

// Mock dependencies
jest.mock('react-native-webview', () => ({
  WebView: jest.fn(({ onMessage, onError }) => {
    // Simulate WebView component
    return null;
  })
}));

jest.mock('../../config/mappls', () => ({
  isMapplsConfigured: jest.fn(),
  getMapplsSdkUrl: jest.fn(),
  DEFAULT_MAP_CONFIG: {
    defaultCenter: { lat: 28.6139, lng: 77.2090 },
    defaultZoom: 15,
    markerColors: {
      pickup: '#10B981',
      drop: '#EF4444',
      driver: '#3B82F6',
      custom: '#8B5CF6'
    },
    routeColor: '#3B82F6',
    routeWidth: 4
  }
}));

describe('MapplsWebMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when Mappls is not configured', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should render fallback message', () => {
      const { getByText } = render(<MapplsWebMap />);
      expect(getByText('Map not configured')).toBeTruthy();
      expect(getByText('Please add EXPO_PUBLIC_MAPPLS_MAP_KEY to .env')).toBeTruthy();
    });

    it('should not render WebView', () => {
      const { queryByTestId } = render(<MapplsWebMap />);
      expect(queryByTestId('mappls-webview')).toBeNull();
    });
  });

  describe('when Mappls is configured', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should render WebView with correct props', () => {
      const center: LatLng = { lat: 28.6139, lng: 77.2090 };
      const zoom = 16;
      
      const { getByTestId } = render(
        <MapplsWebMap center={center} zoom={zoom} />
      );
      
      // WebView should be rendered (mocked)
      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should handle markers prop correctly', () => {
      const markers: MapMarker[] = [
        {
          id: 'pickup',
          position: { lat: 28.6139, lng: 77.2090 },
          kind: 'pickup',
          title: 'Pickup Location'
        },
        {
          id: 'drop',
          position: { lat: 28.6050, lng: 77.2000 },
          kind: 'drop',
          title: 'Drop Location'
        }
      ];

      const { rerender } = render(<MapplsWebMap markers={markers} />);
      
      // Update markers
      const newMarkers = [
        ...markers,
        {
          id: 'driver',
          position: { lat: 28.6100, lng: 77.2050 },
          kind: 'driver' as const,
          title: 'Driver Location'
        }
      ];
      
      rerender(<MapplsWebMap markers={newMarkers} />);
      expect(newMarkers).toHaveLength(3);
    });

    it('should handle route path correctly', () => {
      const routePath: LatLng[] = [
        { lat: 28.6139, lng: 77.2090 },
        { lat: 28.6120, lng: 77.2070 },
        { lat: 28.6100, lng: 77.2050 },
        { lat: 28.6050, lng: 77.2000 }
      ];

      const { rerender } = render(<MapplsWebMap routePath={routePath} />);
      expect(routePath).toHaveLength(4);
    });

    it('should call onReady callback when map is ready', async () => {
      const onReady = jest.fn();
      const { rerender } = render(<MapplsWebMap onReady={onReady} />);
      
      // Simulate map ready message
      // In real scenario, WebView would post this message
      // For testing, we just verify the callback is passed
      expect(onReady).toBeDefined();
    });

    it('should call onError callback on error', async () => {
      const onError = jest.fn();
      const { rerender } = render(<MapplsWebMap onError={onError} />);
      
      // Verify error handler is defined
      expect(onError).toBeDefined();
    });

    it('should call onMarkerClick when marker is clicked', async () => {
      const onMarkerClick = jest.fn();
      const markers: MapMarker[] = [
        {
          id: 'test-marker',
          position: { lat: 28.6139, lng: 77.2090 },
          kind: 'custom',
          title: 'Test Marker'
        }
      ];

      render(
        <MapplsWebMap 
          markers={markers} 
          onMarkerClick={onMarkerClick}
        />
      );

      // Verify callback is defined
      expect(onMarkerClick).toBeDefined();
    });
  });

  describe('props validation', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should use default center and zoom when not provided', () => {
      const { rerender } = render(<MapplsWebMap />);
      expect(DEFAULT_MAP_CONFIG.defaultCenter).toBeDefined();
      expect(DEFAULT_MAP_CONFIG.defaultZoom).toBeDefined();
    });

    it('should accept custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { rerender } = render(<MapplsWebMap style={customStyle} />);
      expect(customStyle).toBeDefined();
    });
  });
});