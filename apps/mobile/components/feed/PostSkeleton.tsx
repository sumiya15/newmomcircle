/**
 * components/feed/PostSkeleton.tsx
 *
 * Shimmer skeleton for a feed post card.
 * Uses Moti's Skeleton primitive on top of expo-linear-gradient.
 * Render 3–4 of these while the real feed data is loading.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { Colors, Spacing, Radius } from '../../utils/theme';

const LIGHT: [string, string] = ['#f6f1ee', '#ede4df'];

interface Props {
  /** Stagger mount delay so cards don't all appear at once */
  index?: number;
  /** Whether to show an image block — alternates per card for visual variety */
  showImage?: boolean;
}

export default function PostSkeleton({ index = 0, showImage = false }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 280, delay: index * 60 }}
      style={styles.card}
    >
      {/* Header row */}
      <View style={styles.row}>
        <Skeleton colorMode="light" radius="round" height={44} width={44} colors={LIGHT} />
        <View style={styles.metaBlock}>
          <Skeleton colorMode="light" height={13} width={140} radius={6} colors={LIGHT} />
          <View style={{ height: 6 }} />
          <Skeleton colorMode="light" height={11} width={90} radius={6} colors={LIGHT} />
        </View>
      </View>

      {/* Content lines */}
      <View style={styles.contentBlock}>
        <Skeleton colorMode="light" height={13} width="100%" radius={6} colors={LIGHT} />
        <View style={{ height: 8 }} />
        <Skeleton colorMode="light" height={13} width="88%" radius={6} colors={LIGHT} />
        <View style={{ height: 8 }} />
        <Skeleton colorMode="light" height={13} width="72%" radius={6} colors={LIGHT} />
      </View>

      {/* Optional image block */}
      {showImage && (
        <View style={styles.imageBlock}>
          <Skeleton colorMode="light" height={180} width="100%" radius={Radius.md} colors={LIGHT} />
        </View>
      )}

      {/* Footer actions */}
      <View style={styles.footer}>
        <Skeleton colorMode="light" height={22} width={52} radius={Radius.sm} colors={LIGHT} />
        <Skeleton colorMode="light" height={22} width={52} radius={Radius.sm} colors={LIGHT} />
        <Skeleton colorMode="light" height={22} width={36} radius={Radius.sm} colors={LIGHT} />
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    // Subtle warm shadow matching the real cards
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaBlock: { flex: 1 },
  contentBlock: { marginBottom: Spacing.md },
  imageBlock: { marginBottom: Spacing.md },
  footer: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
