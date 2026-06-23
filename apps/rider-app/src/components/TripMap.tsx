import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '../theme/theme';
import type { TrackPhase } from '../hooks/useDriverTracking';

type Props = { phase: TrackPhase; progress: number };

type Anchor = { x: number; y: number }; // fractions of the container (0..1)

// Fixed stylised anchors — replaced by real projected coordinates once a map
// SDK is wired in. The car interpolates between these based on phase/progress.
const DRIVER_START: Anchor = { x: 0.8, y: 0.2 };
const PICKUP: Anchor = { x: 0.52, y: 0.46 };
const DROP: Anchor = { x: 0.26, y: 0.74 };

function lerp(a: Anchor, b: Anchor, t: number): Anchor {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function carAnchor(phase: TrackPhase, progress: number): Anchor {
  switch (phase) {
    case 'arriving':
    case 'connecting':
      return lerp(DRIVER_START, PICKUP, progress);
    case 'arrived':
      return PICKUP;
    case 'on_trip':
      return lerp(PICKUP, DROP, progress);
    case 'completed':
      return DROP;
    default:
      return DRIVER_START;
  }
}

/** Absolutely-positioned rotated line connecting two pixel points. */
function Line({ from, to, color, dashed }: { from: Anchor; to: Anchor; color: string; dashed?: boolean }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <View
      style={{
        position: 'absolute',
        left: from.x,
        top: from.y,
        width: length,
        height: 0,
        borderTopWidth: 3,
        borderColor: color,
        borderStyle: dashed ? 'dashed' : 'solid',
        transform: [{ translateY: -1.5 }, { rotateZ: `${angle}deg` }],
        transformOrigin: 'left center',
      }}
    />
  );
}

export default function TripMap({ phase, progress }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const car = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const initialised = useRef(false);

  const toPx = (a: Anchor) => ({ x: a.x * size.w, y: a.y * size.h });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  // Animate the car toward its target whenever phase/progress change.
  useEffect(() => {
    if (size.w === 0) return;
    const target = toPx(carAnchor(phase, progress));
    if (!initialised.current) {
      car.setValue(target);
      initialised.current = true;
      return;
    }
    Animated.timing(car, {
      toValue: target,
      duration: 1100,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, progress, size.w, size.h]);

  const pickupPx = toPx(PICKUP);
  const dropPx = toPx(DROP);
  const startPx = toPx(DRIVER_START);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <View style={styles.surface} />

      {size.w > 0 && (
        <>
          {/* Route legs */}
          <Line from={startPx} to={pickupPx} color={colors.outlineVariant} dashed />
          <Line from={pickupPx} to={dropPx} color={colors.secondary} />

          {/* Pickup (blue dot) */}
          <View style={[styles.marker, { left: pickupPx.x - 8, top: pickupPx.y - 8 }]}>
            <View style={styles.pickupDot} />
          </View>
          {/* Drop (black square) */}
          <View style={[styles.marker, { left: dropPx.x - 7, top: dropPx.y - 7 }]}>
            <View style={styles.dropSquare} />
          </View>

          {/* Animated car */}
          <Animated.View
            style={[
              styles.car,
              { transform: [{ translateX: Animated.subtract(car.x, 18) }, { translateY: Animated.subtract(car.y, 18) }] },
            ]}
          >
            <View style={styles.carHalo} />
            <View style={styles.carBadge}>
              <MaterialIcons name="local-taxi" size={20} color={colors.onPrimary} />
            </View>
          </Animated.View>
        </>
      )}

      {/* Top + bottom fades so UI overlays stay legible */}
      <LinearGradient
        colors={['rgba(249,249,249,0.85)', 'rgba(249,249,249,0)', 'rgba(249,249,249,0)', 'rgba(249,249,249,0.95)']}
        locations={[0, 0.2, 0.78, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: colors.surfaceDim },
  marker: { position: 'absolute' },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.onSecondary,
  },
  dropSquare: { width: 14, height: 14, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.onPrimary },
  car: { position: 'absolute', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  carHalo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    opacity: 0.18,
  },
  carBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
});
