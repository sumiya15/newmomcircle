/**
 * components/common/Button.tsx
 * Reusable peach gradient button for the mobile app.
 */
import React from "react";
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Radius, Shadow } from "../../utils/theme";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost";
  style?: ViewStyle;
}

export default function Button({
  label, onPress, loading, disabled,
  variant = "primary", style,
}: Props) {
  if (variant === "primary") {
    return (
      <TouchableOpacity
        style={[styles.wrap, style, (disabled || loading) && styles.disabled]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.peach, Colors.peachDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.grad}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.label}>{label}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.outline, style, (disabled || loading) && styles.disabled]}
        onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={Colors.peach} />
          : <Text style={styles.outlineLabel}>{label}</Text>}
      </TouchableOpacity>
    );
  }
  // ghost
  return (
    <TouchableOpacity
      style={[{ paddingVertical: 8 }, style]}
      onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.full, overflow: "hidden", ...Shadow.button },
  grad: { paddingVertical: 16, alignItems: "center", borderRadius: Radius.full },
  label: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.md, color: Colors.white },
  disabled: { opacity: 0.5 },
  outline: {
    borderRadius: Radius.full, borderWidth: 2, borderColor: Colors.peach,
    paddingVertical: 14, alignItems: "center",
  },
  outlineLabel: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.md, color: Colors.peach },
  ghostLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.base, color: Colors.textMuted },
});
