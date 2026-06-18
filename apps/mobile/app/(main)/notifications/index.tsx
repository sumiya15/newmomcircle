/**
 * app/(main)/notifications/index.tsx — Screen 21: Notifications
 *
 * Layout:
 *   - Header: back + "Notifications" + "Mark all read" button
 *   - Filter strip: All / Unread / Likes / Comments / Circles / System
 *   - SectionList grouped by Today / This Week / Older
 *   - NotificationRow: coloured left border when unread, actor avatar / type
 *     icon, rich text, relative time, optional Accept/Decline for invites
 *   - Swipe-left delete (long-press context menu on Android)
 *   - Skeleton loading · empty state
 *
 * Entry: notifications-outline bell in feed header (now wired up)
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, SectionList,
  ScrollView, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNowStrict, isToday, isThisWeek, subDays } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';
import { deterministicAvatar } from '../../../lib/unsplashImages';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | 'like' | 'comment' | 'circle_invite' | 'new_post'
  | 'milestone' | 'system' | 'event' | 'follow';

type NotifFilter = 'All' | 'Unread' | 'Likes' | 'Comments' | 'Circles' | 'System';

interface Notif {
  id: string;
  type: NotifType;
  read: boolean;
  createdAt: Date;
  actorName?: string;
  actorSeed?: string;
  text: string;
  preview?: string;
  actionable?: boolean;
  accepted?: boolean;
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string; bg: string;
  filter: NotifFilter;
}> = {
  like:          { icon: 'heart',                   color: '#D94F4F', bg: 'rgba(217,79,79,0.12)',    filter: 'Likes'    },
  comment:       { icon: 'chatbubble',               color: '#7B68C8', bg: 'rgba(123,104,200,0.12)', filter: 'Comments' },
  circle_invite: { icon: 'people',                   color: Colors.peachDark, bg: Colors.peachOverlay, filter: 'Circles' },
  new_post:      { icon: 'newspaper',                color: '#5CB87A', bg: 'rgba(92,184,122,0.12)',  filter: 'Circles'  },
  milestone:     { icon: 'trophy',                   color: '#F0B75B', bg: 'rgba(240,183,91,0.12)',  filter: 'System'   },
  system:        { icon: 'shield-checkmark',         color: Colors.textMuted, bg: Colors.warmGrey,   filter: 'System'   },
  event:         { icon: 'calendar',                 color: '#5CB87A', bg: 'rgba(92,184,122,0.12)',  filter: 'System'   },
  follow:        { icon: 'person-add',               color: Colors.peachDark, bg: Colors.peachOverlay, filter: 'Circles' },
};

const FILTERS: NotifFilter[] = ['All', 'Unread', 'Likes', 'Comments', 'Circles', 'System'];

// ─── Mock data ────────────────────────────────────────────────────────────────

const now = new Date();
const ago = (mins: number) => new Date(now.getTime() - mins * 60 * 1000);

const MOCK_NOTIFS: Notif[] = [
  {
    id: 'n1',  type: 'like',          read: false, createdAt: ago(2),
    actorName: 'Priya Sharma',        actorSeed: 'u1',
    text: 'Priya Sharma liked your post.',
    preview: '"Day 15 postpartum — finally managed a shower AND made chai 🎉"',
  },
  {
    id: 'n2',  type: 'comment',       read: false, createdAt: ago(15),
    actorName: 'Anita Reddy',         actorSeed: 'u2',
    text: 'Anita Reddy commented on your post.',
    preview: '"This is exactly what I needed to hear today 💕"',
  },
  {
    id: 'n3',  type: 'circle_invite', read: false, createdAt: ago(45),
    actorName: 'NewMomCircle',
    text: 'You\'ve been invited to join Bengaluru Moms.',
    preview: '238 members · Support & Community',
    actionable: true,
  },
  {
    id: 'n4',  type: 'event',         read: false, createdAt: ago(60 * 3),
    text: 'Reminder: New Moms Support Circle — Bandra starts in 1 hour.',
    preview: 'Saturday 10:30 AM · Bandra Community Hall',
  },
  {
    id: 'n5',  type: 'like',          read: true,  createdAt: ago(60 * 5),
    actorName: 'Maya Singh',          actorSeed: 'u3',
    text: 'Maya Singh liked your post.',
  },
  {
    id: 'n6',  type: 'comment',       read: true,  createdAt: ago(60 * 7),
    actorName: 'Dr. Sunita Patel',    actorSeed: 'u4',
    text: 'Dr. Sunita Patel replied to your comment.',
    preview: '"Growth spurts are so hard to spot at first!"',
  },
  {
    id: 'n7',  type: 'milestone',     read: true,  createdAt: ago(60 * 12),
    text: '🌟 You\'ve been a member for 4 weeks! Keep going.',
  },
  {
    id: 'n8',  type: 'new_post',      read: true,  createdAt: ago(60 * 18),
    text: '3 new posts in Postpartum Recovery circle.',
    preview: 'Priya, Deepa and 1 other posted',
  },
  {
    id: 'n9',  type: 'follow',        read: false, createdAt: ago(60 * 24 + 120),
    actorName: 'Dr. Priya Nair',      actorSeed: 'u5',
    text: 'Dr. Priya Nair is now following you.',
  },
  {
    id: 'n10', type: 'like',          read: true,  createdAt: ago(60 * 26),
    actorName: 'Deepa Ravi',          actorSeed: 'u6',
    text: 'Deepa Ravi liked your post.',
  },
  {
    id: 'n11', type: 'system',        read: true,  createdAt: ago(60 * 30),
    text: 'Your post was featured in Today\'s Highlights! 🎉',
  },
  {
    id: 'n12', type: 'comment',       read: true,  createdAt: subDays(now, 2),
    actorName: 'Anita Kapoor',        actorSeed: 'u7',
    text: 'Anita Kapoor commented on your post.',
    preview: '"So helpful, thank you so much!"',
  },
  {
    id: 'n13', type: 'circle_invite', read: true,  createdAt: subDays(now, 3),
    text: 'You joined Chennai New Moms. Welcome! 🌸',
    preview: '145 members · Chennai & surrounds',
    accepted: true,
  },
  {
    id: 'n14', type: 'milestone',     read: true,  createdAt: subDays(now, 5),
    text: '🌸 You shared your first post! The circle is with you.',
  },
  {
    id: 'n15', type: 'system',        read: true,  createdAt: subDays(now, 14),
    text: 'Welcome to NewMomCircle! We\'re so glad you\'re here. 🌸',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(d: Date): string {
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

function groupNotifs(list: Notif[]): { title: string; data: Notif[] }[] {
  const today:    Notif[] = [];
  const thisWeek: Notif[] = [];
  const older:    Notif[] = [];

  for (const n of list) {
    if (isToday(n.createdAt))          today.push(n);
    else if (isThisWeek(n.createdAt))  thisWeek.push(n);
    else                               older.push(n);
  }

  return [
    ...(today.length    ? [{ title: 'Today',     data: today    }] : []),
    ...(thisWeek.length ? [{ title: 'This Week',  data: thisWeek }] : []),
    ...(older.length    ? [{ title: 'Older',      data: older    }] : []),
  ];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [notifs,       setNotifs]      = useState<Notif[]>(MOCK_NOTIFS);
  const [filter,       setFilter]      = useState<NotifFilter>('All');
  const [loading,      setLoading]     = useState(false);
  const [dismissed,    setDismissed]   = useState<Set<string>>(new Set());

  const unreadCount = notifs.filter((n) => !n.read && !dismissed.has(n.id)).length;

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const handleAccept = (id: string) => {
    setNotifs((prev) => prev.map((n) =>
      n.id === id ? { ...n, read: true, accepted: true, actionable: false } : n
    ));
  };

  const handleDecline = (id: string) => dismiss(id);

  const visible = useMemo(() => {
    let list = notifs.filter((n) => !dismissed.has(n.id));
    switch (filter) {
      case 'Unread':   list = list.filter((n) => !n.read); break;
      case 'Likes':    list = list.filter((n) => n.type === 'like'); break;
      case 'Comments': list = list.filter((n) => n.type === 'comment'); break;
      case 'Circles':  list = list.filter((n) => ['circle_invite', 'new_post', 'follow'].includes(n.type)); break;
      case 'System':   list = list.filter((n) => ['milestone', 'system', 'event'].includes(n.type)); break;
    }
    return list;
  }, [notifs, filter, dismissed]);

  const sections = useMemo(() => groupNotifs(visible), [visible]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="notifications-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Pressable
          testID="notifications-mark-all-btn"
          style={styles.markAllBtn}
          onPress={markAllRead}
          disabled={unreadCount === 0}
        >
          <Text style={[
            styles.markAllText,
            unreadCount === 0 && { color: Colors.divider },
          ]}>
            Mark all read
          </Text>
        </Pressable>
      </View>

      {/* ── Filter tabs ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: Motion.duration.base }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = f === filter;
            const count  = f === 'Unread' ? unreadCount : 0;
            return (
              <Pressable
                key={f}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {f}
                </Text>
                {f === 'Unread' && count > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </MotiView>

      {/* ── Content ── */}
      {loading ? (
        <NotifSkeleton />
      ) : sections.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="All caught up!"
          subtitle={filter === 'Unread'
            ? 'No unread notifications.'
            : 'No notifications yet — stay active in circles to see updates here.'}
        />
      ) : (
        <SectionList
          testID="notifications-list"
          sections={sections}
          keyExtractor={(n) => n.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, index }) => (
            <AnimatePresence>
              {!dismissed.has(item.id) && (
                <MotiView
                  from={{ opacity: 0, translateX: -12 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    type: 'timing',
                    duration: Motion.duration.base,
                    delay: index * 30,
                  }}
                >
                  <NotifRow
                    notif={item}
                    onPress={() => markRead(item.id)}
                    onDismiss={() => dismiss(item.id)}
                    onAccept={() => handleAccept(item.id)}
                    onDecline={() => handleDecline(item.id)}
                  />
                </MotiView>
              )}
            </AnimatePresence>
          )}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        />
      )}
    </View>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif, onPress, onDismiss, onAccept, onDecline,
}: {
  notif: Notif;
  onPress: () => void;
  onDismiss: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const cfg      = TYPE_CONFIG[notif.type];
  const hasActor = !!notif.actorName && !!notif.actorSeed;
  const avatarUrl = notif.actorSeed
    ? deterministicAvatar(notif.actorSeed).url
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !notif.read && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      onLongPress={onDismiss}
    >
      {/* Unread indicator */}
      {!notif.read && <View style={styles.unreadBar} />}

      {/* Avatar / icon */}
      <View style={styles.rowLeft}>
        {hasActor && avatarUrl ? (
          <View style={styles.actorWrap}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.actorAvatar}
              contentFit="cover"
            />
            {/* Type icon badge over avatar */}
            <View style={[styles.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
              <Ionicons name={cfg.icon} size={9} color={cfg.color} />
            </View>
          </View>
        ) : (
          <View style={[styles.typeIconCircle, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          </View>
        )}
      </View>

      {/* Text */}
      <View style={styles.rowBody}>
        <Text style={[styles.notifText, !notif.read && styles.notifTextBold]}>
          {notif.text}
        </Text>
        {notif.preview && (
          <Text style={styles.notifPreview} numberOfLines={2}>
            {notif.preview}
          </Text>
        )}
        <Text style={styles.notifTime}>{relTime(notif.createdAt)}</Text>

        {/* Action buttons for circle invites */}
        {notif.actionable && !notif.accepted && (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.85 }]}
              onPress={onAccept}
            >
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.85 }]}
              onPress={onDecline}
            >
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
          </View>
        )}
        {notif.accepted && (
          <View style={styles.acceptedPill}>
            <Ionicons name="checkmark" size={11} color={Colors.success} />
            <Text style={styles.acceptedPillText}>Joined</Text>
          </View>
        )}
      </View>

      {/* Dismiss button */}
      <Pressable style={styles.dismissBtn} onPress={onDismiss} hitSlop={10}>
        <Ionicons name="close" size={14} color={Colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonBlock width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="80%" height={13} radius={4} />
            <SkeletonBlock width="55%" height={11} radius={4} />
          </View>
        </View>
      ))}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.white,
  },
  markAllBtn: { paddingHorizontal: 4 },
  markAllText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // Filters
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  filterChipActive: { backgroundColor: Colors.peach, borderColor: Colors.peach },
  filterLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  filterLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },
  filterBadge: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 9,
    color: Colors.peachDark,
  },

  // Section header
  sectionHeader: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: Spacing.md,
    gap: Spacing.sm,
    position: 'relative',
  },
  rowUnread: { backgroundColor: 'rgba(255,159,124,0.06)' },
  rowPressed: { backgroundColor: Colors.warmGrey },
  rowSep: { height: 1, backgroundColor: Colors.divider, marginLeft: Spacing.lg + 44 + Spacing.sm },

  unreadBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.peach,
  },

  // Actor avatar
  rowLeft: { flexShrink: 0 },
  actorWrap: { width: 44, height: 44, position: 'relative' },
  actorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: Colors.white,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  typeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  // Text
  rowBody: { flex: 1, gap: 2 },
  notifText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  notifTextBold: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.textPrimary,
  },
  notifPreview: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  notifTime: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  acceptBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    ...Shadow.button,
  },
  acceptBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },
  declineBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  declineBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  acceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  acceptedPillText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.success,
  },

  // Dismiss button
  dismissBtn: {
    padding: 4,
    marginTop: 2,
    flexShrink: 0,
  },

  // Skeleton
  skeletonWrap: { padding: Spacing.lg, gap: Spacing.md },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
});
