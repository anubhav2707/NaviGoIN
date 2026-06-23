import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme/theme';

type Props = { title: string; note: string };

/** Temporary stand-in until the matching Stitch screen is converted. */
export default function PlaceholderScreen({ title, note }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.xl,
  },
  title: { ...typography.headlineMd, color: colors.onBackground, marginBottom: spacing.sm },
  note: { ...typography.bodyMd, color: colors.onSurfaceVariant },
});
