/**
 * primitives/SectionHeader.tsx
 * Consistent section title row with optional "See all" link.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../../utils/theme';

interface Props {
  title: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  style?: ViewStyle;
}

export default function SectionHeader({
  title, onSeeAll, seeAllLabel = 'See all', style,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={12}>
          <Text style={styles.link}>{seeAllLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  link: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.peachDark,
  },
});
