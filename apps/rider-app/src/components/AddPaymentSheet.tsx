import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import PrimaryButton from './PrimaryButton';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';

export type NewPayment = {
  kind: 'upi' | 'card';
  label: string;
  sub: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

type Kind = 'upi' | 'card';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdd: (payment: NewPayment) => void;
  defaultKind?: Kind;
};

/** Add a UPI ID or a card; on submit hands a ready-to-display payment option to the parent. */
export default function AddPaymentSheet({ visible, onClose, onAdd, defaultKind = 'upi' }: Props) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [value, setValue] = useState('');

  const reset = () => {
    setKind(defaultKind);
    setValue('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const trimmed = value.trim();
  const valid =
    kind === 'upi'
      ? /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(trimmed)
      : trimmed.replace(/\s/g, '').length >= 12;

  const submit = () => {
    if (!valid) return;
    if (kind === 'upi') {
      onAdd({ kind, label: `UPI • ${trimmed}`, sub: 'UPI ID', icon: 'account-balance-wallet' });
    } else {
      const digits = trimmed.replace(/\D/g, '');
      onAdd({ kind, label: `Card •••• ${digits.slice(-4)}`, sub: 'Debit/Credit card', icon: 'credit-card' });
    }
    close();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.dragHandle} />
          <Text style={styles.title}>Add payment method</Text>

          {/* Kind toggle */}
          <View style={styles.segment}>
            {(['upi', 'card'] as Kind[]).map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.segmentItem, kind === k && styles.segmentItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  setKind(k);
                  setValue('');
                }}
              >
                <Text style={[styles.segmentText, kind === k && styles.segmentTextActive]}>
                  {k === 'upi' ? 'UPI ID' : 'Card'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={kind === 'upi' ? 'name@bank' : '1234 5678 9012 3456'}
            placeholderTextColor={colors.onSurfaceVariant}
            autoCapitalize="none"
            keyboardType={kind === 'upi' ? 'email-address' : 'number-pad'}
            autoFocus
          />

          <PrimaryButton
            label="Add method"
            icon="check"
            onPress={submit}
            disabled={!valid}
            style={{ marginTop: spacing.md }}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  title: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.md },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.default,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  segmentItemActive: {
    backgroundColor: colors.surfaceContainerLowest,
    ...elevation.level1,
  },
  segmentText: { ...typography.buttonLg, color: colors.onSurfaceVariant },
  segmentTextActive: { color: colors.primary },
  input: {
    ...typography.bodyLg,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.default,
    paddingHorizontal: spacing.md,
    height: 56,
  },
});
