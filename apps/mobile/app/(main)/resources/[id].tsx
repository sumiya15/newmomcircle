/**
 * app/(main)/resources/[id].tsx — Screen 16: Article Detail
 *
 * Layout:
 *   - Large hero image with LinearGradient overlay
 *   - Back chevron + bookmark icon overlaid on hero
 *   - Animated sticky header fades in after user scrolls past hero
 *   - Below hero: category chip · title · author row · read-time badge
 *   - Article body: paragraphs, tip boxes, pull quotes, section headings
 *   - "Related articles" row at the bottom (3 compact cards)
 *   - Share CTA bar pinned above safe-area bottom
 */

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Animated as RNAnimated, StatusBar, Dimensions, Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { MOCK_ARTICLES, type Article, type ArticleBlock } from './index';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 300;
const STICKY_THRESHOLD = HERO_H - 60;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ArticleDetailScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const params   = useLocalSearchParams<{ id: string; articleJson?: string }>();

  // Prefer the passed JSON (offline), fall back to mock lookup
  const article: Article = params.articleJson
    ? (JSON.parse(params.articleJson) as Article)
    : (MOCK_ARTICLES.find((a) => a.id === params.id) ?? MOCK_ARTICLES[0]!);

  const related = MOCK_ARTICLES.filter(
    (a) => a.id !== article.id && (a.category === article.category || a.tags.some((t) => article.tags.includes(t)))
  ).slice(0, 3);

  const [bookmarked, setBookmarked] = useState(false);
  const [liked,      setLiked]      = useState(false);
  const [likeCount,  setLikeCount]  = useState(Math.floor(Math.random() * 80) + 20);

  const scrollY    = useRef(new RNAnimated.Value(0)).current;
  const stickyOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD - 20, STICKY_THRESHOLD + 10],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleLike = () => {
    setLiked((l) => !l);
    setLikeCount((c) => liked ? c - 1 : c + 1);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\n${article.excerpt}\n\n— Shared from NewMomCircle`,
      });
    } catch { /* user cancelled */ }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Sticky animated header ── */}
      <RNAnimated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top, opacity: stickyOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.stickyTitle} numberOfLines={1}>{article.title}</Text>
      </RNAnimated.View>

      {/* ── Floating controls (always visible) ── */}
      <View style={[styles.floatingControls, { top: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.floatBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.white} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.floatBtn,
            pressed && { opacity: 0.8 },
            bookmarked && { backgroundColor: Colors.peach },
          ]}
          onPress={() => setBookmarked((b) => !b)}
          hitSlop={12}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={Colors.white}
          />
        </Pressable>
      </View>

      {/* ── Main scroll ── */}
      <RNAnimated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: article.imageUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            placeholder={article.imageBlurHash}
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(20,8,2,0.65)']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* ── Article card lifts over hero ── */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', ...Motion.spring.gentle, delay: 120 }}
          style={styles.articleCard}
        >
          {/* Category + read time */}
          <View style={styles.metaRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{article.category}</Text>
            </View>
            <View style={styles.readTimeBadge}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.readTimeText}>{article.readMinutes} min read</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorInitial}>
                {article.author.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{article.author}</Text>
              <Text style={styles.authorRole}>{article.authorRole}</Text>
            </View>
            <View style={styles.publishDate}>
              <Text style={styles.publishDateText}>
                {format(new Date(article.publishedAt), 'd MMM yyyy')}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Excerpt */}
          <Text style={styles.excerpt}>{article.excerpt}</Text>

          {/* ── Body ── */}
          <View style={styles.body}>
            {article.body.map((block, i) => (
              <ArticleBlockView key={i} block={block} />
            ))}
          </View>

          {/* ── Engagement row ── */}
          <View style={styles.engagementRow}>
            <Pressable
              style={({ pressed }) => [
                styles.engageBtn,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleLike}
            >
              <MotiView
                animate={{ scale: liked ? 1.3 : 1 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy }}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={liked ? '#D94F4F' : Colors.textSecondary}
                />
              </MotiView>
              <Text style={[styles.engageBtnText, liked && { color: '#D94F4F' }]}>
                {likeCount}
              </Text>
            </Pressable>

            <Pressable style={styles.engageBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.engageBtnText}>Share</Text>
            </Pressable>
          </View>

          {/* ── Tags ── */}
          <View style={styles.tagsRow}>
            {article.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </MotiView>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>You might also like</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.lg }}
            >
              {related.map((rel, i) => (
                <RelatedCard
                  key={rel.id}
                  article={rel}
                  index={i}
                  onPress={() =>
                    router.replace({
                      pathname: '/(main)/resources/[id]',
                      params: { id: rel.id, articleJson: JSON.stringify(rel) },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}
      </RNAnimated.ScrollView>

      {/* ── Bottom share bar ── */}
      <View style={[styles.shareBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.88 }]}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={18} color={Colors.white} />
          <Text style={styles.shareBtnText}>Share this article</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Article block renderer ───────────────────────────────────────────────────

function ArticleBlockView({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'paragraph':
      return <Text style={styles.bodyParagraph}>{block.text}</Text>;

    case 'heading':
      return <Text style={styles.bodyHeading}>{block.text}</Text>;

    case 'tip':
      return (
        <View style={styles.tipBox}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={16} color={Colors.peachDark} />
          </View>
          <Text style={styles.tipText}>{block.text}</Text>
        </View>
      );

    case 'quote':
      return (
        <View style={styles.quoteBox}>
          <View style={styles.quoteBar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quoteText}>"{block.text}"</Text>
            {block.attribution && (
              <Text style={styles.quoteAttrib}>— {block.attribution}</Text>
            )}
          </View>
        </View>
      );

    default:
      return null;
  }
}

// ─── Related card ─────────────────────────────────────────────────────────────

function RelatedCard({
  article, index, onPress,
}: { article: Article; index: number; onPress: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 80 }}
    >
      <Pressable
        style={({ pressed }) => [styles.relatedCard, pressed && { opacity: 0.9 }]}
        onPress={onPress}
      >
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.relatedThumb}
          contentFit="cover"
          placeholder={article.imageBlurHash}
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(20,8,2,0.7)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.relatedMeta}>
          <View style={[styles.catBadge, { backgroundColor: Colors.peach }]}>
            <Text style={styles.catBadgeText}>{article.category}</Text>
          </View>
          <Text style={styles.relatedCardTitle} numberOfLines={2}>{article.title}</Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },

  // Sticky animated header
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    ...Shadow.soft,
  },
  stickyTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },

  // Floating controls overlaid on hero
  floatingControls: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 30,
  },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.36)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: {
    width: SCREEN_W,
    height: HERO_H,
  },

  // Article card
  articleCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    ...Shadow.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.peachOverlay,
  },
  catBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.peachDark,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.md,
  },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  authorAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  authorInitial: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.peachDark,
  },
  authorName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  authorRole: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  publishDate: { marginLeft: 'auto' },
  publishDateText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.md,
  },

  excerpt: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },

  // Body blocks
  body: { gap: Spacing.md },
  bodyParagraph: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  bodyHeading: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  tipBox: {
    flexDirection: 'row',
    backgroundColor: Colors.peachOverlay,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.peach,
  },
  tipIconWrap: {
    marginTop: 2,
    flexShrink: 0,
  },
  tipText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  quoteBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.peach,
    flexShrink: 0,
  },
  quoteText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  quoteAttrib: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 6,
  },

  // Engagement
  engagementRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginTop: Spacing.lg,
  },
  engageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engageBtnText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.warmGrey,
  },
  tagText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },

  // Related
  relatedSection: {
    paddingTop: Spacing.xl,
  },
  relatedTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  relatedCard: {
    width: SCREEN_W * 0.58,
    height: 150,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  relatedThumb: {
    ...StyleSheet.absoluteFillObject,
  },
  relatedMeta: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    gap: 5,
  },
  relatedCardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
    lineHeight: 16,
  },

  // Share bar
  shareBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadow.soft,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    paddingVertical: 14,
    ...Shadow.button,
  },
  shareBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
  },
});
