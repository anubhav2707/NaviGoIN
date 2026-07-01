import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';

jest.mock('../../components/MapBackground', () => {
  return function MockMapBackground({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

describe('HomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders offline state by default', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    
    expect(getByText('You are Offline')).toBeTruthy();
    expect(getByText('Go Online to Start Earning')).toBeTruthy();
  });

  it('toggles online state when switch is pressed', () => {
    const { getByText, getByRole } = render(<HomeScreen navigation={mockNavigation} />);
    
    const toggle = getByRole('switch');
    fireEvent(toggle, 'onValueChange', true);
    
    expect(getByText('You are Online')).toBeTruthy();
    expect(getByText('Waiting for trip requests...')).toBeTruthy();
  });

  it('shows earnings information', () => {
    const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
    
    expect(getByText('Today\'s Earnings')).toBeTruthy();
    expect(getByText('₹2450')).toBeTruthy();
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('shows nearby areas when online', () => {
    const { getByText, getByRole } = render(<HomeScreen navigation={mockNavigation} />);
    
    const toggle = getByRole('switch');
    fireEvent(toggle, 'onValueChange', true);
    
    expect(getByText('Nearby Areas')).toBeTruthy();
    expect(getByText('Connaught Place - High demand')).toBeTruthy();
    expect(getByText('Saket - Moderate demand')).toBeTruthy();
  });
});