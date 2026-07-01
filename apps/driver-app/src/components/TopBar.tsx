import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme/theme';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
}

export default function TopBar({ title, onBack, rightIcon, onRightPress }: TopBarProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onBackground} />
          </TouchableOpacity>
        )}
        
        {title && <Text style={styles.title}>{title}</Text>}
        
        {rightIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
            <MaterialIcons name={rightIcon} size={24} color={colors.onBackground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.onBackground,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    padding: spacing.xs,
  },
});