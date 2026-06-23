import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Trip = {
  id: string;
  mode: keyof typeof MaterialIcons.glyphMap;
  type: string;
  date: string;
  fare: string;
  from: string;
  to: string;
};

const TRIPS: Trip[] = [
  { id: '1', mode: 'directions-car', type: 'Ride', date: 'Oct 12', fare: '₹342', from: 'Indiranagar Metro Station', to: 'Prestige Tech Park' },
  { id: '2', mode: 'two-wheeler', type: 'Bike', date: 'Oct 10', fare: '₹85', from: 'Koramangala 5th Block', to: 'HSR Layout Sector 2' },
  { id: '3', mode: 'local-taxi', type: 'Ride', date: 'Oct 08', fare: '₹520', from: 'MG Road', to: 'Kempegowda Airport' },
];

export default function ActivityScreen() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.brand}>Your Trips</Text>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Tabs', { screen: 'Account' })}
          >
            <MaterialIcons name="person" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary hero */}
        <View style={[styles.hero, elevation.level1]}>
          <View>
            <Text style={styles.heroLabel}>This month</Text>
            <Text style={styles.heroValue}>12 trips</Text>
          </View>
          <View style={styles.heroDivider} />
          <View>
            <Text style={styles.heroLabel}>Total spent</Text>
            <Text style={styles.heroValue}>₹4,280</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {TRIPS.map((trip) => (
          <View key={trip.id} style={[styles.tripCard, elevation.level1]}>
            <View style={styles.tripHeader}>
              <View style={styles.tripMode}>
                <MaterialIcons name={trip.mode} size={18} color={colors.onSurfaceVariant} />
                <Text style={styles.tripModeText}>{trip.type} • {trip.date}</Text>
              </View>
              <Text style={styles.tripFare}>{trip.fare}</Text>
            </View>
            <View style={styles.tripRoute}>
              <View style={styles.routeRow}>
                <View style={styles.pickupDot} />
                <Text style={styles.routeText} numberOfLines={1}>{trip.from}</Text>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.dropSquare} />
                <Text style={styles.routeText} numberOfLines={1}>{trip.to}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.rebookButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('RouteSelection', { dropLabel: trip.to })}
            >
              <Text style={styles.rebookText}>Rebook</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  brand: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroLabel: { ...typography.labelMd, color: colors.onSurfaceVariant },
  heroValue: { ...typography.headlineSm, color: colors.primary, marginTop: 2 },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.surfaceVariant,
    marginHorizontal: spacing.xl,
  },

  sectionTitle: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.md },

  tripCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripMode: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tripModeText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  tripFare: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  tripRoute: { gap: spacing.xs },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pickupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  dropSquare: { width: 8, height: 8, backgroundColor: colors.primary },
  routeText: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  rebookButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.default,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  rebookText: { ...typography.buttonLg, color: colors.onPrimary },
});
