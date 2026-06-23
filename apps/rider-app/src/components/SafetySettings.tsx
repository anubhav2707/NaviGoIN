import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Toggle from './Toggle';
import { callNumber } from '../lib/actions';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Control = {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  sub: string;
  danger?: boolean;
  defaultOn: boolean;
};

const CONTROLS: Control[] = [
  { id: 'sos', icon: 'emergency', title: 'SOS Button Visibility', sub: 'Persistent on-screen emergency button', danger: true, defaultOn: true },
  { id: 'checkin', icon: 'location-searching', title: 'Safety Check-ins', sub: "We'll text if trip stops unexpectedly", defaultOn: true },
  { id: 'night', icon: 'dark-mode', title: 'Night Trip Alerts', sub: 'Auto-share location after 10:00 PM', defaultOn: false },
  { id: 'pin', icon: 'pin', title: 'Mandatory Ride PIN', sub: 'Verify driver before trip starts', defaultOn: true },
];

/** Shared safety-toolkit body used by both the Safety tab and the pushed Emergency Settings screen. */
export default function SafetySettings({ showContactsLink = true }: { showContactsLink?: boolean }) {
  const navigation = useNavigation<Nav>();
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(CONTROLS.map((c) => [c.id, c.defaultOn])),
  );

  const setToggle = (id: string, value: boolean) =>
    setToggles((prev) => ({ ...prev, [id]: value }));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.scoreCard, elevation.level1]}>
        <View style={styles.scoreHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreTitle}>Safety Toolkit</Text>
            <Text style={styles.scoreSub}>Customize your security layers for every trip.</Text>
          </View>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
        </View>
        <View style={styles.scoreTrack}>
          <View style={styles.scoreFill} />
        </View>
        <Text style={styles.scoreLabel}>80% Profile Safety Score</Text>
      </View>

      <Text style={styles.sectionLabel}>RIDE SAFETY CONTROLS</Text>
      {CONTROLS.map((control) => (
        <View key={control.id} style={[styles.controlRow, elevation.level1]}>
          <View style={styles.controlLeft}>
            <View style={[styles.controlIcon, control.danger && styles.controlIconDanger]}>
              <MaterialIcons
                name={control.icon}
                size={20}
                color={control.danger ? colors.error : colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.controlTitle}>{control.title}</Text>
              <Text style={styles.controlSub}>{control.sub}</Text>
            </View>
          </View>
          <Toggle value={toggles[control.id]} onValueChange={(v) => setToggle(control.id, v)} />
        </View>
      ))}

      {showContactsLink && (
        <TouchableOpacity
          style={[styles.linkRow, elevation.level1]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('TrustedContacts')}
        >
          <View style={styles.controlLeft}>
            <View style={styles.controlIcon}>
              <MaterialIcons name="group" size={20} color={colors.primary} />
            </View>
            <Text style={styles.controlTitle}>Trusted Contacts</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}

      <Text style={styles.sectionLabel}>LOCAL EMERGENCY SERVICES</Text>
      <View style={styles.servicesRow}>
        <TouchableOpacity
          style={[styles.serviceCard, elevation.level1]}
          activeOpacity={0.8}
          onPress={() => callNumber('100')}
        >
          <MaterialIcons name="local-police" size={28} color={colors.primary} />
          <Text style={styles.serviceTitle}>Police</Text>
          <Text style={styles.serviceSub}>Call 100</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.serviceCard, elevation.level1]}
          activeOpacity={0.8}
          onPress={() => callNumber('102')}
        >
          <MaterialIcons name="medical-services" size={28} color={colors.primary} />
          <Text style={styles.serviceTitle}>Medical</Text>
          <Text style={styles.serviceSub}>Call 102</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Help is one tap away.</Text>
        <Text style={styles.bannerSub}>
          Our dedicated safety team is available 24/7 to assist you during your rides.
        </Text>
        <TouchableOpacity
          style={styles.bannerButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Text style={styles.bannerButtonText}>Learn about Safety</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },
  scoreCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  scoreTitle: { ...typography.headlineSm, color: colors.primary },
  scoreSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  activePill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  activePillText: { ...typography.labelMd, color: colors.onSecondaryContainer },
  scoreTrack: {
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  scoreFill: { width: '80%', height: '100%', backgroundColor: colors.secondary },
  scoreLabel: { ...typography.labelMd, color: colors.secondary, marginTop: spacing.sm },

  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  controlLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  controlIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconDanger: { backgroundColor: colors.errorContainer },
  controlTitle: { ...typography.bodyMd, color: colors.primary },
  controlSub: { ...typography.bodySm, color: colors.onSurfaceVariant },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },

  servicesRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  serviceCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  serviceTitle: { ...typography.buttonLg, color: colors.primary },
  serviceSub: { ...typography.labelMd, color: colors.onSurfaceVariant },

  banner: { backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.lg },
  bannerTitle: { ...typography.headlineSm, color: colors.onPrimary, marginBottom: spacing.sm },
  bannerSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.md },
  bannerButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.default,
    alignSelf: 'flex-start',
  },
  bannerButtonText: { ...typography.buttonLg, color: colors.primary },
});
