/**
 * app/(main)/profile/index.tsx — Screen 18: My Profile
 *
 * Layout:
 *   - Peach hero: avatar · name · "member since" · baby age pill · stats row
 *   - Milestone badges (horizontal scroll)
 *   - Settings rows (icon · label · value/chevron)
 *       Edit Profile · Baby Info · Language · Privacy · Notifications
 *       Sign Out · Delete Account (danger zone)
 *   - Delete confirmation bottom sheet (Moti slide-up)
 *   - Inline error banner — no Alert.alert()
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Switch,
  ScrollView, StatusBar, TextInput, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { differenceInWeeks, differenceInMonths, parse, isValid } from 'date-fns';

import { logout, requestAccountDeletion } from '../../../supabase/auth';
import { updateUserProfile } from '../../../supabase/db';
import { useAuthStore } from '../../../store/authStore';
import { useAppStore, SupportedLocale } from '../../../store/appStore';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { deterministicAvatar } from '../../../lib/unsplashImages';
import WebWrapper from '../../../components/common/WebWrapper';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.56;

// ─── Language options ─────────────────────────────────────────────────────────

const LANGUAGES: { code: SupportedLocale; label: string; native: string }[] = [
  { code: 'en', label: 'English',   native: 'English'  },
  { code: 'hi', label: 'Hindi',     native: 'हिंदी'     },
  { code: 'te', label: 'Telugu',    native: 'తెలుగు'    },
  { code: 'ta', label: 'Tamil',     native: 'தமிழ்'     },
  { code: 'kn', label: 'Kannada',   native: 'ಕನ್ನಡ'    },
];

// ─── Milestones ───────────────────────────────────────────────────────────────

interface Badge {
  id: string; emoji: string; label: string; earned: boolean;
}

const BADGES: Badge[] = [
  { id: 'b1', emoji: '🌸', label: 'First Post',     earned: true  },
  { id: 'b2', emoji: '🤝', label: 'Circle Joined',  earned: true  },
  { id: 'b3', emoji: '📓', label: 'Journal Started', earned: true  },
  { id: 'b4', emoji: '💬', label: 'First Comment',  earned: true  },
  { id: 'b5', emoji: '🌟', label: 'Week 4',          earned: true  },
  { id: 'b6', emoji: '🎯', label: 'Topic Explorer',  earned: false },
  { id: 'b7', emoji: '🏅', label: 'Helper',          earned: false },
  { id: 'b8', emoji: '🌈', label: 'Week 12',         earned: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBabyDOB(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  // Support DD/MM/YYYY and YYYY-MM-DD
  const d1 = parse(raw, 'dd/MM/yyyy', new Date());
  if (isValid(d1)) return d1;
  const d2 = new Date(raw);
  if (isValid(d2)) return d2;
  return null;
}

function babyAgeLabel(dob: Date | null): string | null {
  if (!dob) return null;
  const weeks  = differenceInWeeks(new Date(), dob);
  const months = differenceInMonths(new Date(), dob);
  if (weeks < 1)  return 'Newborn';
  if (weeks < 12) return `${weeks} week${weeks === 1 ? '' : 's'} old`;
  if (months < 24) return `${months} month${months === 1 ? '' : 's'} old`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? '' : 's'} old`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router   = useRouter();
  const { i18n } = useTranslation();
  const insets   = useSafeAreaInsets();

  const user       = useAuthStore((s) => s.user);
  const profile    = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const { language, setLanguage, allowRetraining, setAllowRetraining } = useAppStore();

  // UI state
  const [langOpen,     setLangOpen]     = useState(false);
  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [deletePass,   setDeletePass]   = useState('');
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');

  // Sheet animation
  const sheetY = useSharedValue(SHEET_H);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const openDelete = () => {
    setDeleteOpen(true);
    sheetY.value = withTiming(0, { duration: Motion.duration.base });
  };
  const closeDelete = () => {
    sheetY.value = withTiming(SHEET_H, { duration: Motion.duration.base });
    setTimeout(() => { setDeleteOpen(false); setDeletePass(''); }, Motion.duration.base);
  };

  const babyDOB   = parseBabyDOB(profile?.babyDob);
  const ageLabel  = babyAgeLabel(babyDOB);
  const firstName = profile?.displayName?.split(' ')[0] ?? 'there';
  const avatarUrl = profile?.photoUrl ?? deterministicAvatar(user?.id ?? 'default').url;
  const initials  = (profile?.displayName ?? 'U').slice(0, 2).toUpperCase();

  const currentLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0]!;

  const handleLanguage = async (code: SupportedLocale) => {
    await setLanguage(code);
    i18n.changeLanguage(code);
    if (user) await updateUserProfile(user.id, { language: code });
    setLangOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setErrorMsg('Could not sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePass.trim()) {
      setErrorMsg('Please enter your password to confirm.');
      return;
    }
    setDeleting(true);
    setErrorMsg('');
    try {
      await requestAccountDeletion(deletePass);
      router.replace('/(auth)/login');
    } catch {
      setErrorMsg('Incorrect password. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="profile-screen">
      <StatusBar barStyle="dark-content" />

      {/* WebWrapper: centres content in 480px on wide web.
          The delete sheet / scrim are kept outside so they cover the full screen. */}
      <WebWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[Colors.peachLight, Colors.offWhite]}
          style={styles.hero}
        >
          {/* Settings icon */}
          <Pressable
            testID="profile-settings-btn"
            style={styles.heroSettings}
            hitSlop={12}
            onPress={() => router.push('/(main)/profile/settings' as any)}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
          </Pressable>

          {/* Avatar */}
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', ...Motion.spring.bouncy }}
          >
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
                contentFit="cover"
              />
              <Pressable
                testID="profile-edit-btn"
                style={styles.avatarEditBtn}
                hitSlop={6}
                onPress={() => router.push('/(main)/profile/edit' as any)}
              >
                <Ionicons name="camera-outline" size={13} color={Colors.white} />
              </Pressable>
            </View>
          </MotiView>

          {/* Name + email */}
          <Text testID="profile-name-text" style={styles.heroName}>{profile?.displayName ?? '—'}</Text>
          <Text style={styles.heroEmail}>{profile?.email ?? ''}</Text>

          {/* Baby age pill */}
          {ageLabel && (
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', ...Motion.spring.snappy, delay: 100 }}
            >
              <View style={styles.babyPill}>
                <Text style={styles.babyPillText}>👶  {ageLabel}</Text>
              </View>
            </MotiView>
          )}

          {/* Stats row */}
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 120 }}
          >
            <View style={styles.statsRow}>
              <StatPill icon="create-outline"        value="12" label="Posts"   />
              <View style={styles.statDivider} />
              <StatPill icon="people-outline"        value="4"  label="Circles" />
              <View style={styles.statDivider} />
              <StatPill icon="journal-outline"       value="7"  label="Journal" />
            </View>
          </MotiView>
        </LinearGradient>

        {/* ── Milestones ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Milestones</Text>
            <View style={styles.earnedBadge}>
              <Text style={styles.earnedBadgeText}>
                {BADGES.filter((b) => b.earned).length}/{BADGES.length}
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesRow}
          >
            {BADGES.map((badge, i) => (
              <MotiView
                key={badge.id}
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: badge.earned ? 1 : 0.4, scale: 1 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy, delay: i * 40 }}
              >
                <View style={[styles.badge, !badge.earned && styles.badgeLocked]}>
                  <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                  <Text style={styles.badgeLabel}>{badge.label}</Text>
                  {!badge.earned && (
                    <Ionicons
                      name="lock-closed"
                      size={10}
                      color={Colors.textMuted}
                      style={styles.badgeLock}
                    />
                  )}
                </View>
              </MotiView>
            ))}
          </ScrollView>
        </View>

        {/* ── Settings rows ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.rowGroup}>
            <SettingsRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push('/(main)/profile/edit' as any)}
            />
            <RowSep />
            <SettingsRow
              icon="nutrition-outline"
              label="Baby & Pregnancy"
              value={ageLabel ?? 'Set up'}
              onPress={() => router.push('/(main)/profile/edit' as any)}
            />
            <RowSep />
            <SettingsRow
              icon="language-outline"
              label="Language"
              value={currentLang.native}
              onPress={() => setLangOpen((o) => !o)}
            />
            {/* Language picker inline */}
            <AnimatePresence>
              {langOpen && (
                <MotiView
                  from={{ height: 0, opacity: 0 }}
                  animate={{ height: LANGUAGES.length * 48, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'timing', duration: Motion.duration.base }}
                  style={{ overflow: 'hidden' }}
                >
                  {LANGUAGES.map((l) => (
                    <Pressable
                      key={l.code}
                      style={[
                        styles.langOption,
                        language === l.code && styles.langOptionActive,
                      ]}
                      onPress={() => handleLanguage(l.code)}
                    >
                      <Text style={[
                        styles.langOptionText,
                        language === l.code && { color: Colors.peachDark },
                      ]}>
                        {l.native}
                      </Text>
                      {language === l.code && (
                        <Ionicons name="checkmark" size={16} color={Colors.peachDark} />
                      )}
                    </Pressable>
                  ))}
                </MotiView>
              )}
            </AnimatePresence>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.rowGroup}>
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            <RowSep />
            {/* Privacy toggle */}
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIcon}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.peachDark} />
                </View>
                <View>
                  <Text style={styles.settingsLabel}>AI Personalisation</Text>
                  <Text style={styles.settingsValue}>
                    {allowRetraining ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={allowRetraining}
                onValueChange={(v) => {
                  setAllowRetraining(v);
                  if (user) updateUserProfile(user.id, { allowRetraining: v });
                }}
                trackColor={{ false: Colors.divider, true: Colors.peachLight }}
                thumbColor={allowRetraining ? Colors.peach : Colors.textMuted}
              />
            </View>
            <RowSep />
            <SettingsRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* ── Danger zone ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Account Actions</Text>
          <View style={styles.rowGroup}>
            <SettingsRow
              icon="log-out-outline"
              label="Sign Out"
              labelColor={Colors.textSecondary}
              onPress={handleLogout}
              testID="profile-logout-btn"
            />
            <RowSep />
            <SettingsRow
              icon="trash-outline"
              label="Delete Account"
              labelColor={Colors.danger}
              showChevron={false}
              onPress={openDelete}
            />
          </View>
        </View>

        {/* Global error banner */}
        <AnimatePresence>
          {errorMsg ? (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: Motion.duration.fast }}
              style={styles.errorBanner}
            >
              <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
              <Pressable onPress={() => setErrorMsg('')} hitSlop={8}>
                <Ionicons name="close" size={16} color={Colors.danger} />
              </Pressable>
            </MotiView>
          ) : null}
        </AnimatePresence>
        </ScrollView>
      </WebWrapper>

      {/* ── Delete confirmation sheet (absolute, outside WebWrapper so scrim covers full screen) ── */}
      {deleteOpen && (
        <>
          <Pressable style={styles.scrim} onPress={closeDelete} />
          <Animated.View style={[styles.deleteSheet, sheetStyle]}>
            <View style={styles.sheetHandle} />
            <View style={styles.deleteSheetHeader}>
              <View style={styles.deleteIcon}>
                <Ionicons name="trash-outline" size={24} color={Colors.danger} />
              </View>
              <Text style={styles.deleteTitle}>Delete Account</Text>
              <Text style={styles.deleteBody}>
                This action is permanent and cannot be undone. All your posts, journal entries, and circle memberships will be removed.
              </Text>
            </View>

            <Text style={styles.deletePassLabel}>Confirm your password</Text>
            <TextInput
              style={styles.deletePassInput}
              value={deletePass}
              onChangeText={(t) => { setDeletePass(t); setErrorMsg(''); }}
              secureTextEntry
              placeholder="Enter password…"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />

            <AnimatePresence>
              {errorMsg ? (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={styles.sheetError}
                >
                  <Text style={styles.sheetErrorText}>{errorMsg}</Text>
                </MotiView>
              ) : null}
            </AnimatePresence>

            <Pressable
              style={({ pressed }) => [
                styles.deleteConfirmBtn,
                (deleting || !deletePass.trim()) && { opacity: 0.5 },
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleDeleteAccount}
              disabled={deleting || !deletePass.trim()}
            >
              {deleting ? (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.deleteConfirmInner}
                >
                  <Ionicons name="refresh-outline" size={18} color={Colors.white} />
                  <Text style={styles.deleteConfirmText}>Deleting…</Text>
                </MotiView>
              ) : (
                <Text style={styles.deleteConfirmText}>Permanently Delete</Text>
              )}
            </Pressable>

            <Pressable style={styles.deleteCancelBtn} onPress={closeDelete}>
              <Text style={styles.deleteCancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ─── Stats pill ───────────────────────────────────────────────────────────────

function StatPill({
  icon, value, label,
}: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon, label, value, labelColor, showChevron = true, onPress, testID,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  labelColor?: string;
  showChevron?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: Colors.warmGrey }]}
      onPress={onPress}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIcon}>
          <Ionicons name={icon} size={18} color={Colors.peachDark} />
        </View>
        <Text style={[styles.settingsLabel, labelColor && { color: labelColor }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value ? (
          <Text style={styles.settingsValue}>{value}</Text>
        ) : null}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

function RowSep() {
  return (
    <View style={styles.rowSep} />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  // Hero
  hero: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroSettings: {
    alignSelf: 'flex-end',
    marginRight: Spacing.lg,
    marginBottom: Spacing.sm,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: {
    width: 88, height: 88,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  avatarImg: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: Colors.white,
    ...Shadow.card,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.peach,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  heroName: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  heroEmail: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  babyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.peachOverlay,
    borderWidth: 1,
    borderColor: Colors.peach,
  },
  babyPillText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.peachDark,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    ...Shadow.soft,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  statDivider: {
    width: 1, height: 28,
    backgroundColor: Colors.divider,
  },
  statPill: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.peachDark,
  },
  statLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  earnedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.peachOverlay,
    marginBottom: Spacing.md,
  },
  earnedBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // Badges
  badgesRow: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  badge: {
    width: 76,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 4,
    position: 'relative',
    ...Shadow.soft,
  },
  badgeLocked: { backgroundColor: Colors.warmGrey },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeLock: { position: 'absolute', top: 6, right: 6 },

  // Row group
  rowGroup: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingsIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  settingsValue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  rowSep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md + 34 + Spacing.sm,
  },

  // Language picker
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md + 34 + Spacing.sm,
    height: 48,
  },
  langOptionActive: { backgroundColor: Colors.peachOverlay },
  langOptionText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(217,79,79,0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217,79,79,0.3)',
  },
  errorBannerText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.danger,
  },

  // Delete sheet
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,8,4,0.45)',
    zIndex: 30,
  },
  deleteSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    zIndex: 40,
    ...Shadow.card,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  deleteSheetHeader: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  deleteIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(217,79,79,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.danger,
  },
  deleteBody: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  deletePassLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  deletePassInput: {
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sheetError: {
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  sheetErrorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.danger,
  },
  deleteConfirmBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteConfirmInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deleteConfirmText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
  deleteCancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  deleteCancelText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textMuted,
  },
});
