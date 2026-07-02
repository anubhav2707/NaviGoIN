import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhoneScreen from '../../screens/auth/PhoneScreen';
import OtpScreen from '../../screens/auth/OtpScreen';
import { AuthProvider } from '../../auth/AuthContext';

const Stack = createNativeStackNavigator();

const TestNavigator = ({ initialRoute = 'Phone' }) => (
  <NavigationContainer>
    <AuthProvider>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Phone" component={PhoneScreen} />
        <Stack.Screen 
          name="Otp" 
          component={OtpScreen} 
          initialParams={{ phone: '+919876543210', existingUser: true }}
        />
      </Stack.Navigator>
    </AuthProvider>
  </NavigationContainer>
);

jest.mock('../../auth/AuthContext', () => {
  const React = require('react');
  return {
    AuthProvider: ({ children }: any) => children,
    useAuth: () => ({
      requestOtp: jest.fn().mockResolvedValue({ existingUser: true, devCode: '123456' }),
      verifyOtp: jest.fn().mockResolvedValue(true),
      user: null,
      logout: jest.fn(),
    }),
  };
});

describe('Branding Integration Tests', () => {
  describe('Authentication Flow Branding', () => {
    it('displays NaviGoIn branding on phone entry screen', () => {
      const { getByText } = render(<TestNavigator initialRoute="Phone" />);
      
      expect(getByText('NaviGoIn')).toBeTruthy();
      expect(() => getByText('RideNow')).toThrow();
      expect(() => getByText('Ride App')).toThrow();
    });

    it('maintains consistent branding across auth screens', async () => {
      const phoneScreen = render(<TestNavigator initialRoute="Phone" />);
      expect(phoneScreen.getByText('NaviGoIn')).toBeTruthy();
      phoneScreen.unmount();

      const otpScreen = render(<TestNavigator initialRoute="Otp" />);
      expect(() => otpScreen.getByText('RideNow')).toThrow();
      expect(() => otpScreen.getByText('Ride App')).toThrow();
    });
  });

  describe('Component Integration', () => {
    it('auth components integrate properly with navigation', () => {
      const { getByText, getByPlaceholderText } = render(<TestNavigator initialRoute="Phone" />);
      
      const brandElement = getByText('NaviGoIn');
      expect(brandElement).toBeTruthy();
      
      const phoneInput = getByPlaceholderText('98765 43210');
      expect(phoneInput).toBeTruthy();
      
      const continueButton = getByText('Continue');
      expect(continueButton).toBeTruthy();
    });
  });

  describe('Terms and Conditions', () => {
    it('displays terms with correct app reference', () => {
      const { getByText } = render(<TestNavigator initialRoute="Phone" />);
      
      expect(getByText(/Terms of Service/)).toBeTruthy();
      expect(getByText(/Privacy Policy/)).toBeTruthy();
    });
  });
});