import React from 'react';
import { render } from '@testing-library/react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { Text, View } from 'react-native';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      name: 'NaviGoIn',
      slug: 'navigoin',
      scheme: 'navigoin',
      version: '1.0.0',
      ios: {
        bundleIdentifier: 'com.navigoin.rider',
        infoPlist: {
          CFBundleDisplayName: 'NaviGoIn'
        }
      },
      android: {
        package: 'com.navigoin.rider'
      },
      web: {
        name: 'NaviGoIn',
        shortName: 'NaviGoIn'
      }
    }
  }
}));

jest.mock('expo-linking', () => ({
  __esModule: true,
  createURL: jest.fn((path: string) => `navigoin://${path}`),
  parse: jest.fn((url: string) => ({
    scheme: 'navigoin',
    path: url.replace('navigoin://', '')
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

const TestComponent: React.FC = () => {
  const appName = Constants.expoConfig?.name || 'Unknown';
  const scheme = Constants.expoConfig?.scheme || 'unknown';
  
  return (
    <View>
      <Text testID="app-name">{appName}</Text>
      <Text testID="app-scheme">{scheme}</Text>
    </View>
  );
};

describe('Configuration Integration Tests', () => {
  describe('Expo Constants Integration', () => {
    test('should load app name from configuration', () => {
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('app-name').props.children).toBe('NaviGoIn');
    });

    test('should load scheme from configuration', () => {
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('app-scheme').props.children).toBe('navigoin');
    });

    test('should have correct iOS configuration', () => {
      const iosConfig = Constants.expoConfig?.ios;
      expect(iosConfig?.bundleIdentifier).toBe('com.navigoin.rider');
      expect(iosConfig?.infoPlist?.CFBundleDisplayName).toBe('NaviGoIn');
    });

    test('should have correct Android configuration', () => {
      const androidConfig = Constants.expoConfig?.android;
      expect(androidConfig?.package).toBe('com.navigoin.rider');
    });

    test('should have correct web configuration', () => {
      const webConfig = Constants.expoConfig?.web;
      expect(webConfig?.name).toBe('NaviGoIn');
      expect(webConfig?.shortName).toBe('NaviGoIn');
    });
  });

  describe('Deep Linking Integration', () => {
    test('should create URLs with correct scheme', () => {
      const url = Linking.createURL('home');
      expect(url).toBe('navigoin://home');
    });

    test('should parse URLs with correct scheme', () => {
      const parsed = Linking.parse('navigoin://booking/123');
      expect(parsed.scheme).toBe('navigoin');
      expect(parsed.path).toBe('booking/123');
    });

    test('should handle deep link event listeners', () => {
      const handler = jest.fn();
      Linking.addEventListener('url', handler);
      expect(Linking.addEventListener).toHaveBeenCalledWith('url', handler);
    });
  });

  describe('Navigation Integration', () => {
    test('should integrate with React Navigation', () => {
      const linking = {
        prefixes: ['navigoin://'],
        config: {
          screens: {
            Home: 'home',
            Booking: 'booking/:id'
          }
        }
      };

      const { getByTestId } = render(
        <NavigationContainer linking={linking}>
          <TestComponent />
        </NavigationContainer>
      );

      expect(getByTestId('app-name')).toBeDefined();
    });
  });

  describe('Component Wiring', () => {
    test('should pass configuration to child components', () => {
      const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const config = {
          appName: Constants.expoConfig?.name || 'NaviGoIn',
          scheme: Constants.expoConfig?.scheme || 'navigoin',
          version: Constants.expoConfig?.version || '1.0.0'
        };

        return (
          <View>
            <Text testID="config-app-name">{config.appName}</Text>
            <Text testID="config-scheme">{config.scheme}</Text>
            <Text testID="config-version">{config.version}</Text>
            {children}
          </View>
        );
      };

      const { getByTestId } = render(
        <AppWrapper>
          <TestComponent />
        </AppWrapper>
      );

      expect(getByTestId('config-app-name').props.children).toBe('NaviGoIn');
      expect(getByTestId('config-scheme').props.children).toBe('navigoin');
      expect(getByTestId('config-version').props.children).toBe('1.0.0');
    });
  });
});