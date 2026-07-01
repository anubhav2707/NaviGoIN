import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../auth/AuthContext';
import { colors, radii, spacing, typography } from '../../theme/theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Phone'>;

export default function PhoneScreen({ navigation }: Props) {
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === 10;

  const onContinue = async () => {
    if (!valid) return;
    setLoading(true);
    const fullPhone = `+91${digits}`;
    try {
      const { existingUser, devCode } = await requestOtp(fullPhone);
      navigation.navigate('Otp', { phone: fullPhone, existingUser, devCode });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <MaterialIcons name="directions-car" size={28} color={colors.onPrimary} />
            </View>
            <Text style={styles.brand}>RideNow Driver</Text>
          </View>

          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>Start earning by driving with RideNow</Text>

          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Continue"
            onPress={onContinue}
            disabled={!valid}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  brand: {
    ...typography.h2,
    color: colors.onBackground,
  },
  title: {
    ...typography.h3,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prefix: {
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  prefixText: {
    ...typography.bodyMd,
    color: colors.onBackground,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMd,
    color: colors.onBackground,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});