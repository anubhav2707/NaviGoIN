import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapBackground from '../components/MapBackground';
import { colors, spacing, typography, radii, shadows } from '../theme/theme';

export default function HomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(2450);
  const [todayTrips, setTodayTrips] = useState(12);

  return (
    <SafeAreaView style={styles.container}>
      <MapBackground>
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
            
            {isOnline && (
              <Text style={styles.statusSubtitle}>
                Waiting for trip requests...
              </Text>
            )}
          </View>

          {/* Today's Earnings */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsValue}>₹{todayEarnings}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.earningsItem}>
                <Text style={styles.earningsLabel}>Trips</Text>
                <Text style={styles.earningsValue}>{todayTrips}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            {isOnline ? (
              <View>
                <Text style={styles.sheetTitle}>Nearby Areas</Text>
                <View style={styles.areasList}>
                  <View style={styles.areaItem}>
                    <MaterialIcons name="location-on" size={20} color={colors.primary} />
                    <Text style={styles.areaText}>Connaught Place - High demand</Text>
                  </View>
                  <View style={styles.areaItem}>
                    <MaterialIcons name="location-on" size={20} color={colors.secondary} />
                    <Text style={styles.areaText}>Saket - Moderate demand</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.sheetTitle}>Go Online to Start Earning</Text>
                <Text style={styles.offlineText}>
                  Toggle the switch above to start receiving trip requests
                </Text>
              </View>
            )}
          </View>
        </View>
      </MapBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    zIndex: 3,
  },
  statusCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    ...typography.h4,
    color: colors.onBackground,
  },
  statusSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  earningsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  earningsValue: {
    ...typography.h3,
    color: colors.earnings,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadows.lg,
  },
  sheetTitle: {
    ...typography.h4,
    color: colors.onBackground,
    marginBottom: spacing.md,
  },
  areasList: {
    gap: spacing.md,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  areaText: {
    ...typography.bodyMd,
    color: colors.onBackground,
    flex: 1,
  },
  offlineText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});