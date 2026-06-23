import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AddPaymentSheet, { type NewPayment } from '../components/AddPaymentSheet';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Upi = { id: string; name: string; handle: string; icon: keyof typeof MaterialIcons.glyphMap };

const UPI_ACCOUNTS: Upi[] = [
  { id: 'gpay', name: 'Google Pay', handle: 'alex.j@okgoogle', icon: 'account-balance-wallet' },
  { id: 'phonepe', name: 'PhonePe', handle: '9876543210@ybl', icon: 'account-balance-wallet' },
  { id: 'paytm', name: 'Paytm', handle: 'alexj@paytm', icon: 'payments' },
];

type Txn = { id: string; title: string; meta: string; amount: string; status: 'Success' | 'Refunded'; icon: keyof typeof MaterialIcons.glyphMap };

const TRANSACTIONS: Txn[] = [
  { id: '1', title: 'Ride to Terminal 2', meta: 'Today, 2:45 PM • Google Pay', amount: '₹452.00', status: 'Success', icon: 'directions-car' },
  { id: '2', title: 'Ride to Koramangala', meta: 'Yesterday • PhonePe', amount: '₹85.00', status: 'Success', icon: 'two-wheeler' },
  { id: '3', title: 'Ride to Indiranagar', meta: '22 Oct • Paytm', amount: '₹320.00', status: 'Refunded', icon: 'local-taxi' },
];

export default function PaymentsScreen() {
  const navigation = useNavigation<Nav>();
  const [accounts, setAccounts] = useState<Upi[]>(UPI_ACCOUNTS);
  const [selectedUpi, setSelectedUpi] = useState('gpay');
  const [addingUpi, setAddingUpi] = useState(false);

  const addUpi = (method: NewPayment) => {
    const id = `upi_${Date.now()}`;
    // Only UPI handles belong in this list; cards live on the Saved Cards screen.
    const handle = method.kind === 'upi' ? method.label.replace(/^UPI • /, '') : method.label;
    setAccounts((prev) => [...prev, { id, name: 'UPI ID', handle, icon: 'account-balance-wallet' }]);
    setSelectedUpi(id);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Payments</Text>
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
        {/* UPI hero card */}
        <View style={[styles.heroCard, elevation.level2]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>DEFAULT UPI ID</Text>
              <Text style={styles.heroValue}>alex.johnson@okaxis</Text>
            </View>
            <MaterialIcons name="contactless" size={32} color="rgba(255,255,255,0.5)" />
          </View>
          <View style={styles.verifiedPill}>
            <MaterialIcons name="verified" size={14} color={colors.onSecondary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Linked UPI IDs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Linked UPI IDs</Text>
          <Text style={styles.sectionMeta}>{accounts.length} Accounts</Text>
        </View>
        {accounts.map((upi) => {
          const active = upi.id === selectedUpi;
          return (
            <TouchableOpacity
              key={upi.id}
              style={[styles.upiRow, active && styles.upiRowActive]}
              activeOpacity={0.8}
              onPress={() => setSelectedUpi(upi.id)}
            >
              <View style={styles.upiLeft}>
                <View style={styles.upiIcon}>
                  <MaterialIcons name={upi.icon} size={22} color={active ? colors.secondary : colors.primary} />
                </View>
                <View>
                  <Text style={styles.upiName}>{upi.name}</Text>
                  <Text style={styles.upiHandle}>{upi.handle}</Text>
                </View>
              </View>
              <MaterialIcons
                name={active ? 'check-circle' : 'more-vert'}
                size={22}
                color={active ? colors.secondary : colors.outline}
              />
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={() => setAddingUpi(true)}>
          <MaterialIcons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.addButtonText}>Add New UPI ID</Text>
        </TouchableOpacity>

        {/* Saved cards link */}
        <TouchableOpacity
          style={[styles.linkRow, elevation.level1]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SavedCards')}
        >
          <View style={styles.upiLeft}>
            <View style={styles.upiIcon}>
              <MaterialIcons name="credit-card" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.upiName}>Saved Cards</Text>
              <Text style={styles.upiHandle}>Visa ending in 4242</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Activity' })}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.txnCard, elevation.level1]}>
          {TRANSACTIONS.map((txn, i) => (
            <View
              key={txn.id}
              style={[styles.txnRow, i < TRANSACTIONS.length - 1 && styles.txnRowBorder]}
            >
              <View style={styles.txnLeft}>
                <View style={styles.txnIcon}>
                  <MaterialIcons name={txn.icon} size={18} color={colors.onPrimary} />
                </View>
                <View>
                  <Text style={styles.txnTitle}>{txn.title}</Text>
                  <Text style={styles.txnMeta}>{txn.meta}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txnAmount}>{txn.amount}</Text>
                <Text
                  style={[
                    styles.txnStatus,
                    { color: txn.status === 'Success' ? colors.success : colors.onSurfaceVariant },
                  ]}
                >
                  {txn.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AddPaymentSheet visible={addingUpi} onClose={() => setAddingUpi(false)} onAdd={addUpi} />
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
  title: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  heroLabel: { ...typography.labelMd, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
  heroValue: { ...typography.headlineSm, color: colors.onSecondary, marginTop: 4 },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  verifiedText: { ...typography.labelMd, color: colors.onSecondary },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { ...typography.headlineSm, color: colors.primary },
  sectionMeta: { ...typography.labelMd, color: colors.secondary },
  sectionLink: { ...typography.labelMd, color: colors.secondary },

  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  upiRowActive: { borderColor: colors.secondary, backgroundColor: 'rgba(45,91,255,0.06)' },
  upiLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  upiIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiName: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  upiHandle: { ...typography.bodySm, color: colors.onSurfaceVariant },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceContainerHigh,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  addButtonText: { ...typography.buttonLg, color: colors.primary },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
  },

  txnCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  txnRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  txnLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnTitle: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  txnMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  txnAmount: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  txnStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
});
