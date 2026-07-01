import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, typography, radii, shadows } from '../theme/theme';

type MenuItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();

  const menuItems: MenuItem[] = [
    {
      icon: 'person',
      title: 'Edit Profile',
      subtitle: 'Update your information',
      onPress: () => {},
    },
    {
      icon: 'description',
      title: 'Documents',
      subtitle: 'License, RC, Insurance',
      onPress: () => {},
    },
    {
      icon: 'directions-car',
      title: 'Vehicle Details',
      subtitle: 'Manage vehicle information',
      onPress: () => {},
    },
    {
      icon: 'account-balance',
      title: 'Bank Account',
      subtitle: 'Manage withdrawal settings',
      onPress: () => {},
    },
    {
      icon: 'help-outline',
      title: 'Help & Support',
      subtitle: 'Get help with your account',
      onPress: () => {},
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={12} color={colors.warning} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
          <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>523</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>2Y</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon} size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
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
  profileCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: colors.onPrimary,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.round,
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  ratingText: {
    ...typography.labelSm,
    color: colors.onBackground,
    marginLeft: 2,
  },
  userName: {
    ...typography.h4,
    color: colors.onBackground,
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h4,
    color: colors.onBackground,
    fontWeight: '600',
  },
  statLabel: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
  },
  menuContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.round,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...typography.bodyMd,
    color: colors.onBackground,
    fontWeight: '500',
  },
  menuSubtitle: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    ...typography.bodyMd,
    color: colors.error,
    fontWeight: '500',
    marginLeft: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  version: {
    ...typography.caption,
    color: colors.onSurfaceVariant,
  },
});