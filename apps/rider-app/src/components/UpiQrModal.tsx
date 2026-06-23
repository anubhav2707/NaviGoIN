import React from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import TopBar from './TopBar';
import PrimaryButton from './PrimaryButton';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';

export type UpiQr = { qrPngB64: string; payeeVpa: string; amount: number };

type Props = {
  visible: boolean;
  qr: UpiQr | null;
  onPaid: () => void;
  onClose: () => void;
};

// Shows a UPI QR the rider scans with any UPI app to pay the fare into the
// merchant VPA. "I've paid" closes the trip (a real build confirms via webhook).
export default function UpiQrModal({ visible, qr, onPaid, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <TopBar title="Scan to pay" onBack={onClose} backIcon="close" />
        <View style={styles.content}>
          {qr ? (
            <>
              <View style={[styles.qrCard, elevation.level1]}>
                <Image
                  style={styles.qr}
                  source={{ uri: `data:image/png;base64,${qr.qrPngB64}` }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.amount}>₹{qr.amount.toFixed(2)}</Text>
              <View style={styles.vpaRow}>
                <MaterialIcons name="account-balance-wallet" size={18} color={colors.secondary} />
                <Text style={styles.vpa}>{qr.payeeVpa}</Text>
              </View>
              <Text style={styles.hint}>
                Open any UPI app (GPay, PhonePe, Paytm) and scan this code to pay the fare.
              </Text>
            </>
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton label="I've paid" icon="check" onPress={onPaid} disabled={!qr} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  qrCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  qr: { width: 240, height: 240 },
  amount: { ...typography.displayLg, color: colors.primary, marginTop: spacing.md },
  vpaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vpa: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  hint: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm },
  footer: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.lg },
});
