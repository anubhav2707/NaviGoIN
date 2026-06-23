import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { shareMessage, confirm } from '../lib/actions';
import { useAuth } from '../auth/AuthContext';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MenuItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  sub?: string;
  danger?: boolean;
  onPress?: (nav: Nav) => void;
};

type MenuSection = { heading?: string; items: MenuItem[] };

const SECTIONS: MenuSection[] = [
  {
    heading: 'PAYMENT METHODS',
    items: [
      { icon: 'account-balance-wallet', title: 'UPI Payments', sub: 'Google Pay, PhonePe', onPress: (n) => n.navigate('Tabs', { screen: 'Payments' }) },
      { icon: 'credit-card', title: 'Saved Cards', sub: 'Visa ending in 4242', onPress: (n) => n.navigate('SavedCards') },
    ],
  },
  {
    heading: 'SAFETY',
    items: [
      { icon: 'group', title: 'Trusted Contacts', onPress: (n) => n.navigate('TrustedContacts') },
      { icon: 'emergency', title: 'Emergency Settings', danger: true, onPress: (n) => n.navigate('EmergencySettings') },
    ],
  },
  {
    items: [
      { icon: 'support-agent', title: 'Support', onPress: (n) => n.navigate('HelpSupport') },
      {
        icon: 'redeem',
        title: 'Referrals',
        sub: 'Earn ₹100 for each friend',
        onPress: () =>
          shareMessage('Join me on RideNow! Use my code RIDE100 for ₹100 off your first ride.'),
      },
    ],
  },
];

export default function AccountScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.brand}>Account</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile hero */}
        <View style={[styles.hero, elevation.level1]}>
          <View style={styles.heroLeft}>
            <View style={styles.heroAvatar}>
              <MaterialIcons name="person" size={32} color={colors.onSurfaceVariant} />
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            </View>
            <View>
              <Text style={styles.heroName}>{user?.name ?? 'Rider'}</Text>
              <Text style={styles.heroMeta}>{user?.phone ?? ''} • Rating 4.9</Text>
            </View>
          </View>
          <View style={styles.ratingPill}>
            <MaterialIcons name="star" size={16} color="#f5b400" />
            <Text style={styles.ratingValue}>4.9</Text>
          </View>
        </View>

        {/* Menu sections */}
        {SECTIONS.map((section, si) => (
          <View key={si} style={[styles.section, elevation.level1]}>
            {section.heading && (
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionHeadingText}>{section.heading}</Text>
              </View>
            )}
            {section.items.map((item, ii) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.menuRow, ii < section.items.length - 1 && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={() => item.onPress?.(navigation)}
              >
                <View style={styles.menuLeft}>
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={item.danger ? colors.error : colors.primary}
                  />
                  <View>
                    <Text style={[styles.menuTitle, item.danger && { color: colors.error }]}>
                      {item.title}
                    </Text>
                    {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={styles.signOut}
          activeOpacity={0.6}
          onPress={() =>
            confirm('Sign out?', 'You will need to log in again to book rides.', signOut, 'Sign out')
          }
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  brand: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -6,
    right: -10,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  premiumText: { fontSize: 8, fontWeight: '700', color: colors.onSecondary, letterSpacing: 0.5 },
  heroName: { ...typography.headlineSm, color: colors.primary },
  heroMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  ratingValue: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },

  section: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionHeading: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  sectionHeadingText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '700' },
  menuSub: { ...typography.bodySm, color: colors.onSurfaceVariant },

  signOut: { paddingVertical: spacing.lg, alignItems: 'center' },
  signOutText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textDecorationLine: 'underline',
  },
});
