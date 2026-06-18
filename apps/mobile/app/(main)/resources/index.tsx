/**
 * app/(main)/resources/index.tsx — Screen 15: Resources / Articles Library
 *
 * Layout:
 *   - Header: "Learn & Grow" + search toggle
 *   - Collapsible search bar (AnimatePresence)
 *   - Category filter pills: All / Mental Health / Breastfeeding / Sleep /
 *     Fitness / Nutrition / Baby Dev / Relationships
 *   - Featured card (first article, large hero + gradient overlay)
 *   - Article list: image-left horizontal cards
 *   - Skeleton loading (1 large + 3 compact)
 *   - Empty state when search returns nothing
 *
 * Navigation: tap any card → /(main)/resources/[id] with articleJson param
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';
import WebWrapper from '../../../components/common/WebWrapper';
import {
  postpartumWellness, nursingMoments, babySleeping,
  outdoorWalks, groupOfMoms, nurseryInteriors,
} from '../../../lib/unsplashImages';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'tip';       text: string }
  | { type: 'quote';     text: string; attribution?: string }
  | { type: 'heading';   text: string };

export interface Article {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  imageBlurHash: string;
  author: string;
  authorRole: string;
  readMinutes: number;
  publishedAt: string;
  excerpt: string;
  body: ArticleBlock[];
  tags: string[];
}

// ─── Mock articles ────────────────────────────────────────────────────────────

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'The 4th Trimester: What No One Tells You',
    category: 'Mental Health',
    imageUrl: postpartumWellness[0]!.url,
    imageBlurHash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
    author: 'Dr. Priya Nair',
    authorRole: 'Perinatal Psychologist',
    readMinutes: 7,
    publishedAt: '2026-06-10',
    excerpt:
      'The weeks after birth can feel like the hardest of your life. You are not alone — and understanding why is the first step.',
    tags: ['postpartum', 'mental health', 'recovery'],
    body: [
      { type: 'paragraph', text: 'The term "fourth trimester" describes the 12 weeks after birth — a period that is every bit as transformative as pregnancy, yet rarely discussed with the same care.' },
      { type: 'tip', text: 'You do not need to "bounce back." Your body and mind just did something extraordinary. Give yourself at least 12 weeks of intentional recovery.' },
      { type: 'heading', text: 'The hormonal cliff' },
      { type: 'paragraph', text: 'Within 48 hours of delivery, oestrogen and progesterone levels drop by as much as 90%. This is the fastest hormonal shift a human body can experience — more dramatic than menopause or puberty. Up to 80% of new mothers experience the "baby blues" as a direct result.' },
      { type: 'quote', text: 'Feeling teary on day three does not mean you are failing. It means your biology is doing exactly what it should.', attribution: 'Dr. Priya Nair' },
      { type: 'heading', text: 'When to seek support' },
      { type: 'paragraph', text: 'If feelings of sadness, emptiness, or anxiety persist beyond two weeks, or if you feel detached from your baby, it is important to speak to a healthcare provider. Postpartum depression affects 1 in 5 mothers and is highly treatable.' },
      { type: 'tip', text: 'The Edinburgh Postnatal Depression Scale (EPDS) is a free 10-question tool your GP can administer. Ask for it at your six-week check-up.' },
    ],
  },
  {
    id: 'a2',
    title: 'Breastfeeding Latch: Every Position Explained',
    category: 'Breastfeeding',
    imageUrl: nursingMoments[1]!.url,
    imageBlurHash: 'LKF~Wq~q_3D%IUoffQWBofj[t7j[',
    author: 'Maya Singh',
    authorRole: 'IBCLC Lactation Consultant',
    readMinutes: 5,
    publishedAt: '2026-06-08',
    excerpt:
      'A comfortable latch makes all the difference. Here are the five positions every new mother should know, with tips for each.',
    tags: ['breastfeeding', 'latch', 'newborn'],
    body: [
      { type: 'paragraph', text: 'Getting a good latch is the cornerstone of successful breastfeeding. A shallow latch causes pain and reduces milk transfer — two of the most common reasons mothers stop breastfeeding earlier than planned.' },
      { type: 'heading', text: 'Cradle hold' },
      { type: 'paragraph', text: 'The most commonly taught position. Baby lies on their side facing you, their head resting in the crook of your elbow on the same side as the nursing breast. Support their body with your forearm.' },
      { type: 'tip', text: 'Wait for baby to open wide — mouth gaping like a yawn — before bringing them to the breast. A large mouthful of breast tissue is the goal, not just the nipple.' },
      { type: 'heading', text: 'Football (clutch) hold' },
      { type: 'paragraph', text: 'Baby is tucked under your arm like a football, facing up, with their legs pointing behind you. This gives excellent visibility of the latch and is especially useful for mothers who had a caesarean.' },
      { type: 'quote', text: 'No position is universally right. The best position is the one where both you and baby are comfortable and the latch is deep.', attribution: 'Maya Singh, IBCLC' },
    ],
  },
  {
    id: 'a3',
    title: '"Sleep When the Baby Sleeps" — And How to Actually Do It',
    category: 'Sleep',
    imageUrl: babySleeping[0]!.url,
    imageBlurHash: 'LPH_-;WB0KRjt7WBD%WB~qt7M{WB',
    author: 'Dr. Ritu Sharma',
    authorRole: 'Paediatric Sleep Specialist',
    readMinutes: 6,
    publishedAt: '2026-06-05',
    excerpt:
      'We have all heard the advice. Here is the research-backed approach to actually getting rest in the newborn haze.',
    tags: ['sleep', 'newborn', 'rest', 'recovery'],
    body: [
      { type: 'paragraph', text: 'Sleep deprivation in the newborn period is not just inconvenient — it is a genuine health risk. Research links chronic sleep loss with impaired decision-making, increased risk of postpartum mood disorders, and reduced milk supply.' },
      { type: 'tip', text: 'A single 90-minute uninterrupted sleep block is more restorative than four fragmented 20-minute naps. Prioritise depth over total quantity when you can.' },
      { type: 'heading', text: 'Resetting your expectations' },
      { type: 'paragraph', text: 'Newborns have a sleep cycle of 45–50 minutes, compared to the adult cycle of 90 minutes. They wake between cycles because they have not yet learned to transition independently. This is normal — not a problem to fix.' },
      { type: 'quote', text: 'The goal in the first 12 weeks is not sleep training. It is survival, with dignity.', attribution: 'Dr. Ritu Sharma' },
      { type: 'heading', text: 'Practical approaches' },
      { type: 'paragraph', text: 'Agree with your partner on a handoff shift. For example: one parent takes 10 pm–2 am, the other takes 2 am–6 am. Even if both parents are present all night, the one "off" wears earplugs and is not roused for non-urgent cries.' },
    ],
  },
  {
    id: 'a4',
    title: 'Postpartum Yoga: 10 Gentle Poses for Week 6+',
    category: 'Fitness',
    imageUrl: outdoorWalks[0]!.url,
    imageBlurHash: 'LGI{v?Rj?b%M?btRRjWB~qt7M{WB',
    author: 'Anita Kapoor',
    authorRole: 'Pre/Postnatal Yoga Instructor',
    readMinutes: 8,
    publishedAt: '2026-06-02',
    excerpt:
      'Once cleared at your six-week check-up, gentle movement can dramatically improve mood, core strength, and energy.',
    tags: ['yoga', 'fitness', 'postpartum', 'pelvic floor'],
    body: [
      { type: 'paragraph', text: 'Before resuming any exercise after birth, it is essential to receive clearance from your midwife or GP at your six-week postnatal appointment. If you had a caesarean or birth complications, this clearance may come later — and that is perfectly fine.' },
      { type: 'tip', text: 'Check for diastasis recti (abdominal separation) before starting any core work. Lie on your back, lift your head slightly, and feel for a gap above your belly button. If it is wider than two fingers, avoid crunches and planks until you have seen a women\'s health physiotherapist.' },
      { type: 'heading', text: 'Cat-Cow (Marjaryasana-Bitilasana)' },
      { type: 'paragraph', text: 'Begin on hands and knees, wrists below shoulders, knees below hips. Inhale, drop your belly, lift your gaze (Cow). Exhale, round your spine toward the ceiling (Cat). Repeat 8–10 times. This gently mobilises the spine and reconnects breath with movement.' },
      { type: 'quote', text: 'Start with what feels safe, not with what you used to do. Your postpartum body deserves respect, not a race.', attribution: 'Anita Kapoor' },
    ],
  },
  {
    id: 'a5',
    title: 'Understanding Baby Growth Spurts',
    category: 'Baby Dev',
    imageUrl: nurseryInteriors[0]!.url,
    imageBlurHash: 'LBF6V9Di0KDj?bxuj[WB~qj[M{j[',
    author: 'Dr. Sunita Patel',
    authorRole: 'Developmental Paediatrician',
    readMinutes: 5,
    publishedAt: '2026-05-29',
    excerpt:
      'Your baby seems hungrier, clingier, and is waking more at night. Welcome to a growth spurt. Here is what to expect.',
    tags: ['baby development', 'growth spurt', 'feeding'],
    body: [
      { type: 'paragraph', text: 'Growth spurts typically occur around 2–3 weeks, 6 weeks, 3 months, and 6 months of age. During these periods babies may feed more frequently, be fussier than usual, and have disrupted sleep — sometimes for 2–5 days.' },
      { type: 'tip', text: 'If breastfeeding, increased cluster feeding during a growth spurt is your baby signalling your body to produce more milk. Follow their lead — supply will increase within 24–48 hours.' },
      { type: 'heading', text: 'Signs your baby is in a growth spurt' },
      { type: 'paragraph', text: 'Increased hunger (feeding every 1–2 hours instead of 2–4), more frequent waking at night, unusual fussiness or crying that is not soothed by your usual methods, and sleeping more between feeds.' },
    ],
  },
  {
    id: 'a6',
    title: 'Building Your Village: Asking for Help Without Guilt',
    category: 'Mental Health',
    imageUrl: groupOfMoms[0]!.url,
    imageBlurHash: 'LHF~Wq~q_3D%IUoffQWBofj[t7j[',
    author: 'Dr. Meera Joshi',
    authorRole: 'Family Therapist',
    readMinutes: 4,
    publishedAt: '2026-05-25',
    excerpt:
      'Modern motherhood was never meant to be a solo endeavour. How to ask for — and actually receive — the support you need.',
    tags: ['support', 'mental health', 'community', 'relationships'],
    body: [
      { type: 'paragraph', text: 'The phrase "it takes a village to raise a child" is not a metaphor — it is developmental biology. For most of human history, new mothers were surrounded by experienced women who shared the load of infant care.' },
      { type: 'tip', text: 'When someone asks "what can I do to help?", have a specific answer ready: "You could bring dinner on Thursday" or "Could you hold the baby for an hour so I can nap?" Vague offers rarely materialise. Specific asks almost always do.' },
      { type: 'quote', text: 'Asking for help is not admitting failure. It is the most loving thing you can do for your baby — because a cared-for mother can care better.', attribution: 'Dr. Meera Joshi' },
    ],
  },
  {
    id: 'a7',
    title: 'Iron-Rich Eating for Postpartum Recovery',
    category: 'Nutrition',
    imageUrl: postpartumWellness[1]!.url,
    imageBlurHash: 'LBF6V9Di0KDj?bxuj[WB~qj[M{j[',
    author: 'Asha Kumar',
    authorRole: 'Registered Dietitian',
    readMinutes: 6,
    publishedAt: '2026-05-20',
    excerpt:
      'Blood loss in childbirth depletes iron reserves. These simple dietary swaps help you rebuild energy and fight postpartum fatigue.',
    tags: ['nutrition', 'iron', 'postpartum', 'recovery'],
    body: [
      { type: 'paragraph', text: 'Postpartum anaemia — low iron after childbirth — affects up to 30% of new mothers and is a leading cause of the exhaustion many mothers attribute simply to "new baby life." Getting iron levels tested at your six-week check is worth requesting.' },
      { type: 'tip', text: 'Pair plant-based iron sources (spinach, lentils, fortified cereal) with vitamin C (orange juice, tomato, bell pepper) at the same meal. Vitamin C increases iron absorption by up to 300%.' },
      { type: 'heading', text: 'Top iron-rich foods' },
      { type: 'paragraph', text: 'Animal sources (haem iron, best absorbed): red meat, dark chicken meat, liver, oysters, sardines. Plant sources (non-haem iron): lentils, kidney beans, tofu, fortified oat milk, dark leafy greens, pumpkin seeds, dried apricots.' },
      { type: 'tip', text: 'Avoid drinking tea or coffee within an hour of an iron-rich meal — tannins significantly reduce absorption. Swap for water or a small glass of orange juice instead.' },
    ],
  },
  {
    id: 'a8',
    title: 'Partner Support: What Dads & Co-Parents Need to Know',
    category: 'Relationships',
    imageUrl: groupOfMoms[1]!.url,
    imageBlurHash: 'LHF~Wq~q_3D%IUoffQWBofj[t7j[',
    author: 'Deepa Ravi',
    authorRole: 'Couples Counsellor',
    readMinutes: 7,
    publishedAt: '2026-05-15',
    excerpt:
      'The early weeks after birth are a relationship crucible. Here is how partners can show up in ways that actually help — and what to avoid.',
    tags: ['relationships', 'partners', 'communication', 'postpartum'],
    body: [
      { type: 'paragraph', text: 'Research consistently shows that the quality of co-parent communication in the first year predicts relationship satisfaction five years later. The good news: small, consistent actions matter far more than grand gestures.' },
      { type: 'tip', text: 'Instead of asking "what do you need?", observe and act. Load the dishwasher. Bring water and a snack to wherever she is feeding. Take the baby for a walk without being asked. These actions reduce cognitive load, which is as depleting as physical exhaustion.' },
      { type: 'heading', text: 'What not to say' },
      { type: 'paragraph', text: '"You look exhausted" — yes, she knows. "The house is a mess" — not the time. "When will you feel like yourself again?" — this implies who she is now is temporary and less-than. She may be becoming a more complex, layered version of herself.' },
      { type: 'quote', text: 'The most romantic thing you can do for the mother of your child is to ensure she never has to ask for what she needs twice.', attribution: 'Deepa Ravi' },
    ],
  },
];

const CATEGORIES = [
  'All', 'Mental Health', 'Breastfeeding', 'Sleep',
  'Fitness', 'Nutrition', 'Baby Dev', 'Relationships',
];

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'All':          'grid-outline',
  'Mental Health':'heart-outline',
  'Breastfeeding':'nutrition-outline',
  'Sleep':        'moon-outline',
  'Fitness':      'fitness-outline',
  'Nutrition':    'leaf-outline',
  'Baby Dev':     'happy-outline',
  'Relationships':'people-outline',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const router  = useRouter();

  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading,       setLoading]       = useState(false);
  const [bookmarks,     setBookmarks]     = useState<Set<string>>(new Set());

  const searchRef = useRef<TextInput>(null);

  const filtered = useMemo(() => {
    let list = MOCK_ARTICLES;
    if (activeCategory !== 'All') {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q)),
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const [featured, ...rest] = filtered;

  const handleOpenArticle = (article: Article) => {
    router.push({
      pathname: '/(main)/resources/[id]',
      params: { id: article.id, articleJson: JSON.stringify(article) },
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSearch = () => {
    setSearchOpen((o) => {
      if (o) { setSearchQuery(''); }
      else    { setTimeout(() => searchRef.current?.focus(), 200); }
      return !o;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="resources-screen">
      <StatusBar barStyle="dark-content" />
      {/* WebWrapper: centres content in 480px on wide web; passthrough on native */}
      <WebWrapper>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Learn & Grow</Text>
          <Text style={styles.headerSub}>Evidence-based guides for new mothers</Text>
        </View>
        <Pressable testID="resources-search-toggle" style={styles.searchToggle} hitSlop={12} onPress={toggleSearch}>
          <Ionicons
            name={searchOpen ? 'close-outline' : 'search-outline'}
            size={22}
            color={Colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <AnimatePresence>
        {searchOpen && (
          <MotiView
            from={{ height: 0, opacity: 0 }}
            animate={{ height: 52, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.fast }}
            style={styles.searchBarWrap}
          >
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                testID="resources-search-input"
                ref={searchRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search articles…"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable testID="resources-search-clear-btn" onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </Pressable>
              )}
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* ── Category pills ── */}
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: Motion.duration.base, delay: 80 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === activeCategory;
            return (
              <Pressable
                key={cat}
                testID={`resources-cat-${cat.toLowerCase().replace(/ /g, '-')}-btn`}
                style={({ pressed }) => [
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <Ionicons
                  name={CATEGORY_ICONS[cat] ?? 'ellipse-outline'}
                  size={13}
                  color={active ? Colors.white : Colors.textMuted}
                />
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </MotiView>

      {/* ── Content ── */}
      {loading ? (
        <ArticlesSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No articles found"
          subtitle={`No results for "${searchQuery}". Try a different search or category.`}
        />
      ) : (
        <FlatList
          testID="resources-list"
          data={rest}
          keyExtractor={(a) => a.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Events banner */}
              <EventsBanner onPress={() => router.push('/(main)/resources/events')} />
              {featured ? (
                <FeaturedCard
                  article={featured}
                  bookmarked={bookmarks.has(featured.id)}
                  onPress={() => handleOpenArticle(featured)}
                  onBookmark={() => toggleBookmark(featured.id)}
                />
              ) : null}
            </>
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 60 }}
            >
              <ArticleCard
                article={item}
                bookmarked={bookmarks.has(item.id)}
                onPress={() => handleOpenArticle(item)}
                onBookmark={() => toggleBookmark(item.id)}
              />
            </MotiView>
          )}
        />
      )}
      </WebWrapper>
    </View>
  );
}

// ─── Events banner ───────────────────────────────────────────────────────────

function EventsBanner({ onPress }: { onPress: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
    >
      <Pressable
        testID="resources-events-banner-btn"
        style={({ pressed }) => [styles.eventsBanner, pressed && { opacity: 0.9 }]}
        onPress={onPress}
      >
        <Image
          source={{ uri: outdoorWalks[3]!.url }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(232,115,74,0.72)', 'rgba(123,104,200,0.72)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.eventsBannerContent}>
          <View style={styles.eventsBannerLeft}>
            <Text style={styles.eventsBannerLabel}>COMMUNITY</Text>
            <Text style={styles.eventsBannerTitle}>Events Near You</Text>
            <Text style={styles.eventsBannerSub}>Meetups · Workshops · Online Classes</Text>
          </View>
          <View style={styles.eventsBannerChevron}>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({
  article, bookmarked, onPress, onBookmark,
}: {
  article: Article;
  bookmarked: boolean;
  onPress: () => void;
  onBookmark: () => void;
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
    >
      <Pressable
        testID="resources-featured-article-btn"
        style={({ pressed }) => [styles.featured, pressed && { opacity: 0.94 }]}
        onPress={onPress}
      >
        <Image
          source={{ uri: article.imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          placeholder={article.imageBlurHash}
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(20,8,2,0.78)']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Bookmark */}
        <Pressable
          testID="resources-featured-bookmark-btn"
          style={styles.featuredBookmark}
          onPress={onBookmark}
          hitSlop={10}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={Colors.white}
          />
        </Pressable>
        {/* Label */}
        <View style={styles.featuredLabel}>
          <View style={[styles.catBadge, { backgroundColor: Colors.peach }]}>
            <Text style={styles.catBadgeText}>{article.category}</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.featuredMeta}>
            <Ionicons name="person-circle-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredMetaText}>{article.author}</Text>
            <View style={styles.metaDot} />
            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.8)" />
            <Text style={styles.featuredMetaText}>{article.readMinutes} min</Text>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({
  article, bookmarked, onPress, onBookmark,
}: {
  article: Article;
  bookmarked: boolean;
  onPress: () => void;
  onBookmark: () => void;
}) {
  return (
    <Pressable
      testID={`resources-article-${article.id}-btn`}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.93 }]}
      onPress={onPress}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: article.imageUrl }}
        style={styles.cardThumb}
        contentFit="cover"
        placeholder={article.imageBlurHash}
        transition={300}
      />
      {/* Text */}
      <View style={styles.cardBody}>
        <View style={[styles.catBadge, { backgroundColor: Colors.peachOverlay, alignSelf: 'flex-start' }]}>
          <Text style={[styles.catBadgeText, { color: Colors.peachDark }]}>{article.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.cardExcerpt} numberOfLines={2}>{article.excerpt}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>{article.author}</Text>
          <View style={styles.metaDot} />
          <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
          <Text style={styles.cardMeta}>{article.readMinutes} min</Text>
        </View>
      </View>
      {/* Bookmark */}
      <Pressable testID={`resources-bookmark-${article.id}-btn`} onPress={onBookmark} hitSlop={12} style={styles.cardBookmark}>
        <Ionicons
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={bookmarked ? Colors.peach : Colors.textMuted}
        />
      </Pressable>
    </Pressable>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ArticlesSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      scrollEnabled={false}
    >
      {/* Featured skeleton */}
      <SkeletonBlock width="100%" height={220} radius={Radius.xl} />
      <View style={{ height: Spacing.md }} />
      {/* Card skeletons */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.card, { marginBottom: Spacing.sm }]}>
          <SkeletonBlock width={100} height={88} radius={Radius.md} />
          <View style={[styles.cardBody, { gap: 8 }]}>
            <SkeletonBlock width={70}  height={16} radius={4} />
            <SkeletonBlock width="90%" height={16} radius={4} />
            <SkeletonBlock width="60%" height={14} radius={4} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  searchToggle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },

  // Search
  searchBarWrap: {
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },

  // Categories
  categoryRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  categoryChipActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.peach,
  },
  categoryLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  categoryLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },

  // Featured card
  featured: {
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  featuredBookmark: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  featuredLabel: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: 6,
  },
  featuredTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.md,
    color: Colors.white,
    lineHeight: 24,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.85)',
  },

  // Article card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    ...Shadow.soft,
  },
  cardThumb: {
    width: 100,
    height: 88,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  cardExcerpt: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardMeta: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardBookmark: {
    paddingRight: Spacing.sm,
    paddingLeft: 4,
    alignSelf: 'flex-start',
    paddingTop: Spacing.sm,
  },

  // Shared
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  catBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 9,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 2,
  },

  // Events banner
  eventsBanner: {
    height: 88,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  eventsBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  eventsBannerLeft: { gap: 2 },
  eventsBannerLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  eventsBannerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
  eventsBannerSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.82)',
  },
  eventsBannerChevron: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
});
