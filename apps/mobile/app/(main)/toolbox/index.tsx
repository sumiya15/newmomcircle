/**
 * app/(main)/toolbox/index.tsx
 * Wellness Toolbox Screen — Mobile
 *
 * Tools: Box Breathing · Daily Affirmation · Grounding (5-4-3-2-1) · Mom Jokes
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Easing,
  Platform,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../../utils/theme";
import WebWrapper from "../../../components/common/WebWrapper";

// ── Seed data ────────────────────────────────────────────────────────────────

const AFFIRMATIONS = [
  { text: "I am doing the best I can, and that is more than enough.", emoji: "🌸" },
  { text: "My body is strong, healing, and capable of amazing things.", emoji: "💪" },
  { text: "I deserve rest, patience, and compassion from myself.", emoji: "🕊️" },
  { text: "It is okay to ask for help; I do not have to carry this alone.", emoji: "🤝" },
  { text: "My baby chose me, and I am the perfect mother for them.", emoji: "💖" },
  { text: "I am allowed to feel overwhelmed. All my feelings are valid.", emoji: "🌊" },
];

const JOKES = [
  "Sleep when the baby sleeps. Clean when the baby cleans. Simple! 👶",
  "The fact that you haven't run away yet? Chef's kiss! You're doing great.",
  "Current mood: Baby asleep 20 min, already miss them, but if they wake up I'll cry. 🤷‍♀️",
  "My baby chose YOU specifically. Out of all humans on Earth. Think about that. 💕",
  "I love my kids. Except when they wake up. Other than that, they're angels! 👼",
];

const BREATHING_STEPS = [
  { phase: "Inhale", duration: 4, color: "#FF9F7C" },
  { phase: "Hold", duration: 4, color: "#FFCFBB" },
  { phase: "Exhale", duration: 4, color: "#4CAF7D" },
  { phase: "Hold", duration: 4, color: "#FFCFBB" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ToolboxScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"breath" | "affirm" | "ground" | "joke">("breath");
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [jokeIdx, setJokeIdx] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathStep, setBreathStep] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [circleScale, setCircleScale] = useState(0.6);
  const [breathDuration, setBreathDuration] = useState(400);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Breathing animation
  const startBreathing = () => {
    setIsBreathing(true);
    setBreathStep(0);
    runBreathCycle(0);
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    if (breathTimer.current) clearTimeout(breathTimer.current);
    setCircleScale(0.6);
    setBreathDuration(400);
  };

  const runBreathCycle = (stepIdx: number) => {
    const step = BREATHING_STEPS[stepIdx];
    const targetScale = step.phase === "Exhale" ? 0.55 : step.phase === "Inhale" ? 1.0 : 0.78;
    setCircleScale(targetScale);
    setBreathDuration(step.duration * 1000);
    setBreathStep(stepIdx);
    breathTimer.current = setTimeout(() => {
      const next = (stepIdx + 1) % BREATHING_STEPS.length;
      if (next === 0) setBreathCount((c) => c + 1);
      runBreathCycle(next);
    }, step.duration * 1000);
  };

  useEffect(() => {
    return () => {
      if (breathTimer.current) clearTimeout(breathTimer.current);
    };
  }, []);

  const currentStep = BREATHING_STEPS[breathStep];

  return (
    <View style={styles.root} testID="toolbox-screen">
      {/* WebWrapper: centres content in 480px on wide web; passthrough on native */}
      <WebWrapper>
      {/* Header */}
      <LinearGradient
        colors={["rgba(20,8,4,0.95)", "rgba(20,8,4,0.80)"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🧘‍♀️ Wellness Toolbox</Text>
        <Text style={styles.headerSub}>Tools for calm, clarity, and connection</Text>
      </LinearGradient>

      {/* Tab Pills */}
      <View style={styles.tabRow}>
        {[
          { key: "breath", label: "Breathing", emoji: "💨" },
          { key: "affirm", label: "Affirm", emoji: "🌸" },
          { key: "ground", label: "Ground", emoji: "🌿" },
          { key: "joke", label: "Smile", emoji: "😄" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            testID={`toolbox-tab-${tab.key}-btn`}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
          >
            <Text style={styles.tabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.tabPillText, activeTab === tab.key && styles.tabPillTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        testID="toolbox-scroll"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatePresence exitBeforeEnter>
        {/* ── BREATHING ── */}
        {activeTab === "breath" && (
          <MotiView
            key="breath"
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: "timing", duration: 240 }}
          >
          <View style={styles.breathSection}>
            <Text style={styles.sectionTitle}>Box Breathing</Text>
            <Text style={styles.sectionSub}>4 counts each phase · Inhale → Hold → Exhale → Hold</Text>

            <View style={styles.breathCircleWrapper}>
              <MotiView
                animate={{ scale: circleScale }}
                transition={{ type: 'timing', duration: breathDuration, easing: Easing.inOut(Easing.ease) }}
                style={styles.breathCircleOuter}
              >
                <View style={styles.breathCircleInner}>
                  <Text style={styles.breathPhase}>{isBreathing ? currentStep.phase : "Ready"}</Text>
                  {isBreathing && (
                    <Text style={styles.breathCount}>Cycle {breathCount + 1}</Text>
                  )}
                </View>
              </MotiView>
            </View>

            <TouchableOpacity
              testID="toolbox-breath-btn"
              style={[styles.breathBtn, isBreathing && styles.breathBtnStop]}
              onPress={isBreathing ? stopBreathing : startBreathing}
            >
              <LinearGradient
                colors={isBreathing ? ["#D94F4F", "#B83B3B"] : [Colors.peach, Colors.peachDark]}
                style={styles.breathBtnGrad}
              >
                <Text style={styles.breathBtnText}>{isBreathing ? "Stop" : "Begin"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </MotiView>
        )}

        {/* ── AFFIRMATIONS ── */}
        {activeTab === "affirm" && (
          <MotiView
            key="affirm"
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: "timing", duration: 240 }}
          >
          <View style={styles.card}>
            <Text style={styles.affirmEmoji}>{AFFIRMATIONS[affirmIdx].emoji}</Text>
            <Text style={styles.affirmText}>"{AFFIRMATIONS[affirmIdx].text}"</Text>
            <TouchableOpacity
              testID="toolbox-next-affirmation-btn"
              onPress={() => setAffirmIdx((i) => (i + 1) % AFFIRMATIONS.length)}
              style={styles.nextBtn}
            >
              <LinearGradient
                colors={[Colors.peach, Colors.peachDark]}
                style={styles.nextBtnGrad}
              >
                <Text style={styles.nextBtnText}>Next Affirmation →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </MotiView>
        )}

        {/* ── 5-4-3-2-1 GROUNDING ── */}
        {activeTab === "ground" && (
          <MotiView
            key="ground"
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: "timing", duration: 240 }}
          >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>5-4-3-2-1 Grounding</Text>
            <Text style={styles.sectionSub}>Bring yourself back to the present moment</Text>
            {[
              { count: 5, sense: "SEE", prompt: "Name 5 things you can see around you right now" },
              { count: 4, sense: "TOUCH", prompt: "Name 4 things you can physically feel" },
              { count: 3, sense: "HEAR", prompt: "Name 3 things you can hear in this moment" },
              { count: 2, sense: "SMELL", prompt: "Name 2 things you can smell" },
              { count: 1, sense: "TASTE", prompt: "Name 1 thing you can taste" },
            ].map((step) => (
              <View key={step.count} style={styles.groundStep}>
                <View style={styles.groundBadge}>
                  <Text style={styles.groundBadgeNum}>{step.count}</Text>
                </View>
                <View style={styles.groundTextArea}>
                  <Text style={styles.groundSense}>{step.sense}</Text>
                  <Text style={styles.groundPrompt}>{step.prompt}</Text>
                </View>
              </View>
            ))}
          </View>
          </MotiView>
        )}

        {/* ── MOM JOKES ── */}
        {activeTab === "joke" && (
          <MotiView
            key="joke"
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: "timing", duration: 240 }}
          >
          <View style={styles.card}>
            <Text style={styles.jokeEmoji}>😄</Text>
            <Text style={styles.jokeTitle}>A Little Smile Goes a Long Way</Text>
            <Text style={styles.jokeText}>{JOKES[jokeIdx]}</Text>
            <TouchableOpacity
              testID="toolbox-next-joke-btn"
              onPress={() => setJokeIdx((i) => (i + 1) % JOKES.length)}
              style={styles.nextBtn}
            >
              <LinearGradient
                colors={[Colors.peach, Colors.peachDark]}
                style={styles.nextBtnGrad}
              >
                <Text style={styles.nextBtnText}>Next Joke →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </MotiView>
        )}
        </AnimatePresence>
      </ScrollView>
      </WebWrapper>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1A0A05" },
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.peachLight,
    opacity: 0.75,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
    backgroundColor: "rgba(20,8,4,0.9)",
  },
  tabPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    gap: 2,
  },
  tabPillActive: {
    backgroundColor: "rgba(255,159,124,0.20)",
    borderColor: Colors.peach,
  },
  tabEmoji: { fontSize: 16 },
  tabPillText: {
    fontFamily: Typography.fontFamily,
    fontSize: 9,
    color: Colors.textMuted,
  },
  tabPillTextActive: {
    color: Colors.peach,
    fontFamily: Typography.fontFamilySemiBold,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  breathSection: { alignItems: "center" },
  sectionTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.white,
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  sectionSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.peachLight,
    opacity: 0.7,
    marginBottom: Spacing.xl,
    alignSelf: "flex-start",
  },
  breathCircleWrapper: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  breathCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,159,124,0.15)",
    borderWidth: 2,
    borderColor: Colors.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  breathCircleInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,159,124,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  breathPhase: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.white,
  },
  breathCount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.peachLight,
    marginTop: 4,
  },
  breathBtn: { width: "100%", borderRadius: Radius.full, overflow: "hidden" },
  breathBtnStop: {},
  breathBtnGrad: { paddingVertical: 16, alignItems: "center" },
  breathBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.glassBg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  affirmEmoji: { fontSize: 48, textAlign: "center" },
  affirmText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.lg,
    color: Colors.white,
    textAlign: "center",
    lineHeight: 28,
    fontStyle: "italic",
  },
  nextBtn: { borderRadius: Radius.full, overflow: "hidden" },
  nextBtnGrad: { paddingVertical: 14, alignItems: "center" },
  nextBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
  groundStep: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  groundBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,159,124,0.2)",
    borderWidth: 1.5,
    borderColor: Colors.peach,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  groundBadgeNum: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.md,
    color: Colors.peach,
  },
  groundTextArea: { flex: 1 },
  groundSense: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.peach,
    letterSpacing: 1,
  },
  groundPrompt: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 2,
    lineHeight: 20,
  },
  jokeEmoji: { fontSize: 48, textAlign: "center" },
  jokeTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.peachLight,
    textAlign: "center",
  },
  jokeText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.md,
    color: Colors.white,
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
});
