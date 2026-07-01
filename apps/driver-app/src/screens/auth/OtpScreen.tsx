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

  // Resend countdown
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
      // Auth context handles navigation
    } catch {
      setError('Invalid code. Please try again.');
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
            We sent a verification code to {phone}
          </Text>
          
          {devCode && (
            <View style={styles.devCode}>
              <Text style={styles.devCodeText}>Dev Code: {devCode}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.codeContainer}
            onPress={() => hiddenInput.current?.focus()}
            activeOpacity={0.8}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View key={i} style={styles.codeBox}>
                <Text style={styles.codeText}>{code[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          <TextInput
            ref={hiddenInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            style={styles.hiddenInput}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          {needsName && (
            <View style={styles.nameContainer}>
              <Text style={styles.nameLabel}>Your name</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="words"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={onResend}
            disabled={seconds > 0}
            style={styles.resend}
          >
            <Text style={[styles.resendText, seconds > 0 && styles.resendDisabled]}>
              {seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Verify"
            onPress={onVerify}
            disabled={!canVerify}
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
    paddingTop: spacing.xl,
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
  devCode: {
    backgroundColor: colors.info,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  devCodeText: {
    ...typography.labelLg,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    ...typography.h4,
    color: colors.onBackground,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  error: {
    ...typography.bodySm,
    color: colors.error,
    marginBottom: spacing.md,
  },
  nameContainer: {
    marginBottom: spacing.lg,
  },
  nameLabel: {
    ...typography.labelLg,
    color: colors.onBackground,
    marginBottom: spacing.sm,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyMd,
    color: colors.onBackground,
  },
  resend: {
    alignSelf: 'center',
    padding: spacing.md,
  },
  resendText: {
    ...typography.labelLg,
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.onSurfaceVariant,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});