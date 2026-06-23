import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation, radii, spacing, typography } from '../theme/theme';

type Props = {
  label: string;
  onPress?: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: 'primary' | 'error';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

// Pure black full-width CTA per DESIGN.md (no gradient, 12px radius).
export default function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const bg = variant === 'error' ? colors.error : colors.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.button, { backgroundColor: bg }, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          {icon && <MaterialIcons name={icon} size={20} color={colors.onPrimary} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level2,
  },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.buttonLg, color: colors.onPrimary },
});
