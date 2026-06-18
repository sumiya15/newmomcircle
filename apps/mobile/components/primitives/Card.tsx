/**
 * primitives/Card.tsx
 * Themed card surface. Optionally pressable with a 0.97 scale feedback.
 */
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../utils/theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Remove the default padding */
  noPadding?: boolean;
}

export default function Card({ children, onPress, style, noPadding }: Props) {
  const content = (
    <View style={[styles.card, noPadding && styles.noPad, style]}>
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        noPadding && styles.noPad,
        style,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.card,
  },
  noPad: { padding: 0 },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
});
