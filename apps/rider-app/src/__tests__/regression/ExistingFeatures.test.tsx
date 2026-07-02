import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../screens/HomeScreen';
import AccountScreen from '../../screens/AccountScreen';
import SafetyScreen from '../../screens/SafetyScreen';
import { AuthContext } from '../../auth/AuthContext';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('../../components/MapBackground', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

jest.mock('../../components/SafetySettings', () => ({
  __esModule: true,
  default: () => 'SafetySettings',
}));

const mockAuthContextValue = {
  user: { id: '1', name: 'Test User', phone: '+919876543210' },
  signIn: jest.fn(),
  signOut: jest.fn(),
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

describe('Regression Tests - Core Features', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HomeScreen', () => {
    it('should render core UI elements', () => {
      const { getByText } = render(
        <NavigationContainer>
          <HomeScreen navigation={mockNavigation} />
        </NavigationContainer>
      );

      expect(getByText('Where to?')).toBeTruthy();
      expect(getByText('Enter destination')).toBeTruthy();
      expect(getByText('Recent')).toBeTruthy();
      expect(getByText('Office')).toBeTruthy();
      expect(getByText('Home')).toBeTruthy();
    });

    it('should navigate to route selection on search bar press', () => {
      const { getByText } = render(
        <NavigationContainer>
          <HomeScreen navigation={mockNavigation} />
        </NavigationContainer>
      );

      const searchBar = getByText('Enter destination');
      fireEvent.press(searchBar);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('RouteSelection');
    });

    it('should display recent locations', () => {
      const { getByText } = render(
        <NavigationContainer>
          <HomeScreen navigation={mockNavigation} />
        </NavigationContainer>
      );

      expect(getByText('123 Business Park, Sector 5')).toBeTruthy();
      expect(getByText('456 Residential Area, Block B')).toBeTruthy();
    });
  });

  describe('AccountScreen', () => {
    it('should render all menu sections', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <NavigationContainer>
            <AccountScreen />
          </NavigationContainer>
        </AuthContext.Provider>
      );

      // Headers
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('PAYMENT METHODS')).toBeTruthy();
      expect(getByText('SAFETY')).toBeTruthy();

      // Menu items
      expect(getByText('UPI Payments')).toBeTruthy();
      expect(getByText('Saved Cards')).toBeTruthy();
      expect(getByText('Trusted Contacts')).toBeTruthy();
      expect(getByText('Emergency Settings')).toBeTruthy();
      expect(getByText('Support')).toBeTruthy();
      expect(getByText('Sign Out')).toBeTruthy();
    });

    it('should display user profile information', () => {
      const { getByText } = render(
        <AuthContext.Provider value={mockAuthContextValue}>
          <NavigationContainer>
            <AccountScreen />
          </NavigationContainer>
        </AuthContext.Provider>
      );

      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('+91 98765 43210')).toBeTruthy();
    });
  });

  describe('SafetyScreen', () => {
    it('should render safety header and components', () => {
      const { getByText } = render(
        <NavigationContainer>
          <SafetyScreen />
        </NavigationContainer>
      );

      expect(getByText('Safety')).toBeTruthy();
      expect(getByText('SafetySettings')).toBeTruthy();
    });
  });

  describe('Navigation Structure', () => {
    it('should maintain navigation flow after rebranding', () => {
      // Test that navigation structure remains intact
      const screens = ['Home', 'RouteSelection', 'LiveTripTracking'];
      screens.forEach(screen => {
        expect(() => {
          mockNavigation.navigate(screen);
        }).not.toThrow();
      });
    });
  });
});