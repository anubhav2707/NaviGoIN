import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../../auth/AuthContext';
import AppNavigator from '../../navigation/AppNavigator';
import AuthNavigator from '../../navigation/AuthNavigator';

// Mock native modules
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

describe('App Branding Integration', () => {
  const mockAuthContextValue = {
    user: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
    requestOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  it('should display NaviGoIn branding in auth flow', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AuthNavigator />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    // PhoneScreen is the initial screen in AuthNavigator
    expect(getByText('NaviGoIn')).toBeTruthy();
  });

  it('should use NaviGoIn in legal text', () => {
    const { getByText } = render(
      <NavigationContainer>
        <AuthContext.Provider value={mockAuthContextValue}>
          <AuthNavigator />
        </AuthContext.Provider>
      </NavigationContainer>
    );

    expect(getByText(/By continuing, you agree to NaviGoIn's/)).toBeTruthy();
  });

  it('should maintain consistent branding across navigation', () => {
    const authenticatedContext = {
      ...mockAuthContextValue,
      user: { id: '1', name: 'Test User', phone: '+919876543210' },
    };

    const { getByText } = render(
      <AuthContext.Provider value={authenticatedContext}>
        <AppNavigator />
      </AuthContext.Provider>
    );

    // The app should render RootNavigator when user is authenticated
    // Account tab should show version with NaviGoIn
    expect(() => getByText(/NaviGoIn/)).not.toThrow();
  });
});