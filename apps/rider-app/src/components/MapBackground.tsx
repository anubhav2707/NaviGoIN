import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/theme';

/**
 * Stand-in for the live map layer (Level 0 "Floor" in the Urban Kinetic system).
 * Swap the inner View for `react-native-maps` MapView once a Maps API key is wired up —
 * the gradient overlay and pin should be layered on top exactly the same way.
 */
export default function MapBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.surface} />
      <View style={styles.pinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pin} />
      </View>
      <LinearGradient
        colors={[
          'rgba(249,249,249,0.85)',
          'rgba(249,249,249,0)',
          'rgba(249,249,249,0)',
          'rgba(249,249,249,0.95)',
        ]}
        locations={[0, 0.2, 0.8, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
    backgroundColor: colors.surfaceDim,
  },
  pinWrap: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -16,
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    opacity: 0.18,
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.onSecondary,
  },
});
