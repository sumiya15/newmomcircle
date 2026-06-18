/**
 * app/(main)/journal/insights.tsx
 * AI Insights Dashboard - weekly mood bar chart + latest sentiment advice.
 * Reads the last 7 journal entries to draw the mood trend.
 */
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { getJournalEntries } from "../../../supabase/db";
import type { JournalEntry } from "@newmomcircle/types";
import { useAuthStore } from "../../../store/authStore";
import { sentimentColour, sentimentEmoji, SentimentLabel } from "../../../utils/sentiment";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../../utils/theme";
import { format } from "date-fns";

const { width } = Dimensions.get("window");
const BAR_MAX_HEIGHT = 120;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function InsightsScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await getJournalEntries(user.id);
      setEntries(data.slice(0, 7).reverse()); // oldest to newest left to right
      setLoading(false);
    })();
  }, [user]);

  const latest = entries[entries.length - 1];

  // Map sentiment to 0-1 height ratio
  const heightRatio = (e: JournalEntry): number => {
    if (!e.sentiment) return 0.2;
    if (e.sentiment === "positive") return 0.85 + (e.sentimentScore ?? 0) * 0.15;
    if (e.sentiment === "neutral")  return 0.45;
    return 0.15 + (1 - (e.sentimentScore ?? 0.5)) * 0.2;
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={[Colors.peach, Colors.peachDark]} style={styles.header}>
        <Text style={styles.headerTitle}>{t("insights_title")}</Text>
        <Text style={{ fontSize: 26 }}>{"📊"}</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.skeletonBody}>
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.skeletonCard}>
            <Skeleton colorMode="light" height={18} width={120} radius={6} />
            <View style={{ height: Spacing.lg }} />
            <View style={{ flexDirection: "row", gap: Spacing.sm, alignItems: "flex-end" }}>
              {[80, 100, 60, 110, 75, 90, 55].map((h, i) => (
                <View key={i} style={{ flex: 1, height: 120, justifyContent: "flex-end" }}>
                  <Skeleton colorMode="light" height={h} width="100%" radius={6} />
                </View>
              ))}
            </View>
          </MotiView>
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }} style={styles.skeletonCard}>
            <Skeleton colorMode="light" height={14} width={100} radius={6} />
            <View style={{ height: Spacing.md }} />
            <Skeleton colorMode="light" height={14} width="90%" radius={6} />
            <View style={{ height: 8 }} />
            <Skeleton colorMode="light" height={14} width="75%" radius={6} />
          </MotiView>
        </View>
      ) : (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350 }}
          style={styles.body}
        >

          {/* Weekly Mood Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("weekly_mood")}</Text>
            <View style={styles.chart}>
              {entries.length === 0
                ? <Text style={styles.noData}>{"Write journal entries to see your mood trend 🌱"}</Text>
                : entries.map((e, i) => {
                    const ratio = heightRatio(e);
                    const colour = e.sentiment
                      ? sentimentColour(e.sentiment as SentimentLabel)
                      : Colors.warmGrey;
                    const barH = Math.round(BAR_MAX_HEIGHT * ratio);
                    const label = e.createdAt
                      ? format(new Date(e.createdAt), "EEE")
                      : DAYS[i] ?? "-";

                    return (
                      <View key={e.id} style={styles.barGroup}>
                        <Text style={styles.barScore}>
                          {e.sentimentScore ? Math.round(e.sentimentScore * 100) : "-"}
                        </Text>
                        <View style={styles.barTrack}>
                          <MotiView
                            from={{ height: 0 }}
                            animate={{ height: barH }}
                            transition={{ type: "timing", duration: 600, delay: i * 80 }}
                            style={[styles.bar, { backgroundColor: colour }]}
                          />
                        </View>
                        <Text style={styles.barDay}>{label}</Text>
                        <Text style={styles.barEmoji}>
                          {e.sentiment ? sentimentEmoji(e.sentiment as SentimentLabel) : "."}
                        </Text>
                      </View>
                    );
                  })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              {(["positive","neutral","negative"] as SentimentLabel[]).map((l) => (
                <View key={l} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: sentimentColour(l) }]} />
                  <Text style={styles.legendLabel}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Latest Advice */}
          {latest?.sentimentAdvice && (
            <View style={[
              styles.adviceCard,
              { borderLeftColor: latest.sentiment
                  ? sentimentColour(latest.sentiment as SentimentLabel)
                  : Colors.peach },
            ]}>
              <Text style={styles.adviceLabel}>{t("latest_advice")}</Text>
              <Text style={styles.adviceEmoji}>
                {latest.sentiment ? sentimentEmoji(latest.sentiment as SentimentLabel) : "🌿"}
              </Text>
              <Text style={styles.adviceText}>{latest.sentimentAdvice}</Text>
              <Text style={styles.adviceDate}>
                {latest.createdAt ? format(new Date(latest.createdAt), "dd MMM yyyy") : ""}
              </Text>
            </View>
          )}

          {/* Entry Count Summary */}
          <View style={styles.summaryRow}>
            {(["positive","neutral","negative"] as SentimentLabel[]).map((lbl) => {
              const count = entries.filter((e) => e.sentiment === lbl).length;
              return (
                <View key={lbl} style={[styles.summaryCard, { borderTopColor: sentimentColour(lbl) }]}>
                  <Text style={styles.summaryEmoji}>{sentimentEmoji(lbl)}</Text>
                  <Text style={styles.summaryCount}>{count}</Text>
                  <Text style={styles.summaryLabel}>{lbl}</Text>
                </View>
              );
            })}
          </View>

          {entries.length === 0 && (
            <Text style={styles.hint}>
              {"💡 Start writing in your journal to unlock mood insights and compassionate AI guidance."}
            </Text>
          )}
        </MotiView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  skeletonBody: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 80 },
  skeletonCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 8,
    ...Shadow.card,
  },
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.xl, color: Colors.white },
  body: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 80 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: BAR_MAX_HEIGHT + 60,
    paddingBottom: 32,
  },
  barGroup: { alignItems: "center", gap: 4, flex: 1 },
  barScore: { fontFamily: Typography.fontFamily, fontSize: 9, color: Colors.textMuted },
  barTrack: {
    width: 28,
    height: BAR_MAX_HEIGHT,
    backgroundColor: Colors.warmGrey,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 6 },
  barDay: { fontFamily: Typography.fontFamilyMedium, fontSize: 9, color: Colors.textMuted },
  barEmoji: { fontSize: 14 },
  noData: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: "center",
    padding: Spacing.xl,
  },
  legend: { flexDirection: "row", gap: Spacing.lg, marginTop: Spacing.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.textMuted },

  adviceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    ...Shadow.card,
  },
  adviceLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  adviceEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  adviceText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  adviceDate: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.textMuted },

  summaryRow: { flexDirection: "row", gap: Spacing.sm },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderTopWidth: 3,
    ...Shadow.card,
  },
  summaryEmoji: { fontSize: 26, marginBottom: 4 },
  summaryCount: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.xl, color: Colors.textPrimary },
  summaryLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },

  hint: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    padding: Spacing.md,
  },
});
