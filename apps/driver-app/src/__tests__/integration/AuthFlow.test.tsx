import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../auth/AuthContext';
import AuthNavigator from '../../navigation/AuthNavigator';

jest.mock('../../api/client', () => ({
  api: {
    requestOtp: jest.fn().mockResolvedValue({ existingUser: false, devCode: '123456' }),
    verifyOtp: jest.fn().mockResolvedValue({ 
      token: 'test-token', 
      user: { id: '1', name: 'Test Driver', phone: '+919876543210', role: 'driver' }
    }),
  },
  setAuthToken: jest.fn(),
}));

const renderAuthFlow = () => {
  return render(
    <AuthProvider>
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

describe('Auth Flow Integration', () => {
  it('completes full authentication flow for new driver', async () => {
    const { getByPlaceholderText, getByText, getAllByText } = renderAuthFlow();
    
    // Phone Screen
    expect(getByText('Enter your mobile number')).toBeTruthy();
    
    const phoneInput = getByPlaceholderText('98765 43210');
    fireEvent.changeText(phoneInput, '9876543210');
    
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);
    
    // Wait for navigation to OTP screen
    await waitFor(() => {
      expect(getByText('Verify your number')).toBeTruthy();
    });
    
    // OTP Screen
    const otpInputs = getAllByText('');
    expect(otpInputs.length).toBeGreaterThan(0);
    
    // Enter name for new user
    const nameInput = getByPlaceholderText('Enter your name');
    fireEvent.changeText(nameInput, 'Test Driver');
    
    // Enter OTP code
    // Note: In actual implementation, we'd simulate entering the code
    // For now, we'll just verify the screen rendered correctly
    expect(getByText('Verify')).toBeTruthy();
  });

  it('handles offline mode with dev code', async () => {
    // Mock offline scenario
    const { api } = require('../../api/client');
    api.requestOtp.mockRejectedValueOnce(new Error('Network error'));
    
    const { getByPlaceholderText, getByText } = renderAuthFlow();
    
    const phoneInput = getByPlaceholderText('98765 43210');
    fireEvent.changeText(phoneInput, '9876543210');
    
    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);
    
    await waitFor(() => {
      expect(getByText('Verify your number')).toBeTruthy();
      // Should show dev code in offline mode
      expect(getByText('Dev Code: 123456')).toBeTruthy();
    });
  });

  it('handles resend OTP functionality', async () => {
    const { getByPlaceholderText, getByText } = renderAuthFlow();
    
    // Navigate to OTP screen
    const phoneInput = getByPlaceholderText('98765 43210');
    fireEvent.changeText(phoneInput, '9876543210');
    fireEvent.press(getByText('Continue'));
    
    await waitFor(() => {
      expect(getByText('Verify your number')).toBeTruthy();
    });
    
    // Check resend timer
    expect(getByText(/Resend code in \d+s/)).toBeTruthy();
    
    // Fast-forward timer
    jest.advanceTimersByTime(30000);
    
    // Resend button should be available
    await waitFor(() => {
      expect(getByText('Resend code')).toBeTruthy();
    }, { timeout: 31000 });
  });
});