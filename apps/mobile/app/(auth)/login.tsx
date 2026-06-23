/**
 * app/(auth)/login.tsx — Screen 3: Log In
 *
 * Stitch ref "Login" (0fc16a0a):
 *   - Photo banner top ~28% (groupOfMoms) with gradient fade into bg
 *   - "Welcome back." headline + warm subtext
 *   - Email / Password with floating-label Input + inline errors
 *   - Form shakes on invalid submit attempt
 *   - Button: loading spinner → green checkmark → navigate
 *   - "Forgot password?" link right-aligned below password
 *   - "or continue with" divider + Apple/Google social buttons
 *   - "Don't have an account? Sign up" footer
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

import { login } from '../../supabase/auth';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../utils/theme';
import { groupOfMoms } from '../../lib/unsplashImages';
import Input from '../../components/primitives/Input';

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address';
  if (!password || password.length < 1) e.password = 'Enter your password';
  return e;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

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

  const handleSubmit = useCallback(async () => {
    const errs = validate(email, password);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      triggerShake();
      return;
    }
    setErrors({});
    setServerErr('');
    setSubmitState('loading');
    try {
      await login(email.trim(), password);
      setSubmitState('success');
      setTimeout(() => router.replace('/(main)/feed'), 700);
    } catch (err: any) {
      setSubmitState('error');
      const msg = err?.message ?? '';
      setServerErr(
        msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')
          ? 'Incorrect email or password. Please try again.'
          : 'Something went wrong. Please try again.',
      );
      triggerShake();
    }
  }, [email, password, router]);

  const loading = submitState === 'loading';
  const success = submitState === 'success';

  return (
    <View style={styles.root} testID="login-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          testID="login-scroll"
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo banner ── */}
          <View style={styles.banner}>
            <Image
              source={{ uri: groupOfMoms[1]!.url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={Colors.warmGrey}
              transition={350}
            />
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
            <Text testID="login-title" style={styles.headlineTitle}>Welcome back.</Text>
            <Text style={styles.headlineSub}>
              Your circle has missed you — pick up right where you left off.
            </Text>
          </MotiView>

          {/* ── Form card ── */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 200 }}
          >
            <Animated.View style={[styles.card, shakeStyle]}>
              <Text style={styles.cardSubhead}>Log in to your account</Text>

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
                testID="login-email-input"
              />

              <Input
                label="Password"
                leftIcon="lock-closed-outline"
                isPassword
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                error={errors.password}
                testID="login-password-input"
              />

              {/* Forgot password — right-aligned, below password */}
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={styles.forgotRow} hitSlop={12} testID="login-forgot-btn">
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </Link>

              {/* Server error banner */}
              <AnimatePresence>
                {serverErr ? (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 40 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'timing', duration: Motion.duration.fast }}
                    style={styles.serverErrBanner}
                    testID="login-error-banner"
                  >
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                    <Text style={styles.serverErrText}>{serverErr}</Text>
                  </MotiView>
                ) : null}
              </AnimatePresence>

              {/* Primary CTA */}
              <Pressable
                testID="login-submit-btn"
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
                    <MotiView
                      from={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', ...Motion.spring.bouncy }}
                    >
                      <Ionicons name="checkmark" size={26} color={Colors.white} />
                    </MotiView>
                  ) : (
                    <Text style={styles.ctaText}>Log In</Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Social auth divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton icon="logo-apple" label="Apple" testID="login-apple-btn" />
                <SocialButton icon="logo-google" label="Google" testID="login-google-btn" />
              </View>

              {/* Sign up link */}
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                  <Pressable testID="login-signup-link">
                    <Text style={styles.footerLink}>Sign up</Text>
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

  banner: {
    height: BANNER_H,
    width: '100%',
    overflow: 'hidden',
  },

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

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  forgotText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.peachDark,
  },

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
