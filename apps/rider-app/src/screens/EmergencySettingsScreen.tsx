import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import SafetySettings from '../components/SafetySettings';
import { colors } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencySettings'>;

// Pushed variant of the safety toolkit (reached from the in-ride Safety shortcut).
export default function EmergencySettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <TopBar title="Emergency Settings" onBack={() => navigation.goBack()} />
      <SafetySettings showContactsLink />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
