import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radii, spacing, typography } from '../theme/theme';

export type Option = {
  id: string;
  label: string;
  sub?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** Optional dashed action rendered below the list (e.g. "Add new payment method"). */
  addLabel?: string;
  onAdd?: () => void;
};

/** Lightweight bottom-sheet picker used for payment-method and coupon selection. */
export default function OptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  addLabel,
  onAdd,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.title}>{title}</Text>
        {options.map((opt) => {
          const active = opt.id === selectedId;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.row, active && styles.rowActive]}
              activeOpacity={0.7}
              onPress={() => {
                onSelect(opt.id);
                onClose();
              }}
            >
              <View style={styles.rowLeft}>
                {opt.icon && (
                  <View style={styles.iconWrap}>
                    <MaterialIcons
                      name={opt.icon}
                      size={22}
                      color={active ? colors.secondary : colors.primary}
                    />
                  </View>
                )}
                <View>
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  {opt.sub && <Text style={styles.rowSub}>{opt.sub}</Text>}
                </View>
              </View>
              <MaterialIcons
                name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={22}
                color={active ? colors.secondary : colors.outline}
              />
            </TouchableOpacity>
          );
        })}

        {onAdd && (
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={onAdd}>
            <MaterialIcons name="add-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.addText}>{addLabel ?? 'Add new'}</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: spacing.sm,
  },
  rowActive: { borderColor: colors.secondary, backgroundColor: 'rgba(45,91,255,0.06)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  rowSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    marginTop: spacing.xs,
  },
  addText: { ...typography.buttonLg, color: colors.primary },
});

