import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PhoneScreen from '../PhoneScreen';
import { AuthProvider } from '../../../auth/AuthContext';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({
    requestOtp: jest.fn().mockResolvedValue({ existingUser: true, devCode: '123456' }),
  }),
  AuthProvider: ({ children }: any) => children,
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {},
};

describe('PhoneScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the NaviGoIn brand name correctly', () => {
    const { getByText } = render(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText('NaviGoIn')).toBeTruthy();
  });

  it('displays the correct title and subtitle', () => {
    const { getByText } = render(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    expect(getByText('Enter your mobile number')).toBeTruthy();
    expect(getByText("We'll send you a one-time verification code.")).toBeTruthy();
  });

  it('validates phone number input', () => {
    const { getByPlaceholderText, getByText } = render(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const input = getByPlaceholderText('98765 43210');
    const button = getByText('Continue');

    // Initially disabled
    expect(button.parent?.props.disabled).toBe(true);

    // Enter valid phone number
    fireEvent.changeText(input, '9876543210');
    expect(button.parent?.props.disabled).toBe(false);

    // Invalid phone number
    fireEvent.changeText(input, '987');
    expect(button.parent?.props.disabled).toBe(true);
  });

  it('navigates to OTP screen on valid submission', async () => {
    const mockRequestOtp = jest.fn().mockResolvedValue({ existingUser: true, devCode: '123456' });
    jest.spyOn(require('../../../auth/AuthContext'), 'useAuth').mockReturnValue({
      requestOtp: mockRequestOtp,
    });

    const { getByPlaceholderText, getByText } = render(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const input = getByPlaceholderText('98765 43210');
    const button = getByText('Continue');

    fireEvent.changeText(input, '9876543210');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('+919876543210');
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Otp', {
        phone: '+919876543210',
        existingUser: true,
        devCode: '123456',
      });
    });
  });

  it('filters non-numeric characters from phone input', () => {
    const { getByPlaceholderText } = render(
      <PhoneScreen navigation={mockNavigation as any} route={mockRoute as any} />
    );

    const input = getByPlaceholderText('98765 43210');

    fireEvent.changeText(input, '98-765-432-10');
    expect(input.props.value).toBe('9876543210');

    fireEvent.changeText(input, 'abc9876543210xyz');
    expect(input.props.value).toBe('9876543210');
  });
});