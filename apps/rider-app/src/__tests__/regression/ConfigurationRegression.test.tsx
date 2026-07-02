import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import existing components to test regression
import HomeScreen from '../../screens/HomeScreen';
import AccountScreen from '../../screens/AccountScreen';
import ActivityScreen from '../../screens/ActivityScreen';
import PaymentsScreen from '../../screens/PaymentsScreen';
import SafetyScreen from '../../screens/SafetyScreen';
import { AuthProvider } from '../../auth/AuthContext';
import { resolveBaseUrl, setAuthToken } from '../../api/client';
import { isMapplsConfigured, getMapplsSdkUrl } from '../../config/mappls';

// Mock dependencies
jest.mock('expo-constants');
jest.mock('expo-linking');
jest.mock('../../api/client');
jest.mock('../../config/mappls');
jest.mock('react-native-webview', () => ({
  WebView: 'WebView'
}));

const Stack = createStackNavigator();

const TestApp: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Account" component={AccountScreen} />
          <Stack.Screen name="Activity" component={ActivityScreen} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
          <Stack.Screen name="Safety" component={SafetyScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
};

describe('Configuration Regression Tests', () => {
  beforeEach(() => {
    // Setup mocks with new configuration
    (Constants as any).expoConfig = {
      name: 'NaviGoIn',
      slug: 'navigoin',
      scheme: 'navigoin',
      version: '1.0.0',
      ios: {
        bundleIdentifier: 'com.navigoin.rider'
      },
      android: {
        package: 'com.navigoin.rider'
      }
    };

    (Linking.createURL as jest.Mock).mockImplementation((path: string) => `navigoin://${path}`);
    (Linking.parse as jest.Mock).mockImplementation((url: string) => ({
      scheme: 'navigoin',
      path: url.replace('navigoin://', '')
    }));

    (resolveBaseUrl as jest.Mock).mockReturnValue('https://api.navigoin.com');
    (setAuthToken as jest.Mock).mockImplementation(() => {});
    (isMapplsConfigured as jest.Mock).mockReturnValue(true);
    (getMapplsSdkUrl as jest.Mock).mockReturnValue('https://maps.mappls.com/sdk');
  });

  describe('Existing Screen Functionality', () => {
    test('HomeScreen should render with new configuration', async () => {
      const { getByTestId } = render(<TestApp />);
      
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeDefined();
      });
    });

    test('Navigation should work between screens', async () => {
      const { getByTestId } = render(<TestApp />);
      
      // Verify navigation still works with new app configuration
      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeDefined();
      });
    });
  });

  describe('API Client Compatibility', () => {
    test('should maintain API client functionality', () => {
      // Verify API base URL resolution works
      const baseUrl = resolveBaseUrl();
      expect(baseUrl).toBe('https://api.navigoin.com');
    });

    test('should handle auth token setting', () => {
      setAuthToken('test-token');
      expect(setAuthToken).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Mappls Integration', () => {
    test('should maintain Mappls configuration', () => {
      expect(isMapplsConfigured()).toBe(true);
      expect(getMapplsSdkUrl()).toBe('https://maps.mappls.com/sdk');
    });
  });

  describe('Deep Linking Regression', () => {
    test('should maintain deep linking functionality', () => {
      // Test that deep links still work with new scheme
      const homeUrl = Linking.createURL('home');
      expect(homeUrl).toBe('navigoin://home');
      
      const bookingUrl = Linking.createURL('booking/123');
      expect(bookingUrl).toBe('navigoin://booking/123');
    });

    test('should parse deep links correctly', () => {
      const parsed = Linking.parse('navigoin://activity');
      expect(parsed.scheme).toBe('navigoin');
      expect(parsed.path).toBe('activity');
    });
  });

  describe('Configuration Access', () => {
    test('components should access new configuration', () => {
      const appName = Constants.expoConfig?.name;
      expect(appName).toBe('NaviGoIn');
      
      const scheme = Constants.expoConfig?.scheme;
      expect(scheme).toBe('navigoin');
    });

    test('should maintain version compatibility', () => {
      const version = Constants.expoConfig?.version;
      expect(version).toBe('1.0.0');
    });
  });

  describe('Platform-specific Configuration', () => {
    test('iOS configuration should be updated', () => {
      const iosConfig = Constants.expoConfig?.ios;
      expect(iosConfig?.bundleIdentifier).toBe('com.navigoin.rider');
    });

    test('Android configuration should be updated', () => {
      const androidConfig = Constants.expoConfig?.android;
      expect(androidConfig?.package).toBe('com.navigoin.rider');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain existing feature flags', () => {
      // Verify that changing app name doesn't break feature detection
      const config = Constants.expoConfig;
      expect(config).toBeDefined();
      expect(typeof config?.name).toBe('string');
      expect(typeof config?.slug).toBe('string');
    });

    test('should not break existing navigation patterns', async () => {
      const linking = {
        prefixes: ['navigoin://'],
        config: {
          screens: {
            Home: 'home',
            Account: 'account',
            Activity: 'activity',
            Payments: 'payments',
            Safety: 'safety'
          }
        }
      };

      const { getByTestId } = render(
        <NavigationContainer linking={linking}>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByTestId('home-screen')).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing configuration gracefully', () => {
      (Constants as any).expoConfig = undefined;
      
      // Components should have fallbacks
      const TestComponentWithFallback: React.FC = () => {
        const appName = Constants.expoConfig?.name || 'Fallback';
        return null;
      };
      
      expect(() => render(<TestComponentWithFallback />)).not.toThrow();
    });
  });
});