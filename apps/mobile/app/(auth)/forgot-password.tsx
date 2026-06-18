/**
 * app/(auth)/forgot-password.tsx — Screen 4: Forgot Password
 *
 * Design:
 *   - Small warm photo banner (postpartumWellness) with gradient fade
 *   - "Reset your password." headline + instruction copy
 *   - Email Input with floating label + inline validation
 *   - Loading spinner → green checkmark → success state (no Alert popup)
 *   - Success state: envelope icon + confirmation message + back-to-login CTA
 *   - Back chevron top-left for quick exit
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { forgotPassword } from '../../supabase/auth';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../utils/theme';
import { postpartumWellness } from '../../lib/unsplashImages';
import Input from '../../components/primitives/Input';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [email,       setEmail]       = useState('');
  const [emailError,  setEmailError]  = useState('');
  const [serverErr,   setServerErr]   = useState('');
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
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address');
      triggerShake();
      return;
    }
    setEmailError('');
    setServerErr('');
    setSubmitState('loading');
    try {
      await forgotPassword(email.trim());
      setSubmitState('success');
    } catch {
      setSubmitState('error');
      setServerErr('Something went wrong. Please try again.');
      triggerShake();
    }
  }, [email]);

  const loading = submitState === 'loading';
  const success = submitState === 'success';

  return (
    <View style={styles.root} testID="forgot-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo banner ── */}
          <View style={styles.banner}>
            <Image
              source={{ uri: postpartumWellness[0]!.url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={Colors.warmGrey}
              transition={350}
            />
            <LinearGradient
              colors={['rgba(253,248,245,0)', Colors.offWhite]}
              locations={[0.5, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Back button overlaid on banner */}
            <Pressable
              testID="forgot-back-btn"
              style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.white} />
            </Pressable>
          </View>

          {/* ── Headline ── */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 100 }}
            style={styles.headline}
          >
            <Text style={styles.headlineTitle}>Reset your password.</Text>
            <Text style={styles.headlineSub}>
              Enter the email you signed up with and we'll send you a reset link.
            </Text>
          </MotiView>

          {/* ── Card — form or success ── */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 200 }}
          >
            <AnimatePresence exitBeforeEnter>
              {success ? (
                /* ── Success state ── */
                <MotiView
                  key="success"
                  from={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ type: 'spring', ...Motion.spring.gentle }}
                  style={styles.card}
                  testID="forgot-success-msg"
                >
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', ...Motion.spring.bouncy, delay: 100 }}
                    style={styles.successIcon}
                  >
                    <Ionicons name="mail" size={32} color={Colors.sentimentPositive} />
                  </MotiView>

                  <Text style={styles.successTitle}>Check your inbox</Text>
                  <Text style={styles.successBody}>
                    We've sent a password reset link to{'\n'}
                    <Text style={styles.successEmail}>{email.trim()}</Text>
                    {'\n\n'}Didn't receive it? Check your spam folder or try again.
                  </Text>

                  <Pressable
                    testID="forgot-back-to-login-btn"
                    style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                    onPress={() => router.replace('/(auth)/login')}
                  >
                    <LinearGradient
                      colors={[Colors.peach, Colors.peachDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaGrad}
                    >
                      <Text style={styles.ctaText}>Back to Log In</Text>
                    </LinearGradient>
                  </Pressable>
                </MotiView>
              ) : (
                /* ── Email input form ── */
                <Animated.View key="form" style={[styles.card, shakeStyle]}>
                  <Text style={styles.cardSubhead}>Enter your email</Text>

                  <Input
                    label="Email Address"
                    leftIcon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    error={emailError}
                    testID="forgot-email-input"
                  />

                  {/* Server error */}
                  <AnimatePresence>
                    {serverErr ? (
                      <MotiView
                        from={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 40 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: 'timing', duration: Motion.duration.fast }}
                        style={styles.serverErrBanner}
                      >
                        <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                        <Text style={styles.serverErrText}>{serverErr}</Text>
                      </MotiView>
                    ) : null}
                  </AnimatePresence>

                  <Pressable
                    testID="forgot-submit-btn"
                    style={({ pressed }) => [
                      styles.cta,
                      loading && styles.ctaActive,
                      pressed && !loading && styles.ctaPressed,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[Colors.peach, Colors.peachDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaGrad}
                    >
                      {loading ? (
                        <ActivityIndicator color={Colors.white} />
                      ) : (
                        <Text style={styles.ctaText}>Send Reset Link</Text>
                      )}
                    </LinearGradient>
                  </Pressable>

                  <Pressable testID="forgot-back-link" style={styles.backToLogin} onPress={() => router.back()}>
                    <Ionicons name="arrow-back-outline" size={15} color={Colors.textMuted} />
                    <Text style={styles.backToLoginText}>Back to Log In</Text>
                  </Pressable>
                </Animated.View>
              )}
            </AnimatePresence>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BANNER_H = 180;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  scroll: { flexGrow: 1 },

  banner: {
    height: BANNER_H,
    width: '100%',
    overflow: 'hidden',
  },

  backBtn: {
    position: 'absolute',
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
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

  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  backToLoginText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },

  // Success state
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(92,184,122,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successBody: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  successEmail: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.peachDark,
  },
});
