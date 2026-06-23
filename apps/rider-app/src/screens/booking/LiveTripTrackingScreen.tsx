import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TripMap from '../../components/TripMap';
import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import RazorpayCheckout, { type CheckoutOrder, type PaymentResult } from '../../components/RazorpayCheckout';
import PaymentMethodSheet, { type PayMethod } from '../../components/PaymentMethodSheet';
import UpiQrModal, { type UpiQr } from '../../components/UpiQrModal';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useDriverTracking } from '../../hooks/useDriverTracking';
import { callNumber, shareMessage, confirm } from '../../lib/actions';
import { colors, elevation, radii, spacing, typography } from '../../theme/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveTripTracking'>;

const DRIVER_NAME = 'Rajesh Kumar';
const DRIVER_PHONE = '+919900000003';

const PHASE_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  arriving: 'Driver on the way',
  arrived: 'Driver has arrived',
  on_trip: 'On the way to destination',
  completed: 'Arrived at destination',
  offline: 'On the way to destination',
};

export default function LiveTripTrackingScreen({ navigation, route }: Props) {
  const { booking, ride, tripId } = route.params;
  const { user } = useAuth();
  const fare = Math.round(ride.fare);

  // Live driver telemetry over WebSocket.
  const tracking = useDriverTracking(tripId, booking.pickup, booking.drop);
  const overallProgress =
    tracking.phase === 'on_trip'
      ? 0.5 + tracking.progress * 0.5
      : tracking.phase === 'completed'
        ? 1
        : tracking.progress * 0.5;

  const [completing, setCompleting] = useState(false);
  const [methodSheet, setMethodSheet] = useState(false);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [upiQr, setUpiQr] = useState<UpiQr | null>(null);
  const [qrVisible, setQrVisible] = useState(false);

  const triggerSOS = () =>
    confirm(
      'Emergency SOS',
      'This will call local emergency services (100) and alert your trusted contacts.',
      () => callNumber('100'),
      'Call 100',
    );

  const shareStatus = () =>
    shareMessage(
      `I'm on a RideNow trip with ${DRIVER_NAME} (MH01 AX 4592). Heading to ${booking.dropLabel}. ETA ~12 mins.`,
    );

  useEffect(() => {
    // Driver has picked up — trip is now underway.
    if (tripId) {
      api.updateTripStatus(tripId, 'in_progress').catch(() => {});
    }
  }, [tripId]);

  const finishTrip = async () => {
    try {
      if (tripId) await api.updateTripStatus(tripId, 'completed');
    } catch {
      /* even if the backend is unreachable, let the rider exit the flow */
    } finally {
      navigation.popToTop();
    }
  };

  const openPaymentMethods = () => setMethodSheet(true);

  const onSelectMethod = async (method: PayMethod) => {
    setMethodSheet(false);
    switch (method) {
      case 'cash':
        setCompleting(true);
        try {
          if (tripId && user) await api.chargeCash(tripId, user.id, fare);
        } catch {
          /* offline — still let the rider finish */
        }
        await finishTrip();
        break;

      case 'online':
        setCompleting(true);
        try {
          const created = await api.createPaymentOrder(ride.fare, tripId, user?.id);
          if (created.mock || !created.keyId) {
            await finishTrip();
            return;
          }
          setOrder({
            chargeId: created.chargeId,
            orderId: created.orderId,
            amount: created.amount,
            currency: created.currency,
            keyId: created.keyId,
          });
        } catch {
          await finishTrip();
        } finally {
          setCompleting(false);
        }
        break;

      case 'qr':
        setQrVisible(true);
        setUpiQr(null);
        try {
          const res = await api.createUpiQr(ride.fare, tripId);
          setUpiQr({ qrPngB64: res.qrPngB64, payeeVpa: res.payeeVpa, amount: res.amount });
        } catch {
          setQrVisible(false);
          Alert.alert('Could not generate QR', 'Please try another payment method.');
        }
        break;
    }
  };

  const onPaymentSuccess = async (result: PaymentResult) => {
    const current = order;
    setOrder(null);
    try {
      if (current) {
        await api.verifyPayment({
          chargeId: current.chargeId,
          orderId: result.orderId,
          paymentId: result.paymentId,
          signature: result.signature,
        });
      }
    } catch {
      /* verification failed server-side; still let the rider exit */
    }
    await finishTrip();
  };

  const etaText = tracking.phase === 'completed' ? 'Arrived' : `${tracking.etaMin || 1} mins`;

  return (
    <View style={styles.root}>
      <TripMap phase={tracking.phase} progress={tracking.progress} />

      <TopBar
        variant="transparent"
        backIcon="close"
        onBack={() => navigation.popToTop()}
        right={
          <View style={[styles.etaPill, elevation.level1]}>
            <View style={[styles.liveDot, { backgroundColor: tracking.connected ? colors.success : colors.outline }]} />
            <Text style={styles.etaText}>{etaText}</Text>
          </View>
        }
      />

      {/* Side controls */}
      <View style={styles.sideControls}>
        <TouchableOpacity
          style={[styles.sideButton, elevation.level1]}
          onPress={() => navigation.navigate('EmergencySettings')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="shield" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideButton, elevation.level1]}
          onPress={shareStatus}
          activeOpacity={0.8}
        >
          <MaterialIcons name="share" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />

        {/* Live status banner */}
        <View style={styles.statusRow}>
          <View style={[styles.liveDot, { backgroundColor: tracking.connected ? colors.success : colors.outline }]} />
          <Text style={styles.statusText}>{PHASE_LABEL[tracking.phase] ?? 'Tracking…'}</Text>
          {tracking.phase !== 'completed' && (
            <Text style={styles.statusEta}>· {tracking.etaMin || 1} min</Text>
          )}
        </View>

        {/* Driver row */}
        <View style={styles.driverRow}>
          <View style={styles.driverLeft}>
            <View style={styles.driverAvatar}>
              <MaterialIcons name="person" size={28} color={colors.onSurfaceVariant} />
              <View style={styles.starBadge}>
                <MaterialIcons name="star" size={12} color={colors.onPrimary} />
              </View>
            </View>
            <View>
              <Text style={styles.driverName}>Rajesh Kumar</Text>
              <Text style={styles.driverCar}>White Maruti Dzire • MH01 AX 4592</Text>
            </View>
          </View>
          <View style={styles.commRow}>
            <TouchableOpacity style={styles.commButton} onPress={() => callNumber(DRIVER_PHONE)} activeOpacity={0.7}>
              <MaterialIcons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commButton}
              onPress={() => navigation.navigate('DriverChat', { driverName: DRIVER_NAME })}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chat" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trip progress */}
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(overallProgress * 100)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Pickup: {booking.pickupLabel.split(',')[0]}</Text>
            <Text style={styles.progressLabel}>Drop: {booking.dropLabel.split(',')[0]}</Text>
          </View>
        </View>

        {/* SOS + Share */}
        <View style={styles.actionRow}>
          <PrimaryButton label="SOS" icon="emergency" variant="error" style={styles.actionBtn} onPress={triggerSOS} />
          <PrimaryButton label="Share Status" icon="share" style={styles.actionBtn} onPress={shareStatus} />
        </View>

        {/* Trip stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{booking.distanceKm} km</Text>
          </View>
          <View style={[styles.stat, styles.statMiddle]}>
            <Text style={styles.statLabel}>Fare</Text>
            <Text style={styles.statValue}>₹{Math.round(ride.fare)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>OTP</Text>
            <Text style={[styles.statValue, { color: colors.secondary }]}>8842</Text>
          </View>
        </View>

        <PrimaryButton
          label={`Pay ₹${fare} & Complete`}
          icon="lock"
          loading={completing}
          onPress={openPaymentMethods}
          style={{ marginTop: spacing.md }}
        />
      </View>

      <PaymentMethodSheet
        visible={methodSheet}
        amount={ride.fare}
        onSelect={onSelectMethod}
        onClose={() => setMethodSheet(false)}
      />

      <RazorpayCheckout
        order={order}
        prefill={{ name: user?.name, contact: user?.phone }}
        onSuccess={onPaymentSuccess}
        onDismiss={() => setOrder(null)}
        onError={(msg) => {
          setOrder(null);
          Alert.alert('Payment failed', msg);
        }}
      />

      <UpiQrModal
        visible={qrVisible}
        qr={upiQr}
        onPaid={() => {
          setQrVisible(false);
          finishTrip();
        }}
        onClose={() => setQrVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  etaText: { ...typography.labelMd, color: colors.primary },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  statusText: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
  statusEta: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  sideControls: {
    position: 'absolute',
    right: spacing.marginMobile,
    top: '42%',
    gap: spacing.md,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: spacing.md,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceVariant,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  driverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surfaceContainerLowest,
  },
  driverName: { ...typography.headlineSm, color: colors.primary },
  driverCar: { ...typography.bodySm, color: colors.onSurfaceVariant },
  commRow: { flexDirection: 'row', gap: spacing.sm },
  commButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBlock: { gap: spacing.sm },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
  },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },

  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.sm,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  statLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  statValue: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
});
