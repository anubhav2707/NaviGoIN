import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import TopBar from '../components/TopBar';
import Toggle from '../components/Toggle';
import AddPaymentSheet, { type NewPayment } from '../components/AddPaymentSheet';
import { colors, elevation, radii, spacing, typography } from '../theme/theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedCards'>;

type Card = {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expires: string;
  gradient: [string, string];
};

const CARDS: Card[] = [
  { id: 'visa', brand: 'VISA', last4: '4242', holder: 'ALEX JOHNSON', expires: '09/26', gradient: ['#1a1a1a', '#333333'] },
  { id: 'mc', brand: 'Mastercard', last4: '8812', holder: 'ALEX JOHNSON', expires: '12/24', gradient: ['#0040df', '#002580'] },
];

const NEW_CARD_GRADIENTS: [string, string][] = [
  ['#0f3d2e', '#1c6b4c'],
  ['#3d1a4d', '#6b2d80'],
  ['#4d2a14', '#80502d'],
];

export default function SavedCardsScreen({ navigation }: Props) {
  const [cards, setCards] = useState<Card[]>(CARDS);
  const [primary, setPrimary] = useState('visa');
  const [addingCard, setAddingCard] = useState(false);

  const addCard = (method: NewPayment) => {
    if (method.kind !== 'card') return; // ignore UPI entries on the cards screen
    const last4 = method.label.replace(/\D/g, '').slice(-4);
    const id = `card_${Date.now()}`;
    setCards((prev) => [
      ...prev,
      {
        id,
        brand: 'Card',
        last4,
        holder: 'ALEX JOHNSON',
        expires: '—/—',
        gradient: NEW_CARD_GRADIENTS[prev.length % NEW_CARD_GRADIENTS.length],
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <TopBar title="Saved Cards" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Manage your payment methods for a seamless checkout experience.
        </Text>

        {cards.map((card) => {
          const isPrimary = card.id === primary;
          return (
            <View key={card.id} style={styles.cardBlock}>
              <View style={[styles.card, { backgroundColor: card.gradient[0] }, elevation.level2]}>
                <View style={styles.cardTop}>
                  {card.brand === 'Mastercard' ? (
                    <View style={styles.mcLogo}>
                      <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
                      <View style={[styles.mcCircle, styles.mcCircleOverlap, { backgroundColor: '#F79E1B' }]} />
                    </View>
                  ) : (
                    <Text style={styles.cardBrand}>{card.brand}</Text>
                  )}
                  <MaterialIcons name="contactless" size={28} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>
                      <Text style={styles.cardMetaValue}>{card.holder}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.cardMetaLabel}>EXPIRES</Text>
                      <Text style={styles.cardMetaValue}>{card.expires}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialIcons
                    name={isPrimary ? 'verified' : 'credit-card'}
                    size={22}
                    color={isPrimary ? colors.secondary : colors.onSurfaceVariant}
                  />
                  <View>
                    <Text style={styles.settingTitle}>
                      {isPrimary ? 'Primary Card' : 'Set as Default'}
                    </Text>
                    <Text style={styles.settingSub}>
                      {isPrimary ? 'Used for all auto-payments' : 'Tap to switch primary method'}
                    </Text>
                  </View>
                </View>
                <Toggle value={isPrimary} onValueChange={() => setPrimary(card.id)} />
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={() => setAddingCard(true)}>
          <MaterialIcons name="add-circle-outline" size={32} color={colors.onSurfaceVariant} />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        <View style={styles.securityRow}>
          <MaterialIcons name="lock" size={14} color={colors.onSurfaceVariant} />
          <Text style={styles.securityText}>Secure 256-bit SSL Encrypted</Text>
        </View>
      </ScrollView>

      <AddPaymentSheet
        visible={addingCard}
        onClose={() => setAddingCard(false)}
        onAdd={addCard}
        defaultKind="card"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.marginMobile, paddingBottom: spacing.xl },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.lg },

  cardBlock: { marginBottom: spacing.lg, gap: spacing.md },
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { ...typography.headlineSm, color: '#ffffff', fontWeight: '700', letterSpacing: 2 },
  mcLogo: { flexDirection: 'row' },
  mcCircle: { width: 32, height: 32, borderRadius: 16, opacity: 0.9 },
  mcCircleOverlap: { marginLeft: -16 },
  cardNumber: { ...typography.displayLg, color: '#ffffff', letterSpacing: 4, marginBottom: spacing.sm },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardMetaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  cardMetaValue: { ...typography.bodyMd, color: '#ffffff' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  settingTitle: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  settingSub: { ...typography.labelMd, color: colors.onSurfaceVariant },

  addButton: {
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addButtonText: { ...typography.buttonLg, color: colors.onSurfaceVariant },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    opacity: 0.6,
  },
  securityText: { ...typography.labelMd, color: colors.onSurfaceVariant },
});
