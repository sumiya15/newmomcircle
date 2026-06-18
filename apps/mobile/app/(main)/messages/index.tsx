/**
 * app/(main)/messages/index.tsx — Screen 11: Messages List
 *
 * Design:
 *   - Header: "Messages" + compose button (pencil icon, top-right)
 *   - Search bar to filter conversations by name
 *   - Conversation rows: avatar · name + online dot · last message preview ·
 *     relative timestamp · unread badge
 *   - Loading: 5 staggered skeleton rows
 *   - Empty state when no conversations or search yields nothing
 *   - Press row → Chat screen (Screen 12)
 *   - Swipe-right-to-delete hint via long-press context (future; row shows
 *     a delete affordance on long press for now)
 *
 * Data: mock conversations keyed by id; real-time would use a Supabase
 * realtime subscription on a `conversations` table (not yet wired).
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatDistanceToNowStrict } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { deterministicAvatar } from '../../../lib/unsplashImages';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean;
  isMine: boolean; // last message was sent by me
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participantId: 'u-priya',
    participantName: 'Priya Sharma',
    lastMessage: 'Oh wow, that latch trick actually worked!! Thank you so much 🙏',
    lastMessageAt: new Date(Date.now() - 4 * 60 * 1000),
    unreadCount: 2,
    isOnline: true,
    isMine: false,
  },
  {
    id: 'conv-2',
    participantId: 'u-ananya',
    participantName: 'Ananya Reddy',
    lastMessage: 'Did you try the Huckleberry schedule thing? We had our first 4hr stretch!',
    lastMessageAt: new Date(Date.now() - 38 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    isMine: false,
  },
  {
    id: 'conv-3',
    participantId: 'u-kavya',
    participantName: 'Kavya M.',
    lastMessage: 'Same! Sending you all the strength 💛',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMine: true,
  },
  {
    id: 'conv-4',
    participantId: 'u-meena',
    participantName: 'Meena Krishnan',
    lastMessage: 'Are you going to the Thursday meetup in Koramangala?',
    lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    unreadCount: 1,
    isOnline: false,
    isMine: false,
  },
  {
    id: 'conv-5',
    participantId: 'u-sruthi',
    participantName: 'Sruthi P.',
    lastMessage: 'She took a bottle! Finally 😭🎉',
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMine: false,
  },
  {
    id: 'conv-6',
    participantId: 'u-divya',
    participantName: 'Divya Nair',
    lastMessage: 'I\'ll share the recipe tomorrow, it\'s amazing for supply 🥛',
    lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMine: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shortTime(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: false })
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd');
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return CONVERSATIONS;
    const q = query.toLowerCase();
    return CONVERSATIONS.filter((c) =>
      c.participantName.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }, [query]);

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="messages-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', ...Motion.spring.bouncy }}
              style={styles.totalBadge}
            >
              <Text style={styles.totalBadgeText}>{totalUnread}</Text>
            </MotiView>
          )}
        </View>

        {/* Compose new message */}
        <Pressable
          testID="messages-compose-btn"
          style={({ pressed }) => [styles.composeBtn, pressed && styles.composeBtnPressed]}
          hitSlop={12}
          onPress={() => {/* TODO: new conversation picker */}}
        >
          <Ionicons name="create-outline" size={22} color={Colors.peachDark} />
        </Pressable>
      </View>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
        <TextInput
          testID="messages-search-input"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <AnimatePresence>
          {query.length > 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', ...Motion.spring.snappy }}
            >
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* ── List ── */}
      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={query ? 'No results' : 'No messages yet'}
          message={query
            ? 'Try a different name or keyword.'
            : 'Connect with another mama — start a conversation from her profile.'
          }
        />
      ) : (
        <FlatList
          testID="messages-list"
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={Separator}
          renderItem={({ item, index }) => (
            <ConversationRow
              conv={item}
              index={index}
              onPress={() => router.push({
                pathname: '/(main)/messages/[id]',
                params: {
                  id: item.id,
                  convJson: JSON.stringify(item),
                },
              })}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

interface RowProps {
  conv: Conversation;
  index: number;
  onPress: () => void;
}

function ConversationRow({ conv, index, onPress }: RowProps) {
  const avatar = deterministicAvatar(conv.participantId).url;
  const time   = shortTime(conv.lastMessageAt);
  const hasUnread = conv.unreadCount > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateX: -16 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base, delay: index * 55 }}
    >
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={onPress}
      >
        {/* Avatar + online dot */}
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={Colors.warmGrey}
            transition={200}
          />
          {conv.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text
              style={[styles.name, hasUnread && styles.nameUnread]}
              numberOfLines={1}
            >
              {conv.participantName}
            </Text>
            <Text style={[styles.time, hasUnread && styles.timeUnread]}>
              {time}
            </Text>
          </View>

          <View style={styles.rowBottom}>
            <Text
              style={[styles.preview, hasUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {conv.isMine ? `You: ${conv.lastMessage}` : conv.lastMessage}
            </Text>
            {hasUnread && (
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy }}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>{conv.unreadCount}</Text>
              </MotiView>
            )}
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

// ─── Skeleton list ────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <View style={styles.listContent}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.row, { opacity: 1 - i * 0.15 }]}
        >
          <SkeletonBlock width={52} height={52} borderRadius={26} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.rowTop}>
              <SkeletonBlock width="55%" height={13} borderRadius={Radius.sm} />
              <SkeletonBlock width={28} height={11} borderRadius={Radius.sm} />
            </View>
            <SkeletonBlock width="80%" height={11} borderRadius={Radius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  totalBadge: {
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBadgeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 11,
    color: Colors.white,
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.peachOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeBtnPressed: { transform: [{ scale: 0.93 }] },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Shadow.soft,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    padding: 0,
  },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'],
    gap: 0,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.offWhite,
  },
  rowPressed: {
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
  },

  avatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.sentimentPositive,
    borderWidth: 2,
    borderColor: Colors.offWhite,
  },

  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameUnread: {
    fontFamily: Typography.fontFamilySemiBold,
    color: Colors.textPrimary,
  },
  time: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  timeUnread: {
    color: Colors.peachDark,
    fontFamily: Typography.fontFamilyMedium,
  },

  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  preview: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  previewUnread: {
    fontFamily: Typography.fontFamilyMedium,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.peach,
    borderRadius: Radius.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 11,
    color: Colors.white,
  },

  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 52 + Spacing.md,
  },
});
