/**
 * app/(main)/tracker/index.tsx — Screen 13: Baby Tracker Dashboard
 *
 * Design:
 *   - Header: baby name · today's date · ← / → day navigation
 *   - 4 stat summary tiles: Feeds · Sleep · Diapers · Last logged
 *   - Vertical timeline: chronological entries for the selected day
 *     each entry: coloured icon ring · type label · time · detail
 *   - Empty state for days with no logs
 *   - Skeleton loading on first mount
 *   - "+" FAB → log-entry sheet slides up from the bottom (Screen 14,
 *     embedded here as LogSheet so it can share local state without a
 *     separate route)
 *
 * Screen 14 — Log Entry Sheet is the bottom-sheet modal in this file:
 *   - Drag handle + animated slide-up (Reanimated translateY spring)
 *   - Type grid: Feed · Sleep · Diaper · Pump · Weight · Meds
 *   - Context fields change per type (side, amount, duration, diaperType…)
 *   - Simple hour : minute spinner (tap +/- to adjust time)
 *   - Notes field
 *   - Save closes the sheet and inserts the entry into the timeline
 */

import React, {
  useCallback, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  FlatList, TextInput, Dimensions, StatusBar,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, addDays, isToday, isSameDay } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.72;

// ─── Types ────────────────────────────────────────────────────────────────────

type EntryType = 'feed' | 'sleep' | 'diaper' | 'pump' | 'weight' | 'meds';
type Side      = 'left' | 'right' | 'both';
type DiaperT   = 'wet' | 'dirty' | 'both';

interface TrackerEntry {
  id: string;
  type: EntryType;
  startTime: Date;
  duration?: number;   // minutes
  amount?: number;     // ml
  side?: Side;
  diaperType?: DiaperT;
  notes?: string;
}

// ─── Entry type metadata ──────────────────────────────────────────────────────

const TYPE_META: Record<EntryType, {
  label: string; icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string;
}> = {
  feed:   { label: 'Feed',   icon: 'nutrition-outline',      color: '#E8734A', bg: 'rgba(232,115,74,0.12)'   },
  sleep:  { label: 'Sleep',  icon: 'moon-outline',           color: '#7B68C8', bg: 'rgba(123,104,200,0.12)'  },
  diaper: { label: 'Diaper', icon: 'water-outline',          color: '#5CB87A', bg: 'rgba(92,184,122,0.12)'   },
  pump:   { label: 'Pump',   icon: 'pulse-outline',          color: '#FF9F7C', bg: 'rgba(255,159,124,0.12)'  },
  weight: { label: 'Weight', icon: 'scale-outline',          color: '#F0B75B', bg: 'rgba(240,183,91,0.12)'   },
  meds:   { label: 'Meds',   icon: 'medical-outline',        color: '#D94F4F', bg: 'rgba(217,79,79,0.12)'    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2);

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function entryDetail(e: TrackerEntry): string {
  switch (e.type) {
    case 'feed': {
      const parts: string[] = [];
      if (e.amount)   parts.push(`${e.amount} ml`);
      if (e.side)     parts.push(e.side);
      if (e.duration) parts.push(fmtDuration(e.duration));
      return parts.join(' · ') || '—';
    }
    case 'sleep':
      return e.duration ? fmtDuration(e.duration) : '—';
    case 'diaper':
      return e.diaperType ? e.diaperType.charAt(0).toUpperCase() + e.diaperType.slice(1) : '—';
    case 'pump':
      return e.amount ? `${e.amount} ml${e.side ? ` · ${e.side}` : ''}` : '—';
    case 'weight':
      return e.amount ? `${e.amount} kg` : '—';
    case 'meds':
      return e.notes ?? '—';
    default:
      return '—';
  }
}

// ─── Mock seed data for today ─────────────────────────────────────────────────

function seedToday(): TrackerEntry[] {
  const now = new Date();
  const t = (hoursAgo: number): Date =>
    new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  return [
    { id: uid(), type: 'sleep',  startTime: t(8.5), duration: 120 },
    { id: uid(), type: 'feed',   startTime: t(6.2), amount: 90,  side: 'left',  duration: 18 },
    { id: uid(), type: 'diaper', startTime: t(5.8), diaperType: 'wet' },
    { id: uid(), type: 'sleep',  startTime: t(4.5), duration: 90 },
    { id: uid(), type: 'feed',   startTime: t(3.1), amount: 110, side: 'right', duration: 22 },
    { id: uid(), type: 'diaper', startTime: t(2.9), diaperType: 'both' },
    { id: uid(), type: 'pump',   startTime: t(2.0), amount: 60,  side: 'left' },
    { id: uid(), type: 'feed',   startTime: t(0.8), amount: 95,  side: 'left',  duration: 20 },
  ];
}

// ─── Summary tiles ────────────────────────────────────────────────────────────

function computeSummary(entries: TrackerEntry[]) {
  const feeds   = entries.filter((e) => e.type === 'feed');
  const sleeps  = entries.filter((e) => e.type === 'sleep');
  const diapers = entries.filter((e) => e.type === 'diaper');
  const last    = entries.reduce<TrackerEntry | null>(
    (a, b) => (!a || b.startTime > a.startTime ? b : a), null
  );
  return {
    feedCount:    feeds.length,
    sleepTotal:   sleeps.reduce((s, e) => s + (e.duration ?? 0), 0),
    diaperCount:  diapers.length,
    lastEntry:    last,
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentDay, setCurrentDay] = useState(new Date());
  const [allEntries, setAllEntries] = useState<TrackerEntry[]>(seedToday);
  const [loading,    setLoading]    = useState(false);
  const [sheetOpen,  setSheetOpen]  = useState(false);

  // Filter entries for the selected day
  const dayEntries = useMemo(
    () => allEntries
      .filter((e) => isSameDay(e.startTime, currentDay))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
    [allEntries, currentDay],
  );

  const summary = useMemo(() => computeSummary(dayEntries), [dayEntries]);

  const goDay = (delta: 1 | -1) => setCurrentDay((d) => addDays(d, delta));

  const addEntry = useCallback((entry: TrackerEntry) => {
    setAllEntries((prev) => [...prev, entry]);
    setSheetOpen(false);
  }, []);

  const isCurrentDay = isToday(currentDay);
  const dayLabel = isCurrentDay ? 'Today' : format(currentDay, 'EEE d MMM');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="tracker-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View testID="tracker-header" style={styles.header}>
        <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Baby Tracker</Text>
          <View style={styles.dateNav}>
            <Pressable onPress={() => goDay(-1)} hitSlop={12} style={styles.dateNavBtn}>
              <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
            </Pressable>
            <Text style={styles.dateLabel}>{dayLabel}</Text>
            <Pressable
              onPress={() => goDay(1)}
              hitSlop={12}
              style={styles.dateNavBtn}
              disabled={isCurrentDay}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={isCurrentDay ? Colors.divider : Colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Settings stub */}
        <Pressable style={styles.headerSettings} hitSlop={12}>
          <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          testID="tracker-log-list"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Summary tiles ── */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 60 }}
          >
            <View testID="tracker-today-summary" style={styles.tilesRow}>
              <SummaryTile
                icon="nutrition-outline"
                color={TYPE_META.feed.color}
                bg={TYPE_META.feed.bg}
                label="Feeds"
                value={String(summary.feedCount)}
                sub="today"
              />
              <SummaryTile
                icon="moon-outline"
                color={TYPE_META.sleep.color}
                bg={TYPE_META.sleep.bg}
                label="Sleep"
                value={summary.sleepTotal > 0 ? fmtDuration(summary.sleepTotal) : '—'}
                sub="total"
              />
            </View>
            <View style={styles.tilesRow}>
              <SummaryTile
                icon="water-outline"
                color={TYPE_META.diaper.color}
                bg={TYPE_META.diaper.bg}
                label="Diapers"
                value={String(summary.diaperCount)}
                sub="today"
              />
              <SummaryTile
                icon="time-outline"
                color={Colors.textMuted}
                bg={Colors.warmGrey}
                label="Last log"
                value={summary.lastEntry
                  ? format(summary.lastEntry.startTime, 'HH:mm')
                  : '—'}
                sub={summary.lastEntry ? TYPE_META[summary.lastEntry.type].label : 'none yet'}
              />
            </View>
          </MotiView>

          {/* ── Section header ── */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: Motion.duration.base, delay: 120 }}
            style={styles.sectionHeaderRow}
          >
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.sectionCount}>{dayEntries.length} entries</Text>
          </MotiView>

          {/* ── Timeline ── */}
          {dayEntries.length === 0 ? (
            <EmptyState
              emoji="📋"
              title={isCurrentDay ? 'Nothing logged yet' : 'No entries this day'}
              subtitle={isCurrentDay
                ? 'Tap + to log a feed, sleep, diaper, or more.'
                : 'Use the arrows to navigate to a day with entries.'}
            />
          ) : (
            <View style={styles.timeline}>
              {dayEntries.map((entry, index) => (
                <TimelineEntry
                  key={entry.id}
                  entry={entry}
                  index={index}
                  isLast={index === dayEntries.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Log FAB ── */}
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', ...Motion.spring.bouncy, delay: 300 }}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
      >
        <Pressable
          testID="tracker-fab-btn"
          style={({ pressed }) => [styles.fabBtn, pressed && styles.fabBtnPressed]}
          onPress={() => setSheetOpen(true)}
        >
          <Ionicons name="add" size={30} color={Colors.white} />
        </Pressable>
      </MotiView>

      {/* ── Log Entry Sheet (Screen 14) ── */}
      <LogSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={addEntry}
        defaultDay={currentDay}
      />
    </View>
  );
}

// ─── Summary tile ─────────────────────────────────────────────────────────────

interface TileProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string; bg: string;
  label: string; value: string; sub: string;
}

function SummaryTile({ icon, color, bg, label, value, sub }: TileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </View>
  );
}

// ─── Timeline entry row ───────────────────────────────────────────────────────

function TimelineEntry({
  entry, index, isLast,
}: { entry: TrackerEntry; index: number; isLast: boolean }) {
  const meta = TYPE_META[entry.type];
  const detail = entryDetail(entry);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 50 }}
      style={styles.timelineRow}
    >
      {/* Vertical connector line */}
      <View style={styles.timelineLeft}>
        <View style={[styles.timelineDot, { backgroundColor: meta.bg, borderColor: meta.color }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Entry card */}
      <View testID="tracker-entry-card" style={styles.timelineCard}>
        <View style={styles.timelineCardTop}>
          <Text style={styles.timelineType}>{meta.label}</Text>
          <Text style={styles.timelineTime}>{format(entry.startTime, 'HH:mm')}</Text>
        </View>
        <Text style={styles.timelineDetail}>{detail}</Text>
        {entry.notes ? (
          <Text style={styles.timelineNotes}>{entry.notes}</Text>
        ) : null}
      </View>
    </MotiView>
  );
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <View style={styles.scroll}>
      <View style={styles.tilesRow}>
        <View style={styles.tile}><SkeletonBlock width="100%" height={90} radius={Radius.lg} /></View>
        <View style={styles.tile}><SkeletonBlock width="100%" height={90} radius={Radius.lg} /></View>
      </View>
      <View style={styles.tilesRow}>
        <View style={styles.tile}><SkeletonBlock width="100%" height={90} radius={Radius.lg} /></View>
        <View style={styles.tile}><SkeletonBlock width="100%" height={90} radius={Radius.lg} /></View>
      </View>
      <View style={{ gap: Spacing.md, marginTop: Spacing.xl, paddingHorizontal: Spacing.lg }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} width="100%" height={64} radius={Radius.lg} />
        ))}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Screen 14 — Log Entry Sheet
// ═══════════════════════════════════════════════════════════════════════════════

interface LogSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: TrackerEntry) => void;
  defaultDay: Date;
}

const TYPE_ORDER: EntryType[] = ['feed', 'sleep', 'diaper', 'pump', 'weight', 'meds'];

function LogSheet({ open, onClose, onSave, defaultDay }: LogSheetProps) {
  const insets = useSafeAreaInsets();

  // Sheet animation — translateY: SHEET_H (hidden) → 0 (visible)
  const translateY = useSharedValue(SHEET_H);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  React.useEffect(() => {
    translateY.value = open
      ? withSpring(0, { damping: 22, stiffness: 300 })
      : withTiming(SHEET_H, { duration: Motion.duration.base });
  }, [open]);

  // Form state
  const [type,      setType]      = useState<EntryType>('feed');
  const [hour,      setHour]      = useState(() => new Date().getHours());
  const [minute,    setMinute]    = useState(() => Math.floor(new Date().getMinutes() / 5) * 5);
  const [amount,    setAmount]    = useState('');
  const [duration,  setDuration]  = useState('');
  const [side,      setSide]      = useState<Side>('left');
  const [diaperT,   setDiaperT]   = useState<DiaperT>('wet');
  const [notes,     setNotes]     = useState('');

  const reset = () => {
    setType('feed'); setAmount(''); setDuration(''); setSide('left');
    setDiaperT('wet'); setNotes('');
    const now = new Date();
    setHour(now.getHours()); setMinute(Math.floor(now.getMinutes() / 5) * 5);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = () => {
    const startTime = new Date(defaultDay);
    startTime.setHours(hour, minute, 0, 0);
    const entry: TrackerEntry = {
      id:        uid(),
      type,
      startTime,
      duration:  duration  ? parseInt(duration,  10) : undefined,
      amount:    amount    ? parseFloat(amount)      : undefined,
      side:      (type === 'feed' || type === 'pump') ? side : undefined,
      diaperType: type === 'diaper' ? diaperT : undefined,
      notes:     notes.trim() || undefined,
    };
    onSave(entry);
    reset();
  };

  if (!open) return null;

  const meta = TYPE_META[type];

  return (
    <>
      {/* Scrim */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ type: 'timing', duration: Motion.duration.base }}
          style={[StyleSheet.absoluteFill, styles.scrim]}
        />
      </Pressable>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.sheetScroll,
              { paddingBottom: Math.max(insets.bottom, Spacing.xl) + 80 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Drag handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Text style={styles.sheetCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Log Entry</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetSaveBtn,
                  pressed && styles.sheetSaveBtnPressed,
                ]}
                onPress={handleSave}
              >
                <Text style={styles.sheetSaveBtnText}>Save</Text>
              </Pressable>
            </View>

            {/* ── Type grid ── */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeGrid}>
              {TYPE_ORDER.map((t) => {
                const m = TYPE_META[t];
                const active = type === t;
                return (
                  <Pressable
                    key={t}
                    testID={`tracker-log-${t}-btn`}
                    style={({ pressed }) => [
                      styles.typeCell,
                      active && { borderColor: m.color, backgroundColor: m.bg },
                      pressed && styles.typeCellPressed,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <View style={[
                      styles.typeCellIcon,
                      { backgroundColor: active ? m.bg : Colors.warmGrey },
                    ]}>
                      <Ionicons name={m.icon} size={20} color={active ? m.color : Colors.textMuted} />
                    </View>
                    <Text style={[
                      styles.typeCellLabel,
                      active && { color: m.color, fontFamily: Typography.fontFamilySemiBold },
                    ]}>
                      {m.label}
                    </Text>
                    {active && (
                      <MotiView
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', ...Motion.spring.bouncy }}
                        style={[styles.typeCellCheck, { backgroundColor: m.color }]}
                      >
                        <Ionicons name="checkmark" size={10} color={Colors.white} />
                      </MotiView>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* ── Time picker ── */}
            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.timePicker}>
              <TimeSpinner
                value={hour}
                min={0} max={23}
                onChange={setHour}
                format={(v) => String(v).padStart(2, '0')}
              />
              <Text style={styles.timeColon}>:</Text>
              <TimeSpinner
                value={minute}
                min={0} max={55}
                step={5}
                onChange={setMinute}
                format={(v) => String(v).padStart(2, '0')}
              />
            </View>

            {/* ── Context fields ── */}
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={type}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: Motion.duration.fast }}
              >
                {(type === 'feed' || type === 'pump') && (
                  <>
                    <Text style={styles.fieldLabel}>
                      {type === 'feed' ? 'Amount (ml)' : 'Pumped (ml)'}
                    </Text>
                    <TextInput
                      testID="tracker-amount-input"
                      style={styles.numericInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                      placeholder="e.g. 90"
                      placeholderTextColor={Colors.textMuted}
                    />

                    <Text style={styles.fieldLabel}>Side</Text>
                    <SegmentControl
                      options={['left', 'right', 'both'] as Side[]}
                      value={side}
                      onChange={setSide}
                      labels={{ left: 'Left', right: 'Right', both: 'Both' }}
                      activeColor={meta.color}
                    />
                  </>
                )}

                {type === 'feed' && (
                  <>
                    <Text style={styles.fieldLabel}>Duration (min)</Text>
                    <TextInput
                      testID="tracker-amount-input"
                      style={styles.numericInput}
                      value={duration}
                      onChangeText={setDuration}
                      keyboardType="numeric"
                      placeholder="e.g. 20"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </>
                )}

                {type === 'sleep' && (
                  <>
                    <Text style={styles.fieldLabel}>Duration (min)</Text>
                    <TextInput
                      testID="tracker-amount-input"
                      style={styles.numericInput}
                      value={duration}
                      onChangeText={setDuration}
                      keyboardType="numeric"
                      placeholder="e.g. 90"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </>
                )}

                {type === 'diaper' && (
                  <>
                    <Text style={styles.fieldLabel}>Type</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(['wet', 'dirty', 'both'] as DiaperT[]).map((dt) => (
                        <Pressable
                          key={dt}
                          testID={`tracker-diaper-type-${dt}`}
                          onPress={() => setDiaperT(dt)}
                          style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: diaperT === dt ? meta.color : Colors.warmGrey, alignItems: 'center' }}
                        >
                          <Text style={{ color: diaperT === dt ? Colors.white : Colors.textSecondary, fontSize: 12 }}>
                            {{ wet: 'Wet 💧', dirty: 'Dirty 💩', both: 'Both' }[dt]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {type === 'weight' && (
                  <>
                    <Text style={styles.fieldLabel}>Weight (kg)</Text>
                    <TextInput
                      style={styles.numericInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 4.2"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </>
                )}

                {type === 'meds' && (
                  <>
                    <Text style={styles.fieldLabel}>Medication & dose</Text>
                    <TextInput
                      style={styles.numericInput}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="e.g. Vitamin D 400 IU"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </>
                )}
              </MotiView>
            </AnimatePresence>

            {/* ── Notes (all types except meds where it's the primary field) ── */}
            {type !== 'meds' && (
              <>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  testID="tracker-notes-input"
                  style={[styles.numericInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any observations..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </>
            )}
          </ScrollView>

          {/* Sticky save bar */}
          <View style={[styles.sheetSaveBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
            <Pressable
              testID="tracker-save-btn"
              style={({ pressed }) => [styles.sheetSaveBarBtn, pressed && { opacity: 0.85 }]}
              onPress={handleSave}
            >
              <View style={[styles.sheetSaveBarInner, { backgroundColor: meta.color }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.sheetSaveBarText}>Save {meta.label}</Text>
              </View>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

// ─── Time spinner ─────────────────────────────────────────────────────────────

interface SpinnerProps {
  value: number;
  min: number; max: number; step?: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}

function TimeSpinner({ value, min, max, step = 1, onChange, format: fmt }: SpinnerProps) {
  const inc = () => onChange(value + step > max ? min : value + step);
  const dec = () => onChange(value - step < min ? max : value - step);

  return (
    <View style={styles.spinner}>
      <Pressable onPress={inc} hitSlop={10} style={styles.spinnerBtn}>
        <Ionicons name="chevron-up" size={18} color={Colors.peachDark} />
      </Pressable>
      <Text style={styles.spinnerValue}>{fmt(value)}</Text>
      <Pressable onPress={dec} hitSlop={10} style={styles.spinnerBtn}>
        <Ionicons name="chevron-down" size={18} color={Colors.peachDark} />
      </Pressable>
    </View>
  );
}

// ─── Segment control ──────────────────────────────────────────────────────────

interface SegProps<T extends string> {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  activeColor: string;
}

function SegmentControl<T extends string>({
  options, value, onChange, labels, activeColor,
}: SegProps<T>) {
  return (
    <View style={styles.segControl}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            style={({ pressed }) => [
              styles.segOption,
              active && { borderColor: activeColor, backgroundColor: `${activeColor}18` },
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => onChange(opt)}
          >
            <Text style={[
              styles.segOptionLabel,
              active && { color: activeColor, fontFamily: Typography.fontFamilySemiBold },
            ]}>
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
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
    gap: Spacing.sm,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateNavBtn: { padding: 4 },
  dateLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    minWidth: 90,
    textAlign: 'center',
  },
  headerSettings: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  // Summary tiles
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 4,
    ...Shadow.soft,
  },
  tileIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  tileLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tileValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  tileSub: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Timeline
  timeline: { gap: 0 },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 36,
  },
  timelineDot: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: Colors.divider,
    marginTop: 2,
    marginBottom: 2,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  timelineCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineType: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  timelineTime: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  timelineDetail: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  timelineNotes: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 20,
  },
  fabBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.peach,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.button,
  },
  fabBtnPressed: { transform: [{ scale: 0.93 }] },

  // ── Log Sheet ──────────────────────────────────────────────────────────────

  scrim: { backgroundColor: 'rgba(20,8,4,0.45)' },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    ...Shadow.card,
    zIndex: 30,
  },
  sheetScroll: { paddingHorizontal: Spacing.lg },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sheetCancel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  sheetTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  sheetSaveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
  },
  sheetSaveBtnPressed: { opacity: 0.85 },
  sheetSaveBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
  },

  fieldLabel: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Type grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeCell: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.offWhite,
    gap: 6,
    position: 'relative',
  },
  typeCellPressed: { transform: [{ scale: 0.96 }] },
  typeCellIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  typeCellLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  typeCellCheck: {
    position: 'absolute',
    top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // Time picker
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
  },
  timeColon: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },

  // Spinners
  spinner: { alignItems: 'center', gap: 4 },
  spinnerBtn: {
    width: 40, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    ...Shadow.soft,
  },
  spinnerValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    minWidth: 52,
    textAlign: 'center',
  },

  // Inputs
  numericInput: {
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },

  // Segment control
  segControl: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  segOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.offWhite,
    alignItems: 'center',
  },
  segOptionLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Sheet save bar
  sheetSaveBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  sheetSaveBarBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.button,
  },
  sheetSaveBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.full,
  },
  sheetSaveBarText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
});
