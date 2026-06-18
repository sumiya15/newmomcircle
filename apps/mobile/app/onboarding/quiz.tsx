/**
 * app/onboarding/quiz.tsx — Screen 5: Onboarding Quiz / Profile Setup
 *
 * 4-step wizard that personalises the app experience:
 *   Step 0 — Name (pre-filled from auth, editable)
 *   Step 1 — Baby status (expecting / newborn / 3-6mo / 6-12mo / 12mo+)
 *   Step 2 — Topics of interest (multi-select chips, 2+ required)
 *   Step 3 — Community preference (lurker / sharer / both)
 *
 * Motion:
 *   - Progress bar fills with spring on each advance
 *   - Step content cross-fades + slides in from right on next, left on back
 *   - Topic chips pop in staggered via Moti
 *   - Option cards have press scale + peach border on select
 *   - CTA button locks while animating (prevents double-tap)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, StatusBar, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../utils/theme';
import { nursingMoments, outdoorWalks, babySleeping, postpartumWellness } from '../../lib/unsplashImages';
import { useAuthStore } from '../../store/authStore';

const { width: W } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

interface BabyStage {
  id: string;
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const BABY_STAGES: BabyStage[] = [
  { id: 'expecting',  label: 'Still expecting',  sub: 'Due soon or currently pregnant', icon: 'heart-outline' },
  { id: 'newborn',    label: 'Newborn',           sub: '0 – 3 months',                  icon: 'moon-outline' },
  { id: '3to6',       label: '3 – 6 months',     sub: 'Rolling, smiling, discovering',  icon: 'sunny-outline' },
  { id: '6to12',      label: '6 – 12 months',    sub: 'Sitting, solids, sleep regressions', icon: 'leaf-outline' },
  { id: '12plus',     label: '12 months+',        sub: 'Walking, talking, toddler life', icon: 'walk-outline' },
];

interface Topic {
  id: string;
  label: string;
  emoji: string;
}

const TOPICS: Topic[] = [
  { id: 'breastfeeding', label: 'Breastfeeding',    emoji: '🤱' },
  { id: 'sleep',         label: 'Baby Sleep',       emoji: '😴' },
  { id: 'mental-health', label: 'Mental Health',    emoji: '🧠' },
  { id: 'nutrition',     label: 'Nutrition',        emoji: '🥗' },
  { id: 'development',   label: 'Development',      emoji: '🌱' },
  { id: 'ppd',           label: 'Postpartum',       emoji: '💛' },
  { id: 'relationships', label: 'Relationships',    emoji: '💑' },
  { id: 'fitness',       label: 'Fitness & Body',   emoji: '🏃‍♀️' },
  { id: 'work',          label: 'Back to Work',     emoji: '💼' },
  { id: 'multiples',     label: 'Twins/Multiples',  emoji: '👯' },
  { id: 'single',        label: 'Single Parenting', emoji: '💪' },
  { id: 'community',     label: 'Find My Circle',   emoji: '🫂' },
];

interface CommunityStyle {
  id: string;
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const COMMUNITY_STYLES: CommunityStyle[] = [
  { id: 'lurker',  label: 'I like to read',       sub: 'Browse stories and tips at my own pace',     icon: 'glasses-outline' },
  { id: 'sharer',  label: 'I love sharing',        sub: 'Post updates, ask questions, celebrate wins', icon: 'chatbubbles-outline' },
  { id: 'both',    label: 'A bit of both',         sub: 'Dip in and out whenever it feels right',     icon: 'shuffle-outline' },
];

const STEP_PHOTOS = [
  nursingMoments[0]!.url,
  babySleeping[0]!.url,
  outdoorWalks[2]!.url,
  postpartumWellness[3]!.url,
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OnboardingQuizScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const user     = useAuthStore((s) => s.user);

  const [step,           setStep]           = useState(0);
  const [direction,      setDirection]      = useState<1 | -1>(1);
  const [name,           setName]           = useState(user?.displayName ?? '');
  const [selectedStage,  setSelectedStage]  = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [communityStyle, setCommunityStyle] = useState<string | null>(null);
  const [busy,           setBusy]           = useState(false);

  const progressAnim = useSharedValue(1 / TOTAL_STEPS);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const advance = useCallback((delta: 1 | -1 = 1) => {
    const next = step + delta;
    if (next < 0 || next > TOTAL_STEPS) return;
    setDirection(delta);
    setStep(next);
    progressAnim.value = withSpring((next + 1) / TOTAL_STEPS, Motion.spring.snappy);
  }, [step, progressAnim]);

  const canAdvance = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return selectedStage !== null;
    if (step === 2) return selectedTopics.size >= 2;
    if (step === 3) return communityStyle !== null;
    return true;
  };

  const handleFinish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    // TODO: persist onboarding data to Supabase profile
    router.replace('/(main)/feed');
  }, [busy, router]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="quiz-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header: back + progress bar ── */}
      <View style={styles.header}>
        <Pressable
          testID="quiz-back-btn"
          style={styles.headerBack}
          onPress={() => step > 0 ? advance(-1) : router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        <View testID="quiz-progress-bar" style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        <Text style={styles.stepLabel}>{step + 1} / {TOTAL_STEPS}</Text>
      </View>

      {/* ── Step content — cross-fade + slide ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={step}
            from={{ opacity: 0, translateX: direction * 40 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: direction * -40 }}
            transition={{ type: 'timing', duration: Motion.duration.base }}
          >
            {/* Small photo banner per step */}
            <View style={styles.photoBanner}>
              <Image
                source={{ uri: STEP_PHOTOS[step] }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                placeholder={Colors.warmGrey}
                transition={300}
              />
              <LinearGradient
                colors={['rgba(253,248,245,0)', Colors.offWhite]}
                locations={[0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {step === 0 && (
              <StepName name={name} onChange={setName} />
            )}
            {step === 1 && (
              <StepBabyStage selected={selectedStage} onSelect={setSelectedStage} />
            )}
            {step === 2 && (
              <StepTopics selected={selectedTopics} onToggle={toggleTopic} />
            )}
            {step === 3 && (
              <StepCommunityStyle selected={communityStyle} onSelect={setCommunityStyle} />
            )}
          </MotiView>
        </AnimatePresence>

        {/* ── CTA ── */}
        <MotiView
          animate={{ opacity: canAdvance() ? 1 : 0.45 }}
          transition={{ type: 'timing', duration: Motion.duration.fast }}
          style={styles.ctaWrap}
        >
          <Pressable
            testID={step < TOTAL_STEPS - 1 ? "quiz-next-btn" : "quiz-submit-btn"}
            style={({ pressed }) => [
              styles.cta,
              pressed && canAdvance() && styles.ctaPressed,
            ]}
            onPress={step < TOTAL_STEPS - 1 ? () => advance(1) : handleFinish}
            disabled={!canAdvance() || busy}
          >
            <LinearGradient
              colors={[Colors.peach, Colors.peachDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>
                {step < TOTAL_STEPS - 1 ? 'Continue' : 'Start my journey'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        </MotiView>

        {/* Skip — only visible on steps that aren't the last */}
        {step < TOTAL_STEPS - 1 && (
          <Pressable style={styles.skipRow} onPress={() => advance(1)} hitSlop={12}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Step 0: Name ─────────────────────────────────────────────────────────────

function StepName({ name, onChange }: { name: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>What should we{'\n'}call you?</Text>
      <Text style={styles.stepSub}>
        This is how other moms in your circle will see you.
      </Text>

      <View style={styles.nameInputWrap}>
        <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.nameIcon} />
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={onChange}
          placeholder="Your first name"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="words"
          autoFocus
          returnKeyType="done"
          fontFamily={Typography.fontFamily}
        />
      </View>
    </View>
  );
}

// ─── Step 1: Baby Stage ───────────────────────────────────────────────────────

function StepBabyStage({
  selected, onSelect,
}: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>Where are you{'\n'}in the journey?</Text>
      <Text style={styles.stepSub}>
        We'll show you content and circles that match your stage.
      </Text>

      <View style={styles.optionList}>
        {BABY_STAGES.map((stage, i) => (
          <MotiView
            key={stage.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: i * 60 }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                selected === stage.id && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => onSelect(stage.id)}
            >
              <View style={[
                styles.optionIcon,
                selected === stage.id && styles.optionIconSelected,
              ]}>
                <Ionicons
                  name={stage.icon}
                  size={20}
                  color={selected === stage.id ? Colors.peachDark : Colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.optionLabel,
                  selected === stage.id && styles.optionLabelSelected,
                ]}>
                  {stage.label}
                </Text>
                <Text style={styles.optionSub}>{stage.sub}</Text>
              </View>
              {selected === stage.id && (
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', ...Motion.spring.bouncy }}
                >
                  <Ionicons name="checkmark-circle" size={22} color={Colors.peach} />
                </MotiView>
              )}
            </Pressable>
          </MotiView>
        ))}
      </View>
    </View>
  );
}

// ─── Step 2: Topics ───────────────────────────────────────────────────────────

function StepTopics({
  selected, onToggle,
}: { selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>What's on your{'\n'}mind most?</Text>
      <Text style={styles.stepSub}>
        Pick at least 2 — we'll personalise your feed and suggest circles.
      </Text>

      <View style={styles.chipGrid}>
        {TOPICS.map((topic, i) => {
          const active = selected.has(topic.id);
          return (
            <MotiView
              key={topic.id}
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', ...Motion.spring.gentle, delay: i * 40 }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => onToggle(topic.id)}
              >
                <Text style={styles.chipEmoji}>{topic.emoji}</Text>
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {topic.label}
                </Text>
              </Pressable>
            </MotiView>
          );
        })}
      </View>

      {selected.size > 0 && selected.size < 2 && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: Motion.duration.fast }}
        >
          <Text style={styles.minHint}>Pick at least one more</Text>
        </MotiView>
      )}
    </View>
  );
}

// ─── Step 3: Community Style ──────────────────────────────────────────────────

function StepCommunityStyle({
  selected, onSelect,
}: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>How do you like{'\n'}to connect?</Text>
      <Text style={styles.stepSub}>
        No right answer — you can change this anytime in settings.
      </Text>

      <View style={styles.optionList}>
        {COMMUNITY_STYLES.map((style, i) => (
          <MotiView
            key={style.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: i * 70 }}
          >
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                selected === style.id && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => onSelect(style.id)}
            >
              <View style={[
                styles.optionIcon,
                selected === style.id && styles.optionIconSelected,
              ]}>
                <Ionicons
                  name={style.icon}
                  size={20}
                  color={selected === style.id ? Colors.peachDark : Colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.optionLabel,
                  selected === style.id && styles.optionLabelSelected,
                ]}>
                  {style.label}
                </Text>
                <Text style={styles.optionSub}>{style.sub}</Text>
              </View>
              {selected === style.id && (
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', ...Motion.spring.bouncy }}
                >
                  <Ionicons name="checkmark-circle" size={22} color={Colors.peach} />
                </MotiView>
              )}
            </Pressable>
          </MotiView>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warmGrey,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.peach,
  },
  stepLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    minWidth: 32,
    textAlign: 'right',
  },

  scroll: {
    paddingBottom: Spacing['2xl'],
  },

  photoBanner: {
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },

  stepWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  stepTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  stepSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // Name input
  nameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.peach,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
    ...Shadow.soft,
  },
  nameIcon: { },
  nameInput: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Option card (Stage + Community)
  optionList: { gap: Spacing.sm },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  optionCardSelected: {
    borderColor: Colors.peach,
    backgroundColor: 'rgba(255,159,124,0.06)',
  },
  optionCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: Colors.peachOverlay,
  },
  optionLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.peachDark,
  },
  optionSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },

  // Topic chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.peach,
    backgroundColor: Colors.peachOverlay,
  },
  chipPressed: {
    transform: [{ scale: 0.96 }],
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: Colors.peachDark,
  },
  minHint: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  cta: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.button,
  },
  ctaPressed: { transform: [{ scale: 0.97 }] },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  skipRow: {
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  skipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
});
