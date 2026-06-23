import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, TextInput, ActivityIndicator,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/authStore";
import {
  getGuardians, addGuardian, deleteGuardian, sendSosAlert,
} from "../../../supabase/db";
import { useShakeDetection } from "../../../hooks/useShakeDetection";
import { Colors, Typography, Spacing, Radius, Shadow } from "../../../utils/theme";
import type { Guardian } from "@newmomcircle/types";
import WebWrapper from "../../../components/common/WebWrapper";

const SOS_COUNTDOWN = 10;

export default function SafetyScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const insets = useSafeAreaInsets();

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(SOS_COUNTDOWN);
  const [sending, setSending] = useState(false);
  const [showAddGuardian, setShowAddGuardian] = useState(false);

  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gRelationship, setGRelationship] = useState("");
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [modalError, setModalError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  useEffect(() => {
    if (user) void loadGuardians();
  }, [user]);

  const loadGuardians = async () => {
    if (!user) return;
    const data = await getGuardians(user.id);
    setGuardians(data);
  };

  useEffect(() => {
    if (!sosActive) return;
    if (countdown === 0) { void handleSendAlert(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosActive, countdown]);

  const triggerSOS = () => {
    setSosActive(true);
    setCountdown(SOS_COUNTDOWN);
  };

  const cancelSOS = () => {
    setSosActive(false);
    setCountdown(SOS_COUNTDOWN);
  };

  const handleSendAlert = async () => {
    setSending(true);
    setSosActive(false);
    try {
      if (user) await sendSosAlert(user.id, "button");
      showToast("✅ " + t("sos_sent"));
    } catch {
      showToast(t("error_generic"));
    } finally {
      setSending(false);
      setCountdown(SOS_COUNTDOWN);
    }
  };

  useShakeDetection({ onShake: triggerSOS });

  const handleAddGuardian = async () => {
    if (!gName.trim() || !gPhone.trim() || !user) return;
    setSavingGuardian(true);
    try {
      await addGuardian({
        userId: user.id,
        name: gName.trim(),
        phone: gPhone.trim(),
        relationship: gRelationship.trim(),
      });
      setGName(""); setGPhone(""); setGRelationship("");
      setShowAddGuardian(false);
      setModalError("");
      await loadGuardians();
    } catch {
      setModalError(t("error_generic"));
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleDeleteGuardian = (id: string) => setPendingDeleteId(id);

  const confirmDeleteGuardian = async () => {
    if (!pendingDeleteId) return;
    await deleteGuardian(pendingDeleteId);
    setPendingDeleteId(null);
    await loadGuardians();
  };

  return (
    <View style={styles.root} testID="safety-screen">
      {/* WebWrapper: centres content in 480px on wide web; passthrough on native */}
      <WebWrapper>
        <LinearGradient testID="safety-header" colors={["#D94F4F", "#B03030"]} style={styles.header}>
          <Text style={styles.headerTitle}>{t("safety_title")}</Text>
          <Text style={styles.headerEmoji}>🛡️</Text>
        </LinearGradient>

        <View style={styles.body}>
        <View style={styles.sosSection}>
          <MotiView
            animate={{ scale: sosActive ? 1.12 : 1 }}
            transition={{ type: 'timing', duration: 500, loop: sosActive, repeatReverse: sosActive }}
          >
            <TouchableOpacity
              testID="safety-sos-btn"
              style={styles.sosBtn}
              onPress={triggerSOS}
              activeOpacity={0.82}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={Colors.white} size="large" />
              ) : (
                <>
                  <Text style={styles.sosBtnText}>{t("sos_button")}</Text>
                  <Text style={styles.sosSubtitle}>{t("sos_subtitle")}</Text>
                </>
              )}
            </TouchableOpacity>
          </MotiView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("guardians")}</Text>
            <TouchableOpacity testID="safety-add-guardian-btn" style={styles.addBtn} onPress={() => { setShowAddGuardian(true); setModalError(""); }}>
              <Text style={styles.addBtnText}>+ {t("add_guardian")}</Text>
            </TouchableOpacity>
          </View>

          {guardians.length === 0 ? (
            <Text style={styles.emptyText}>{t("no_guardians")}</Text>
          ) : (
            guardians.map((g) => (
              <View key={g.id} testID="safety-guardian-card" style={styles.guardianCard}>
                <View style={styles.guardianAvatar}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guardianName}>{g.name}</Text>
                  <Text style={styles.guardianDetails}>{g.phone} · {g.relationship}</Text>
                  {pendingDeleteId === g.id && (
                    <View style={styles.deleteConfirmRow}>
                      <Text style={styles.deleteConfirmLabel}>Remove?</Text>
                      <TouchableOpacity testID="safety-delete-confirm-yes" onPress={confirmDeleteGuardian} style={styles.deleteYesBtn}>
                        <Text style={styles.deleteYesText}>{t("delete_confirm_yes")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity testID="safety-cancel-delete-btn" onPress={() => setPendingDeleteId(null)}>
                        <Text style={styles.deleteNoText}>{t("delete_confirm_no")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <TouchableOpacity testID={`safety-delete-guardian-${g.id}-btn`} onPress={() => handleDeleteGuardian(g.id)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Toast */}
      <AnimatePresence>
        {toast ? (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 20 }}
            style={[styles.toast, { bottom: insets.bottom + 24 }]}
          >
            <Text style={styles.toastText}>{toast}</Text>
          </MotiView>
        ) : null}
      </AnimatePresence>
      </WebWrapper>

      {/* SOS Countdown Overlay (Modal — outside WebWrapper) */}
      <Modal visible={sosActive} transparent animationType="fade">
        <View style={styles.sosOverlay}>
          <View testID="safety-sos-countdown" style={styles.sosCountdownCard}>
            <Text style={styles.sosCountdownTitle}>{t("sos_confirm_title")}</Text>
            <Text style={styles.sosCountdownNum}>{countdown}</Text>
            <TouchableOpacity testID="safety-cancel-btn" style={styles.cancelBtn} onPress={cancelSOS}>
              <Text style={styles.cancelBtnText}>{t("sos_cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Guardian Modal */}
      <Modal visible={showAddGuardian} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t("add_guardian")}</Text>
            {[
              { label: t("guardian_name"),        value: gName,         setter: setGName,         keyboard: undefined,          testID: "safety-guardian-name-input" },
              { label: t("guardian_phone"),        value: gPhone,        setter: setGPhone,        keyboard: "phone-pad" as const, testID: "safety-guardian-phone-input" },
              { label: t("guardian_relationship"), value: gRelationship, setter: setGRelationship, keyboard: undefined,          testID: "safety-guardian-relationship-input" },
            ].map((f, i) => (
              <TextInput
                key={i}
                testID={f.testID}
                style={styles.input}
                value={f.value}
                onChangeText={f.setter}
                placeholder={f.label}
                placeholderTextColor={Colors.textMuted}
                keyboardType={f.keyboard}
              />
            ))}
            {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}
            <TouchableOpacity
              testID="safety-save-guardian-btn"
              style={[styles.saveGuardianBtn, savingGuardian && { opacity: 0.5 }]}
              onPress={handleAddGuardian}
              disabled={savingGuardian}
            >
              {savingGuardian ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveGuardianBtnText}>{t("save_guardian")}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity testID="safety-cancel-modal-btn" style={styles.cancelModalBtn} onPress={() => { setShowAddGuardian(false); setModalError(""); }}>
              <Text style={styles.cancelModalText}>{t("delete_confirm_no")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.xl, color: Colors.white },
  headerEmoji: { fontSize: 28 },
  body: { flex: 1, padding: Spacing.lg },
  sosSection: { alignItems: "center", marginVertical: Spacing.xl },
  sosBtn: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.danger, justifyContent: "center", alignItems: "center",
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 28, elevation: 16,
  },
  sosBtnText: { fontFamily: Typography.fontFamilyBold, fontSize: Typography["3xl"], color: Colors.white },
  sosSubtitle: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center", paddingHorizontal: Spacing.md },
  section: { marginTop: Spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary },
  addBtn: { paddingVertical: 8, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.peachOverlay, borderWidth: 1.5, borderColor: Colors.peach },
  addBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.sm, color: Colors.peachDark },
  emptyText: { fontFamily: Typography.fontFamily, fontSize: Typography.base, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.md },
  guardianCard: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.card },
  guardianAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.peachOverlay, justifyContent: "center", alignItems: "center" },
  guardianName: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.base, color: Colors.textPrimary },
  guardianDetails: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.textMuted },
  deleteIcon: { fontSize: 20, padding: Spacing.xs },
  sosOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  sosCountdownCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, width: 280, alignItems: "center", ...Shadow.card },
  sosCountdownTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: "center" },
  sosCountdownNum: { fontFamily: Typography.fontFamilyBold, fontSize: 72, color: Colors.danger, lineHeight: 80, marginBottom: Spacing.lg },
  cancelBtn: { borderWidth: 2, borderColor: Colors.danger, borderRadius: Radius.full, paddingVertical: 12, paddingHorizontal: Spacing.xl },
  cancelBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.md, color: Colors.danger },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, paddingBottom: 40 },
  modalTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: Spacing.lg },
  input: { backgroundColor: Colors.warmGrey, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontFamily: Typography.fontFamily, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.md },
  saveGuardianBtn: { backgroundColor: Colors.peach, borderRadius: Radius.full, paddingVertical: 16, alignItems: "center", marginBottom: Spacing.sm, ...Shadow.button },
  saveGuardianBtnText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.md, color: Colors.white },
  cancelModalBtn: { alignItems: "center", paddingVertical: Spacing.sm },
  cancelModalText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.base, color: Colors.textMuted },
  modalErrorText: { fontFamily: Typography.fontFamily, fontSize: Typography.sm, color: Colors.danger, marginBottom: Spacing.sm },
  deleteConfirmRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 4 },
  deleteConfirmLabel: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.danger },
  deleteYesBtn: { backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  deleteYesText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.xs, color: Colors.white },
  deleteNoText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.xs, color: Colors.textMuted },
  toast: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.full,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  toastText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.sm, color: Colors.white },
});
