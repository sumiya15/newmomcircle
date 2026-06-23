/**
 * app/(main)/explore/[id].tsx — Screen 8: Circle Detail
 *
 * Design:
 *   - Hero cover photo (top ~42%) with gradient + back + share buttons
 *   - Circle name, category badge, member count
 *   - Join/Leave spring-animated CTA
 *   - Tab strip: Posts | Members | About
 *   - Posts tab: FlatList of PostCard items (same component as feed)
 *   - Members tab: horizontal AvatarRow + count
 *   - About tab: description + rules + moderators
 *   - Loading skeleton for posts
 *   - FAB to create a post (navigates to create-post)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  ScrollView, StatusBar, Dimensions, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import PostCard from '../../../components/feed/PostCard';
import PostSkeleton from '../../../components/feed/PostSkeleton';
import Avatar from '../../../components/primitives/Avatar';
import {
  groupOfMoms, outdoorWalks, nursingMoments,
  babySleeping, postpartumWellness, deterministicAvatar,
} from '../../../lib/unsplashImages';
import type { Post } from '@newmomcircle/types';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H * 0.42;

// ─── Mock data (keyed by circle id) ──────────────────────────────────────────

const CIRCLE_DATA: Record<string, {
  name: string; description: string; category: string;
  memberCount: number; coverPhoto: string;
  rules: string[]; moderators: string[];
}> = {
  c1: {
    name: 'Breastfeeding Support',
    description: 'A warm, judgement-free space for all things breastfeeding — latch struggles, supply tips, weaning journeys, and the emotional rollercoaster in between. Every feeding journey is valid here.',
    category: 'Feeding',
    memberCount: 4218,
    coverPhoto: nursingMoments[0]!.url,
    rules: ['Be kind & supportive', 'No unsolicited advice', 'Medical questions → consult a provider', 'Celebrate all feeding choices'],
    moderators: ['Priya S.', 'Meena K.'],
  },
  c2: {
    name: 'Sleep, Mama, Sleep',
    description: 'Surviving and eventually thriving through the chaos of newborn sleep. Gentle methods, survival stories, and solidarity for the 3 am crowd.',
    category: 'Sleep',
    memberCount: 3872,
    coverPhoto: babySleeping[1]!.url,
    rules: ['No sleep shaming', 'Share what works for you', 'Keep it real'],
    moderators: ['Ananya R.'],
  },
  default: {
    name: 'Circle',
    description: 'A supportive community of mothers.',
    category: 'Community',
    memberCount: 1200,
    coverPhoto: groupOfMoms[0]!.url,
    rules: ['Be kind', 'No spam'],
    moderators: ['Admin'],
  },
};

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    authorName: 'Ananya Reddy',
    authorInitials: 'AR',
    authorPhotoUrl: deterministicAvatar('u2').url,
    content: 'Finally got a full 3-hour stretch last night!! The Huckleberry app schedule changes are actually working 🙌 Who else is using it?',
    imageUrl: null,
    category: 'Sleep',
    likeCount: 48,
    commentCount: 12,
    likedBy: [],
    isLiked: false,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'p2',
    authorId: 'u3',
    authorName: 'Kavya M.',
    authorInitials: 'KM',
    authorPhotoUrl: deterministicAvatar('u3').url,
    content: 'Struggling with latch at week 2 — LC says baby has a mild tongue tie. Any mamas been through the snip? How was recovery?',
    imageUrl: null,
    category: 'Feeding',
    likeCount: 22,
    commentCount: 31,
    likedBy: [],
    isLiked: true,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'p3',
    authorId: 'u4',
    authorName: 'Sruthi P.',
    authorInitials: 'SP',
    authorPhotoUrl: deterministicAvatar('u4').url,
    content: 'Day 15 and I finally feel like we\'re getting the hang of it. To every mama who said "it gets better" — THANK YOU. It does. 💛',
    imageUrl: outdoorWalks[0]!.url,
    category: 'Feeding',
    likeCount: 134,
    commentCount: 28,
    likedBy: [],
    isLiked: false,
    isAnonymous: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

const MOCK_MEMBERS = Array.from({ length: 12 }, (_, i) => deterministicAvatar(`member-${i}`));

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Posts', 'Members', 'About'] as const;
type Tab = typeof TABS[number];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CircleDetailScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { id }     = useLocalSearchParams<{ id: string }>();

  const circle = CIRCLE_DATA[id as string] ?? CIRCLE_DATA.default!;

  const [isJoined,   setJoined]   = useState(false);
  const [activeTab,  setActiveTab] = useState<Tab>('Posts');
  const [posts,      setPosts]     = useState<Post[]>(MOCK_POSTS);
  const [loadingPosts] = useState(false);

  const toggleJoin = () => setJoined((v) => !v);
  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
  };

  return (
    <View style={styles.root} testID="circle-detail-screen">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Hero ── */}
      <View style={[styles.hero, { height: HERO_H }]}>
        <Image
          source={{ uri: circle.coverPhoto }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          placeholder={Colors.warmGrey}
          transition={300}
        />
        <LinearGradient
          colors={['rgba(20,8,4,0.08)', 'rgba(20,8,4,0.55)', 'rgba(20,8,4,0.78)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Nav buttons */}
        <View testID="circle-detail-header" style={[styles.heroNav, { top: insets.top + Spacing.xs }]}>
          <Pressable testID="circle-detail-back-btn" style={styles.heroNavBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
          </Pressable>
          <Pressable style={styles.heroNavBtn} hitSlop={12}>
            <Ionicons name="share-outline" size={20} color={Colors.white} />
          </Pressable>
        </View>

        {/* Circle info */}
        <View style={styles.heroInfo}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{circle.category}</Text>
          </View>
          <Text style={styles.circleName}>{circle.name}</Text>
          <View style={styles.memberRow}>
            <Ionicons name="people" size={14} color={Colors.peachLight} />
            <Text style={styles.memberCount}>
              {circle.memberCount.toLocaleString()} members
            </Text>
          </View>
        </View>
      </View>

      {/* ── Join CTA strip ── */}
      <View style={styles.joinStrip}>
        <Pressable
          testID="circle-detail-join-btn"
          style={({ pressed }) => [
            styles.joinBtn,
            isJoined && styles.joinBtnActive,
            pressed && styles.joinBtnPressed,
          ]}
          onPress={toggleJoin}
        >
          <AnimatePresence exitBeforeEnter>
            {isJoined ? (
              <MotiView
                key="leave"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: Motion.duration.fast }}
                style={styles.joinBtnInner}
              >
                <Ionicons name="checkmark" size={16} color={Colors.peachDark} />
                <Text style={[styles.joinBtnText, { color: Colors.peachDark }]}>Joined</Text>
              </MotiView>
            ) : (
              <MotiView
                key="join"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: Motion.duration.fast }}
                style={styles.joinBtnInner}
              >
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={styles.joinBtnText}>Join Circle</Text>
              </MotiView>
            )}
          </AnimatePresence>
        </Pressable>

        <Pressable style={styles.notifBtn} hitSlop={8}>
          <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Tab strip ── */}
      <View style={styles.tabStrip}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            testID={`circle-detail-tab-${tab.toLowerCase()}`}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
            {activeTab === tab && (
              <MotiView
                style={styles.tabIndicator}
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'spring', ...Motion.spring.snappy }}
              />
            )}
          </Pressable>
        ))}
      </View>

      {/* ── Tab content ── */}
      <AnimatePresence exitBeforeEnter>
        <MotiView
          key={activeTab}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'timing', duration: Motion.duration.base }}
          style={{ flex: 1 }}
        >
          {activeTab === 'Posts' && (
            <FlatList
              data={loadingPosts ? [] : posts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.postsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                loadingPosts
                  ? <><PostSkeleton /><PostSkeleton /></>
                  : null
              }
              renderItem={({ item, index }) => (
                <PostCard
                  post={item}
                  index={index}
                  onLike={() => handleLike(item.id)}
                  onComment={(p) => router.push({ pathname: '/(main)/feed/[id]', params: { id: p.id, postJson: JSON.stringify(p) } })}
                  onPress={(p) => router.push({ pathname: '/(main)/feed/[id]', params: { id: p.id, postJson: JSON.stringify(p) } })}
                />
              )}
            />
          )}

          {activeTab === 'Members' && (
            <ScrollView contentContainerStyle={styles.membersContent}>
              <Text style={styles.sectionLabel}>
                {circle.memberCount.toLocaleString()} members
              </Text>
              <View style={styles.avatarGrid}>
                {MOCK_MEMBERS.map((m, i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', ...Motion.spring.gentle, delay: i * 30 }}
                  >
                    <Avatar uri={m.url} size="md" />
                  </MotiView>
                ))}
                <View style={styles.memberMore}>
                  <Text style={styles.memberMoreText}>+{circle.memberCount - 12}</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {activeTab === 'About' && (
            <ScrollView contentContainerStyle={styles.aboutContent}>
              <Text style={styles.aboutDescription}>{circle.description}</Text>

              <Text style={styles.sectionLabel}>Community Rules</Text>
              {circle.rules.map((rule, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleDot} />
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}

              <Text style={styles.sectionLabel}>Moderators</Text>
              {circle.moderators.map((mod, i) => (
                <View key={i} style={styles.modRow}>
                  <Avatar
                    uri={deterministicAvatar(mod).url}
                    size="sm"
                  />
                  <Text style={styles.modName}>{mod}</Text>
                  <View style={styles.modBadge}>
                    <Text style={styles.modBadgeText}>Mod</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </MotiView>
      </AnimatePresence>

      {/* ── FAB — create post in this circle ── */}
      {isJoined && (
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', ...Motion.spring.bouncy }}
          style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        >
          <Pressable
            style={({ pressed }) => [styles.fabBtn, pressed && styles.fabBtnPressed]}
            onPress={() => router.push('/(main)/feed')}
          >
            <Ionicons name="create-outline" size={24} color={Colors.white} />
          </Pressable>
        </MotiView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  hero: {
    width: '100%',
    position: 'relative',
  },
  heroNav: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  heroNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.peachOverlay,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
  },
  categoryText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.peachLight,
    letterSpacing: 0.3,
  },
  circleName: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 36,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.peachLight,
    opacity: 0.88,
  },

  joinStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  joinBtn: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
    backgroundColor: Colors.peach,
    ...Shadow.button,
  },
  joinBtnActive: {
    backgroundColor: Colors.warmGrey,
    shadowOpacity: 0,
  },
  joinBtnPressed: { transform: [{ scale: 0.97 }] },
  joinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 13,
  },
  joinBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.peachDark,
    fontFamily: Typography.fontFamilySemiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.peach,
  },

  // Posts tab
  postsList: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },

  // Members tab
  membersContent: {
    padding: Spacing.lg,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  memberMore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberMoreText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // About tab
  aboutContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  aboutDescription: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.peach,
    marginTop: 7,
  },
  ruleText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  modRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  modBadge: {
    backgroundColor: Colors.peachOverlay,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  modBadgeText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 20,
  },
  fabBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  fabBtnPressed: { transform: [{ scale: 0.93 }] },
});
