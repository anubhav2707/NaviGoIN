import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, elevation, radii, spacing, typography } from '../theme/theme';

type Props = {
  title?: string;
  onBack?: () => void;
  /** Transparent floats over a map; surface sits on a solid background. */
  variant?: 'surface' | 'transparent';
  right?: React.ReactNode;
  backIcon?: keyof typeof MaterialIcons.glyphMap;
  style?: ViewStyle;
};

export default function TopBar({
  title,
  onBack,
  variant = 'surface',
  right,
  backIcon = 'arrow-back',
  style,
}: Props) {
  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.root,
        variant === 'surface' && styles.surface,
        style,
      ]}
    >
      <View style={styles.row}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
              <MaterialIcons name={backIcon} size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconButton} />
          )}
        </View>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
        <View style={styles.sideRight}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 50 },
  surface: { backgroundColor: colors.surface },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  side: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  // Right slot sizes to its content (e.g. the "Route Preview" pill) but stays
  // at least as wide as the left slot so a centered title remains centered.
  sideRight: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.level1,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.headlineSm,
    color: colors.primary,
  },
});
