/**
 * app/(main)/feed/index.tsx
 *
 * Community feed — the social heartbeat of NewMomCircle.
 *
 * States:
 *   loading   → 4 staggered skeleton cards
 *   empty     → EmptyState with CTA to write the first post
 *   populated → FlatList of PostCards + sticky category filter
 *
 * Motion philosophy: every interaction has a micro-response (press scale,
 * FAB spring, modal slide). Nothing flashy — everything feels "settled."
 */
import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { formatRelative } from 'date-fns';

import { useAuthStore } from '../../../store/authStore';
import {
  getPosts,
  subscribeToPostsRealtime,
  createPost,
  toggleLike,
} from '../../../supabase/db';
import { supabase } from '../../../supabase/client';
import { Colors, Typography, Spacing, Radius, Shadow } from '../../../utils/theme';
import type { Post } from '@newmomcircle/types';
import PostCard from '../../../components/feed/PostCard';
import PostSkeleton from '../../../components/feed/PostSkeleton';
import CategoryPills, { FeedCategory } from '../../../components/feed/CategoryPills';
import EmptyState from '../../../components/common/EmptyState';
import {
  outdoorWalks,
  nursingMoments,
  deterministicAvatar,
} from '../../../lib/unsplashImages';

// ─── Rich dummy data (shown when Supabase returns 0 posts) ───────────────────

const DUMMY_POSTS: Post[] = [
  {
    id: 'dummy-1',
    authorId: 'u1',
    authorName: 'Priya Sharma',
    authorInitials: 'PS',
    authorPhotoUrl: deterministicAvatar('u1').url,
    content:
      'Day 15 postpartum — finally managed a shower AND made chai. Celebrating the small wins today! ☕🎉',
    imageUrl: null,
    likeCount: 24,
    commentCount: 8,
    likedBy: [],
    isAnonymous: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dummy-2',
    authorId: 'u2',
    authorName: 'Anita Reddy',
    authorInitials: 'AR',
    authorPhotoUrl: deterministicAvatar('u2').url,
    content:
      'मेरे बच्चे ने आज पहली बार मुस्कुराया 🥹💕 सारी नींद की कमी worth it!',
    // Real Unsplash photo of a mother and baby in warm light
    imageUrl: nursingMoments[0]!.url,
    likeCount: 47,
    commentCount: 15,
    likedBy: [],
    isAnonymous: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dummy-3',
    authorId: 'u3',
    authorName: 'Kavitha S',
    authorInitials: 'KS',
    authorPhotoUrl: deterministicAvatar('u3').url,
    content:
      'The breathing exercises from the Toolbox actually helped with my anxiety today. Tried the 4-7-8 technique and felt calmer within minutes. 🧘‍♀️',
    imageUrl: null,
    likeCount: 31,
    commentCount: 5,
    likedBy: [],
    isAnonymous: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dummy-4',
    authorId: 'u4',
    authorName: 'Lakshmi N',
    authorInitials: 'LN',
    authorPhotoUrl: deterministicAvatar('u4').url,
    content:
      'First park walk with the stroller today! The fresh air did wonders for both of us. Highly recommend a 15-minute change of scenery when you feel overwhelmed.',
    // Outdoor walk scene
    imageUrl: outdoorWalks[0]!.url,
    likeCount: 156,
    commentCount: 22,
    likedBy: [],
    isAnonymous: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'dummy-5',
    authorId: 'u5',
    authorName: 'Deepa Menon',
    authorInitials: 'DM',
    authorPhotoUrl: deterministicAvatar('u5').url,
    content:
      'Sleep deprivation is genuine torture but these little faces make it all worth it 😴👶 Sending strength to all the mamas doing midnight feeds right now!',
    imageUrl: null,
    likeCount: 203,
    commentCount: 41,
    likedBy: [],
    isAnonymous: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'MM';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Initial fetch + realtime subscription
  useEffect(() => {
    // Fetch immediately on mount
    getPosts().then((livePosts) => {
      setPosts(livePosts.length > 0 ? livePosts : DUMMY_POSTS);
      setLoading(false);
    }).catch(() => {
      setPosts(DUMMY_POSTS);
      setLoading(false);
    });

    // Subscribe for live updates
    const unsub = subscribeToPostsRealtime((livePosts) => {
      setPosts(livePosts.length > 0 ? livePosts : DUMMY_POSTS);
    });

    return unsub;
  }, []);

  const handleLike = useCallback(
    async (post: Post) => {
      if (!user) return;
      try {
        await toggleLike(post.id, user.id, post.likedBy);
      } catch {
        // Optimistic UI already updated in PostCard — silent failure is OK
      }
    },
    [user],
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPostImage(result.assets[0].uri);
    }
  };

  const handleSubmitPost = async () => {
    if (!postText.trim() || !user || !profile) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (postImage) {
        const blob = await (await fetch(postImage)).blob();
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('post-images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }
      await createPost({
        authorId: user.id,
        authorName: profile.displayName,
        authorInitials: getInitials(profile.displayName),
        authorPhotoUrl: profile.photoUrl ?? undefined,
        content: postText.trim(),
        imageUrl,
      });
      setPostText('');
      setPostImage(null);
      setCreateError('');
      setShowCreate(false);
    } catch {
      setCreateError(t('error_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPost = useCallback((post: Post) => {
    router.push({
      pathname: '/(main)/feed/[id]',
      params: { id: post.id, postJson: JSON.stringify(post) },
    });
  }, [router]);

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <PostCard
        post={item}
        index={index}
        onLike={handleLike}
        onComment={handleOpenPost}
        onPress={handleOpenPost}
      />
    ),
    [handleLike, handleOpenPost],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <FeedHeader profile={profile} />
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <PostSkeleton key={i} index={i} showImage={i === 1} />
          ))}
        </View>
      </View>
    );
  }

  // ── Populated / empty ─────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="feed-screen">
      <FeedHeader profile={profile} />

      <FlatList
        testID="feed-list"
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderPost}
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.listContentEmpty,
        ]}
        // Category pills scroll with the list so they don't eat screen space
        ListHeaderComponent={
          <CategoryPills active={activeCategory} onChange={setActiveCategory} />
        }
        ListHeaderComponentStyle={styles.pillsHeader}
        ListEmptyComponent={
          <EmptyState
            emoji="🌸"
            title="Be the first to share"
            subtitle="Your circle is waiting. Share a moment, ask a question, or just say hi."
            actionLabel="Write a post"
            onAction={() => router.push('/(main)/feed/create')}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />

      {/* ── FAB ── */}
      <AnimatePresence>
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260, delay: 400 }}
          style={[styles.fabWrap, { bottom: insets.bottom + 90 }]}
        >
          <Pressable
            testID="feed-create-btn"
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.fabPressed,
            ]}
            onPress={() => router.push('/(main)/feed/create')}
          >
            <LinearGradient
              colors={[Colors.peach, Colors.peachDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGrad}
            >
              <Ionicons name="add" size={28} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        </MotiView>
      </AnimatePresence>

      {/* ── Create Post Modal ── */}
      <CreatePostModal
        visible={showCreate}
        postText={postText}
        postImage={postImage}
        submitting={submitting}
        error={createError}
        onChangeText={setPostText}
        onPickImage={handlePickImage}
        onRemoveImage={() => setPostImage(null)}
        onSubmit={handleSubmitPost}
        onClose={() => {
          setShowCreate(false);
          setPostText('');
          setPostImage(null);
          setCreateError('');
        }}
      />
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FeedHeader({ profile }: { profile: { displayName: string } | null }) {
  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting}, {firstName} 🌸</Text>
          <Text style={styles.subGreeting}>Your circle is here for you.</Text>
        </View>
        <View style={styles.headerRight}>
        {/* Explore Circles */}
        <Pressable
          testID="feed-explore-btn"
          style={styles.iconBtn}
          hitSlop={12}
          onPress={() => router.push('/(main)/explore')}
        >
          <Ionicons name="people-circle-outline" size={24} color={Colors.textSecondary} />
        </Pressable>
        {/* Direct Messages */}
        <Pressable
          testID="feed-messages-btn"
          style={styles.iconBtn}
          hitSlop={12}
          onPress={() => router.push('/(main)/messages')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={23} color={Colors.textSecondary} />
          {/* Unread dot */}
          <View style={styles.notifDot} />
        </Pressable>
        {/* Baby Tracker */}
        <Pressable
          testID="feed-tracker-btn"
          style={styles.iconBtn}
          hitSlop={12}
          onPress={() => router.push('/(main)/tracker')}
        >
          <Ionicons name="nutrition-outline" size={23} color={Colors.textSecondary} />
        </Pressable>
        {/* Notification bell */}
        <Pressable
          testID="feed-notification-btn"
          style={styles.iconBtn}
          hitSlop={12}
          onPress={() => router.push('/(main)/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
          {/* Unread dot */}
          <View style={styles.notifDot} />
        </Pressable>
        </View>
      </View>
      {/* Search bar row */}
      <Pressable
        testID="feed-search-btn"
        style={({ pressed }) => [styles.searchBarFake, pressed && { opacity: 0.75 }]}
        onPress={() => router.push('/(main)/search')}
      >
        <Ionicons name="search-outline" size={15} color={Colors.textMuted} />
        <Text style={styles.searchBarFakePlaceholder}>Search posts, people, circles…</Text>
      </Pressable>
    </View>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────

interface CreatePostModalProps {
  visible: boolean;
  postText: string;
  postImage: string | null;
  submitting: boolean;
  error: string;
  onChangeText: (t: string) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onSubmit: () => void;
  onClose: () => void;
}

function CreatePostModal({
  visible, postText, postImage, submitting, error,
  onChangeText, onPickImage, onRemoveImage, onSubmit, onClose,
}: CreatePostModalProps) {
  const insets = useSafeAreaInsets();
  const canPost = postText.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {/* Tap-outside-to-dismiss scrim */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {/* Drag handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New post</Text>
            <Pressable
              testID="feed-submit-btn"
              style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
              onPress={onSubmit}
              disabled={!canPost || submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.postBtnText}>Post</Text>}
            </Pressable>
          </View>

          {/* Text input */}
          <TextInput
            testID="feed-post-input"
            style={styles.textInput}
            multiline
            value={postText}
            onChangeText={onChangeText}
            placeholder="Share something with your circle…"
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
            autoFocus
            maxLength={1000}
          />

          {/* Attached image preview */}
          {postImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image
                source={{ uri: postImage }}
                style={styles.imagePreview}
                contentFit="cover"
                transition={200}
              />
              <Pressable style={styles.removeImageBtn} onPress={onRemoveImage}>
                <Ionicons name="close-circle" size={24} color={Colors.white} />
              </Pressable>
            </View>
          ) : null}

          {/* Error banner */}
          {error ? (
            <View style={styles.modalErrorBanner}>
              <Text style={styles.modalErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* Toolbar */}
          <View style={styles.modalToolbar}>
            <Pressable style={styles.toolbarBtn} onPress={onPickImage} hitSlop={8}>
              <Ionicons name="image-outline" size={22} color={Colors.peach} />
              <Text style={styles.toolbarBtnText}>Photo</Text>
            </Pressable>
            <Text style={styles.charCount}>
              {postText.length}/1000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.offWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.peach,
    borderWidth: 1.5,
    borderColor: Colors.offWhite,
  },
  searchBarFake: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.warmGrey,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  searchBarFakePlaceholder: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    flex: 1,
  },

  // Feed list
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // clears the FAB + tab bar
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  listContentEmpty: { flexGrow: 1 },
  pillsHeader: {
    marginHorizontal: -Spacing.lg, // bleed to screen edges
    marginBottom: Spacing.sm,
  },

  // Skeleton loading
  skeletonList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    right: Spacing.lg,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    ...Shadow.button,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
  },
  fabGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,10,5,0.5)',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    minHeight: 320,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.warmGrey,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalCancelText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
  modalTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  postBtn: {
    backgroundColor: Colors.peach,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    ...Shadow.button,
  },
  postBtnDisabled: {
    opacity: 0.45,
  },
  postBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
  },
  textInput: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  imagePreviewWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    // Dark scrim behind the X so it's visible on any photo
    backgroundColor: 'rgba(20,8,4,0.55)',
    borderRadius: 12,
  },
  modalToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  toolbarBtnText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.peachDark,
  },
  charCount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  modalErrorBanner: {
    backgroundColor: Colors.danger + '18',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  modalErrorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.danger,
  },
});
