import React, { useEffect, useRef, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SupportChat'>;

type Message = { id: string; text: string; from: 'user' | 'agent' };

const QUICK_REPLIES = ['Refund status', 'Report a driver', 'Lost an item', 'Talk to a human'];

// Lightweight keyword router for the auto-agent. A real build would stream
// replies from a support backend / LLM; this gives believable, helpful answers.
function agentReply(text: string): string {
  const t = text.toLowerCase();
  if (/(refund|money back|charge|charged|fare)/.test(t))
    return 'I can help with that. I can see your recent trips — could you tell me the date or destination of the charge you want reviewed? Refunds usually reflect within 5–7 business days.';
  if (/(lost|left|forgot|item|phone|wallet|bag)/.test(t))
    return "Sorry you lost something! I can connect you with your driver on a masked number. Which trip was it on — your last ride, or an earlier one?";
  if (/(driver|rude|unsafe|rash|behav)/.test(t))
    return 'Thank you for flagging this — safety comes first. Could you share what happened? I can file a report and our safety team will review the driver.';
  if (/(otp|code|login|sign in|log in|verify)/.test(t))
    return 'For OTP issues, please confirm the number you are using. You can re-request a code after the timer ends. Would you like me to trigger a fresh code?';
  if (/(human|agent|person|call|representative|talk)/.test(t))
    return "Of course — I'm connecting you to a human agent. Typical wait is under 2 minutes. You can also tap the call icon above to reach our 24/7 line right away.";
  if (/(cancel|cancellation)/.test(t))
    return 'Cancellation fees apply after the free window or once a driver arrives. If you think it was charged in error, share the trip and I will review it for a waiver.';
  return "Got it — thanks for the details. I'm looking into this for you. Could you share a little more so I can resolve it faster?";
}

export default function SupportChatScreen({ navigation, route }: Props) {
  const topicTitle = route.params?.topicTitle;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  // Greeting on open, tailored to the topic the user came from.
  useEffect(() => {
    const greeting = topicTitle
      ? `Hi! You're chatting with RideNow Support about "${topicTitle}". How can I help?`
      : "Hi! You're chatting with RideNow Support. How can I help you today?";
    setMessages([{ id: 'greet', text: greeting, from: 'agent' }]);
  }, [topicTitle]);

  const pushAgentReply = (forText: string) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, text: agentReply(forText), from: 'agent' },
      ]);
    }, 900);
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `u_${Date.now()}`, text: trimmed, from: 'user' }]);
    setDraft('');
    pushAgentReply(trimmed);
  };

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages, typing]);

  return (
    <View style={styles.root}>
      <TopBar
        title="RideNow Support"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callNumber('+18001234567')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="call" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        }
      />

      {/* Online status strip */}
      <View style={styles.statusStrip}>
        <View style={styles.onlineDot} />
        <Text style={styles.statusText}>Agent online • typically replies in under a minute</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.from === 'user' ? styles.rowUser : styles.rowAgent]}>
              {item.from === 'agent' && (
                <View style={styles.agentAvatar}>
                  <MaterialIcons name="support-agent" size={16} color={colors.onPrimary} />
                </View>
              )}
              <View style={[styles.bubble, item.from === 'user' ? styles.bubbleUser : styles.bubbleAgent]}>
                <Text style={[styles.bubbleText, item.from === 'user' && styles.bubbleTextUser]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            typing ? (
              <View style={[styles.bubbleRow, styles.rowAgent]}>
                <View style={styles.agentAvatar}>
                  <MaterialIcons name="support-agent" size={16} color={colors.onPrimary} />
                </View>
                <View style={[styles.bubble, styles.bubbleAgent]}>
                  <Text style={styles.typingText}>typing…</Text>
                </View>
              </View>
            ) : null
          }
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
            placeholder="Describe your issue"
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
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { ...typography.bodySm, color: colors.onSurfaceVariant },

  list: { padding: spacing.marginMobile, gap: spacing.sm },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  rowUser: { justifyContent: 'flex-end' },
  rowAgent: { justifyContent: 'flex-start' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { maxWidth: '76%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: radii.sm },
  bubbleAgent: { backgroundColor: colors.surfaceContainerHigh, borderBottomLeftRadius: radii.sm },
  bubbleText: { ...typography.bodyMd, color: colors.onSurface },
  bubbleTextUser: { color: colors.onPrimary },
  typingText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontStyle: 'italic' },

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
