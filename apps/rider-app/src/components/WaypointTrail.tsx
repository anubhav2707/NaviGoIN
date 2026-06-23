import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme/theme';

type Props = {
  pickup: string;
  drop: string;
  /** Intermediate stops between pickup and drop, in order. */
  stops?: string[];
  /** Show small uppercase Pickup/Drop-off labels above each value. */
  withLabels?: boolean;
};

type Marker = 'pickup' | 'stop' | 'drop';

/**
 * The pickup→drop visual language from DESIGN.md: a blue dot for pickup and a
 * black square for destination, joined by a dashed vertical connector. Any
 * intermediate stops render as hollow blue dots between the two.
 *
 * Laid out as aligned rows (marker + text) with connectors between, so each
 * marker always sits next to its own address line regardless of text length.
 */
export default function WaypointTrail({ pickup, drop, stops = [], withLabels = false }: Props) {
  const rows: { marker: Marker; label: string; value: string }[] = [
    { marker: 'pickup', label: 'PICKUP', value: pickup },
    ...stops.map((s, i) => ({ marker: 'stop' as const, label: `STOP ${i + 1}`, value: s })),
    { marker: 'drop', label: 'DROP-OFF', value: drop },
  ];

  return (
    <View>
      {rows.map((row, index) => (
        <View key={index}>
          {index > 0 && (
            <View style={styles.connectorRow}>
              <View style={styles.markerCol}>
                <View style={styles.dash} />
              </View>
            </View>
          )}
          <View style={styles.row}>
            <View style={styles.markerCol}>
              {row.marker === 'pickup' && <View style={styles.pickupDot} />}
              {row.marker === 'stop' && <View style={styles.stopDot} />}
              {row.marker === 'drop' && <View style={styles.dropSquare} />}
            </View>
            <View style={styles.textCol}>
              {withLabels && <Text style={styles.label}>{row.label}</Text>}
              <Text style={styles.value} numberOfLines={2}>{row.value}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const MARKER_COL = 24;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  markerCol: { width: MARKER_COL, alignItems: 'center' },
  textCol: { flex: 1, gap: 2 },
  connectorRow: { flexDirection: 'row' },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.secondary,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dash: {
    height: 20,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineVariant,
    marginVertical: 2,
  },
  dropSquare: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
  },
  label: { ...typography.labelMd, color: colors.onSurfaceVariant },
  value: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
});
