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
          shareMessage('Join me on NaviGoIn! Use my code NAVI100 for ₹100 off your first ride.'),
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
              <MaterialIcons name="person" size={28} color={colors.onPrimary} />
            </View>
            <View>
              <Text style={styles.heroName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.heroPhone}>{user?.phone || '+91 98765 43210'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.heroEdit}>
            <MaterialIcons name="edit" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu sections */}
        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.heading && <Text style={styles.sectionHeading}>{section.heading}</Text>}
            <View style={[styles.sectionCard, elevation.level1]}>
              {section.items.map((item, j) => (
                <TouchableOpacity
                  key={j}
                  style={[
                    styles.menuItem,
                    j < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => item.onPress?.(navigation)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={item.danger ? colors.error : colors.primary}
                    />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, item.danger && styles.menuTitleDanger]}>
                      {item.title}
                    </Text>
                    {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={async () => {
            const ok = await confirm('Sign Out', 'Are you sure you want to sign out?');
            if (ok) signOut();
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>NaviGoIn v1.0.0</Text>
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
  content: { paddingBottom: spacing.xxl },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.marginMobile,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { ...typography.bodyLg, color: colors.onSurface, fontWeight: '600' },
  heroPhone: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  heroEdit: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginBottom: spacing.lg },
  sectionHeading: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing.marginMobile,
    marginBottom: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.marginMobile,
    borderRadius: radii.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: colors.errorContainer },
  menuContent: { flex: 1 },
  menuTitle: { ...typography.bodyLg, color: colors.onSurface },
  menuTitleDanger: { color: colors.error },
  menuSub: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.marginMobile,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radii.md,
  },
  signOutText: { ...typography.labelLg, color: colors.error },
  version: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});