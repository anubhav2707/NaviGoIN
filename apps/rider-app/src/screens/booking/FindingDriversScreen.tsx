import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MapBackground from '../../components/MapBackground';
import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import WaypointTrail from '../../components/WaypointTrail';
import { api } from '../../api/client';
import { colors, elevation, radii, spacing, typography } from '../../theme/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FindingDrivers'>;

// Stand-in rider identity until auth is wired up.
const DEMO_RIDER_ID = 'usr_demo_rider';

export default function FindingDriversScreen({ navigation, route }: Props) {
  const { booking, ride } = route.params;
  const [statusText, setStatusText] = useState('Matching with nearest drivers...');
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the shimmering progress bar.
    Animated.timing(progress, {
      toValue: 1,
      duration: 3500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Pulsing search ring on the map.
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    let cancelled = false;
    let tripId: string | undefined;

    // Create the trip on the backend, then simulate a driver accepting.
    api
      .createTrip(DEMO_RIDER_ID, booking.pickup, booking.drop)
      .then((trip) => {
        tripId = trip.id;
        if (!cancelled) setStatusText('Driver found! Confirming...');
      })
      .catch(() => {
        if (!cancelled) setStatusText('Matching with nearest drivers...');
      });

    const timer = setTimeout(() => {
      if (cancelled) return;
      navigation.replace('RideConfirmed', { booking, ride, tripId });
    }, 3800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [booking, ride, navigation, progress, pulse]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '95%'],
  });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.root}>
      <MapBackground />

      {/* Pulsing search marker */}
      <View style={styles.pulseWrap} pointerEvents="none">
        <Animated.View
          style={[styles.pulseRing, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
        />
        <View style={styles.pulseDot} />
      </View>

      <TopBar variant="transparent" title="Finding Drivers" onBack={() => navigation.goBack()} />

      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />

        <View style={styles.statusHeader}>
          <Text style={styles.activeSearch}>ACTIVE SEARCH</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.summaryCard}>
          <WaypointTrail
            pickup={booking.pickupLabel}
            drop={booking.dropLabel}
            stops={booking.stops}
            withLabels
          />
          <View style={styles.divider} />
          <View style={styles.summaryFooter}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcon}>
                <MaterialIcons name="directions-car" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.summaryRide}>RideNow {ride.label}</Text>
                <Text style={styles.summarySub}>Top Rated</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryFare}>₹{Math.round(ride.fare)}</Text>
              <Text style={styles.summarySub}>UPI</Text>
            </View>
          </View>
        </View>

        <PrimaryButton
          label="Cancel Request"
          variant="error"
          onPress={() => navigation.popToTop()}
        />
        <Text style={styles.cancelNote}>No charge for cancellations within 2 mins</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pulseWrap: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
  },
  pulseDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.onPrimary,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  activeSearch: { ...typography.labelMd, color: colors.secondary, letterSpacing: 1 },
  statusText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radii.full },
  summaryCard: {
    backgroundColor: colors.surfaceBright,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  divider: { height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.md },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRide: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '700' },
  summarySub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  summaryFare: { ...typography.headlineSm, color: colors.onSurface },
  cancelNote: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
