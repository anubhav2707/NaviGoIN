import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../theme/theme';

type Period = 'today' | 'week' | 'month';

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');

  const earnings = {
    today: { amount: 2450, trips: 12, hours: 8.5, tips: 150 },
    week: { amount: 15680, trips: 78, hours: 52, tips: 980 },
    month: { amount: 62400, trips: 312, hours: 210, tips: 4200 },
  };

  const current = earnings[selectedPeriod];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as Period[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Earnings Card */}
        <View style={styles.mainCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>₹{current.amount}</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-car" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{current.trips}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <MaterialIcons name="access-time" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{current.hours}h</Text>
              <Text style={styles.statLabel}>Online</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <MaterialIcons name="volunteer-activism" size={24} color={colors.primary} />
              <Text style={styles.statValue}>₹{current.tips}</Text>
              <Text style={styles.statLabel}>Tips</Text>
            </View>
          </View>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Earnings Breakdown</Text>
          
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Trip Earnings</Text>
            <Text style={styles.breakdownValue}>₹{current.amount - current.tips}</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Tips</Text>
            <Text style={styles.breakdownValue}>₹{current.tips}</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Incentives</Text>
            <Text style={styles.breakdownValue}>₹0</Text>
          </View>
          
          <View style={[styles.breakdownItem, styles.totalRow]}>
            <Text style={styles.totalRowLabel}>Total</Text>
            <Text style={styles.totalRowValue}>₹{current.amount}</Text>
          </View>
        </View>

        {/* Withdrawal Button */}
        <TouchableOpacity style={styles.withdrawButton}>
          <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
        </TouchableOpacity>

        {/* Recent Trips */}
        <View style={styles.recentCard}>
          <Text style={styles.cardTitle}>Recent Trips</Text>
          
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.tripItem}>
              <View style={styles.tripIcon}>
                <MaterialIcons name="local-taxi" size={20} color={colors.primary} />
              </View>
              <View style={styles.tripDetails}>
                <Text style={styles.tripTime}>Today, 3:30 PM</Text>
                <Text style={styles.tripRoute}>Connaught Place → Saket</Text>
              </View>
              <Text style={styles.tripAmount}>₹245</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.onBackground,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.lg,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.surface,
  },
  periodText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  periodTextActive: {
    color: colors.primary,
  },
  mainCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  totalLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    ...typography.h1,
    color: colors.earnings,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.divider,
  },
  statValue: {
    ...typography.h4,
    color: colors.onBackground,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  breakdownCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  breakdownLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  breakdownValue: {
    ...typography.bodyMd,
    color: colors.onBackground,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalRowLabel: {
    ...typography.bodyLg,
    color: colors.onBackground,
    fontWeight: '600',
  },
  totalRowValue: {
    ...typography.bodyLg,
    color: colors.earnings,
    fontWeight: '700',
  },
  withdrawButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  withdrawButtonText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: '600',
  },
  recentCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tripIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.round,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  tripDetails: {
    flex: 1,
  },
  tripTime: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
  tripRoute: {
    ...typography.bodyMd,
    color: colors.onBackground,
    marginTop: 2,
  },
  tripAmount: {
    ...typography.bodyLg,
    color: colors.earnings,
    fontWeight: '600',
  },
});