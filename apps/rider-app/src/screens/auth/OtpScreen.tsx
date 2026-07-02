import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../../components/TopBar';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../auth/AuthContext';
import { colors, radii, spacing, typography } from '../../theme/theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;

const OTP_LENGTH = 6;

export default function OtpScreen({ navigation, route }: Props) {
  const { phone, existingUser } = route.params;
  const { verifyOtp, requestOtp } = useAuth();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [devCode, setDevCode] = useState(route.params.devCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const hiddenInput = useRef<TextInput>(null);

  // Resend countdown.
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const needsName = !existingUser;
  const canVerify = code.length === OTP_LENGTH && (!needsName || name.trim().length >= 2);

  const onVerify = async () => {
    if (!canVerify) return;
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, code, needsName ? name : undefined);
      // On success the AuthProvider sets the user and the app swaps to the main stack.
    } catch {
      setError('That code is incorrect. Please try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    const res = await requestOtp(phone);
    setDevCode(res.devCode);
    setSeconds(30);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <TopBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the code sent to {phone}
          </Text>

          {devCode && (
            <View style={styles.devBox}>
              <Text style={styles.devText}>Dev Code: {devCode}</Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => hiddenInput.current?.focus()}
            style={styles.codeContainer}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  i === code.length && styles.codeBoxActive,
                  error && styles.codeBoxError,
                ]}
              >
                <Text style={styles.codeText}>{code[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          <TextInput
            ref={hiddenInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            style={styles.hiddenInput}
            autoFocus
          />

          {error && <Text style={styles.error}>{error}</Text>}

          {needsName && (
            <>
              <Text style={styles.nameLabel}>What's your name?</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="words"
              />
            </>
          )}

          <TouchableOpacity
            onPress={onResend}
            disabled={seconds > 0}
            style={styles.resendButton}
          >
            <Text style={[styles.resendText, seconds > 0 && styles.resendDisabled]}>
              {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottom}>
          <PrimaryButton
            title="Verify"
            onPress={onVerify}
            loading={loading}
            disabled={!canVerify}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.marginMobile },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xl,
  },
  devBox: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  devText: {
    ...typography.labelLg,
    color: colors.onTertiaryContainer,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  codeBoxError: {
    borderColor: colors.error,
  },
  codeText: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  hiddenInput: {
    position: 'absolute',
    left: -9999,
    opacity: 0,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    marginBottom: spacing.md,
  },
  nameLabel: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.xl,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.onSurfaceVariant,
  },
  bottom: { padding: spacing.marginMobile },
});