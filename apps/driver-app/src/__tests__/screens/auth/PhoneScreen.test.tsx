import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PhoneScreen from '../../../screens/auth/PhoneScreen';
import { AuthProvider } from '../../../auth/AuthContext';

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('PhoneScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    expect(getByText('RideNow Driver')).toBeTruthy();
    expect(getByText('Enter your mobile number')).toBeTruthy();
    expect(getByText('Start earning by driving with RideNow')).toBeTruthy();
    expect(getByPlaceholderText('98765 43210')).toBeTruthy();
  });

  it('formats phone number input correctly', () => {
    const { getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '9876543210');
    
    expect(input.props.value).toBe('9876543210');
  });

  it('removes non-numeric characters', () => {
    const { getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '987-654-3210');
    
    expect(input.props.value).toBe('9876543210');
  });

  it('limits input to 10 digits', () => {
    const { getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '98765432101234');
    
    expect(input.props.value).toBe('9876543210');
  });

  it('enables continue button when valid phone number is entered', () => {
    const { getByText, getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    const button = getByText('Continue').parent;
    expect(button?.props.disabled).toBe(true);
    
    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '9876543210');
    
    expect(button?.props.disabled).toBe(false);
  });

  it('navigates to OTP screen on continue', async () => {
    const { getByText, getByPlaceholderText } = renderWithAuth(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );
    
    const input = getByPlaceholderText('98765 43210');
    fireEvent.changeText(input, '9876543210');
    
    const button = getByText('Continue');
    fireEvent.press(button);
    
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Otp', expect.objectContaining({
        phone: '+919876543210',
      }));
    });
  });
});