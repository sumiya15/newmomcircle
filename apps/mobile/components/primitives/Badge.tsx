/**
 * primitives/Badge.tsx
 * Small count/status badge — unread count on nav icons, category tags, status pills.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../utils/theme';

type BadgeVariant = 'count' | 'dot' | 'status';
type BadgeColor = 'peach' | 'green' | 'amber' | 'red' | 'muted';

const BG: Record<BadgeColor, string> = {
  peach:  Colors.peach,
  green:  Colors.sentimentPositive,
  amber:  Colors.sentimentNeutral,
  red:    Colors.danger,
  muted:  Colors.warmGrey,
};

const FG: Record<BadgeColor, string> = {
  peach:  Colors.white,
  green:  Colors.white,
  amber:  Colors.textPrimary,
  red:    Colors.white,
  muted:  Colors.textMuted,
};

interface Props {
  variant?: BadgeVariant;
  count?: number;
  label?: string;
  color?: BadgeColor;
  style?: ViewStyle;
}

export default function Badge({ variant = 'count', count, label, color = 'peach', style }: Props) {
  if (variant === 'dot') {
    return (
      <View
        style={[styles.dot, { backgroundColor: BG[color] }, style]}
      />
    );
  }

  const text = variant === 'count'
    ? count !== undefined ? (count > 99 ? '99+' : String(count)) : undefined
    : label;

  if (!text) return null;

  return (
    <View style={[styles.pill, { backgroundColor: BG[color] }, style]}>
      <Text style={[styles.pillText, { color: FG[color] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  pill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    lineHeight: 16,
  },
});
