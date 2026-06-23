import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MapBackground from '../../components/MapBackground';
import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import WaypointTrail from '../../components/WaypointTrail';
import OptionSheet, { type Option } from '../../components/OptionSheet';
import AddPaymentSheet, { type NewPayment } from '../../components/AddPaymentSheet';
import { api, type FareEstimate } from '../../api/client';
import { colors, elevation, radii, spacing, typography } from '../../theme/theme';
import type { RideSelection, RootStackParamList, VehicleType } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectRide'>;

const PAYMENT_OPTIONS: Option[] = [
  { id: 'gpay', label: 'UPI • Google Pay', sub: 'alex.j@okgoogle', icon: 'account-balance-wallet' },
  { id: 'phonepe', label: 'UPI • PhonePe', sub: '9876543210@ybl', icon: 'account-balance-wallet' },
  { id: 'card', label: 'Visa •••• 4242', sub: 'Credit card', icon: 'credit-card' },
  { id: 'cash', label: 'Cash', sub: 'Pay the driver directly', icon: 'payments' },
];

// id doubles as the rupee discount applied to the selected fare.
const COUPON_OPTIONS: Option[] = [
  { id: '0', label: 'No coupon', icon: 'block' },
  { id: '50', label: 'RIDE50', sub: '₹50 off this ride', icon: 'confirmation-number' },
  { id: '75', label: 'CITY75', sub: '₹75 off rides over ₹300', icon: 'confirmation-number' },
];

type RideOption = {
  vehicleType: VehicleType;
  label: string;
  tag?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  etaLabel: string;
  fallbackFare: number;
};

// Static catalog; fares are overlaid from the backend pricing endpoint when it responds.
const RIDE_OPTIONS: RideOption[] = [
  { vehicleType: 'mini', label: 'Mini', tag: '4 seats', icon: 'directions-car', etaLabel: '3 min away', fallbackFare: 240 },
  { vehicleType: 'sedan', label: 'Sedan', tag: 'Comfort', icon: 'directions-car', etaLabel: '5 min away', fallbackFare: 310 },
  { vehicleType: 'suv', label: 'SUV', tag: '6 seats', icon: 'airport-shuttle', etaLabel: '8 min away', fallbackFare: 450 },
  { vehicleType: 'auto', label: 'Auto', icon: 'electric-rickshaw', etaLabel: '2 min away', fallbackFare: 180 },
  { vehicleType: 'bike', label: 'Bike', tag: 'Quick', icon: 'two-wheeler', etaLabel: '1 min away', fallbackFare: 90 },
];

// Maps the app's vehicle types onto the backend pricing tariff keys.
const TARIFF_KEY: Record<VehicleType, string> = {
  mini: 'auto',
  sedan: 'sedan',
  suv: 'premier',
  auto: 'auto',
  bike: 'bike',
};

export default function SelectRideScreen({ navigation, route }: Props) {
  const { booking } = route.params;
  const [selected, setSelected] = useState<VehicleType>('sedan');
  const [fares, setFares] = useState<Record<string, number>>({});
  const [paymentMethods, setPaymentMethods] = useState<Option[]>(PAYMENT_OPTIONS);
  const [paymentId, setPaymentId] = useState('gpay');
  const [couponId, setCouponId] = useState('0');
  const [sheet, setSheet] = useState<'payment' | 'coupon' | null>(null);
  const [addingPayment, setAddingPayment] = useState(false);

  const payment = paymentMethods.find((p) => p.id === paymentId) ?? paymentMethods[0];
  const discount = Number(couponId);

  const addPaymentMethod = (method: NewPayment) => {
    const id = `custom_${Date.now()}`;
    setPaymentMethods((prev) => [
      ...prev,
      { id, label: method.label, sub: method.sub, icon: method.icon },
    ]);
    setPaymentId(id); // select the newly added method
  };

  useEffect(() => {
    let active = true;
    api
      .estimateFares(booking.distanceKm, booking.durationMin)
      .then((res) => {
        if (!active) return;
        const byType: Record<string, number> = {};
        res.estimates.forEach((e: FareEstimate) => { byType[e.vehicleType] = e.fare; });
        setFares(byType);
      })
      .catch(() => { /* keep fallback fares if the backend isn't reachable */ });
    return () => { active = false; };
  }, [booking.distanceKm, booking.durationMin]);

  const baseFare = (opt: RideOption) => fares[TARIFF_KEY[opt.vehicleType]] ?? opt.fallbackFare;
  // Coupon discount applied to the displayed and booked fare, never below ₹0.
  const fareFor = (opt: RideOption) => Math.max(0, baseFare(opt) - discount);

  const selectedOption = useMemo(
    () => RIDE_OPTIONS.find((o) => o.vehicleType === selected)!,
    [selected],
  );

  const onBook = () => {
    const ride: RideSelection = {
      vehicleType: selected,
      label: selectedOption.label,
      fare: fareFor(selectedOption),
    };
    navigation.navigate('FindingDrivers', { booking, ride });
  };

  return (
    <View style={styles.root}>
      <MapBackground />
      <TopBar variant="transparent" title="Confirm Ride" onBack={() => navigation.goBack()} />

      <View style={[styles.waypointCard, elevation.level2]}>
        <WaypointTrail
          pickup={booking.pickupLabel}
          drop={booking.dropLabel}
          stops={booking.stops}
        />
      </View>

      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {RIDE_OPTIONS.map((opt) => {
            const isSelected = opt.vehicleType === selected;
            return (
              <TouchableOpacity
                key={opt.vehicleType}
                style={[styles.rideRow, isSelected && styles.rideRowSelected]}
                activeOpacity={0.8}
                onPress={() => setSelected(opt.vehicleType)}
              >
                <View style={styles.rideLeft}>
                  <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                    <MaterialIcons
                      name={opt.icon}
                      size={32}
                      color={isSelected ? colors.secondary : colors.onSurfaceVariant}
                    />
                  </View>
                  <View>
                    <View style={styles.rideTitleRow}>
                      <Text style={styles.rideTitle}>{opt.label}</Text>
                      {opt.tag && (
                        <View style={[styles.tag, isSelected && styles.tagSelected]}>
                          <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                            {opt.tag}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rideEta}>{opt.etaLabel}</Text>
                  </View>
                </View>
                <Text style={styles.ridePrice}>₹{Math.round(fareFor(opt))}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.footerChip}
              activeOpacity={0.7}
              onPress={() => setSheet('payment')}
            >
              <MaterialIcons name={payment.icon ?? 'account-balance-wallet'} size={20} color={colors.secondary} />
              <Text style={styles.footerChipText} numberOfLines={1}>{payment.label}</Text>
              <MaterialIcons name="expand-more" size={16} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerChip, discount > 0 && styles.footerChipActive]}
              activeOpacity={0.7}
              onPress={() => setSheet('coupon')}
            >
              <MaterialIcons name="confirmation-number" size={20} color={discount > 0 ? colors.secondary : colors.primary} />
              <Text style={styles.footerChipText} numberOfLines={1}>
                {discount > 0 ? `₹${discount} off applied` : 'Coupons'}
              </Text>
            </TouchableOpacity>
          </View>
          <PrimaryButton
            label={`Book RideNow • ₹${Math.round(fareFor(selectedOption))}`}
            icon="arrow-forward"
            onPress={onBook}
          />
        </View>
      </View>

      <OptionSheet
        visible={sheet === 'payment'}
        title="Payment method"
        options={paymentMethods}
        selectedId={paymentId}
        onSelect={setPaymentId}
        onClose={() => setSheet(null)}
        addLabel="Add new payment method"
        onAdd={() => {
          setSheet(null);
          setAddingPayment(true);
        }}
      />
      <OptionSheet
        visible={sheet === 'coupon'}
        title="Apply a coupon"
        options={COUPON_OPTIONS}
        selectedId={couponId}
        onSelect={setCouponId}
        onClose={() => setSheet(null)}
      />
      <AddPaymentSheet
        visible={addingPayment}
        onClose={() => setAddingPayment(false)}
        onAdd={addPaymentMethod}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  waypointCard: {
    marginHorizontal: spacing.marginMobile,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '62%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  list: { paddingHorizontal: spacing.marginMobile },
  rideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  rideRowSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceContainerLowest,
    ...elevation.level1,
  },
  rideLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: { backgroundColor: colors.secondaryFixed },
  rideTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rideTitle: { ...typography.headlineSm, color: colors.onSurface },
  tag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  tagSelected: { backgroundColor: colors.secondaryFixed },
  tagText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tagTextSelected: { color: colors.secondary },
  rideEta: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  ridePrice: { ...typography.headlineSm, color: colors.onSurface },

  footer: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing.md,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  footerChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  footerChipActive: { borderColor: colors.secondary, backgroundColor: 'rgba(45,91,255,0.06)' },
  footerChipText: { ...typography.labelMd, color: colors.onSurface, flexShrink: 1 },
});
