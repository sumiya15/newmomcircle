import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet, Pressable,
  Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/authStore";
import {
  createJournalEntry,
  updateJournalSentiment,
  getJournalEntries,
  analyzeSentiment,
} from "../../../supabase/db";
import { parseHFSentiment, sentimentEmoji, sentimentColour } from "../../../utils/sentiment";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../../utils/theme";
import { useAppStore } from "../../../store/appStore";
import { format } from "date-fns";
import type { JournalEntry } from "@newmomcircle/types";

export default function JournalScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { allowRetraining } = useAppStore();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [latestResult, setLatestResult] = useState<JournalEntry | null>(null);
  const [saveError, setSaveError] = useState("");

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getJournalEntries(user.id);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadEntries(); }, [user]);

  const handleSave = async () => {
    if (!entryText.trim() || !user) return;
    setSaving(true);
    try {
      const entry = await createJournalEntry({
        userId: user.id,
        content: entryText.trim(),
        allowRetraining,
      });
      if (!entry) throw new Error("Failed to save entry");

      setAnalysing(true);
      const result = await analyzeSentiment(entryText.trim());

      if (result) {
        await updateJournalSentiment(entry.id, {
          label: result.sentiment,
          score: result.sentimentScore,
          advice: result.sentimentAdvice,
          coping: result.suggestedCoping,
        });
        setLatestResult({
          ...entry,
          sentiment: result.sentiment,
          sentimentScore: result.sentimentScore,
          sentimentAdvice: result.sentimentAdvice,
          suggestedCoping: result.suggestedCoping,
        });
      } else {
        setLatestResult(entry);
      }

      setEntryText("");
      setShowNew(false);
      await loadEntries();
    } catch {
      setSaveError(t("error_generic"));
    } finally {
      setSaving(false);
      setAnalysing(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[Colors.peach, Colors.peachDark]} style={styles.header}>
        <Text style={styles.headerTitle}>{t("journal_title")}</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowNew(true)}>
          <Text style={styles.newBtnText}>+ {t("new_entry")}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {latestResult?.sentiment && (
        <View style={[styles.resultBanner, { borderLeftColor: sentimentColour(latestResult.sentiment) }]}>
          <Text style={styles.resultEmoji}>{sentimentEmoji(latestResult.sentiment)}</Text>
          <Text style={styles.resultAdvice}>{latestResult.sentimentAdvice}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 80, type: "timing", duration: 350 }}
              style={styles.skeletonCard}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.sm }}>
                <Skeleton colorMode="light" height={12} width={80} radius={6} />
                <Skeleton colorMode="light" height={22} width={90} radius={Radius.full} />
              </View>
              <Skeleton colorMode="light" height={13} width="100%" radius={6} />
              <View style={{ height: 6 }} />
              <Skeleton colorMode="light" height={13} width="80%" radius={6} />
              <View style={{ height: 6 }} />
              <Skeleton colorMode="light" height={13} width="60%" radius={6} />
            </MotiView>
          ))}
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🌱</Text>
              <Text style={styles.emptyTitle}>{t("no_entries")}</Text>
              <Text style={styles.emptySubtitle}>Start writing to track your mood journey</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNew(true)} activeOpacity={0.85}>
                <LinearGradient colors={[Colors.peach, Colors.peachDark]} style={styles.emptyBtnGrad}>
                  <Text style={styles.emptyBtnText}>+ {t("new_entry")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => <EntryCard entry={item} index={index} />}
        />
      )}

      <Modal visible={showNew} animationType="slide" transparent onRequestClose={() => { setShowNew(false); setSaveError(""); }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("new_entry")}</Text>
              <TouchableOpacity onPress={() => { setShowNew(false); setSaveError(""); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textArea}
              multiline
              value={entryText}
              onChangeText={setEntryText}
              placeholder={t("journal_placeholder")}
              placeholderTextColor={Colors.textMuted}
              textAlignVertical="top"
              autoFocus
            />

            {saveError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{saveError}</Text>
              </View>
            ) : null}

            {analysing && (
              <View style={styles.analysingRow}>
                <ActivityIndicator color={Colors.peach} size="small" />
                <Text style={styles.analysingText}>{t("analysing")}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, (saving || !entryText.trim()) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving || !entryText.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[Colors.peach, Colors.peachDark]} style={styles.saveBtnGrad}>
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>{t("save_entry")}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function EntryCard({ entry, index }: { entry: JournalEntry; index: number }) {
  const date = entry.createdAt ? format(new Date(entry.createdAt), "dd MMM yyyy") : "";
  const [pressed, setPressed] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0, scale: pressed ? 0.97 : 1 }}
      transition={{ type: "timing", duration: 300, delay: index * 60 }}
    >
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardDate}>{date}</Text>
            {entry.sentiment && (
              <View style={[styles.sentimentBadge, { backgroundColor: sentimentColour(entry.sentiment) + "22" }]}>
                <Text style={styles.sentimentBadgeText}>
                  {sentimentEmoji(entry.sentiment)} {entry.sentiment}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardContent} numberOfLines={3}>{entry.content}</Text>
          {entry.sentimentAdvice && (
            <Text style={styles.cardAdvice} numberOfLines={2}>{entry.sentimentAdvice}</Text>
          )}
        </View>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.xl, color: Colors.white },
  newBtn: {
    backgroundColor: "rgba(255,255,255,0.22)", paddingVertical: 8,
    paddingHorizontal: Spacing.md, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.glassStroke,
  },
  newBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.sm, color: Colors.white },
  resultBanner: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    margin: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md, borderLeftWidth: 4, ...Shadow.card,
  },
  resultEmoji: { fontSize: 28 },
  resultAdvice: { flex: 1, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  list: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 80 },
  empty: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySubtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.sm, color: Colors.textMuted, marginBottom: Spacing.lg, textAlign: "center" },
  emptyBtn: { borderRadius: Radius.full, overflow: "hidden", ...Shadow.button },
  emptyBtnGrad: { paddingVertical: 14, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, alignItems: "center" },
  emptyBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.base, color: Colors.white },
  skeletonCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.card },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xs },
  cardDate: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.xs, color: Colors.textMuted },
  sentimentBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: Radius.full },
  sentimentBadgeText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.xs, color: Colors.textPrimary },
  cardContent: { fontFamily: Typography.fontFamily, fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.xs },
  cardAdvice: { fontFamily: Typography.fontFamily, fontSize: Typography.sm, color: Colors.textMuted, fontStyle: "italic", lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: {
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 40, maxHeight: "90%",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary },
  modalClose: { fontFamily: Typography.fontFamily, fontSize: Typography.lg, color: Colors.textMuted },
  textArea: {
    backgroundColor: Colors.warmGrey, borderRadius: Radius.md, padding: Spacing.md,
    minHeight: 180, fontFamily: Typography.fontFamily, fontSize: Typography.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  analysingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  analysingText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.sm, color: Colors.peachDark },
  errorBanner: {
    backgroundColor: Colors.danger + '18',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorBannerText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.sm, color: Colors.danger },
  saveBtn: { borderRadius: Radius.full, overflow: "hidden", ...Shadow.button },
  saveBtnGrad: { paddingVertical: 16, alignItems: "center", borderRadius: Radius.full },
  saveBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.md, color: Colors.white },
});
