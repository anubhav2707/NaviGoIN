import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MapBackground from '../../components/MapBackground';
import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import OptionSheet, { type Option } from '../../components/OptionSheet';
import { colors, elevation, radii, spacing, typography } from '../../theme/theme';
import type { BookingContext, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RouteSelection'>;

// Demo coordinates around New Delhi — a real build geocodes the typed addresses.
const DEMO_PICKUP = { lat: 28.6139, lng: 77.209 };
const DEMO_DROP = { lat: 28.5562, lng: 77.1 };

const PROMO_OPTIONS: Option[] = [
  { id: '', label: 'No promo code', icon: 'block' },
  { id: 'RIDE50', label: 'RIDE50', sub: '₹50 off your next ride', icon: 'confirmation-number' },
  { id: 'CITY75', label: 'CITY75', sub: '₹75 off rides over ₹300', icon: 'confirmation-number' },
];

const MAX_POINTS = 5; // pickup + up to 4 stops/drop

export default function RouteSelectionScreen({ navigation, route }: Props) {
  // The whole route as one ordered list: index 0 is pickup, the last is the
  // final drop-off, anything between is an intermediate stop. Keeping it as a
  // single array makes reordering and swapping trivial.
  const [points, setPoints] = useState<string[]>([
    route.params?.pickupLabel ?? 'Oberoi Commerz II, Mumbai',
    route.params?.dropLabel ?? 'Chhatrapati Shivaji International Airport',
  ]);
  const [promo, setPromo] = useState('');
  const [promoSheet, setPromoSheet] = useState(false);

  const setPoint = (index: number, value: string) =>
    setPoints((prev) => prev.map((p, i) => (i === index ? value : p)));

  // New stops are inserted just before the final drop-off.
  const addStop = () =>
    setPoints((prev) =>
      prev.length >= MAX_POINTS ? prev : [...prev.slice(0, -1), '', prev[prev.length - 1]],
    );

  const removeAt = (index: number) =>
    setPoints((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));

  // Swap a point with its neighbour in the given direction.
  const move = (index: number, dir: -1 | 1) =>
    setPoints((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // Two-point convenience: interchange source and destination.
  const swapEnds = () => setPoints((prev) => [...prev].reverse());

  const lastIndex = points.length - 1;
  const stopCount = points.length - 2; // intermediate stops

  // Rough estimate that grows with each added stop, until real routing is wired in.
  const distanceKm = 18.4 + Math.max(0, stopCount) * 6;
  const durationMin = 24 + Math.max(0, stopCount) * 8;

  const onContinue = () => {
    const booking: BookingContext = {
      pickupLabel: points[0],
      dropLabel: points[lastIndex],
      stops: points.slice(1, -1).filter((s) => s.trim() !== ''),
      pickup: DEMO_PICKUP,
      drop: DEMO_DROP,
      distanceKm,
      durationMin,
    };
    navigation.navigate('SelectRide', { booking });
  };

  return (
    <View style={styles.root}>
      <MapBackground />

      <TopBar
        variant="transparent"
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.pill}>
            <Text style={styles.pillText}>Route Preview</Text>
          </View>
        }
      />

      {/* Waypoint inputs */}
      <View style={[styles.inputCard, elevation.level1]}>
        <View style={styles.inputColumn}>
          <View style={styles.inputRows}>
          {points.map((value, index) => {
            const isPickup = index === 0;
            const isDrop = index === lastIndex;
            const label = isPickup ? 'Pickup' : isDrop ? 'Drop-off' : `Stop ${index}`;
            return (
              <View key={index}>
                {index > 0 && <View style={styles.connector} />}
                <View style={styles.inputRow}>
                  {isPickup ? (
                    <View style={styles.pickupDot} />
                  ) : isDrop ? (
                    <View style={styles.dropSquare} />
                  ) : (
                    <View style={styles.stopDot} />
                  )}
                  <View style={styles.inputBody}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                      style={styles.input}
                      value={value}
                      placeholder="Add a location"
                      placeholderTextColor={colors.onSurfaceVariant}
                      onChangeText={(t) => setPoint(index, t)}
                    />
                  </View>

                  {/* Reorder controls — only meaningful with 3+ points */}
                  {points.length >= 3 && (
                    <View style={styles.reorderControls}>
                      <TouchableOpacity
                        onPress={() => move(index, -1)}
                        disabled={index === 0}
                        hitSlop={6}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-up"
                          size={22}
                          color={index === 0 ? colors.outlineVariant : colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => move(index, 1)}
                        disabled={index === lastIndex}
                        hitSlop={6}
                      >
                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={22}
                          color={index === lastIndex ? colors.outlineVariant : colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeAt(index)} hitSlop={6}>
                        <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          </View>

          {/* Swap source ↔ destination — only when exactly two points */}
          {points.length === 2 && (
            <TouchableOpacity style={styles.swapButton} onPress={swapEnds} hitSlop={8}>
              <MaterialIcons name="swap-vert" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Add another stop */}
        {points.length < MAX_POINTS && (
          <TouchableOpacity style={styles.addStopRow} onPress={addStop} activeOpacity={0.7}>
            <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addStopText}>Add stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom sheet */}
      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />
        <View style={styles.estimateRow}>
          <View>
            <Text style={styles.estimateLabel}>ESTIMATED TIME</Text>
            <Text style={styles.estimateValue}>{durationMin} mins</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.estimateLabel}>EST. FARE</Text>
            <Text style={styles.estimateValue}>₹{Math.round(50 + distanceKm * 16 + durationMin * 1.5)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.promoRow, promo !== '' && styles.promoRowActive]}
          activeOpacity={0.7}
          onPress={() => setPromoSheet(true)}
        >
          <View style={styles.promoLeft}>
            <MaterialIcons name="confirmation-number" size={22} color={colors.secondary} />
            <Text style={styles.promoText}>{promo === '' ? 'Apply Promo Code' : `${promo} applied`}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <PrimaryButton label="Continue to Booking" icon="arrow-forward" onPress={onContinue} />
      </View>

      <OptionSheet
        visible={promoSheet}
        title="Apply Promo Code"
        options={PROMO_OPTIONS}
        selectedId={promo}
        onSelect={setPromo}
        onClose={() => setPromoSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    ...elevation.level1,
  },
  pillText: { ...typography.labelMd, color: colors.primary },

  inputCard: {
    marginHorizontal: spacing.marginMobile,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  // Row holds the marker rail + inputs; swap button sits beside it, centered.
  inputColumn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputRows: { flex: 1 },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level1,
  },
  reorderControls: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  addStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  addStopText: { ...typography.bodyMd, color: colors.primary, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
  },
  dropSquare: { width: 12, height: 12, backgroundColor: colors.primary },
  connector: {
    height: 20,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    marginLeft: 5,
    marginVertical: 2,
  },
  inputBody: { flex: 1 },
  inputLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: 2 },
  input: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + spacing.md,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceVariant,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  estimateLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, letterSpacing: 1 },
  estimateValue: { ...typography.headlineMd, color: colors.primary, marginTop: 2 },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  promoRowActive: { borderColor: colors.secondary, backgroundColor: 'rgba(45,91,255,0.06)' },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  promoText: { ...typography.bodyMd, color: colors.onSurface },
});
