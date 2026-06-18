/**
 * components/common/EmptyState.tsx
 * Reusable empty-state display with emoji, title, optional subtitle and CTA.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "./Button";
import { Colors, Typography, Spacing } from "../../utils/theme";

interface Props {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  emoji = "🌿", title, subtitle, actionLabel, onAction,
}: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: Spacing.lg, paddingHorizontal: Spacing.xl }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing["2xl"] },
  emoji: { fontSize: 52, marginBottom: Spacing.md },
  title: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
