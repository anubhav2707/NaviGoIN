import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../../navigation/RootNavigator';
import { AuthProvider } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext', () => ({
  ...jest.requireActual('../../auth/AuthContext'),
  useAuth: () => ({
    user: { id: '1', name: 'Test Driver', phone: '+919876543210', role: 'driver' },
    signOut: jest.fn(),
  }),
}));

const renderWithNavigation = () => {
  return render(
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

describe('Navigation Integration', () => {
  it('renders main tabs correctly', () => {
    const { getByText } = renderWithNavigation();
    
    // Check tab labels
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Earnings')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('navigates between tabs', () => {
    const { getByText } = renderWithNavigation();
    
    // Start on Home tab
    expect(getByText('You are Offline')).toBeTruthy();
    
    // Navigate to Earnings
    fireEvent.press(getByText('Earnings'));
    expect(getByText('Total Earnings')).toBeTruthy();
    
    // Navigate to Profile
    fireEvent.press(getByText('Profile'));
    expect(getByText('Test Driver')).toBeTruthy();
    
    // Navigate back to Home
    fireEvent.press(getByText('Home'));
    expect(getByText('You are Offline')).toBeTruthy();
  });

  it('maintains tab state when switching', () => {
    const { getByText, getByRole } = renderWithNavigation();
    
    // Toggle online status on Home
    const toggle = getByRole('switch');
    fireEvent(toggle, 'onValueChange', true);
    expect(getByText('You are Online')).toBeTruthy();
    
    // Navigate away and back
    fireEvent.press(getByText('Earnings'));
    fireEvent.press(getByText('Home'));
    
    // State should be maintained
    expect(getByText('You are Online')).toBeTruthy();
  });
});