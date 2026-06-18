/**
 * primitives/Tag.tsx
 * Category chip / filter tag — active vs. inactive visual states,
 * optional press-scale via Pressable, optional icon prefix.
 */
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
  /** Disable interaction (read-only label) */
  readOnly?: boolean;
}

export default function Tag({ label, active, onPress, icon, style, readOnly }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed && !readOnly && styles.chipPressed,
        style,
      ]}
      onPress={readOnly ? undefined : onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={active ? Colors.white : Colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  chipActive: {
    backgroundColor: Colors.peach,
    ...Shadow.soft,
    shadowColor: Colors.peachDark,
  },
  chipInactive: {
    backgroundColor: Colors.warmGrey,
  },
  chipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
  },
  labelActive:   { color: Colors.white },
  labelInactive: { color: Colors.textSecondary },
});
