import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import PrimaryButton from '../components/PrimaryButton';
import { callNumber } from '../lib/actions';
import { SUPPORT_TOPICS } from '../data/support';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const FAQS: { q: string; a: string }[] = [
  { q: 'How do I get a fare receipt?', a: 'Open the trip from the Activity tab and tap "Get receipt" — it will be emailed to your registered address.' },
  { q: 'How are fares calculated?', a: 'Fares combine a base fare, a per-kilometre rate, a per-minute rate, and any active surge multiplier for your area.' },
  { q: 'How do I report a safety concern?', a: 'Use the Safety tab during or after a ride to contact our 24/7 safety team or your trusted contacts.' },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <View style={styles.root}>
      <TopBar title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>Browse common topics or reach our 24/7 support team.</Text>
        </View>

        {/* Live chat entry */}
        <TouchableOpacity
          style={[styles.chatCard, elevation.level1]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SupportChat', undefined)}
        >
          <View style={styles.chatIcon}>
            <MaterialIcons name="support-agent" size={24} color={colors.onSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatTitle}>Chat with us</Text>
            <Text style={styles.chatSub}>Live customer care • replies in under a minute</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Topics — each drills into its own issue list */}
        <Text style={styles.sectionLabel}>COMMON TOPICS</Text>
        <View style={[styles.card, elevation.level1]}>
          {SUPPORT_TOPICS.map((topic, i) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.topicRow, i < SUPPORT_TOPICS.length - 1 && styles.rowBorder]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SupportTopic', { topicId: topic.id })}
            >
              <View style={styles.topicLeft}>
                <View style={styles.topicIcon}>
                  <MaterialIcons name={topic.icon} size={20} color={colors.primary} />
                </View>
                <Text style={styles.topicTitle}>{topic.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
        <View style={[styles.card, elevation.level1]}>
          {FAQS.map((faq, i) => {
            const open = openFaq === i;
            return (
              <TouchableOpacity
                key={faq.q}
                style={[styles.faqRow, i < FAQS.length - 1 && styles.rowBorder]}
                activeOpacity={0.7}
                onPress={() => setOpenFaq(open ? null : i)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <MaterialIcons
                    name={open ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </View>
                {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactSub}>Chat with an agent or call us 24/7.</Text>
          <PrimaryButton
            label="Chat with support"
            icon="chat"
            onPress={() => navigation.navigate('SupportChat', undefined)}
            style={{ marginTop: spacing.md }}
          />
          <TouchableOpacity
            style={styles.callRow}
            activeOpacity={0.7}
            onPress={() => callNumber('+18001234567')}
          >
            <MaterialIcons name="call" size={18} color={colors.onPrimary} />
            <Text style={styles.callText}>Or call 1800-123-4567</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

  hero: { marginBottom: spacing.lg },
  heroTitle: { ...typography.headlineMd, color: colors.primary },
  heroSub: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs },

  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chatIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTitle: { ...typography.bodyMd, color: colors.primary, fontWeight: '700' },
  chatSub: { ...typography.bodySm, color: colors.onSurfaceVariant },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  callText: { ...typography.bodySm, color: 'rgba(255,255,255,0.85)' },

  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.md, overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },

  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  topicLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: { ...typography.bodyMd, color: colors.onSurface, flex: 1 },

  faqRow: { padding: spacing.md },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600', flex: 1 },
  faqAnswer: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.sm },

  contactCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  contactTitle: { ...typography.headlineSm, color: colors.onPrimary },
  contactSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
});
