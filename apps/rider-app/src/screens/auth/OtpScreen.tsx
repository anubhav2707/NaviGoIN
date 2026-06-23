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
            Enter the 6-digit code sent to <Text style={styles.phone}>{phone}</Text>
          </Text>

          {/* Tapping the boxes focuses a single hidden input that holds the code. */}
          <TouchableOpacity activeOpacity={1} onPress={() => hiddenInput.current?.focus()}>
            <View style={styles.boxesRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <View key={i} style={[styles.box, i === code.length && styles.boxActive]}>
                  <Text style={styles.boxText}>{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
          <TextInput
            ref={hiddenInput}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
          />

          {devCode && (
            <TouchableOpacity style={styles.devHint} onPress={() => setCode(devCode)} activeOpacity={0.7}>
              <Text style={styles.devHintText}>Dev code: {devCode} — tap to autofill</Text>
            </TouchableOpacity>
          )}

          {needsName && (
            <View style={styles.nameBlock}>
              <Text style={styles.nameLabel}>Your name</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Sambhav"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="words"
              />
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendMuted}>Resend code in {seconds}s</Text>
            ) : (
              <TouchableOpacity onPress={onResend} activeOpacity={0.7}>
                <Text style={styles.resendActive}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Verify & Continue"
            icon="check"
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
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.marginMobile, paddingTop: spacing.lg },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.xl },
  phone: { color: colors.onSurface, fontWeight: '700' },

  boxesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  box: {
    flex: 1,
    height: 56,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary },
  boxText: { ...typography.headlineMd, color: colors.onSurface },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  devHint: { marginTop: spacing.md, alignSelf: 'flex-start' },
  devHintText: { ...typography.bodySm, color: colors.secondary },

  nameBlock: { marginTop: spacing.xl },
  nameLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  nameInput: {
    height: 56,
    ...typography.bodyLg,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.default,
    paddingHorizontal: spacing.md,
  },

  error: { ...typography.bodySm, color: colors.error, marginTop: spacing.md },
  resendRow: { marginTop: spacing.lg },
  resendMuted: { ...typography.bodySm, color: colors.onSurfaceVariant },
  resendActive: { ...typography.bodyMd, color: colors.secondary, fontWeight: '600' },

  footer: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.lg },
});
