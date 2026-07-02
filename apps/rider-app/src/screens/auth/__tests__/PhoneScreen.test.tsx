import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PhoneScreen from '../PhoneScreen';
import { useAuth } from '../../../auth/AuthContext';

// Mock dependencies
jest.mock('../../../auth/AuthContext');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const mockRequestOtp = jest.fn();
const mockNavigate = jest.fn();

describe('PhoneScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      requestOtp: mockRequestOtp,
    });
  });

  it('should display NaviGoIn branding', () => {
    const { getByText } = render(
      <PhoneScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );

    expect(getByText('NaviGoIn')).toBeTruthy();
  });

  it('should display terms with NaviGoIn name', () => {
    const { getByText } = render(
      <PhoneScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );

    expect(getByText(/By continuing, you agree to NaviGoIn's/)).toBeTruthy();
  });

  it('should handle valid phone number submission', async () => {
    mockRequestOtp.mockResolvedValue({
      existingUser: true,
      devCode: '1234',
    });

    const { getByPlaceholderText, getByText } = render(
      <PhoneScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );

    const phoneInput = getByPlaceholderText('98765 43210');
    fireEvent.changeText(phoneInput, '9876543210');

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockRequestOtp).toHaveBeenCalledWith('+919876543210');
      expect(mockNavigate).toHaveBeenCalledWith('Otp', {
        phone: '+919876543210',
        existingUser: true,
        devCode: '1234',
      });
    });
  });

  it('should not submit with invalid phone number', () => {
    const { getByPlaceholderText, getByText } = render(
      <PhoneScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />
    );

    const phoneInput = getByPlaceholderText('98765 43210');
    fireEvent.changeText(phoneInput, '987'); // Too short

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    expect(mockRequestOtp).not.toHaveBeenCalled();
  });
});