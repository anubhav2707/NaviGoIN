import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../theme/theme';

export type PayMethod = 'cash' | 'online' | 'qr';

type Props = {
  visible: boolean;
  amount: number;
  onSelect: (method: PayMethod) => void;
  onClose: () => void;
};

type Row = {
  method: PayMethod;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const ROWS: Row[] = [
  { method: 'cash', icon: 'payments', title: 'Cash', subtitle: 'Pay the driver directly' },
  { method: 'online', icon: 'credit-card', title: 'UPI / Card', subtitle: 'Pay online via Razorpay' },
  { method: 'qr', icon: 'qr-code-2', title: 'Scan & Pay', subtitle: 'Show a UPI QR to pay' },
];

export default function PaymentMethodSheet({ visible, amount, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.title}>Pay ₹{Math.round(amount)}</Text>
        <Text style={styles.subtitle}>Choose how you'd like to pay for this trip.</Text>

        {ROWS.map((row) => (
          <TouchableOpacity
            key={row.method}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => onSelect(row.method)}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconWrap}>
                <MaterialIcons name={row.icon} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{row.title}</Text>
                <Text style={styles.rowSub}>{row.subtitle}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headlineSm, color: colors.primary },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  rowSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
