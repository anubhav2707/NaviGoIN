import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapplsWebMap from './MapplsWebMap';
import { colors } from '../theme/theme';

interface MapBackgroundProps {
  children: React.ReactNode;
  showDriverLocation?: boolean;
}

export default function MapBackground({ children, showDriverLocation = true }: MapBackgroundProps) {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapplsWebMap
          center={{ lat: 28.6139, lng: 77.2090 }}
          zoom={13}
          markers={showDriverLocation ? [{
            position: { lat: 28.6139, lng: 77.2090 },
            color: 'blue',
            title: 'Your Location'
          }] : []}
        />
      </View>
      <View style={styles.overlay}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});