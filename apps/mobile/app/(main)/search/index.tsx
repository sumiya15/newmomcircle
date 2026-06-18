/**
 * app/(main)/search/index.tsx — Screen 22: Search
 *
 * Layout:
 *   - Autofocused search bar (back button left)
 *   - Empty state: Trending topics chips + Recent searches
 *   - Typing state: debounced results in 3 tabs (Posts / People / Circles)
 *   - Skeleton during search debounce
 *   - Empty results state per tab
 *
 * Entry: search bar tapped in feed header (navigates here with autofocus)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import Avatar from '../../../components/primitives/Avatar';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';
import { deterministicAvatar, groupOfMoms, outdoorWalks, postpartumWellness, nursingMoments } from '../../../lib/unsplashImages';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchTab = 'Posts' | 'People' | 'Circles';

interface SearchPost {
  id: string; authorName: string; authorSeed: string;
  content: string; likeCount: number; commentCount: number;
  createdAt: string;
}

interface SearchPerson {
  id: string; name: string; role: string;
  seed: string; babyStage: string;
  circles: number; mutual: number;
}

interface SearchCircle {
  id: string; name: string; category: string;
  coverUrl: string; memberCount: number;
  description: string; joined: boolean;
}

// ─── Mock search corpus ───────────────────────────────────────────────────────

const MOCK_POSTS: SearchPost[] = [
  { id: 'p1', authorName: 'Priya Sharma',    authorSeed: 'u1', likeCount: 24, commentCount: 8,  createdAt: '2h ago',   content: 'Day 15 postpartum — finally managed a shower AND made chai. Celebrating the small wins today!' },
  { id: 'p2', authorName: 'Anita Reddy',     authorSeed: 'u2', likeCount: 47, commentCount: 12, createdAt: '4h ago',   content: 'My baby smiled for the first time today 🥹 All the sleepless nights feel worth it.' },
  { id: 'p3', authorName: 'Maya Singh',      authorSeed: 'u3', likeCount: 18, commentCount: 5,  createdAt: '6h ago',   content: 'Anyone else struggling with latching? Six weeks in and it still hurts. Looking for advice.' },
  { id: 'p4', authorName: 'Dr. Sunita Patel',authorSeed: 'u4', likeCount: 89, commentCount: 34, createdAt: 'Yesterday',content: 'Reminder: growth spurts at 6 weeks are completely normal. Cluster feeding is baby\'s way of boosting supply.' },
  { id: 'p5', authorName: 'Deepa Ravi',      authorSeed: 'u5', likeCount: 31, commentCount: 7,  createdAt: 'Yesterday',content: 'Three months in and I finally feel like myself again. Postpartum recovery is not linear — be patient with yourself.' },
  { id: 'p6', authorName: 'Kavitha Menon',   authorSeed: 'u8', likeCount: 12, commentCount: 3,  createdAt: '2 days ago',content: 'Anyone tried the 5 S\'s for settling a fussy baby? Side/stomach position + shushing worked for us!' },
  { id: 'p7', authorName: 'Asha Kumar',      authorSeed: 'u9', likeCount: 56, commentCount: 21, createdAt: '3 days ago',content: 'Iron levels tanked after delivery. Eating spinach + OJ together has helped so much. Try it!' },
  { id: 'p8', authorName: 'Anita Kapoor',    authorSeed: 'u7', likeCount: 22, commentCount: 9,  createdAt: '4 days ago',content: 'Started postpartum yoga this week. Only 15 mins a day but my back already thanks me. 🧘' },
];

const MOCK_PEOPLE: SearchPerson[] = [
  { id: 'u1', name: 'Priya Sharma',     role: 'New Mom',             seed: 'u1', babyStage: '3–6 mo',  circles: 4, mutual: 2 },
  { id: 'u2', name: 'Anita Reddy',      role: 'New Mom',             seed: 'u2', babyStage: '0–3 mo',  circles: 2, mutual: 1 },
  { id: 'u3', name: 'Maya Singh',       role: 'IBCLC Lactation',     seed: 'u3', babyStage: '6–12 mo', circles: 6, mutual: 0 },
  { id: 'u4', name: 'Dr. Sunita Patel', role: 'Developmental Peds',  seed: 'u4', babyStage: '',        circles: 3, mutual: 1 },
  { id: 'u5', name: 'Deepa Ravi',       role: 'Couples Counsellor',  seed: 'u5', babyStage: '',        circles: 5, mutual: 0 },
  { id: 'u6', name: 'Dr. Priya Nair',   role: 'Perinatal Psych.',    seed: 'u6', babyStage: '',        circles: 7, mutual: 3 },
  { id: 'u7', name: 'Anita Kapoor',     role: 'Yoga Instructor',     seed: 'u7', babyStage: '12 mo+',  circles: 4, mutual: 1 },
  { id: 'u8', name: 'Kavitha Menon',    role: 'New Mom',             seed: 'u8', babyStage: '0–3 mo',  circles: 3, mutual: 2 },
];

const MOCK_CIRCLES: SearchCircle[] = [
  { id: 'c1', name: 'Postpartum Recovery',  category: 'Health',     coverUrl: postpartumWellness[0]!.url, memberCount: 312, description: 'Support through the 4th trimester and beyond.', joined: true  },
  { id: 'c2', name: 'Breastfeeding Support',category: 'Feeding',    coverUrl: nursingMoments[0]!.url,     memberCount: 248, description: 'Latch help, supply questions, weaning advice.', joined: false },
  { id: 'c3', name: 'Bengaluru Moms',       category: 'Local',      coverUrl: outdoorWalks[2]!.url,       memberCount: 238, description: 'Moms in and around Bengaluru.', joined: false },
  { id: 'c4', name: 'Sleep & Schedules',    category: 'Sleep',      coverUrl: postpartumWellness[1]!.url, memberCount: 195, description: 'Gentle sleep coaching and schedules.', joined: false },
  { id: 'c5', name: 'Fitness After Baby',   category: 'Fitness',    coverUrl: outdoorWalks[0]!.url,       memberCount: 176, description: 'Postpartum movement, pelvic floor, yoga.', joined: true  },
  { id: 'c6', name: 'First-Time Parents',   category: 'Community',  coverUrl: groupOfMoms[0]!.url,        memberCount: 421, description: 'Everything first-time parents want to ask.', joined: false },
];

const TRENDING = [
  'breastfeeding', 'sleep regression', 'postpartum anxiety',
  '4th trimester', 'cluster feeding', 'pelvic floor',
  'baby milestone', 'self-care', 'formula feeding',
];

const RECENT_SEARCHES_INITIAL = ['postpartum yoga', 'sleep schedule', 'latch help'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query,          setQuery]          = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab,      setActiveTab]      = useState<SearchTab>('Posts');
  const [loading,        setLoading]        = useState(false);
  const [recent,         setRecent]         = useState<string[]>(RECENT_SEARCHES_INITIAL);
  const [joinedCircles,  setJoinedCircles]  = useState<Set<string>>(
    new Set(MOCK_CIRCLES.filter((c) => c.joined).map((c) => c.id))
  );

  // Debounce search
  useEffect(() => {
    if (!query.trim()) { setDebouncedQuery(''); return; }
    setLoading(true);
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Autofocus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setRecent((prev) => {
      const next = [q, ...prev.filter((r) => r !== q)].slice(0, 6);
      return next;
    });
  };

  const clearQuery = () => { setQuery(''); setDebouncedQuery(''); };

  const toggleJoin = (id: string) =>
    setJoinedCircles((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Filtered results
  const q = debouncedQuery;
  const filteredPosts   = useMemo(() => !q ? [] : MOCK_POSTS.filter((p) =>
    p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q)
  ), [q]);
  const filteredPeople  = useMemo(() => !q ? [] : MOCK_PEOPLE.filter((p) =>
    p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)
  ), [q]);
  const filteredCircles = useMemo(() => !q ? [] : MOCK_CIRCLES.filter((c) =>
    c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  ), [q]);

  const hasResults = filteredPosts.length > 0 || filteredPeople.length > 0 || filteredCircles.length > 0;

  const tabCounts: Record<SearchTab, number> = {
    Posts:   filteredPosts.length,
    People:  filteredPeople.length,
    Circles: filteredCircles.length,
  };

  const showEmpty = !!debouncedQuery && !loading && !hasResults;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Search bar ── */}
      <View style={styles.searchRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            placeholder="Search posts, people, circles…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
          />
          <AnimatePresence>
            {query.length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', ...Motion.spring.snappy }}
              >
                <Pressable onPress={clearQuery} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </View>

      {/* ── Empty state (no query) ── */}
      {!query ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Trending */}
          <View style={styles.discoverSection}>
            <Text style={styles.discoverTitle}>Trending Topics</Text>
            <View style={styles.trendingGrid}>
              {TRENDING.map((t, i) => (
                <MotiView
                  key={t}
                  from={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', ...Motion.spring.snappy, delay: i * 30 }}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.trendingChip,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => { setQuery(t); handleSearch(t); }}
                  >
                    <Ionicons name="trending-up-outline" size={11} color={Colors.peachDark} />
                    <Text style={styles.trendingChipText}>{t}</Text>
                  </Pressable>
                </MotiView>
              ))}
            </View>
          </View>

          {/* Recent searches */}
          {recent.length > 0 && (
            <View style={styles.discoverSection}>
              <View style={styles.discoverTitleRow}>
                <Text style={styles.discoverTitle}>Recent Searches</Text>
                <Pressable onPress={() => setRecent([])} hitSlop={8}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.recentList}>
                {recent.map((r) => (
                  <Pressable
                    key={r}
                    style={({ pressed }) => [styles.recentRow, pressed && { opacity: 0.8 }]}
                    onPress={() => { setQuery(r); handleSearch(r); }}
                  >
                    <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.recentText}>{r}</Text>
                    <Pressable
                      onPress={() => setRecent((prev) => prev.filter((x) => x !== r))}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={14} color={Colors.textMuted} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : loading ? (
        /* Skeleton while debouncing */
        <SearchSkeleton />
      ) : showEmpty ? (
        <EmptyState
          emoji="🔍"
          title={`No results for "${query}"`}
          subtitle="Try different keywords — search for a topic, person's name, or circle."
        />
      ) : (
        /* Results */
        <>
          {/* Tab strip */}
          <View style={styles.tabStrip}>
            {(['Posts', 'People', 'Circles'] as SearchTab[]).map((t) => {
              const active = t === activeTab;
              const count  = tabCounts[t];
              return (
                <Pressable
                  key={t}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveTab(t)}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t}</Text>
                  {count > 0 && (
                    <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                      <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={activeTab}
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: Motion.duration.fast }}
              style={{ flex: 1 }}
            >
              {activeTab === 'Posts' && (
                <ResultsList
                  data={filteredPosts}
                  empty={<EmptyState emoji="📝" title="No posts found" subtitle={`No posts match "${query}"`} />}
                  renderItem={({ item, index }: { item: SearchPost; index: number }) => (
                    <PostResultRow post={item} index={index} />
                  )}
                  keyExtractor={(item: SearchPost) => item.id}
                  insets={insets}
                />
              )}
              {activeTab === 'People' && (
                <ResultsList
                  data={filteredPeople}
                  empty={<EmptyState emoji="👩" title="No people found" subtitle={`No one matches "${query}"`} />}
                  renderItem={({ item, index }: { item: SearchPerson; index: number }) => (
                    <PersonResultRow person={item} index={index} />
                  )}
                  keyExtractor={(item: SearchPerson) => item.id}
                  insets={insets}
                />
              )}
              {activeTab === 'Circles' && (
                <ResultsList
                  data={filteredCircles}
                  empty={<EmptyState emoji="⭕" title="No circles found" subtitle={`No circles match "${query}"`} />}
                  renderItem={({ item, index }: { item: SearchCircle; index: number }) => (
                    <CircleResultRow
                      circle={item}
                      joined={joinedCircles.has(item.id)}
                      onToggle={() => toggleJoin(item.id)}
                      index={index}
                    />
                  )}
                  keyExtractor={(item: SearchCircle) => item.id}
                  insets={insets}
                />
              )}
            </MotiView>
          </AnimatePresence>
        </>
      )}
    </View>
  );
}

// ─── Results list wrapper ─────────────────────────────────────────────────────

function ResultsList<T>({
  data, empty, renderItem, keyExtractor, insets,
}: {
  data: T[];
  empty: React.ReactNode;
  renderItem: (info: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T) => string;
  insets: { bottom: number };
}) {
  if (data.length === 0) return <>{empty}</>;
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      ItemSeparatorComponent={() => <View style={styles.itemSep} />}
    />
  );
}

// ─── Post result row ──────────────────────────────────────────────────────────

function PostResultRow({ post, index }: { post: SearchPost; index: number }) {
  const avatarUrl = deterministicAvatar(post.authorSeed).url;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 40 }}
    >
      <Pressable
        style={({ pressed }) => [styles.resultCard, pressed && { backgroundColor: Colors.warmGrey }]}
      >
        <View style={styles.resultCardHeader}>
          <Avatar uri={avatarUrl} size="sm" />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultAuthor}>{post.authorName}</Text>
            <Text style={styles.resultTime}>{post.createdAt}</Text>
          </View>
        </View>
        <Text style={styles.resultPostContent} numberOfLines={3}>{post.content}</Text>
        <View style={styles.resultPostMeta}>
          <View style={styles.resultPostStat}>
            <Ionicons name="heart-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.resultPostStatText}>{post.likeCount}</Text>
          </View>
          <View style={styles.resultPostStat}>
            <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.resultPostStatText}>{post.commentCount}</Text>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Person result row ────────────────────────────────────────────────────────

function PersonResultRow({ person, index }: { person: SearchPerson; index: number }) {
  const avatarUrl = deterministicAvatar(person.seed).url;
  return (
    <MotiView
      from={{ opacity: 0, translateX: 12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 40 }}
    >
      <Pressable
        style={({ pressed }) => [styles.personRow, pressed && { backgroundColor: Colors.warmGrey }]}
      >
        <Avatar uri={avatarUrl} size="md" />
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.personRole}>{person.role}</Text>
          <View style={styles.personMeta}>
            {person.babyStage ? (
              <View style={styles.personTag}>
                <Text style={styles.personTagText}>👶 {person.babyStage}</Text>
              </View>
            ) : null}
            {person.mutual > 0 && (
              <Text style={styles.mutualText}>{person.mutual} mutual circle{person.mutual > 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>
        <Pressable style={styles.followBtn}>
          <Text style={styles.followBtnText}>Follow</Text>
        </Pressable>
      </Pressable>
    </MotiView>
  );
}

// ─── Circle result row ────────────────────────────────────────────────────────

function CircleResultRow({
  circle, joined, onToggle, index,
}: { circle: SearchCircle; joined: boolean; onToggle: () => void; index: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 40 }}
    >
      <Pressable
        style={({ pressed }) => [styles.circleRow, pressed && { backgroundColor: Colors.warmGrey }]}
      >
        <Image
          source={{ uri: circle.coverUrl }}
          style={styles.circleThumb}
          contentFit="cover"
        />
        <View style={styles.circleInfo}>
          <Text style={styles.circleName}>{circle.name}</Text>
          <Text style={styles.circleDesc} numberOfLines={1}>{circle.description}</Text>
          <View style={styles.circleMeta}>
            <View style={styles.circleCatBadge}>
              <Text style={styles.circleCatText}>{circle.category}</Text>
            </View>
            <Text style={styles.circleMembers}>{circle.memberCount} members</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.joinBtn,
            joined && styles.joinBtnJoined,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
          onPress={onToggle}
        >
          <AnimatePresence exitBeforeEnter>
            {joined ? (
              <MotiView key="joined" from={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', ...Motion.spring.bouncy }}>
                <Text style={[styles.joinBtnText, styles.joinBtnTextJoined]}>✓ Joined</Text>
              </MotiView>
            ) : (
              <MotiView key="join" from={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', ...Motion.spring.bouncy }}>
                <Text style={styles.joinBtnText}>Join</Text>
              </MotiView>
            )}
          </AnimatePresence>
        </Pressable>
      </Pressable>
    </MotiView>
  );
}

// ─── Search skeleton ──────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <View style={{ padding: Spacing.lg, gap: Spacing.md }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
          <SkeletonBlock width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="70%" height={13} radius={4} />
            <SkeletonBlock width="45%" height={11} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  // Search bar row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.peach,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Discover sections
  discoverSection: { marginBottom: Spacing.xl },
  discoverTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  discoverTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // Trending chips
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  trendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  trendingChipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },

  // Recent searches
  recentList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  recentText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Tabs
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 14,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.peach },
  tabLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.peachDark,
    fontFamily: Typography.fontFamilySemiBold,
  },
  tabBadge: {
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: Radius.full,
    backgroundColor: Colors.warmGrey,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: { backgroundColor: Colors.peachOverlay },
  tabBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
  },
  tabBadgeTextActive: { color: Colors.peachDark },

  itemSep: { height: 1, backgroundColor: Colors.divider },

  // Post result
  resultCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resultAuthor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  resultTime: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  resultPostContent: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resultPostMeta: { flexDirection: 'row', gap: Spacing.md },
  resultPostStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultPostStatText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Person result
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
  },
  personInfo: { flex: 1, gap: 2 },
  personName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  personRole: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  personMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  personTag: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.warmGrey,
  },
  personTagText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  mutualText: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    color: Colors.textMuted,
  },
  followBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.peach,
  },
  followBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // Circle result
  circleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
  },
  circleThumb: {
    width: 52, height: 52, borderRadius: Radius.md,
    flexShrink: 0,
  },
  circleInfo: { flex: 1, gap: 3 },
  circleName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  circleDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  circleMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  circleCatBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.peachOverlay,
  },
  circleCatText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 9,
    color: Colors.peachDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  circleMembers: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  joinBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    minWidth: 60,
    alignItems: 'center',
    ...Shadow.button,
  },
  joinBtnJoined: {
    backgroundColor: Colors.peachOverlay,
    borderWidth: 1.5,
    borderColor: Colors.peach,
    ...Shadow.soft,
  },
  joinBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },
  joinBtnTextJoined: { color: Colors.peachDark },
});
