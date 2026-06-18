/**
 * components/feed/PostCard.tsx
 *
 * Production-quality post card with:
 * - Staggered fade+slide mount via Moti
 * - Press scale via Pressable's pressed state (avoids Reanimated 4 worklet overhead for a simple press)
 * - Heart pop animation via Moti useAnimationState on like
 * - expo-image for all photos with warm placeholder
 * - Deterministic avatar fallback (no broken-image silhouettes)
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { MotiView, useAnimationState } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { formatRelative } from 'date-fns';
import type { Post } from '@newmomcircle/types';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../utils/theme';
import { deterministicAvatar } from '../../lib/unsplashImages';

// Warm cream placeholder so nothing ever flashes a broken-image icon
const PHOTO_PLACEHOLDER = Colors.peachOverlay;
const AVATAR_PLACEHOLDER = Colors.warmGrey;

export interface PostCardProps {
  post: Post;
  index: number;
  onLike: (post: Post) => void;
  onComment?: (post: Post) => void;
  onShare?: (post: Post) => void;
  onPress?: (post: Post) => void;
}

export default function PostCard({
  post, index, onLike, onComment, onShare, onPress,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount);

  // Moti animation state for the heart icon — springs from 1 → 1.35 → 1
  const heartAnim = useAnimationState({
    rest: { scale: 1 },
    pop:  { scale: 1.35 },
  });

  const handleLike = useCallback(() => {
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLocalLikeCount((c) => c + (nowLiked ? 1 : -1));
    // Trigger pop only when liking, not unliking
    if (nowLiked) {
      heartAnim.transitionTo('pop');
      // Spring back after 220 ms
      setTimeout(() => heartAnim.transitionTo('rest'), 220);
    }
    onLike(post);
  }, [liked, heartAnim, onLike, post]);

  const timeLabel = post.createdAt
    ? formatRelative(new Date(post.createdAt), new Date())
    : '';

  // Use deterministic Unsplash avatar as fallback so every post has a real face
  const fallbackAvatar = deterministicAvatar(post.authorId).url;

  return (
    // Staggered mount: each card fades+slides up 12px with 80ms per-card delay
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 80 }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => onPress?.(post)}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: post.authorPhotoUrl ?? fallbackAvatar }}
              style={styles.avatar}
              contentFit="cover"
              placeholder={AVATAR_PLACEHOLDER}
              transition={250}
            />
          </View>

          <View style={styles.metaWrap}>
            <Text style={styles.authorName} numberOfLines={1}>
              {post.isAnonymous ? 'Anonymous Mom' : post.authorName}
            </Text>
            <Text style={styles.timeAgo} numberOfLines={1}>{timeLabel}</Text>
          </View>

          <Pressable hitSlop={16} style={styles.moreBtn}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        </View>

        {/* ── Content ── */}
        <Text style={styles.content}>{post.content}</Text>

        {/* ── Optional attached image ── */}
        {post.imageUrl ? (
          <Image
            source={{ uri: post.imageUrl }}
            style={styles.postImage}
            contentFit="cover"
            placeholder={PHOTO_PLACEHOLDER}
            transition={300}
          />
        ) : null}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.actions}>
            {/* Like — animated heart */}
            <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={12}>
              <MotiView state={heartAnim} transition={{ type: 'spring', damping: 10, stiffness: 280 }}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={21}
                  color={liked ? Colors.peach : Colors.textMuted}
                />
              </MotiView>
              <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
                {localLikeCount}
              </Text>
            </Pressable>

            {/* Comment */}
            <Pressable
              style={styles.actionBtn}
              onPress={() => onComment?.(post)}
              hitSlop={12}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.textMuted} />
              <Text style={styles.actionCount}>{post.commentCount}</Text>
            </Pressable>
          </View>

          {/* Share */}
          <Pressable onPress={() => onShare?.(post)} hitSlop={12}>
            <Ionicons name="paper-plane-outline" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>
      </Pressable>
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
    ...Shadow.card,
  },
  // Subtle press feedback — enough to feel physical, not jarring
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.96,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    // Soft peach ring matches the Stitch design
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  avatar: { width: 44, height: 44 },

  metaWrap: { flex: 1 },
  authorName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  moreBtn: { padding: 4 },

  content: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  actionCountActive: {
    color: Colors.peach,
  },
});
