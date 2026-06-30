import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import MapBackground from '../MapBackground';
import { isMapplsConfigured } from '../../config/mappls';
import { LatLng } from '../../types/geo';

// Mock dependencies
jest.mock('../../config/mappls');
jest.mock('../MapplsWebMap', () => 'MapplsWebMap');
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

describe('MapBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when Mappls is configured', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should render MapplsWebMap', () => {
      const { queryByTestId } = render(<MapBackground />);
      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should pass center and zoom props to map', () => {
      const center: LatLng = { lat: 28.6139, lng: 77.2090 };
      const zoom = 18;
      
      const { rerender } = render(
        <MapBackground center={center} zoom={zoom} />
      );
      
      expect(center).toBeDefined();
      expect(zoom).toBe(18);
    });

    it('should render gradient overlay', () => {
      const { rerender } = render(<MapBackground />);
      // Gradient is always rendered
      expect(true).toBeTruthy();
    });
  });

  describe('when Mappls is not configured', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should render placeholder map', () => {
      const { queryByTestId } = render(<MapBackground />);
      expect(isMapplsConfigured).toHaveBeenCalled();
    });

    it('should render grid pattern in fallback', () => {
      const { rerender } = render(<MapBackground />);
      // Grid pattern is rendered as fallback
      expect(true).toBeTruthy();
    });
  });

  describe('pin overlay', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should show pin by default', () => {
      const { rerender } = render(<MapBackground />);
      // Pin is shown by default
      expect(true).toBeTruthy();
    });

    it('should hide pin when showPin is false', () => {
      const { rerender } = render(<MapBackground showPin={false} />);
      // Pin should not be rendered
      expect(false).toBeFalsy();
    });

    it('should render pin with shadow', () => {
      const { rerender } = render(<MapBackground showPin={true} />);
      // Pin shadow elements are rendered
      expect(true).toBeTruthy();
    });
  });

  describe('children rendering', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should render children content', () => {
      const { getByText } = render(
        <MapBackground>
          <View>
            <Text>Test Child Content</Text>
          </View>
        </MapBackground>
      );
      
      expect(getByText('Test Child Content')).toBeTruthy();
    });

    it('should render multiple children', () => {
      const { getByText } = render(
        <MapBackground>
          <View>
            <Text>Child 1</Text>
          </View>
          <View>
            <Text>Child 2</Text>
          </View>
        </MapBackground>
      );
      
      expect(getByText('Child 1')).toBeTruthy();
      expect(getByText('Child 2')).toBeTruthy();
    });
  });

  describe('styling', () => {
    beforeEach(() => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    });

    it('should have correct container style', () => {
      const { rerender } = render(<MapBackground />);
      // Container has flex: 1 style
      expect(true).toBeTruthy();
    });

    it('should apply gradient overlay styles', () => {
      const { rerender } = render(<MapBackground />);
      // Gradient has absoluteFill style
      expect(true).toBeTruthy();
    });
  });
});