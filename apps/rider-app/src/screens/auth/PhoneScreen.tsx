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
              <MaterialIcons name="local-taxi" size={28} color={colors.onPrimary} />
            </View>
            <Text style={styles.brand}>NaviGoIn</Text>
          </View>

          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>We'll send you a one-time verification code.</Text>

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
            label="Continue"
            onPress={onContinue}
            disabled={!valid}
            loading={loading}
          />
          <Text style={styles.terms}>
            By continuing, you agree to NaviGoIn's{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.xxl },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  brand: { ...typography.headlineLg, color: colors.primary, fontWeight: '700' },
  title: { ...typography.headlineMd, color: colors.onBackground, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyLg, color: colors.onSurfaceVariant, marginBottom: spacing.xl },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  prefix: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.outline,
  },
  prefixText: { ...typography.bodyLg, color: colors.onSurface },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  footer: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },
  terms: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  link: { color: colors.primary, textDecorationLine: 'underline' },
});