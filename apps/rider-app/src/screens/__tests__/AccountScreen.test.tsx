import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AccountScreen from '../AccountScreen';
import { useAuth } from '../../auth/AuthContext';
import { shareMessage } from '../../lib/actions';

// Mock dependencies
jest.mock('../../auth/AuthContext');
jest.mock('../../lib/actions');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const mockSignOut = jest.fn();
const mockUser = {
  name: 'Test User',
  phone: '+91 98765 43210',
};

describe('AccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    });
  });

  it('should display NaviGoIn version', () => {
    const { getByText } = render(<AccountScreen />);
    expect(getByText('NaviGoIn v1.0.0')).toBeTruthy();
  });

  it('should share referral message with NaviGoIn branding', () => {
    const { getByText } = render(<AccountScreen />);
    
    const referralButton = getByText('Referrals');
    fireEvent.press(referralButton);

    expect(shareMessage).toHaveBeenCalledWith(
      'Join me on NaviGoIn! Use my code NAVI100 for ₹100 off your first ride.'
    );
  });

  it('should display user information', () => {
    const { getByText } = render(<AccountScreen />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('+91 98765 43210')).toBeTruthy();
  });

  it('should have all menu sections', () => {
    const { getByText } = render(<AccountScreen />);
    
    // Payment methods
    expect(getByText('PAYMENT METHODS')).toBeTruthy();
    expect(getByText('UPI Payments')).toBeTruthy();
    expect(getByText('Saved Cards')).toBeTruthy();
    
    // Safety
    expect(getByText('SAFETY')).toBeTruthy();
    expect(getByText('Trusted Contacts')).toBeTruthy();
    expect(getByText('Emergency Settings')).toBeTruthy();
    
    // Other
    expect(getByText('Support')).toBeTruthy();
    expect(getByText('Referrals')).toBeTruthy();
  });
});