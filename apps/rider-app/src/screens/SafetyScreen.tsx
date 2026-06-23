import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import SafetySettings from '../components/SafetySettings';
import { colors, spacing, typography } from '../theme/theme';

export default function SafetyScreen() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Safety</Text>
          <MaterialIcons name="shield" size={24} color={colors.error} />
        </View>
      </SafeAreaView>
      <SafetySettings />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
  },
  title: { ...typography.headlineMd, color: colors.primary, fontWeight: '700' },
});
