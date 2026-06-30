import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import MapplsWebMap from './MapplsWebMap';
import { isMapplsConfigured } from '../config/mappls';
import { LatLng, MapMarker, interpolateLatLng } from '../types/geo';
import { useDriverTracking } from '../hooks/useDriverTracking';

export type TripPhase = 'pickup_arriving' | 'pickup_reached' | 'trip_started' | 'trip_ending';

interface TripMapProps {
  phase: TripPhase;
  progress: number; // 0 to 1
  pickupLocation?: LatLng;
  dropLocation?: LatLng;
  driverLocation?: LatLng;
  routePath?: LatLng[];
  onDriverLocationUpdate?: (location: LatLng) => void;
}

export default function TripMap({
  phase,
  progress,
  pickupLocation,
  dropLocation,
  driverLocation: propDriverLocation,
  routePath: propRoutePath,
  onDriverLocationUpdate
}: TripMapProps) {
  // Use mock driver tracking if no real location provided
  const mockTracking = useDriverTracking({
    phase,
    progress,
    pickupLocation,
    dropLocation,
    enabled: !propDriverLocation
  });

  const driverLocation = propDriverLocation || mockTracking.driverLocation;
  const routePath = propRoutePath || mockTracking.routePath;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Calculate map center based on phase
  const mapCenter = useMemo(() => {
    if (phase === 'pickup_arriving' || phase === 'pickup_reached') {
      return pickupLocation || driverLocation;
    } else if (phase === 'trip_started' || phase === 'trip_ending') {
      // Center between driver and drop location
      if (driverLocation && dropLocation) {
        return {
          lat: (driverLocation.lat + dropLocation.lat) / 2,
          lng: (driverLocation.lng + dropLocation.lng) / 2
        };
      }
      return dropLocation || driverLocation;
    }
    return driverLocation;
  }, [phase, pickupLocation, dropLocation, driverLocation]);

  // Generate markers based on phase
  const markers = useMemo((): MapMarker[] => {
    const markersList: MapMarker[] = [];

    // Driver marker (always visible)
    if (driverLocation) {
      markersList.push({
        id: 'driver',
        position: driverLocation,
        kind: 'driver',
        title: 'Driver',
        description: phase === 'pickup_reached' ? 'Waiting for you' : 'On the way'
      });
    }

    // Pickup marker (visible until trip starts)
    if (pickupLocation && (phase === 'pickup_arriving' || phase === 'pickup_reached')) {
      markersList.push({
        id: 'pickup',
        position: pickupLocation,
        kind: 'pickup',
        title: 'Pickup',
        description: 'Your pickup location'
      });
    }

    // Drop marker (visible after trip starts)
    if (dropLocation && (phase === 'trip_started' || phase === 'trip_ending')) {
      markersList.push({
        id: 'drop',
        position: dropLocation,
        kind: 'drop',
        title: 'Drop',
        description: 'Your destination'
      });
    }

    return markersList;
  }, [phase, pickupLocation, dropLocation, driverLocation]);

  // Animate driver marker on phase change
  useEffect(() => {
    if (phase === 'pickup_reached') {
      // Pulse animation when driver arrives
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [phase, scaleAnim]);

  // Fade transition on phase change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  }, [phase, fadeAnim]);

  // Notify parent of driver location updates
  useEffect(() => {
    if (driverLocation && onDriverLocationUpdate) {
      onDriverLocationUpdate(driverLocation);
    }
  }, [driverLocation, onDriverLocationUpdate]);

  // Calculate zoom based on phase
  const zoom = useMemo(() => {
    if (phase === 'pickup_arriving') return 15;
    if (phase === 'pickup_reached') return 17;
    if (phase === 'trip_started') return 14;
    if (phase === 'trip_ending') return 16;
    return 15;
  }, [phase]);

  // Render map or fallback
  if (!isMapplsConfigured()) {
    // Fallback visualization without real map
    return (
      <View style={styles.container}>
        <View style={styles.fallbackMap}>
          <View style={styles.fallbackContent}>
            {/* Animated driver indicator */}
            <Animated.View
              style={[
                styles.driverIndicator,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }]
                }
              ]}
            />
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <MapplsWebMap
        center={mapCenter}
        zoom={zoom}
        markers={markers}
        routePath={routePath}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center'
  },
  fallbackContent: {
    width: '80%',
    alignItems: 'center'
  },
  driverIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    marginBottom: 32
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#d1d5db',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4
  }
});