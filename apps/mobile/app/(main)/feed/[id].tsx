/**
 * app/(main)/feed/[id].tsx — Screen 9: Post Detail + Comments
 *
 * Design:
 *   - Back + share header
 *   - Full post body (author, image, full content, like/comment actions)
 *   - "N Comments" section label
 *   - FlatList of polished CommentRow items with deterministicAvatar
 *   - Skeleton loading (3 rows) while comments fetch
 *   - Empty state when no comments
 *   - Sticky comment input bar at the very bottom
 *   - Keyboard-aware: input slides up with keyboard on iOS & Android
 *
 * Navigation:
 *   - Accessed by pressing a PostCard anywhere in the app
 *   - Post data is passed via URL param `postJson` (JSON string)
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { formatRelative, format } from 'date-fns';

import { useAuthStore } from '../../../store/authStore';
import {
  subscribeToComments, addComment,
} from '../../../supabase/db';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import type { Post, Comment } from '@newmomcircle/types';
import { deterministicAvatar } from '../../../lib/unsplashImages';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2) || 'MM';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  // Post passed as JSON param from navigation
  const params   = useLocalSearchParams<{ postJson: string }>();
  const post: Post | null = params.postJson ? JSON.parse(params.postJson) : null;

  const [liked,          setLiked]          = useState(post?.likedBy?.includes(user?.id ?? '') ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(post?.likeCount ?? 0);
  const [comments,       setComments]       = useState<Comment[]>([]);
  const [loadingCmts,    setLoadingCmts]    = useState(true);
  const [commentText,    setCommentText]    = useState('');
  const [sending,        setSending]        = useState(false);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!post?.id) return;
    setLoadingCmts(true);
    const unsub = subscribeToComments(post.id, (data) => {
      setComments(data);
      setLoadingCmts(false);
    });
    return unsub;
  }, [post?.id]);

  const handleLike = useCallback(() => {
    setLiked((prev) => !prev);
    setLocalLikeCount((c) => liked ? c - 1 : c + 1);
  }, [liked]);

  const handleSend = useCallback(async () => {
    if (!commentText.trim() || !post?.id || !user || !profile) return;
    setSending(true);
    try {
      await addComment({
        postId: post.id,
        authorId: user.id,
        authorName: profile.displayName,
        authorInitials: getInitials(profile.displayName),
        content: commentText.trim(),
      });
      setCommentText('');
      // Scroll to bottom after sending
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } finally {
      setSending(false);
    }
  }, [commentText, post?.id, user, profile]);

  if (!post) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <EmptyState emoji="⚠️" title="Post not found" subtitle="This post may have been deleted." />
      </View>
    );
  }

  const timeLabel = formatRelative(new Date(post.createdAt), new Date());
  const fallbackAvatar = deterministicAvatar(post.authorId).url;
  const canSend = commentText.trim().length > 0 && !sending;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="post-detail-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable testID="post-detail-back-btn" style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <Pressable style={styles.headerShare} hitSlop={12}>
          <Ionicons name="share-outline" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top}
      >
        {/* ── Content + Comments list ── */}
        <FlatList
          testID="post-detail-comments-list"
          ref={listRef}
          data={loadingCmts ? [] : comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <PostBody
              post={post}
              liked={liked}
              likeCount={localLikeCount}
              commentCount={comments.length}
              onLike={handleLike}
            />
          }
          ListEmptyComponent={
            loadingCmts
              ? <CommentSkeletons />
              : (
                <EmptyState
                  emoji="💬"
                  title="No comments yet"
                  subtitle="Be the first to say something kind."
                />
              )
          }
          renderItem={({ item, index }) => (
            <CommentRow comment={item} index={index} />
          )}
          ItemSeparatorComponent={() => <View style={styles.commentSep} />}
        />

        {/* ── Comment input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <Image
            source={{ uri: deterministicAvatar(user?.id ?? 'me').url }}
            style={styles.inputAvatar}
            contentFit="cover"
            placeholder={Colors.warmGrey}
            transition={200}
          />
          <TextInput
            testID="post-detail-comment-input"
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="default"
          />
          <AnimatePresence>
            {commentText.trim().length > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: 'spring', ...Motion.spring.snappy }}
              >
                <Pressable
                  testID="post-detail-comment-submit-btn"
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={!canSend}
                  hitSlop={8}
                >
                  {sending
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Ionicons name="arrow-up" size={18} color={Colors.white} />}
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Post body (top of the list) ─────────────────────────────────────────────

interface PostBodyProps {
  post: Post;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
}

function PostBody({ post, liked, likeCount, commentCount, onLike }: PostBodyProps) {
  const fallbackAvatar = deterministicAvatar(post.authorId).url;
  const timeLabel = formatRelative(new Date(post.createdAt), new Date());

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
    >
      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: post.authorPhotoUrl ?? fallbackAvatar }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={Colors.warmGrey}
            transition={250}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>
            {post.isAnonymous ? 'Anonymous Mom' : post.authorName}
          </Text>
          <Text style={styles.timeAgo}>{timeLabel}</Text>
        </View>
        <Pressable hitSlop={16}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Full content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Attached image */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
          placeholder={Colors.warmGrey}
          transition={300}
        />
      ) : null}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Pressable
          testID="post-detail-like-btn"
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={onLike}
          hitSlop={12}
        >
          <MotiView
            animate={{ scale: liked ? 1.22 : 1 }}
            transition={{ type: 'spring', ...Motion.spring.bouncy }}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? Colors.peach : Colors.textMuted}
            />
          </MotiView>
          <Text style={[styles.actionCount, liked && styles.actionCountActive]}>
            {likeCount}
          </Text>
        </Pressable>

        <View style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.actionCount}>{commentCount}</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]} hitSlop={12}>
          <Ionicons name="paper-plane-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.actionCount}>Share</Text>
        </Pressable>
      </View>

      {/* Comments section label */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Comments</Text>
        <Text style={styles.sectionCount}>{commentCount}</Text>
      </View>
    </MotiView>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment, index }: { comment: Comment; index: number }) {
  const avatar = deterministicAvatar(comment.authorId).url;
  const timeLabel = comment.createdAt
    ? format(new Date(comment.createdAt), 'dd MMM · HH:mm')
    : '';

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 50 }}
      style={styles.commentRow}
    >
      <Image
        source={{ uri: avatar }}
        style={styles.commentAvatar}
        contentFit="cover"
        placeholder={Colors.warmGrey}
        transition={200}
      />
      <View style={styles.commentBubble}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentTime}>{timeLabel}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>

        {/* Inline reactions row */}
        <View style={styles.commentActions}>
          <Pressable style={styles.commentLike} hitSlop={10}>
            <Ionicons name="heart-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.commentLikeLabel}>Like</Text>
          </Pressable>
          <Pressable style={styles.commentLike} hitSlop={10}>
            <Text style={styles.commentLikeLabel}>Reply</Text>
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}

// ─── Comment skeletons ────────────────────────────────────────────────────────

function CommentSkeletons() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.commentRow, { opacity: 1 - i * 0.2 }]}>
          <SkeletonBlock width={36} height={36} radius={18} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="45%" height={12} radius={Radius.sm} />
            <SkeletonBlock width="90%" height={10} radius={Radius.sm} />
            <SkeletonBlock width="70%" height={10} radius={Radius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
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
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  headerShare: { padding: 4 },
  backBtn: {
    margin: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: {
    paddingBottom: Spacing.xl,
  },

  // Post body
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  avatar: { width: 48, height: 48 },
  authorName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  postContent: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  postImage: {
    marginHorizontal: Spacing.lg,
    height: 220,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBtnPressed: { opacity: 0.7 },
  actionCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  actionCountActive: {
    color: Colors.peach,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },

  // Comments
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  commentSep: { height: Spacing.xs },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderTopLeftRadius: 6,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  commentTime: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  commentText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  commentLike: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentLikeLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Skeleton
  skeletonWrap: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 3,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    ...Shadow.button,
  },
  sendBtnDisabled: { opacity: 0.55 },
});
