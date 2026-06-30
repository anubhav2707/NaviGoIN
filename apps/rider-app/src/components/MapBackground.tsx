import React from 'react';
import {
  View,
  StyleSheet,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapplsWebMap from './MapplsWebMap';
import { isMapplsConfigured } from '../config/mappls';
import { LatLng } from '../types/geo';

interface MapBackgroundProps {
  center?: LatLng;
  zoom?: number;
  showPin?: boolean;
  children?: React.ReactNode;
}

export default function MapBackground({
  center,
  zoom = 16,
  showPin = true,
  children
}: MapBackgroundProps) {
  const renderMapLayer = () => {
    if (isMapplsConfigured()) {
      return (
        <MapplsWebMap
          center={center}
          zoom={zoom}
          style={StyleSheet.absoluteFill}
        />
      );
    }

    // Fallback placeholder when Mappls is not configured
    return (
      <View style={[StyleSheet.absoluteFill, styles.placeholderMap]}>
        <View style={styles.gridPattern}>
          {[...Array(20)].map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * 50 }]} />
          ))}
          {[...Array(10)].map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * 50 }]} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map layer */}
      {renderMapLayer()}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)', 'transparent']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
      />

      {/* Center pin overlay */}
      {showPin && (
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={styles.pinShadow} />
          <View style={styles.pin}>
            <View style={styles.pinInner} />
          </View>
          <View style={styles.pinPoint} />
        </View>
      )}

      {/* Content overlay */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  placeholderMap: {
    backgroundColor: '#e5e7eb'
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#d1d5db',
    opacity: 0.3
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -20,
    zIndex: 2,
    alignItems: 'center'
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  pinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'white'
  },
  pinPoint: {
    width: 2,
    height: 16,
    backgroundColor: '#3B82F6',
    marginTop: -8
  },
  pinShadow: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    transform: [{ scaleX: 1.5 }]
  }
});