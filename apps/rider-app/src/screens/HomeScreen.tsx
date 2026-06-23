import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MapBackground from '../components/MapBackground';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type QuickAction = { icon: keyof typeof MaterialIcons.glyphMap; label: string };

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'directions-car', label: 'Ride' },
  { icon: 'electric-rickshaw', label: 'Auto' },
  { icon: 'two-wheeler', label: 'Bike' },
  { icon: 'vpn-key', label: 'Rentals' },
  { icon: 'inventory-2', label: 'Package' },
  { icon: 'calendar-month', label: 'Schedule' },
];

const SAVED_PLACES = [
  { icon: 'home' as const, label: 'Home', subtitle: 'Vasant Kunj...' },
  { icon: 'work' as const, label: 'Work', subtitle: 'Cyber City...' },
];

const RECENTS = [
  { title: 'Indira Gandhi International Airport', subtitle: 'New Delhi, Delhi' },
  { title: 'Cyber Hub', subtitle: 'DLF Phase 2, Gurugram' },
  { title: 'Select CITYWALK', subtitle: 'Saket District Centre, New Delhi' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const startBooking = (dropLabel?: string) =>
    navigation.navigate('RouteSelection', dropLabel ? { dropLabel } : undefined);

  return (
    <View style={styles.root}>
      <MapBackground />

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Tabs', { screen: 'Account' })}
            >
              <MaterialIcons name="menu" size={22} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.brand}>RideNow</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Tabs', { screen: 'Account' })}
          />
        </View>
      </SafeAreaView>

      {/* Floating "my location" button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialIcons name="my-location" size={22} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Bottom sheet: Plan your trip */}
      <View style={[styles.sheet, elevation.level2]}>
        <View style={styles.dragHandle} />

        <TouchableOpacity activeOpacity={0.8} onPress={() => startBooking()}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.primary} />
            <Text style={styles.searchPlaceholder}>Where to?</Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsRow}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickAction}
              activeOpacity={0.7}
              onPress={() => startBooking()}
            >
              <MaterialIcons name={action.icon} size={28} color={colors.primary} />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Plan your trip</Text>

        <View style={styles.savedRow}>
          {SAVED_PLACES.map((place) => (
            <TouchableOpacity
              key={place.label}
              style={styles.savedCard}
              activeOpacity={0.7}
              onPress={() => startBooking(place.subtitle)}
            >
              <View style={styles.savedIconWrap}>
                <MaterialIcons name={place.icon} size={20} color={colors.onSecondaryContainer} />
              </View>
              <View>
                <Text style={styles.savedLabel}>{place.label}</Text>
                <Text style={styles.savedSubtitle} numberOfLines={1}>{place.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {RECENTS.map((recent, index) => (
            <TouchableOpacity
              key={recent.title}
              style={[styles.recentRow, index === RECENTS.length - 1 && styles.recentRowLast]}
              activeOpacity={0.7}
              onPress={() => startBooking(recent.title)}
            >
              <MaterialIcons name="history" size={20} color={colors.onSurfaceVariant} />
              <View style={styles.recentTextWrap}>
                <Text style={styles.recentTitle} numberOfLines={1}>{recent.title}</Text>
                <Text style={styles.recentSubtitle}>{recent.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level1,
  },
  brand: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.surfaceContainerHighest,
    backgroundColor: colors.surfaceContainerHigh,
  },

  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: 320,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...elevation.level2,
  },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    ...elevation.level1,
  },
  searchPlaceholder: { ...typography.bodyLg, color: colors.onSurfaceVariant },

  quickActionsRow: { gap: spacing.md, paddingBottom: spacing.sm, marginBottom: spacing.md },
  quickAction: {
    width: 92,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    ...elevation.level1,
  },
  quickActionLabel: { ...typography.labelMd, color: colors.onSurface },

  sectionTitle: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.lg },

  savedRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  savedCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
  },
  savedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLabel: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '700' },
  savedSubtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, maxWidth: 96 },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  recentRowLast: { borderBottomWidth: 0 },
  recentTextWrap: { flex: 1 },
  recentTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '700' },
  recentSubtitle: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
