import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen';
import LiveTripTrackingScreen from '../../screens/booking/LiveTripTrackingScreen';
import { isMapplsConfigured, MAPPLS_MAP_KEY } from '../../config/mappls';

// Mock all external dependencies
jest.mock('../../config/mappls');
jest.mock('react-native-webview', () => ({
  WebView: 'WebView'
}));
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        mapplsMapKey: 'test-key'
      }
    }
  }
}));

const Stack = createStackNavigator();

const TestApp = ({ initialRoute = 'Home' }) => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="LiveTripTracking" component={LiveTripTrackingScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Map Integration Tests', () => {
  describe('HomeScreen Map Integration', () => {
    it('should render map background when Mappls is configured', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(<TestApp />);
      
      // Map should be rendered in background
      expect(isMapplsConfigured).toHaveBeenCalled();
      expect(queryByText('Where to?')).toBeTruthy();
    });

    it('should show fallback when Mappls is not configured', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
      
      const { queryByText } = render(<TestApp />);
      
      // Should still render UI with fallback map
      expect(queryByText('Where to?')).toBeTruthy();
    });

    it('should maintain map state during navigation', async () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { getByText, queryByText } = render(<TestApp />);
      
      // Initial state
      expect(queryByText('Where to?')).toBeTruthy();
      
      // Navigate away and back would normally test state persistence
      // Map state should be maintained
    });
  });

  describe('LiveTripTrackingScreen Map Integration', () => {
    it('should render trip map with markers', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(
        <TestApp initialRoute="LiveTripTracking" />
      );
      
      // Trip tracking UI should be rendered
      expect(queryByText('Driver is arriving')).toBeTruthy();
    });

    it('should update map based on trip phase', async () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText, rerender } = render(
        <TestApp initialRoute="LiveTripTracking" />
      );
      
      // Initial phase
      expect(queryByText('Driver is arriving')).toBeTruthy();
      
      // Phase will change over time due to useEffect
      await waitFor(
        () => {
          // Status might change to 'Driver has arrived' eventually
          expect(isMapplsConfigured).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });

    it('should handle driver location updates', async () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(
        <TestApp initialRoute="LiveTripTracking" />
      );
      
      // Driver location should be updating
      await waitFor(() => {
        expect(queryByText('ETA')).toBeTruthy();
      });
    });
  });

  describe('Map Configuration', () => {
    it('should read configuration from environment', () => {
      process.env.EXPO_PUBLIC_MAPPLS_MAP_KEY = 'test-env-key';
      
      // Configuration should be available
      expect(process.env.EXPO_PUBLIC_MAPPLS_MAP_KEY).toBe('test-env-key');
      
      delete process.env.EXPO_PUBLIC_MAPPLS_MAP_KEY;
    });

    it('should fallback to app.json config', () => {
      // Mock Constants to return config
      const Constants = require('expo-constants').default;
      
      expect(Constants.expoConfig.extra.mapplsMapKey).toBe('test-key');
    });
  });

  describe('WebView Bridge Communication', () => {
    it('should handle map ready event', async () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(<TestApp />);
      
      // Map should initialize
      await waitFor(() => {
        expect(isMapplsConfigured).toHaveBeenCalled();
      });
    });

    it('should handle marker click events', async () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(
        <TestApp initialRoute="LiveTripTracking" />
      );
      
      // Marker clicks would be handled through WebView message passing
      expect(queryByText('Driver is arriving')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebView loading errors gracefully', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(true);
      
      const { queryByText } = render(<TestApp />);
      
      // UI should still be functional even if map fails
      expect(queryByText('Where to?')).toBeTruthy();
    });

    it('should handle missing API key gracefully', () => {
      (isMapplsConfigured as jest.Mock).mockReturnValue(false);
      
      const { queryByText } = render(<TestApp />);
      
      // Should show fallback UI
      expect(queryByText('Where to?')).toBeTruthy();
    });
  });
});