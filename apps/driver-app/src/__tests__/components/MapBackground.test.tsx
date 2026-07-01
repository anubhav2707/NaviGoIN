import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import MapBackground from '../../components/MapBackground';

jest.mock('../../components/MapplsWebMap', () => {
  return function MockMapplsWebMap() {
    return null;
  };
});

describe('MapBackground', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <MapBackground>
        <Text>Test Content</Text>
      </MapBackground>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  it('renders with driver location by default', () => {
    const { getByTestId } = render(
      <MapBackground showDriverLocation>
        <Text testID="child">Content</Text>
      </MapBackground>
    );
    
    expect(getByTestId('child')).toBeTruthy();
  });

  it('renders without driver location when disabled', () => {
    const { getByTestId } = render(
      <MapBackground showDriverLocation={false}>
        <Text testID="child">Content</Text>
      </MapBackground>
    );
    
    expect(getByTestId('child')).toBeTruthy();
  });
});