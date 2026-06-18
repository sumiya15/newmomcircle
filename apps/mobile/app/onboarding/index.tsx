/**
 * app/onboarding/index.tsx — Screen 1b: Onboarding Carousel
 *
 * Stitch ref: Onboarding 1-4 (Photo BG) screens:
 *  - Full-bleed photo top ~58% of screen
 *  - Rounded-top cream content sheet overlapping photo by ~24px
 *  - Title, body, dot pagination, Next/Get Started CTA
 *  - "Available in हिंदी • தமிழ் • বাংলা" language strip at foot
 *  - Skip button top-right
 *
 * Motion:
 *  - react-native-reanimated-carousel with parallax (photo moves slower than sheet)
 *  - Active dot animates width 8→28px
 *  - Content fades+slides in on slide change
 *  - CTA button shows spring press scale
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, StatusBar, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-native-reanimated-carousel';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolate, Extrapolation,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../utils/theme';
import { groupOfMoms, babySleeping, nursingMoments } from '../../lib/unsplashImages';

const { width: W, height: H } = Dimensions.get('window');

// Photo height = top 58% of screen
const PHOTO_H = H * 0.58;
// Content sheet overlaps photo by this much, with rounded top corners
const SHEET_OVERLAP = 28;

interface Slide {
  title: string;
  body: string;
  photo: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const SLIDES: Slide[] = [
  {
    title: "You're not doing\nthis alone",
    body: 'Find your circle of mothers who understand your journey — no judgment, just real talk.',
    photo: groupOfMoms[0]!.url,
    icon: 'people',
  },
  {
    title: 'Track the little\nthings, together',
    body: "Log feeds, sleep, diapers and moods. Your baby's story, beautifully kept.",
    photo: babySleeping[0]!.url,
    icon: 'heart',
  },
  {
    title: 'Real moms,\nreal stories',
    body: 'Vetted articles, expert guidance, and thousands of mothers who have been right where you are.',
    photo: nursingMoments[1]!.url,
    icon: 'leaf',
  },
];

const LANG_STRIP = 'Available in हिंदी  •  தமிழ்  •  বাংলা';

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const isLast = activeIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      router.replace('/(auth)/signup');
    }
    // Carousel advances via its own gesture; we only need to handle the final tap
  }, [isLast, router]);

  const handleSkip = () => router.replace('/(auth)/login');

  return (
    <View style={styles.root} testID="onboarding-screen">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip — top-right, above the carousel */}
      {!isLast && (
        <Pressable testID="onboarding-skip-btn" style={styles.skipBtn} onPress={handleSkip} hitSlop={16}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* ── Carousel ── */}
      <Carousel
        width={W}
        height={H}
        data={SLIDES}
        loop={false}
        onSnapToItem={setActiveIndex}
        scrollAnimationDuration={Motion.duration.slow}
        renderItem={({ item, index, animationValue }) => (
          <CarouselSlide
            slide={item}
            index={index}
            animationValue={animationValue}
            active={activeIndex}
            isLast={index === SLIDES.length - 1}
            onNext={handleNext}
          />
        )}
      />

      {/* Pagination dots — rendered outside carousel so they stay fixed */}
      <View style={styles.dotsWrap}>
        {SLIDES.map((_, i) => (
          <MotiView
            key={i}
            animate={{
              width: i === activeIndex ? 28 : 8,
              opacity: i === activeIndex ? 1 : 0.38,
            }}
            transition={{ type: 'spring', ...Motion.spring.snappy }}
            style={styles.dot}
          />
        ))}
      </View>

      {/* Language availability strip */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: Motion.duration.slow, delay: 600 }}
        style={styles.langStrip}
      >
        <Text style={styles.langText}>{LANG_STRIP}</Text>
      </MotiView>
    </View>
  );
}

// ─── Single carousel slide ────────────────────────────────────────────────────

interface SlideProps {
  slide: Slide;
  index: number;
  animationValue: Animated.SharedValue<number>;
  active: number;
  isLast: boolean;
  onNext: () => void;
}

function CarouselSlide({ slide, animationValue, isLast, onNext }: SlideProps) {
  // Parallax: photo translates at 35% of slide speed (slower = deeper feel)
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          animationValue.value,
          [-1, 0, 1],
          [-W * 0.35, 0, W * 0.35],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.slide}>
      {/* Photo — slightly wider than slide so parallax doesn't show empty edges */}
      <Animated.View style={[styles.photoWrap, photoStyle]}>
        <Image
          source={{ uri: slide.photo }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          // Warm cream fallback while photo loads
          placeholder={Colors.warmGrey}
          transition={300}
        />
        {/* Gradient fade from photo into the cream sheet */}
        <LinearGradient
          colors={['rgba(253,248,245,0)', 'rgba(253,248,245,0.6)', Colors.offWhite]}
          locations={[0.6, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Rounded content sheet */}
      <View style={styles.sheet}>
        {/* Icon badge */}
        <View style={styles.iconBadge}>
          <Ionicons name={slide.icon} size={22} color={Colors.peachDark} />
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        {/* Spacer — dots + lang strip rendered by parent, CTA below */}
        <View style={{ height: Spacing['2xl'] + 16 }} />

        {/* CTA button — only the last slide shows "Get Started"; others advance via swipe */}
        {isLast && (
          <Pressable
            testID="onboarding-get-started-btn"
            style={({ pressed }) => [
              styles.ctaWrap,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            onPress={onNext}
          >
            <LinearGradient
              colors={[Colors.peach, Colors.peachDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        )}

        {!isLast && (
          <View style={styles.swipeHint}>
            <Text style={styles.swipeText}>Swipe to continue</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.offWhite,
  },

  // Skip button sits over the carousel at the top right
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: Radius.full,
  },
  skipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.white,
  },

  // Pagination dots — overlay at bottom of the sheet
  dotsWrap: {
    position: 'absolute',
    bottom: 116,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.peach,
  },

  // Language strip at very bottom
  langStrip: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  langText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // Slide
  slide: { width: W, height: H },

  // Photo area (slightly wider to allow parallax without gaps)
  photoWrap: {
    position: 'absolute',
    top: 0,
    left: -W * 0.18,
    right: -W * 0.18,
    height: PHOTO_H + SHEET_OVERLAP,
  },

  // Content sheet — cream, rounded-top corners, overlapping the photo
  sheet: {
    position: 'absolute',
    top: PHOTO_H - SHEET_OVERLAP,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.offWhite,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    // Subtle upward shadow so the sheet feels lifted off the photo
    shadowColor: 'rgba(80,30,10,0.22)',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // CTA — last slide only
  ctaWrap: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.button,
  },
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
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: Spacing.sm,
  },
  swipeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
