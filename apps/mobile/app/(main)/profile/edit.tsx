/**
 * app/(main)/profile/edit.tsx — Screen 19: Edit Profile
 *
 * Layout:
 *   - Header: back < · "Edit Profile" · Save button (right)
 *   - Photo: 96px avatar tap-to-change (ImagePicker stub)
 *   - Section "About You": Display Name · Bio (150-char counter) · City
 *   - Section "Your Baby": Baby Name · Baby DOB · Stage chips
 *   - Section "Interests": 12 multi-select topic chips
 *   - Sticky Save bar at bottom
 *
 * Persistence: displayName + babyDob → updateUserProfile
 *              bio/city/babyName/interests → local optimistic state only
 *              (not in DB schema, stored in UI until backend is extended)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { updateUserProfile } from '../../../supabase/db';
import { useAuthStore } from '../../../store/authStore';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { deterministicAvatar } from '../../../lib/unsplashImages';

// ─── Constants ────────────────────────────────────────────────────────────────

const BIO_MAX = 150;

const BABY_STAGES = [
  { id: 'expecting',  label: 'Expecting' },
  { id: '0-3mo',      label: '0–3 mo'   },
  { id: '3-6mo',      label: '3–6 mo'   },
  { id: '6-12mo',     label: '6–12 mo'  },
  { id: '12mo+',      label: '12 mo+'   },
];

const TOPICS = [
  'Breastfeeding', 'Sleep',        'Mental Health',  'Nutrition',
  'Baby Dev',      'Exercise',     'Relationships',  'Medication',
  'Birth Recovery','Anxiety',      'Work & Career',  'Single Parenting',
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const insets     = useSafeAreaInsets();
  const router     = useRouter();
  const user       = useAuthStore((s) => s.user);
  const profile    = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  // Form state (initialised from current profile)
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio,         setBio]         = useState('');
  const [city,        setCity]        = useState('');
  const [babyName,    setBabyName]    = useState('');
  const [babyDob,     setBabyDob]     = useState(profile?.babyDob ?? '');
  const [stage,       setStage]       = useState<string | null>(null);
  const [topics,      setTopics]      = useState<Set<string>>(new Set());
  const [photoUri,    setPhotoUri]    = useState<string | null>(profile?.photoUrl ?? null);

  // Save flow
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Shake animation on validation failure
  const shakeX = useSharedValue(0);
  const nameRef = useRef<TextInput>(null);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 55 }),
      withTiming(8,  { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(6,  { duration: 55 }),
      withTiming(0,  { duration: 55 }),
    );
  }, []);

  const toggleTopic = (t: string) => {
    setTopics((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (displayName.trim().length < 2) {
      setErrorMsg('Display name must be at least 2 characters.');
      shake();
      nameRef.current?.focus();
      return;
    }
    if (!user) return;

    setSaving(true);
    setErrorMsg('');
    try {
      await updateUserProfile(user.id, {
        displayName: displayName.trim(),
        babyDob:     babyDob.trim() || undefined,
      });
      // Optimistic local update
      setProfile({
        ...profile!,
        displayName: displayName.trim(),
        babyDob:     babyDob.trim() || profile?.babyDob,
      });
      setSuccess(true);
      // Brief success state then navigate back
      setTimeout(() => router.back(), 900);
    } catch {
      setErrorMsg('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatarUrl = photoUri ?? deterministicAvatar(user?.id ?? 'default').url;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top }]} testID="edit-profile-screen">
        <StatusBar barStyle="dark-content" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable testID="edit-profile-back-btn" style={styles.headerBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            testID="edit-profile-save-header-btn"
            style={({ pressed }) => [
              styles.saveHeaderBtn,
              (saving || success) && { opacity: 0.7 },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSave}
            disabled={saving || success}
          >
            <AnimatePresence exitBeforeEnter>
              {success ? (
                <MotiView
                  key="check"
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', ...Motion.spring.bouncy }}
                >
                  <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                </MotiView>
              ) : saving ? (
                <MotiView
                  key="spin"
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{ loop: true, repeatReverse: false, type: 'timing', duration: 800 }}
                >
                  <Ionicons name="refresh-outline" size={20} color={Colors.peach} />
                </MotiView>
              ) : (
                <MotiView key="label" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Text style={styles.saveHeaderText}>Save</Text>
                </MotiView>
              )}
            </AnimatePresence>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Error banner ── */}
          <AnimatePresence>
            {errorMsg ? (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: Motion.duration.fast }}
                style={styles.errorBanner}
              >
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <Pressable onPress={() => setErrorMsg('')} hitSlop={8}>
                  <Ionicons name="close" size={16} color={Colors.danger} />
                </Pressable>
              </MotiView>
            ) : null}
          </AnimatePresence>

          {/* ── Photo ── */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', ...Motion.spring.bouncy }}
            style={styles.photoSection}
          >
            <Pressable
              style={({ pressed }) => [styles.avatarWrap, pressed && { opacity: 0.85 }]}
              onPress={handlePickPhoto}
            >
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera-outline" size={22} color={Colors.white} />
              </View>
            </Pressable>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </MotiView>

          {/* ── About You ── */}
          <FormSection title="About You" icon="person-outline">
            <FormField label="Display Name *">
              <Animated.View style={animStyle}>
                <TextInput
                  ref={nameRef}
                  style={[
                    styles.input,
                    errorMsg && displayName.trim().length < 2 && styles.inputError,
                  ]}
                  value={displayName}
                  onChangeText={(t) => { setDisplayName(t); setErrorMsg(''); }}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                  maxLength={50}
                  returnKeyType="next"
                />
              </Animated.View>
            </FormField>

            <FormField label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
                placeholder="A little about yourself…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </FormField>

            <FormField label="City">
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Bengaluru"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
              />
            </FormField>
          </FormSection>

          {/* ── Your Baby ── */}
          <FormSection title="Your Baby" icon="nutrition-outline">
            <FormField label="Baby's Name">
              <TextInput
                style={styles.input}
                value={babyName}
                onChangeText={setBabyName}
                placeholder="e.g. Arjun"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
              />
            </FormField>

            <FormField label="Baby's Date of Birth" hint="DD/MM/YYYY">
              <TextInput
                style={styles.input}
                value={babyDob}
                onChangeText={setBabyDob}
                placeholder="e.g. 14/04/2026"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                returnKeyType="done"
                maxLength={10}
              />
            </FormField>

            <FormField label="Baby Stage">
              <View style={styles.chipRow}>
                {BABY_STAGES.map((s) => {
                  const active = stage === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => setStage(active ? null : s.id)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FormField>
          </FormSection>

          {/* ── Interests ── */}
          <FormSection title="Your Interests" icon="heart-outline">
            <Text style={styles.fieldHintText}>
              Select all that apply — your feed is personalised based on these.
            </Text>
            <View style={styles.topicGrid}>
              {TOPICS.map((t) => {
                const active = topics.has(t);
                return (
                  <MotiView
                    key={t}
                    animate={{ scale: active ? 1.03 : 1 }}
                    transition={{ type: 'spring', ...Motion.spring.snappy }}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.topicChip,
                        active && styles.topicChipActive,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => toggleTopic(t)}
                    >
                      {active && (
                        <Ionicons name="checkmark" size={12} color={Colors.white} />
                      )}
                      <Text style={[styles.topicChipText, active && styles.topicChipTextActive]}>
                        {t}
                      </Text>
                    </Pressable>
                  </MotiView>
                );
              })}
            </View>
          </FormSection>
        </ScrollView>

        {/* ── Sticky Save bar ── */}
        <View style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              (saving || success) && { opacity: 0.7 },
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleSave}
            disabled={saving || success}
          >
            <AnimatePresence exitBeforeEnter>
              {success ? (
                <MotiView
                  key="done"
                  from={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', ...Motion.spring.bouncy }}
                  style={styles.saveBtnInner}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Saved!</Text>
                </MotiView>
              ) : saving ? (
                <MotiView
                  key="loading"
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.saveBtnInner}
                >
                  <Ionicons name="refresh-outline" size={18} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Saving…</Text>
                </MotiView>
              ) : (
                <MotiView key="idle" from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </MotiView>
              )}
            </AnimatePresence>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Form section ─────────────────────────────────────────────────────────────

function FormSection({
  title, icon, children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={15} color={Colors.peachDark} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </MotiView>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function FormField({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint && <Text style={styles.fieldHint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  saveHeaderBtn: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveHeaderText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.peach,
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(217,79,79,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217,79,79,0.3)',
    marginBottom: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.danger,
  },

  // Photo
  photoSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarWrap: {
    width: 96, height: 96, borderRadius: 48,
    position: 'relative',
    ...Shadow.card,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: Colors.white,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoHint: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
    ...Shadow.soft,
  },

  // Field
  field: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  fieldHint: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  fieldHintText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    lineHeight: 18,
  },

  // Input
  input: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },
  inputError: { color: Colors.danger },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 4,
  },

  // Stage chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingTop: 4,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.offWhite,
  },
  chipActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.peach,
  },
  chipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },

  // Topic grid
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.offWhite,
  },
  topicChipActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.peach,
  },
  topicChipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  topicChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },

  // Save bar
  saveBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    ...Shadow.soft,
  },
  saveBtn: {
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.button,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  saveBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
});
