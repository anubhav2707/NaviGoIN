import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import { callNumber } from '../lib/actions';
import { colors, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DriverChat'>;

type Message = { id: string; text: string; mine: boolean };

// A few quick canned replies a rider commonly sends to a driver.
const QUICK_REPLIES = ['On my way down', "I'm at the gate", 'Please wait 2 mins', 'Call me'];

const SEED: Message[] = [
  { id: '1', text: "Hi! I'm on my way to your pickup point.", mine: false },
  { id: '2', text: 'Great, thank you!', mine: true },
  { id: '3', text: "I'll be in a white Dzire. Reaching in ~3 mins.", mine: false },
];

export default function DriverChatScreen({ navigation, route }: Props) {
  const { driverName } = route.params;
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState('');

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: String(Date.now()), text: trimmed, mine: true }]);
    setDraft('');
  };

  return (
    <View style={styles.root}>
      <TopBar
        title={driverName}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callNumber('+919900000002')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="call" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* Quick replies */}
        <View style={styles.quickRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_REPLIES}
            keyExtractor={(q) => q}
            contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.marginMobile }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.quickChip} activeOpacity={0.7} onPress={() => send(item)}>
                <Text style={styles.quickChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={colors.onSurfaceVariant}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            onPress={() => send(draft)}
            disabled={!draft.trim()}
            activeOpacity={0.85}
          >
            <MaterialIcons name="send" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.marginMobile, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: radii.sm },
  bubbleTheirs: { backgroundColor: colors.surfaceContainerHigh, borderBottomLeftRadius: radii.sm },
  bubbleText: { ...typography.bodyMd, color: colors.onSurface },
  bubbleTextMine: { color: colors.onPrimary },

  quickRow: { paddingVertical: spacing.sm },
  quickChip: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  quickChipText: { ...typography.bodySm, color: colors.onSurface },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
