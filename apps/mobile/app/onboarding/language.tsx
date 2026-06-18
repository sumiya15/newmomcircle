/**
 * app/onboarding/language.tsx
 * Language Selection Screen — Figma node 24:29
 * "Language Selection (Photo BG)" with the asymmetric bento-like grid.
 *
 * Languages: English, हिंदी, తెలుగు, தமிழ், ಕನ್ನಡ
 * Selected language is persisted to AsyncStorage.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../utils/theme";
import { useAppStore, SupportedLocale } from "../../store/appStore";

const { width } = Dimensions.get("window");

interface LanguageOption {
  code: SupportedLocale;
  label: string;        // native script
  sublabel: string;     // English name
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English",  sublabel: "English",  flag: "🇬🇧" },
  { code: "hi", label: "हिंदी",    sublabel: "Hindi",    flag: "🇮🇳" },
  { code: "te", label: "తెలుగు",   sublabel: "Telugu",   flag: "🔷" },
  { code: "ta", label: "தமிழ்",    sublabel: "Tamil",    flag: "🔶" },
  { code: "kn", label: "ಕನ್ನಡ",   sublabel: "Kannada",  flag: "🟣" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { i18n, t } = useTranslation();
  const { setLanguage } = useAppStore();
  const [selected, setSelected] = useState<SupportedLocale>("en");

  const handleSelect = async (code: SupportedLocale) => {
    setSelected(code);
    await setLanguage(code);
    i18n.changeLanguage(code);
  };

  const handleContinue = () => {
    router.replace("/onboarding/index");
  };

  return (
    <View style={styles.root} testID="language-screen">
      {/* Background photo */}
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1588776813677-77aef5595b83?w=800" }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />

      {/* Warm gradient overlay */}
      <LinearGradient
        colors={[
          "rgba(255,200,160,0.25)",
          "rgba(80,30,10,0.6)",
          "rgba(20,8,4,0.82)",
        ]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        testID="language-scroll"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <Text style={{ fontSize: 22 }}>🌸</Text>
          </View>
          <Text style={styles.appName}>{t("app_name")}</Text>
        </View>

        <Text style={styles.title}>{t("select_language")}</Text>
        <Text style={styles.subtitle}>{t("language_subtitle")}</Text>

        {/* Asymmetric Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Row 1: English (wide) + Hindi (narrow) */}
          <View style={styles.row}>
            <LanguageCard
              option={LANGUAGES[0]}
              selected={selected === "en"}
              onPress={() => handleSelect("en")}
              flex={1.6}
              testID="language-en-btn"
            />
            <LanguageCard
              option={LANGUAGES[1]}
              selected={selected === "hi"}
              onPress={() => handleSelect("hi")}
              flex={1}
              testID="language-hi-btn"
            />
          </View>
          {/* Row 2: Telugu (narrow) + Tamil (wide) */}
          <View style={styles.row}>
            <LanguageCard
              option={LANGUAGES[2]}
              selected={selected === "te"}
              onPress={() => handleSelect("te")}
              flex={1}
              testID="language-te-btn"
            />
            <LanguageCard
              option={LANGUAGES[3]}
              selected={selected === "ta"}
              onPress={() => handleSelect("ta")}
              flex={1.6}
              testID="language-ta-btn"
            />
          </View>
          {/* Row 3: Kannada (full width) */}
          <View style={styles.row}>
            <LanguageCard
              option={LANGUAGES[4]}
              selected={selected === "kn"}
              onPress={() => handleSelect("kn")}
              flex={1}
              fullWidth
              testID="language-kn-btn"
            />
          </View>
        </View>

        {/* Continue button */}
        <TouchableOpacity
          testID="language-continue-btn"
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[Colors.peach, Colors.peachDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueBtnGrad}
          >
            <Text style={styles.continueBtnText}>{t("next")} →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Language Card Component ────────────────────────────────────────────────

interface CardProps {
  option: LanguageOption;
  selected: boolean;
  onPress: () => void;
  flex?: number;
  fullWidth?: boolean;
  testID?: string;
}

function LanguageCard({ option, selected, onPress, flex = 1, fullWidth, testID }: CardProps) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        { flex: fullWidth ? undefined : flex },
        fullWidth && { width: "100%" },
        selected && styles.cardSelected,
      ]}
    >
      <Text style={styles.cardFlag}>{option.flag}</Text>
      <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
        {option.label}
      </Text>
      <Text style={styles.cardSublabel}>{option.sublabel}</Text>
      {selected && <View style={styles.checkDot} />}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const CARD_HEIGHT = 96;
const GAP = 10;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A0A05",
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glassBg,
    borderWidth: 1,
    borderColor: Colors.glassStroke,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.9,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.white,
    marginBottom: Spacing.xs,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.peachLight,
    opacity: 0.78,
    marginBottom: Spacing.xl,
  },
  bentoGrid: {
    gap: GAP,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  card: {
    height: CARD_HEIGHT,
    backgroundColor: Colors.glassBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.glassStroke,
    padding: Spacing.md,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  cardSelected: {
    backgroundColor: "rgba(255,159,124,0.22)",
    borderColor: Colors.peach,
    ...Shadow.card,
  },
  cardFlag: {
    fontSize: 22,
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
  },
  cardLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
    lineHeight: 24,
  },
  cardLabelSelected: {
    color: Colors.peachLight,
  },
  cardSublabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.peachLight,
    opacity: 0.65,
    marginTop: 2,
  },
  checkDot: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.peach,
  },
  continueBtn: {
    borderRadius: Radius.full,
    overflow: "hidden",
    ...Shadow.button,
  },
  continueBtnGrad: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: Radius.full,
  },
  continueBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
