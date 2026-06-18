/**
 * app/onboarding/splash.tsx — Screen 1a: Splash
 *
 * Stitch ref "Splash Screen" (f1aa45a1):
 *   leaf icon → "NewMomCircle" → "Your Postpartum Support Circle"
 *   "Safe • Secure • Sisterhood" trust strip at foot
 *   Auto-advances to language picker after 2.4 s; tap also advances.
 *
 * Uses Moti for staggered logo+text reveal. Keeps the existing
 * AsyncStorage check so returning users skip language selection.
 */

import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '../../utils/theme';
import { outdoorWalks } from '../../lib/unsplashImages';

const TRUST = ['Safe', 'Secure', 'Sisterhood'] as const;

export default function SplashScreen() {
  const router = useRouter();

  const advance = async () => {
    const lang = await AsyncStorage.getItem('@nmc_language');
    router.replace(lang ? '/(auth)/login' : '/onboarding/language');
  };

  useEffect(() => {
    const t = setTimeout(advance, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Pressable style={styles.root} testID="splash-screen" onPress={advance}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed warm background photo */}
      <Image
        source={{ uri: outdoorWalks[0]!.url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={Colors.peachOverlay}
        transition={400}
      />

      {/* Warm dark gradient overlay */}
      <LinearGradient
        colors={['rgba(20,8,4,0.15)', 'rgba(80,30,10,0.52)', 'rgba(20,8,4,0.78)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Center block */}
      <View style={styles.centerBlock}>
        {/* Logo circle */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 80 }}
          style={styles.logoCircle}
        >
          <Ionicons name="leaf" size={38} color={Colors.white} />
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 260 }}
        >
          <Text style={styles.title}>NewMomCircle</Text>
          <Text style={styles.tagline}>Your Postpartum Support Circle</Text>
        </MotiView>
      </View>

      {/* Trust strip */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 360, delay: 520 }}
        style={styles.trustRow}
      >
        {TRUST.map((item, i) => (
          <React.Fragment key={item}>
            <Text style={styles.trustItem}>{item}</Text>
            {i < TRUST.length - 1 && <View style={styles.trustDot} />}
          </React.Fragment>
        ))}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A0A05' },

  centerBlock: { alignItems: 'center', gap: Spacing.lg },

  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.glassBg,
    borderWidth: 1.5,
    borderColor: Colors.glassStroke,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.peach,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: Spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.md,
    color: Colors.peachLight,
    textAlign: 'center',
    marginTop: Spacing.xs,
    opacity: 0.9,
  },

  trustRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trustItem: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.78)',
    letterSpacing: 0.6,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
