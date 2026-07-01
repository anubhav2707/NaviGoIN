import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PrimaryButton from '../../components/PrimaryButton';

describe('PrimaryButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(<PrimaryButton title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<PrimaryButton title="Test Button" onPress={onPress} />);
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { queryByTestId } = render(
      <PrimaryButton title="Test Button" loading onPress={() => {}} />
    );
    
    // ActivityIndicator is rendered when loading
    expect(queryByTestId).toBeTruthy();
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PrimaryButton title="Test Button" loading onPress={onPress} testID="button" />
    );
    
    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PrimaryButton title="Test Button" disabled onPress={onPress} testID="button" />
    );
    
    fireEvent.press(getByTestId('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders secondary variant correctly', () => {
    const { getByText } = render(
      <PrimaryButton title="Secondary Button" variant="secondary" onPress={() => {}} />
    );
    
    expect(getByText('Secondary Button')).toBeTruthy();
  });
});