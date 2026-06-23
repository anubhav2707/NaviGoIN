import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import PrimaryButton from '../components/PrimaryButton';
import { findTopic } from '../data/support';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SupportTopic'>;

export default function SupportTopicScreen({ navigation, route }: Props) {
  const topic = findTopic(route.params.topicId);
  const [open, setOpen] = useState<number | null>(0);

  if (!topic) {
    return (
      <View style={styles.root}>
        <TopBar title="Support" onBack={() => navigation.goBack()} />
        <Text style={styles.missing}>This topic is unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopBar title={topic.title} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialIcons name={topic.icon} size={24} color={colors.primary} />
          </View>
          <Text style={styles.introText}>{topic.intro}</Text>
        </View>

        <Text style={styles.sectionLabel}>SELECT YOUR ISSUE</Text>
        <View style={[styles.card, elevation.level1]}>
          {topic.issues.map((issue, i) => {
            const expanded = open === i;
            return (
              <View key={issue.q} style={i < topic.issues.length - 1 ? styles.rowBorder : undefined}>
                <TouchableOpacity
                  style={styles.issueHeader}
                  activeOpacity={0.7}
                  onPress={() => setOpen(expanded ? null : i)}
                >
                  <Text style={styles.issueQ}>{issue.q}</Text>
                  <MaterialIcons
                    name={expanded ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {expanded && (
                  <View style={styles.answerBlock}>
                    <Text style={styles.issueA}>{issue.a}</Text>
                    <TouchableOpacity
                      style={styles.escalateRow}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('SupportChat', { topicTitle: topic.title })}
                    >
                      <MaterialIcons name="chat" size={18} color={colors.secondary} />
                      <Text style={styles.escalateText}>This didn't help — chat with an agent</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need a hand?</Text>
          <Text style={styles.contactSub}>Chat with our customer care team in real time.</Text>
          <PrimaryButton
            label="Chat with support"
            icon="chat"
            onPress={() => navigation.navigate('SupportChat', { topicTitle: topic.title })}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  missing: { ...typography.bodyMd, color: colors.onSurfaceVariant, padding: spacing.lg },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(45,91,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(45,91,255,0.1)',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.default,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { ...typography.bodySm, color: colors.onSurface, flex: 1 },

  sectionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.md, overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    gap: spacing.sm,
  },
  issueQ: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600', flex: 1 },
  answerBlock: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  issueA: { ...typography.bodySm, color: colors.onSurfaceVariant, lineHeight: 20 },
  escalateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  escalateText: { ...typography.bodySm, color: colors.secondary, fontWeight: '600' },

  contactCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  contactTitle: { ...typography.headlineSm, color: colors.onPrimary },
  contactSub: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
});
