/**
 * components/feed/CategoryPills.tsx
 *
 * Horizontally scrolling category filter pills for the community feed.
 * Active pill uses peach background; inactive uses warm-gray surface.
 * Pressing an inactive pill animates it in via a subtle spring scale.
 */
import React, { useCallback } from 'react';
import {
  ScrollView, Text, StyleSheet, Pressable, View,
} from 'react-native';
import { MotiView } from 'moti';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';

export const FEED_CATEGORIES = [
  'All',
  'Sleep Tips',
  'Nutrition',
  'Mental Health',
  'Newborn Care',
  'Milestones',
  'Postpartum',
] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];

interface Props {
  active: FeedCategory;
  onChange: (cat: FeedCategory) => void;
}

export default function CategoryPills({ active, onChange }: Props) {
  const handlePress = useCallback(
    (cat: FeedCategory) => {
      if (cat !== active) onChange(cat);
    },
    [active, onChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      // Extra tap area at the bottom so the pill row doesn't feel cramped
    >
      {FEED_CATEGORIES.map((cat) => {
        const isActive = cat === active;
        return (
          <MotiView
            key={cat}
            animate={{ scale: isActive ? 1 : 1 }}
            // Incoming press: the pill will feel selected immediately via color change;
            // the very subtle layout spring is just for smoothness on active switch.
            transition={{ type: 'spring', damping: 18, stiffness: 280 }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.pill,
                isActive ? styles.pillActive : styles.pillInactive,
                pressed && styles.pillPressed,
              ]}
              onPress={() => handlePress(cat)}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          </MotiView>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: Colors.peach,
    // Peach glow under the active pill matches the SOS button's elevated feel
    shadowColor: Colors.peachDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  pillInactive: {
    backgroundColor: Colors.warmGrey,
  },
  pillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  pillText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
  },
  pillTextActive: {
    color: Colors.white,
  },
  pillTextInactive: {
    color: Colors.textSecondary,
  },
});
