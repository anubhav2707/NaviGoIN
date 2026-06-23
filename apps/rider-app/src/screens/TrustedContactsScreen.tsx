import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import Toggle from '../components/Toggle';
import PrimaryButton from '../components/PrimaryButton';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrustedContacts'>;

type Contact = {
  id: string;
  initials: string;
  name: string;
  relation: string;
  phone: string;
  autoShare: boolean;
};

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', initials: 'AJ', name: 'Anjali Johnson', relation: 'Family', phone: '+91 98765 43210', autoShare: true },
  { id: '2', initials: 'RK', name: 'Rohan Kapoor', relation: 'Friend', phone: '+91 88990 11223', autoShare: false },
];

export default function TrustedContactsScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const toggleShare = (id: string, value: boolean) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, autoShare: value } : c)));

  const initialsFor = (full: string) =>
    full
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  const canAdd = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 10;

  const addContact = () => {
    if (!canAdd) return;
    setContacts((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        initials: initialsFor(name),
        name: name.trim(),
        relation: 'Contact',
        phone: phone.trim(),
        autoShare: false,
      },
    ]);
    setName('');
    setPhone('');
    setAdding(false);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Trusted Contacts" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Explanation card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialIcons name="shield" size={24} color={colors.onSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Ride with confidence</Text>
            <Text style={styles.infoSub}>
              Your trusted contacts receive your live location and trip details automatically when
              you start a ride. Toggle this for each person below.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>CURRENT CONTACTS</Text>
          <Text style={styles.sectionMeta}>{contacts.length} of 5 added</Text>
        </View>

        {contacts.map((contact) => (
          <View key={contact.id} style={[styles.contactRow, elevation.level1]}>
            <View style={styles.contactLeft}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitials}>{contact.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <View style={styles.relationTag}>
                    <Text style={styles.relationText}>{contact.relation}</Text>
                  </View>
                </View>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>
            <View style={styles.contactRight}>
              <Toggle
                value={contact.autoShare}
                onValueChange={(v) => toggleShare(contact.id, v)}
                activeColor={colors.secondary}
              />
              <Text style={[styles.shareLabel, contact.autoShare && styles.shareLabelOn]}>
                {contact.autoShare ? 'Auto-share ON' : 'Manual only'}
              </Text>
            </View>
          </View>
        ))}

        {contacts.length < 5 && (
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={() => setAdding(true)}>
            <MaterialIcons name="person-add" size={22} color={colors.onSurfaceVariant} />
            <Text style={styles.addButtonText}>Add New Contact</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAdding(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Add trusted contact</Text>
            <TextInput
              style={styles.sheetInput}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.onSurfaceVariant}
              autoFocus
            />
            <TextInput
              style={styles.sheetInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="phone-pad"
            />
            <PrimaryButton
              label="Add contact"
              icon="check"
              onPress={addContact}
              disabled={!canAdd}
              style={{ marginTop: spacing.md }}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

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
  sheetTitle: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.md },
  sheetInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.default,
    paddingHorizontal: spacing.md,
    height: 52,
    marginBottom: spacing.sm,
  },

  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(45,91,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45,91,255,0.1)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.default,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { ...typography.headlineSm, color: colors.primary, marginBottom: spacing.xs },
  infoSub: { ...typography.bodySm, color: colors.onSurfaceVariant },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, letterSpacing: 1 },
  sectionMeta: { ...typography.labelMd, color: colors.secondary },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  contactLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitials: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactName: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  relationTag: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  relationText: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  contactPhone: { ...typography.bodySm, color: colors.onSurfaceVariant },
  contactRight: { alignItems: 'flex-end', gap: spacing.xs },
  shareLabel: { fontSize: 10, color: colors.onSurfaceVariant, fontWeight: '600' },
  shareLabelOn: { color: colors.secondary },

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
  addButtonText: { ...typography.buttonLg, color: colors.onSurfaceVariant },
});
