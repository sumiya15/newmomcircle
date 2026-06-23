/**
 * app/(main)/profile/settings.tsx — Screen 20: Settings
 *
 * Layout:
 *   - Header: back < · "Settings"
 *   - Section "Notifications":
 *       Push Notifications · Email Digest · Activity Reminders
 *   - Section "Privacy":
 *       Profile Visibility (3-way segment: Public/Circles/Private)
 *       Show Baby Age · Allow Direct Messages
 *   - Section "Data & Privacy":
 *       AI Personalisation (synced with appStore) · Download My Data · Privacy Policy
 *   - Section "About":
 *       App Version · Terms of Service · Licenses
 *
 * All toggles are local state (backend extension pending).
 * AI Personalisation is wired to the shared appStore so it stays in sync
 * with the profile screen toggle.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Switch, ScrollView, StatusBar, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '../../../store/appStore';
import { useAuthStore } from '../../../store/authStore';
import { updateUserProfile } from '../../../supabase/db';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Visibility = 'Public' | 'Circles' | 'Private';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const { allowRetraining, setAllowRetraining } = useAppStore();

  // ── Notification toggles
  const [pushEnabled,     setPushEnabled]     = useState(true);
  const [emailDigest,     setEmailDigest]     = useState(true);
  const [activityAlerts,  setActivityAlerts]  = useState(true);
  const [circleUpdates,   setCircleUpdates]   = useState(true);

  // ── Privacy settings
  const [visibility,      setVisibility]      = useState<Visibility>('Public');
  const [showBabyAge,     setShowBabyAge]     = useState(true);
  const [allowDMs,        setAllowDMs]        = useState(true);
  const [readReceipts,    setReadReceipts]    = useState(true);

  // ── Toast-style feedback for tappable rows
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleRetraining = (v: boolean) => {
    setAllowRetraining(v);
    if (user) updateUserProfile(user.id, { allowRetraining: v });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="settings-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View testID="settings-header" style={styles.header}>
        <Pressable testID="settings-back-btn" style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        testID="settings-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >

        {/* ── Notifications ── */}
        <SettingsSection
          title="Notifications"
          icon="notifications-outline"
          delay={0}
        >
          <ToggleRow
            label="Push Notifications"
            sub="Alerts on this device"
            value={pushEnabled}
            onChange={setPushEnabled}
            testID="settings-push-notifications-toggle"
          />
          <RowSep />
          <ToggleRow
            label="Email Digest"
            sub="Weekly round-up to your inbox"
            value={emailDigest}
            onChange={setEmailDigest}
            disabled={!pushEnabled}
            testID="settings-email-digest-toggle"
          />
          <RowSep />
          <ToggleRow
            label="Activity Alerts"
            sub="Likes, comments & replies"
            value={activityAlerts}
            onChange={setActivityAlerts}
            testID="settings-activity-alerts-toggle"
          />
          <RowSep />
          <ToggleRow
            label="Circle Updates"
            sub="New posts in circles you've joined"
            value={circleUpdates}
            onChange={setCircleUpdates}
            testID="settings-circle-updates-toggle"
          />
        </SettingsSection>

        {/* ── Privacy ── */}
        <SettingsSection
          title="Privacy"
          icon="shield-outline"
          delay={60}
        >
          {/* Visibility segment */}
          <View style={styles.segField}>
            <View style={styles.segFieldLabel}>
              <Text style={styles.rowLabel}>Profile Visibility</Text>
              <Text style={styles.rowSub}>Who can see your profile</Text>
            </View>
            <VisibilityControl value={visibility} onChange={setVisibility} />
          </View>
          <RowSep />
          <ToggleRow
            label="Show Baby Age"
            sub="Display weeks/months on your profile"
            value={showBabyAge}
            onChange={setShowBabyAge}
            testID="settings-show-baby-age-toggle"
          />
          <RowSep />
          <ToggleRow
            label="Allow Direct Messages"
            sub="Other members can message you"
            value={allowDMs}
            onChange={setAllowDMs}
            testID="settings-allow-dms-toggle"
          />
          <RowSep />
          <ToggleRow
            label="Read Receipts"
            sub="Let others know when you've read their messages"
            value={readReceipts}
            onChange={setReadReceipts}
            disabled={!allowDMs}
            testID="settings-read-receipts-toggle"
          />
        </SettingsSection>

        {/* ── Data ── */}
        <SettingsSection
          title="Data & Privacy"
          icon="server-outline"
          delay={120}
        >
          <ToggleRow
            label="AI Personalisation"
            sub="Allow anonymised data to improve recommendations"
            value={allowRetraining}
            onChange={handleRetraining}
            testID="settings-ai-personalisation-toggle"
          />
          <RowSep />
          <TapRow
            label="Download My Data"
            sub="Get a copy of everything you've shared"
            icon="download-outline"
            onPress={() => showToast('Data export coming soon — we\'ll email when ready.')}
            testID="settings-download-data-btn"
          />
          <RowSep />
          <TapRow
            label="Privacy Policy"
            icon="document-text-outline"
            onPress={() => showToast('Opening privacy policy…')}
            testID="settings-privacy-policy-btn"
          />
        </SettingsSection>

        {/* ── About ── */}
        <SettingsSection
          title="About"
          icon="information-circle-outline"
          delay={180}
        >
          <TapRow
            label="App Version"
            sub="NewMomCircle"
            value="1.0.0 (42)"
            icon="phone-portrait-outline"
            showChevron={false}
            onPress={() => {}}
          />
          <RowSep />
          <TapRow
            label="Terms of Service"
            icon="reader-outline"
            onPress={() => showToast('Opening terms…')}
            testID="settings-terms-btn"
          />
          <RowSep />
          <TapRow
            label="Open Source Licenses"
            icon="code-slash-outline"
            onPress={() => showToast('Opening licenses…')}
            testID="settings-licenses-btn"
          />
          <RowSep />
          <TapRow
            label="Send Feedback"
            icon="chatbubble-ellipses-outline"
            onPress={() => showToast('Thank you! Feedback form coming soon.')}
            testID="settings-feedback-btn"
          />
        </SettingsSection>

        {/* Built with love note */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: Motion.duration.slow, delay: 300 }}
        >
          <Text style={styles.builtWith}>
            Made with 🌸 for new mothers everywhere
          </Text>
        </MotiView>

      </ScrollView>

      {/* ── Toast ── */}
      {toastMsg ? (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: 'spring', ...Motion.spring.snappy }}
          style={[styles.toast, { bottom: insets.bottom + 24 }]}
        >
          <Ionicons name="information-circle-outline" size={16} color={Colors.white} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </MotiView>
      ) : null}
    </View>
  );
}

// ─── Settings section ─────────────────────────────────────────────────────────

function SettingsSection({
  title, icon, delay, children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={14} color={Colors.peachDark} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>
        {children}
      </View>
    </MotiView>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label, sub, value, onChange, disabled = false, testID,
}: {
  label: string; sub?: string;
  value: boolean; onChange: (v: boolean) => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, disabled && { color: Colors.textMuted }]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={disabled ? undefined : onChange}
        disabled={disabled}
        trackColor={{ false: Colors.divider, true: Colors.peachLight }}
        thumbColor={value && !disabled ? Colors.peach : Colors.textMuted}
      />
    </View>
  );
}

// ─── Tap row ──────────────────────────────────────────────────────────────────

function TapRow({
  label, sub, value, icon, showChevron = true, onPress, testID,
}: {
  label: string; sub?: string; value?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  showChevron?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        {icon && (
          <View style={styles.rowIconWrap}>
            <Ionicons name={icon} size={16} color={Colors.peachDark} />
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Visibility control ───────────────────────────────────────────────────────

function VisibilityControl({
  value, onChange,
}: { value: Visibility; onChange: (v: Visibility) => void }) {
  const options: { id: Visibility; icon: React.ComponentProps<typeof Ionicons>['name']; }[] = [
    { id: 'Public',  icon: 'globe-outline'   },
    { id: 'Circles', icon: 'people-outline'  },
    { id: 'Private', icon: 'lock-closed-outline' },
  ];

  return (
    <View style={styles.visControl}>
      {options.map(({ id, icon }) => {
        const active = value === id;
        return (
          <Pressable
            key={id}
            testID={`settings-visibility-${id.toLowerCase()}-btn`}
            style={({ pressed }) => [
              styles.visOption,
              active && styles.visOptionActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onChange(id)}
          >
            <Ionicons
              name={icon}
              size={14}
              color={active ? Colors.white : Colors.textMuted}
            />
            <Text style={[styles.visOptionText, active && styles.visOptionTextActive]}>
              {id}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function RowSep() {
  return <View style={styles.sep} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    overflow: 'hidden',
    ...Shadow.soft,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowPressed: { backgroundColor: Colors.warmGrey },
  rowDisabled: { opacity: 0.45 },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  rowSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  rowValue: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md,
  },

  // Segment (visibility)
  segField: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  segFieldLabel: { gap: 2 },
  visControl: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  visOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.offWhite,
  },
  visOptionActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.peach,
  },
  visOptionText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  visOptionTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },

  // Footer note
  builtWith: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },

  // Toast
  toast: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.textPrimary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
  },
  toastText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.white,
    lineHeight: 18,
  },
});
