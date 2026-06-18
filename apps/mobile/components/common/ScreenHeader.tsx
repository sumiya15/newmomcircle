/**
 * components/common/ScreenHeader.tsx
 * Consistent gradient header bar used across main screens.
 */
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing } from "../../utils/theme";

interface Props {
  title: string;
  emoji?: string;
  /** If true shows a ← back button */
  showBack?: boolean;
  /** Optional right-side action button */
  rightLabel?: string;
  onRight?: () => void;
  /** Override gradient colours; defaults to peach */
  colors?: [string, string];
}

export default function ScreenHeader({
  title, emoji, showBack, rightLabel, onRight,
  colors = [Colors.peach, Colors.peachDark],
}: Props) {
  const router = useRouter();

  return (
    <LinearGradient colors={colors} style={styles.root}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightLabel && onRight && (
        <TouchableOpacity style={styles.rightBtn} onPress={onRight}>
          <Text style={styles.rightText}>{rightLabel}</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  backBtn: { marginRight: 4 },
  backText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.white },
  emoji: { fontSize: 24 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.xl, color: Colors.white },
  rightBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rightText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.sm, color: Colors.white },
});
