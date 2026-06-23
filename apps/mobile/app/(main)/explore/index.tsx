/**
 * app/(main)/explore/index.tsx — Screen 7: Explore Circles
 *
 * Design:
 *   - Sticky search bar below header
 *   - Horizontal category filter strip
 *   - 2-column masonry-style circle cards with cover photo + member count
 *   - Loading: staggered SkeletonBlock cards
 *   - Empty state when no circles match filter/search
 *   - Join/Joined toggle with spring animation
 *
 * Navigation:
 *   - Each card → CircleDetail (Screen 8)
 *   - Accessible via FAB or "Explore Circles" CTA in the feed header
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';
import {
  groupOfMoms, outdoorWalks, nursingMoments,
  babySleeping, postpartumWellness,
} from '../../../lib/unsplashImages';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Circle {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  coverPhoto: string;
  isJoined: boolean;
  isFeatured?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_CIRCLES: Circle[] = [
  {
    id: 'c1',
    name: 'Breastfeeding Support',
    description: 'Latch struggles, supply tips, weaning — honest talk, zero judgment.',
    category: 'Feeding',
    memberCount: 4218,
    coverPhoto: nursingMoments[0]!.url,
    isJoined: true,
    isFeatured: true,
  },
  {
    id: 'c2',
    name: 'Sleep, Mama, Sleep',
    description: 'Gentle methods, survival stories, and solidarity for the 3 am crowd.',
    category: 'Sleep',
    memberCount: 3872,
    coverPhoto: babySleeping[1]!.url,
    isJoined: false,
    isFeatured: true,
  },
  {
    id: 'c3',
    name: 'Postpartum Warriors',
    description: 'A safe, anonymous space to talk about PPD, anxiety, and healing.',
    category: 'Mental Health',
    memberCount: 2940,
    coverPhoto: postpartumWellness[1]!.url,
    isJoined: false,
  },
  {
    id: 'c4',
    name: 'Stroller Crew',
    description: 'Local walks, park meetups, and the joy of fresh air together.',
    category: 'Community',
    memberCount: 1563,
    coverPhoto: outdoorWalks[1]!.url,
    isJoined: true,
  },
  {
    id: 'c5',
    name: 'New Moms Circle',
    description: 'First-timers welcome. Share the chaos, the wins, and everything in between.',
    category: 'Community',
    memberCount: 5110,
    coverPhoto: groupOfMoms[0]!.url,
    isJoined: false,
    isFeatured: true,
  },
  {
    id: 'c6',
    name: 'Back to Work',
    description: 'Navigating pumping at work, childcare guilt, and career confidence post-baby.',
    category: 'Work & Career',
    memberCount: 988,
    coverPhoto: postpartumWellness[3]!.url,
    isJoined: false,
  },
  {
    id: 'c7',
    name: 'Wellness & Movement',
    description: 'Postpartum yoga, walking, diastasis rec — move at your own pace.',
    category: 'Wellness',
    memberCount: 1742,
    coverPhoto: postpartumWellness[2]!.url,
    isJoined: false,
  },
  {
    id: 'c8',
    name: 'Twin Life',
    description: 'Double the chaos, double the love. For twin and multiple moms only.',
    category: 'Multiples',
    memberCount: 614,
    coverPhoto: groupOfMoms[2]!.url,
    isJoined: false,
  },
  {
    id: 'c9',
    name: 'Formula Mamas',
    description: 'Fed is best. Judgement-free support for formula feeding families.',
    category: 'Feeding',
    memberCount: 2115,
    coverPhoto: nursingMoments[3]!.url,
    isJoined: false,
  },
  {
    id: 'c10',
    name: 'Nursery & Nesting',
    description: 'Decor inspo, baby gear reviews, and getting that room just right.',
    category: 'Community',
    memberCount: 1337,
    coverPhoto: outdoorWalks[3]!.url,
    isJoined: false,
  },
];

const CATEGORIES = ['All', 'Feeding', 'Sleep', 'Mental Health', 'Community', 'Wellness', 'Work & Career', 'Multiples'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ExploreCirclesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [query,        setQuery]        = useState('');
  const [activeCategory, setCategory]  = useState('All');
  const [circles, setCircles]          = useState<Circle[]>(ALL_CIRCLES);
  const [loading, setLoading]          = useState(false);

  const filtered = useMemo(() => {
    let list = circles;
    if (activeCategory !== 'All') list = list.filter((c) => c.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [circles, activeCategory, query]);

  const toggleJoin = (id: string) => {
    setCircles((prev) =>
      prev.map((c) => c.id === id ? { ...c, isJoined: !c.isJoined, memberCount: c.isJoined ? c.memberCount - 1 : c.memberCount + 1 } : c)
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="explore-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore Circles</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          testID="explore-search-input"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search circles..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Category strip ── */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.catStrip}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = item === activeCategory;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.catPill,
                active && styles.catPillActive,
                pressed && styles.catPillPressed,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.catLabel, active && styles.catLabelActive]}>{item}</Text>
            </Pressable>
          );
        }}
      />

      {/* ── Circle grid ── */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="👥"
          title="No circles found"
          subtitle="Try a different search or category."
        />
      ) : (
        <FlatList
          testID="explore-circles-list"
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <CircleCard
              circle={item}
              index={index}
              onPress={() => router.push({ pathname: '/(main)/explore/[id]', params: { id: item.id } })}
              onToggleJoin={() => toggleJoin(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Circle card ──────────────────────────────────────────────────────────────

interface CardProps {
  circle: Circle;
  index: number;
  onPress: () => void;
  onToggleJoin: () => void;
}

function CircleCard({ circle, index, onPress, onToggleJoin }: CardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 50 }}
      style={styles.cardWrap}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {/* Cover photo */}
        <View style={styles.coverWrap}>
          <Image
            source={{ uri: circle.coverPhoto }}
            style={styles.cover}
            contentFit="cover"
            placeholder={Colors.warmGrey}
            transition={300}
          />
          {circle.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>{circle.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{circle.description}</Text>

          {/* Member count */}
          <View style={styles.memberRow}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.memberCount}>
              {circle.memberCount.toLocaleString()}
            </Text>
          </View>

          {/* Join button */}
          <Pressable
            style={({ pressed }) => [
              styles.joinBtn,
              circle.isJoined && styles.joinBtnActive,
              pressed && styles.joinBtnPressed,
            ]}
            onPress={(e) => { e.stopPropagation(); onToggleJoin(); }}
          >
            <AnimatePresence exitBeforeEnter>
              {circle.isJoined ? (
                <MotiView
                  key="joined"
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', ...Motion.spring.snappy }}
                  style={styles.joinBtnInner}
                >
                  <Ionicons name="checkmark" size={13} color={Colors.peachDark} />
                  <Text style={[styles.joinLabel, styles.joinLabelActive]}>Joined</Text>
                </MotiView>
              ) : (
                <MotiView
                  key="join"
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', ...Motion.spring.snappy }}
                  style={styles.joinBtnInner}
                >
                  <Ionicons name="add" size={13} color={Colors.white} />
                  <Text style={styles.joinLabel}>Join</Text>
                </MotiView>
              )}
            </AnimatePresence>
          </Pressable>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Skeleton loading grid ────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.cardWrap, styles.card]}>
            <SkeletonBlock width="100%" height={120} radius={14} />
            <View style={{ padding: Spacing.sm, gap: 6 }}>
              <SkeletonBlock width="80%" height={14} radius={8} />
              <SkeletonBlock width="100%" height={10} radius={8} />
              <SkeletonBlock width="60%" height={10} radius={8} />
              <SkeletonBlock width="50%" height={28} radius={9999} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.gridRow}>
        {[2, 3].map((i) => (
          <View key={i} style={[styles.cardWrap, styles.card]}>
            <SkeletonBlock width="100%" height={120} radius={14} />
            <View style={{ padding: Spacing.sm, gap: 6 }}>
              <SkeletonBlock width="70%" height={14} radius={8} />
              <SkeletonBlock width="100%" height={10} radius={8} />
              <SkeletonBlock width="50%" height={28} radius={9999} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = (344 - Spacing.lg * 2 - Spacing.sm) / 2; // approx half-width minus gaps

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    ...Shadow.soft,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    padding: 0,
  },

  catStrip: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  catPill: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  catPillActive: {
    borderColor: Colors.peach,
    backgroundColor: Colors.peachOverlay,
  },
  catPillPressed: { transform: [{ scale: 0.96 }] },
  catLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.peachDark,
  },

  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  cardWrap: { flex: 1 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  cardPressed: { transform: [{ scale: 0.97 }] },

  coverWrap: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  cardBody: {
    padding: Spacing.sm,
    gap: 4,
  },
  cardName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  cardDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  memberCount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  joinBtn: {
    marginTop: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    overflow: 'hidden',
    ...Shadow.button,
  },
  joinBtnActive: {
    backgroundColor: Colors.warmGrey,
  },
  joinBtnPressed: { transform: [{ scale: 0.95 }] },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
  },
  joinLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },
  joinLabelActive: {
    color: Colors.peachDark,
  },
});
