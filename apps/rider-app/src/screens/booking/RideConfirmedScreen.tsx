import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TripMap from '../../components/TripMap';
import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import { api } from '../../api/client';
import { callNumber, shareMessage, confirm } from '../../lib/actions';
import { colors, elevation, radii, spacing, typography } from '../../theme/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RideConfirmed'>;

const DEMO_DRIVER_ID = 'drv_demo_1';
const DRIVER_NAME = 'Arjun';
const DRIVER_PHONE = '+919900000002';

type QuickAction = { icon: keyof typeof MaterialIcons.glyphMap; label: string; danger?: boolean; onPress: () => void };

export default function RideConfirmedScreen({ navigation, route }: Props) {
  const { booking, ride, tripId } = route.params;

  useEffect(() => {
    // Move the trip into "accepted" now that a driver is assigned.
    if (tripId) {
      api.updateTripStatus(tripId, 'accepted', DEMO_DRIVER_ID).catch(() => {});
    }
  }, [tripId]);

  const cancelRide = () =>
    confirm('Cancel ride?', 'You may be charged a fee if you cancel now.', () => {
      if (tripId) api.updateTripStatus(tripId, 'cancelled').catch(() => {});
      navigation.popToTop();
    }, 'Cancel ride');

  const QUICK_ACTIONS: QuickAction[] = [
    { icon: 'call', label: 'Call', onPress: () => callNumber(DRIVER_PHONE) },
    { icon: 'chat', label: 'Chat', onPress: () => navigation.navigate('DriverChat', { driverName: DRIVER_NAME }) },
    {
      icon: 'share',
      label: 'Share',
      onPress: () =>
        shareMessage(
          `I'm on a RideNow trip with ${DRIVER_NAME} (DL 1ZC 1234) to ${booking.dropLabel}. Track me live.`,
        ),
    },
    { icon: 'close', label: 'Cancel', danger: true, onPress: cancelRide },
  ];

  return (
    <View style={styles.root}>
      <TripMap phase="arriving" progress={0.45} />

      <TopBar
        variant="transparent"
        title="RideNow"
        backIcon="arrow-back"
        onBack={() => navigation.popToTop()}
      />

      {/* Arriving badge */}
      <View style={styles.badgeWrap} pointerEvents="none">
        <View style={[styles.badge, elevation.level1]}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Arriving in 3 mins</Text>
        </View>
      </View>

      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />

        {/* Driver + OTP */}
        <View style={styles.driverRow}>
          <View style={styles.driverLeft}>
            <View style={styles.driverAvatar}>
              <MaterialIcons name="person" size={32} color={colors.onSurfaceVariant} />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>4.9</Text>
                <MaterialIcons name="star" size={10} color="#f5b400" />
              </View>
            </View>
            <View>
              <Text style={styles.driverName}>Arjun</Text>
              <Text style={styles.driverCar}>White Maruti Suzuki Dzire</Text>
              <Text style={styles.driverPlate}>DL 1ZC 1234</Text>
            </View>
          </View>
          <View style={styles.otpBox}>
            <Text style={styles.otpLabel}>OTP</Text>
            <Text style={styles.otpValue}>8842</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              activeOpacity={0.7}
              onPress={action.onPress}
            >
              <View style={[styles.quickIcon, action.danger && styles.quickIconDanger]}>
                <MaterialIcons
                  name={action.icon}
                  size={22}
                  color={action.danger ? colors.error : colors.primary}
                />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Safety toolkit */}
        <TouchableOpacity
          style={styles.safetyRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('EmergencySettings')}
        >
          <View style={styles.safetyLeft}>
            <View style={styles.safetyIcon}>
              <MaterialIcons name="security" size={20} color={colors.error} />
            </View>
            <View>
              <Text style={styles.safetyTitle}>Safety Toolkit</Text>
              <Text style={styles.safetySub}>Emergency help & safety features</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
        </TouchableOpacity>

        <PrimaryButton
          label="Track Trip"
          icon="navigation"
          onPress={() => navigation.replace('LiveTripTracking', { booking, ride, tripId })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  badgeWrap: { position: 'absolute', top: 110, left: 0, right: 0, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  badgeText: { ...typography.labelMd, color: colors.primary },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceVariant,
    alignSelf: 'center',
  },
  driverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  driverLeft: { flexDirection: 'row', gap: spacing.md },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  ratingText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  driverName: { ...typography.headlineSm, color: colors.primary },
  driverCar: { ...typography.bodySm, color: colors.onSurfaceVariant },
  driverPlate: { ...typography.labelMd, color: colors.primary, marginTop: 2, letterSpacing: 1 },
  otpBox: {
    backgroundColor: 'rgba(45,91,255,0.08)',
    borderWidth: 1,
    borderColor: colors.secondaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    alignItems: 'center',
    minWidth: 80,
  },
  otpLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary, letterSpacing: 2 },
  otpValue: { ...typography.headlineSm, color: colors.secondary, letterSpacing: 4 },

  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceVariant,
    paddingVertical: spacing.md,
  },
  quickAction: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconDanger: { backgroundColor: colors.errorContainer },
  quickLabel: { ...typography.labelMd, color: colors.onSurface },

  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  safetyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  safetyIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: { ...typography.labelMd, color: colors.primary },
  safetySub: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
