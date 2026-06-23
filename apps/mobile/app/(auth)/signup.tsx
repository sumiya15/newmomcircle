/**
 * app/(auth)/signup.tsx — Screen 2: Sign Up
 *
 * Stitch ref "Sign Up" (c1c38aad):
 *   - "Join your village." headline + community subtext
 *   - Photo banner top ~28% (nurseryInteriors) with gradient fade into bg
 *   - Full Name / Email / Password / Confirm form with floating labels + icons
 *   - Password strength micro-indicator (4-segment bar)
 *   - Inline errors — no Alert popups
 *   - Form shakes on invalid submit attempt
 *   - Button: loading spinner → green checkmark → navigate
 *   - "or continue with" divider + Apple/Google social buttons
 *   - "Already have an account? Log in" footer
 *   - Language change link at very bottom
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { signUp } from '../../supabase/auth';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../utils/theme';
import { nurseryInteriors } from '../../lib/unsplashImages';
import Input from '../../components/primitives/Input';
import WebWrapper from '../../components/common/WebWrapper';
import { useWebLayout } from '../../hooks/useWebLayout';

// ─── Password strength ────────────────────────────────────────────────────────

type Strength = 0 | 1 | 2 | 3 | 4;

const STRENGTH_LABEL: Record<Strength, string> = {
  0: '',
  1: 'Too short',
  2: 'Weak',
  3: 'Fair',
  4: 'Strong',
};
const STRENGTH_COLOR: Record<Strength, string> = {
  0: Colors.warmGrey,
  1: Colors.danger,
  2: Colors.sentimentNeutral,
  3: Colors.peach,
  4: Colors.sentimentPositive,
};

function getStrength(pw: string): Strength {
  if (!pw || pw.length < 6) return pw.length > 0 ? 1 : 0;
  let score = 1;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9!@#$%^&*]/.test(pw)) score++;
  return Math.min(score, 4) as Strength;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  name: string, email: string, password: string, confirm: string
): Record<string, string> {
  const e: Record<string, string> = {};
  if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name';
  if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
  if (getStrength(password) < 2) e.password = 'Password must be at least 6 characters';
  if (confirm !== password) e.confirm = "Passwords don't match";
  return e;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isWideWeb, contentWidth } = useWebLayout();
  // On wide web, scale the hero banner by aspect ratio rather than fixed px
  const bannerH = isWideWeb ? Math.round(contentWidth * 0.46) : BANNER_H;

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  // Shake the form card on invalid submit
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 55 }),
      withTiming(10,  { duration: 55 }),
      withTiming(-7,  { duration: 55 }),
      withTiming(7,   { duration: 55 }),
      withTiming(0,   { duration: 55 }),
    );
  };

  const strength = getStrength(password);

  const handleSubmit = useCallback(async () => {
    const errs = validate(name, email, password, confirm);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerShake();
      return;
    }
    setErrors({});
    setServerErr('');
    setSubmitState('loading');
    try {
      await signUp(email.trim(), password, name.trim());
      setSubmitState('success');
      // Brief success state before navigating so the checkmark is visible
      setTimeout(() => router.replace('/onboarding/quiz'), 700);
    } catch (err: any) {
      setSubmitState('error');
      const msg = err?.message ?? '';
      setServerErr(
        msg.includes('already') ? 'An account with this email already exists.' : 'Something went wrong. Please try again.'
      );
      triggerShake();
    }
  }, [name, email, password, confirm, router]);

  const loading = submitState === 'loading';
  const success = submitState === 'success';
  const isValid = Object.keys(validate(name, email, password, confirm)).length === 0;

  return (
    <View style={styles.root} testID="signup-screen">
      {/* WebWrapper: on wide browser viewports, centres content in a 480px column */}
      <WebWrapper style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            testID="signup-scroll"
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Photo banner — height scales with content width on web ── */}
            <View style={[styles.banner, { height: bannerH }]}>
              <Image
                source={{ uri: nurseryInteriors[0]!.url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                placeholder={Colors.warmGrey}
                transition={350}
              />
              {/* Gradient fades photo into the off-white background below */}
              <LinearGradient
                colors={['rgba(253,248,245,0)', Colors.offWhite]}
                locations={[0.55, 1]}
                style={StyleSheet.absoluteFill}
              />
            </View>

          {/* ── Headline ── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 100 }}
            style={styles.headline}
          >
            <Text testID="signup-title" style={styles.headlineTitle}>Join your village.</Text>
            <Text style={styles.headlineSub}>
              Connect with a supportive community of mothers who understand your journey.
            </Text>
          </MotiView>

          {/* ── Form card ── */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 200 }}
          >
            <Animated.View style={[styles.card, shakeStyle]}>
              <Text style={styles.cardSubhead}>Create your account</Text>

              {/* Fields */}
              <Input
                label="Full Name"
                leftIcon="person-outline"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                error={errors.name}
                testID="signup-name-input"
              />
              <Input
                label="Email Address"
                leftIcon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                error={errors.email}
                testID="signup-email-input"
              />
              <Input
                label="Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                error={errors.password}
                testID="signup-password-input"
              />

              {/* Password strength bar */}
              <AnimatePresence>
                {password.length > 0 && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 28 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: Motion.duration.fast }}
                    style={styles.strengthWrap}
                  >
                    <View style={styles.strengthBar}>
                      {([1, 2, 3, 4] as Strength[]).map((level) => (
                        <MotiView
                          key={level}
                          animate={{
                            backgroundColor: strength >= level
                              ? STRENGTH_COLOR[strength]
                              : Colors.warmGrey,
                          }}
                          transition={{ type: 'timing', duration: Motion.duration.fast }}
                          style={styles.strengthSegment}
                        />
                      ))}
                    </View>
                    <Text testID="signup-password-strength" style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                      {STRENGTH_LABEL[strength]}
                    </Text>
                  </MotiView>
                )}
              </AnimatePresence>

              <Input
                label="Confirm Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={confirm}
                onChangeText={setConfirm}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.confirm}
                testID="signup-confirm-input"
              />

              {/* Server error banner — inline, not a popup */}
              <AnimatePresence>
                {serverErr ? (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 40 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: Motion.duration.fast }}
                    style={styles.serverErrBanner}
                    testID="signup-error-banner"
                  >
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.serverErrText}>{serverErr}</Text>
                  </MotiView>
                ) : null}
              </AnimatePresence>

              {/* Primary CTA */}
              <Pressable
                testID="signup-submit-btn"
                style={({ pressed }) => [
                  styles.cta,
                  (loading || success) && styles.ctaActive,
                  pressed && !loading && !success && styles.ctaPressed,
                ]}
                onPress={handleSubmit}
                disabled={loading || success}
              >
                <LinearGradient
                  colors={success ? [Colors.sentimentPositive, '#3da35d'] : [Colors.peach, Colors.peachDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGrad}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : success ? (
                    // Checkmark pops in on success before navigation
                    <MotiView
                      from={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', ...Motion.spring.bouncy }}
                    >
                      <Ionicons name="checkmark" size={26} color={Colors.white} />
                    </MotiView>
                  ) : (
                    <Text style={styles.ctaText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Social auth divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social buttons */}
              <View style={styles.socialRow}>
                <SocialButton icon="logo-apple" label="Apple" testID="signup-apple-btn" />
                <SocialButton icon="logo-google" label="Google" testID="signup-google-btn" />
              </View>

              {/* Log in link */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable testID="signup-login-link">
                    <Text style={styles.footerLink}>Log in</Text>
                  </Pressable>
                </Link>
              </View>
            </Animated.View>
          </MotiView>

          {/* Language change footer */}
          <Link href="/onboarding/language" asChild>
            <Pressable style={styles.langRow}>
              <Ionicons name="language-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.langText}>Change Language</Text>
            </Pressable>
          </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </WebWrapper>
    </View>
  );
}

// ─── Social button ────────────────────────────────────────────────────────────

function SocialButton({
  icon, label, testID,
}: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.socialBtn, pressed && styles.socialBtnPressed]}
    >
      <Ionicons name={icon} size={20} color={Colors.textPrimary} />
      <Text style={styles.socialBtnText}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BANNER_H = 220;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing['2xl'],
  },

  // Photo banner — height is overridden inline via bannerH for responsive web
  banner: {
    height: BANNER_H, // default; overridden inline on wide web
    width: '100%',
    overflow: 'hidden',
  },

  // Headline below the banner
  headline: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  headlineTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  headlineSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Form card
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.card,
  },
  cardSubhead: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // Password strength
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  strengthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    minWidth: 46,
    textAlign: 'right',
  },

  // Server error banner
  serverErrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(217,79,79,0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  serverErrText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.danger,
    flex: 1,
  },

  // CTA button
  cta: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadow.button,
  },
  ctaActive: { opacity: 0.95 },
  ctaPressed: { transform: [{ scale: 0.97 }] },
  ctaGrad: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // Social auth
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dividerLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  socialBtnPressed: {
    backgroundColor: Colors.warmGrey,
    transform: [{ scale: 0.97 }],
  },
  socialBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  footerLink: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.peachDark,
  },

  // Language change
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  langText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
});

