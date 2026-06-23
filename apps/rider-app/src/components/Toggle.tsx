import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../theme/theme';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  /** Track color when on — black (primary) for settings, blue (secondary) for safety. */
  activeColor?: string;
};

export default function Toggle({ value, onValueChange, activeColor = colors.primary }: Props) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.track, { backgroundColor: value ? activeColor : colors.surfaceVariant }]}
      hitSlop={8}
    >
      <View style={[styles.thumb, value && styles.thumbOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});
