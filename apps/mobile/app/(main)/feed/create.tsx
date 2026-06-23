/**
 * app/(main)/feed/create.tsx — Screen 10: Create Post
 *
 * Design:
 *   - Full-screen light modal feel (offWhite bg, no hero image)
 *   - Header: "← Cancel" (left) + "New Post" title + "Post" pill button (right, greyed when empty)
 *   - Author avatar + large multiline text input (auto-growing feel)
 *   - Image preview strip — shows picked image with × remove button
 *   - Bottom toolbar (above keyboard):
 *       📷 Pick image  •  👁 Anonymous  •  char count  •  Category selector
 *   - Category chips expand/collapse via AnimatePresence
 *   - Post button: loading spinner → green checkmark → pop navigation
 *   - Shake on submit attempt when empty
 *
 * Navigation:
 *   - router.replace('/(main)/feed') on success so back button
 *     doesn't return to an already-submitted empty form
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '../../../store/authStore';
import { createPost } from '../../../supabase/db';
import { supabase } from '../../../supabase/client';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { deterministicAvatar } from '../../../lib/unsplashImages';

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'general',   label: 'General',       emoji: '💬' },
  { id: 'feeding',   label: 'Feeding',       emoji: '🤱' },
  { id: 'sleep',     label: 'Sleep',         emoji: '😴' },
  { id: 'milestone', label: 'Milestone',     emoji: '🎉' },
  { id: 'question',  label: 'Question',      emoji: '🙋' },
  { id: 'venting',   label: 'I need to vent',emoji: '💛' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

const MAX_CHARS = 500;

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2) || 'MM';

// ─── Screen ──────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success';

export default function CreatePostScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [text,        setText]       = useState('');
  const [image,       setImage]      = useState<string | null>(null);
  const [anonymous,   setAnonymous]  = useState(false);
  const [category,    setCategory]   = useState<CategoryId>('general');
  const [showCats,    setShowCats]   = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 55 }),
      withTiming(8,  { duration: 55 }),
      withTiming(-5, { duration: 55 }),
      withTiming(0,  { duration: 55 }),
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) { triggerShake(); return; }
    if (!user || !profile) return;
    setSubmitState('loading');
    try {
      let imageUrl: string | undefined;
      if (image) {
        const blob = await (await fetch(image)).blob();
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
        content: text.trim(),
        imageUrl,
        isAnonymous: anonymous,
      });
      setSubmitState('success');
      setTimeout(() => router.back(), 700);
    } catch {
      setSubmitState('idle');
      triggerShake();
    }
  }, [text, image, anonymous, user, profile, router]);

  const loading = submitState === 'loading';
  const success = submitState === 'success';
  const charCount = text.length;
  const charRemaining = MAX_CHARS - charCount;
  const nearLimit = charRemaining <= 50;
  const overLimit = charCount > MAX_CHARS;

  const selectedCat = CATEGORIES.find((c) => c.id === category)!;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="create-post-screen">

      {/* ── Header ── */}
      <View testID="create-post-header" style={styles.header}>
        <Pressable
          testID="create-post-back-btn"
          style={styles.cancelBtn}
          onPress={() => router.back()}
          hitSlop={12}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Text style={styles.headerTitle}>New Post</Text>

        {/* Post button */}
        <Pressable
          testID="create-post-submit-btn"
          style={({ pressed }) => [
            styles.postBtn,
            (success || loading) && styles.postBtnActive,
            !text.trim() && styles.postBtnDisabled,
            pressed && text.trim() && !loading && !success && styles.postBtnPressed,
          ]}
          onPress={handleSubmit}
          disabled={loading || success || overLimit}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : success ? (
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', ...Motion.spring.bouncy }}
            >
              <Ionicons name="checkmark" size={18} color={Colors.white} />
            </MotiView>
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Compose area ── */}
          <Animated.View style={[styles.compose, shakeStyle]}>
            {/* Author avatar */}
            <Image
              source={{ uri: anonymous
                ? deterministicAvatar('anonymous').url
                : deterministicAvatar(user?.id ?? 'me').url
              }}
              style={styles.avatar}
              contentFit="cover"
              placeholder={Colors.warmGrey}
              transition={200}
            />

            {/* Author name + category badge */}
            <View style={{ flex: 1 }}>
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>
                  {anonymous ? 'Anonymous Mom' : profile?.displayName ?? 'You'}
                </Text>
                <Pressable
                  testID="create-post-category-picker"
                  style={styles.categoryBadge}
                  onPress={() => setShowCats((v) => !v)}
                >
                  <Text style={styles.categoryEmoji}>{selectedCat.emoji}</Text>
                  <Text style={styles.categoryLabel}>{selectedCat.label}</Text>
                  <Ionicons
                    name={showCats ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={Colors.peachDark}
                  />
                </Pressable>
              </View>

              {/* Multiline text input */}
              <TextInput
                testID="create-post-content-input"
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder="What's on your mind, mama? Share anything — big or small."
                placeholderTextColor={Colors.textMuted}
                multiline
                autoFocus
                maxLength={MAX_CHARS + 10}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* ── Category picker ── */}
          <AnimatePresence>
            {showCats && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 110 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'timing', duration: Motion.duration.base }}
                style={styles.catPanel}
              >
                <View style={styles.catGrid}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [
                        styles.catChip,
                        category === cat.id && styles.catChipActive,
                        pressed && styles.catChipPressed,
                      ]}
                      onPress={() => { setCategory(cat.id); setShowCats(false); }}
                    >
                      <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catChipLabel, category === cat.id && styles.catChipLabelActive]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          {/* ── Image preview ── */}
          <AnimatePresence>
            {image && (
              <MotiView
                from={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', ...Motion.spring.gentle }}
                style={styles.imagePreviewWrap}
              >
                <Image
                  source={{ uri: image }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => setImage(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={Colors.white} />
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </ScrollView>

        {/* ── Bottom toolbar ── */}
        <View style={[styles.toolbar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {/* Image picker */}
          <Pressable
            style={({ pressed }) => [styles.toolBtn, pressed && styles.toolBtnPressed]}
            onPress={handlePickImage}
            hitSlop={10}
          >
            <Ionicons
              name={image ? 'image' : 'image-outline'}
              size={22}
              color={image ? Colors.peach : Colors.textSecondary}
            />
          </Pressable>

          {/* Anonymous toggle */}
          <Pressable
            testID="create-post-anonymous-toggle"
            style={({ pressed }) => [styles.anonBtn, anonymous && styles.anonBtnActive, pressed && styles.toolBtnPressed]}
            onPress={() => setAnonymous((v) => !v)}
          >
            <Ionicons
              name={anonymous ? 'eye-off' : 'eye-off-outline'}
              size={16}
              color={anonymous ? Colors.peachDark : Colors.textMuted}
            />
            <Text style={[styles.anonLabel, anonymous && styles.anonLabelActive]}>Anonymous</Text>
          </Pressable>

          <View style={{ flex: 1 }} />

          {/* Char count */}
          <MotiView
            animate={{ opacity: charCount > 0 ? 1 : 0 }}
            transition={{ type: 'timing', duration: Motion.duration.fast }}
          >
            <Text style={[
              styles.charCount,
              nearLimit && !overLimit && styles.charCountWarn,
              overLimit && styles.charCountError,
            ]}>
              {charRemaining}
            </Text>
          </MotiView>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  cancelBtn: { padding: 4 },
  cancelText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  postBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.button,
  },
  postBtnActive: { backgroundColor: Colors.sentimentPositive },
  postBtnDisabled: { backgroundColor: Colors.warmGrey, shadowOpacity: 0 },
  postBtnPressed: { transform: [{ scale: 0.95 }] },
  postBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
  },

  scroll: {
    flexGrow: 1,
    paddingVertical: Spacing.md,
  },

  compose: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  authorName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.peachOverlay,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.peach,
  },
  categoryEmoji: { fontSize: 13 },
  categoryLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },
  textInput: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 120,
    padding: 0,
    textAlignVertical: 'top',
  },

  // Category panel
  catPanel: {
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  catChipActive: {
    borderColor: Colors.peach,
    backgroundColor: Colors.peachOverlay,
  },
  catChipPressed: { transform: [{ scale: 0.95 }] },
  catChipEmoji: { fontSize: 14 },
  catChipLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  catChipLabelActive: {
    color: Colors.peachDark,
  },

  // Image preview
  imagePreviewWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: Radius.lg,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  toolBtn: { padding: 4 },
  toolBtnPressed: { opacity: 0.6 },
  anonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  anonBtnActive: {
    borderColor: Colors.peach,
    backgroundColor: Colors.peachOverlay,
  },
  anonLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  anonLabelActive: { color: Colors.peachDark },
  charCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    minWidth: 32,
    textAlign: 'right',
  },
  charCountWarn: { color: Colors.sentimentNeutral },
  charCountError: { color: Colors.danger },
});
