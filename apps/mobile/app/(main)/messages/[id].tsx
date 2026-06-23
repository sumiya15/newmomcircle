/**
 * app/(main)/messages/[id].tsx — Screen 12: Chat Screen
 *
 * Design:
 *   - Header: back · recipient avatar + name + online dot · call/video icons
 *   - Inverted FlatList of message bubbles (newest at bottom)
 *   - Own messages: right-aligned, peach gradient, white text
 *   - Other's messages: left-aligned, white card, dark text + avatar
 *   - Date separators between message groups (e.g. "Today", "Yesterday")
 *   - Delivery ticks: ✓ sent, ✓✓ delivered, ✓✓(blue) read
 *   - Typing indicator: animated 3-dot pulse when the other user is "typing"
 *   - Input bar: emoji stub · expanding TextInput · image picker · send button
 *   - Send button springs in when text is non-empty (AnimatePresence)
 *   - Long-press a message to see reaction picker (heart, 👍, 😂, 😢, 🙌)
 *   - Keyboard-aware on both platforms
 *
 * Data: seeded with rich mock messages; real-time would listen on Supabase.
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  TextInput, KeyboardAvoidingView, Platform,
  StatusBar, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

import { useAuthStore } from '../../../store/authStore';
import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import { deterministicAvatar } from '../../../lib/unsplashImages';

const { width: W } = Dimensions.get('window');
const BUBBLE_MAX_W = W * 0.72;

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  sentAt: Date;
  status: DeliveryStatus;
  reactions?: string[];
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  isOnline: boolean;
}

// ─── Reaction options ─────────────────────────────────────────────────────────

const REACTIONS = ['❤️', '👍', '😂', '😢', '🙌', '🔥'];

// ─── Mock seed messages ───────────────────────────────────────────────────────

function buildMockMessages(meId: string, otherId: string): Message[] {
  const now = new Date();
  const m = (id: string, senderId: string, text: string, minsAgo: number, status: DeliveryStatus = 'read'): Message => ({
    id,
    senderId,
    text,
    sentAt: new Date(now.getTime() - minsAgo * 60 * 1000),
    status,
  });

  return [
    m('m1',  otherId, "Hey! I saw your post about the 4-month sleep regression. We're right in it 😩", 95, 'read'),
    m('m2',  meId,    "Oh no! It's brutal isn't it? How long has it been going on?", 92, 'read'),
    m('m3',  otherId, "Almost 3 weeks now. She was sleeping 5hr stretches before and now it's every 90 mins", 90, 'read'),
    m('m4',  meId,    "I feel you. We went through that at 4.5 months. The Huckleberry app helped us get on a consistent schedule", 85, 'read'),
    m('m5',  otherId, "I've heard of that! Does it actually work?", 83, 'read'),
    m('m6',  meId,    "For us it did! The key was making sure wake windows weren't too long. At 4mo it's about 1.5-2hr max", 80, 'read'),
    m('m7',  meId,    "Also - blackout curtains + white noise machine were game changers 🙌", 78, 'read'),
    m('m8',  otherId, "We already have white noise. Haven't tried the curtains yet. Maybe that's worth a try", 60, 'read'),
    m('m9',  otherId, "Also did you find the regression just... resolved on its own eventually?", 58, 'read'),
    m('m10', meId,    "Yes! Around 5.5 months she just started consolidating again. Hang in there, you're so close 💛", 55, 'read'),
    m('m11', otherId, "That is the most reassuring thing I've heard all week", 40, 'read'),
    m('m12', otherId, "Oh wow, that latch trick actually worked!! Thank you so much 🙏", 4, 'delivered'),
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateSeparatorLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, d MMM');
}

function DeliveryIcon({ status }: { status: DeliveryStatus }) {
  if (status === 'sending') {
    return <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.6)" />;
  }
  if (status === 'sent') {
    return <Ionicons name="checkmark-outline" size={12} color="rgba(255,255,255,0.7)" />;
  }
  if (status === 'delivered') {
    return <Ionicons name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.7)" />;
  }
  // read
  return <Ionicons name="checkmark-done" size={12} color={Colors.peachLight} />;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const user    = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const params = useLocalSearchParams<{ id: string; convJson: string }>();
  const conv: Conversation = params.convJson
    ? JSON.parse(params.convJson)
    : { id: params.id, participantId: 'unknown', participantName: 'Unknown', isOnline: false };

  const meId    = user?.id ?? 'me';
  const otherId = conv.participantId;

  const [messages,      setMessages]      = useState<Message[]>(() => buildMockMessages(meId, otherId));
  const [inputText,     setInputText]     = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null); // message id
  const listRef = useRef<FlatList>(null);

  // Simulate the other person typing after 8 seconds
  useEffect(() => {
    const t1 = setTimeout(() => setIsTyping(true),  8000);
    const t2 = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          senderId: otherId,
          text: 'Did you end up trying the blackout curtains?',
          sentAt: new Date(),
          status: 'delivered',
        },
      ]);
    }, 12000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [otherId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: meId,
      text,
      sentAt: new Date(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, newMsg]);
    // Simulate sent → delivered after 1.5s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'sent' } : m)
      );
    }, 800);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'delivered' } : m)
      );
    }, 1500);
  }, [inputText, meId]);

  const handleReact = useCallback((msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, reactions: [...(m.reactions ?? []), emoji] }
          : m
      )
    );
    setActiveReaction(null);
  }, []);

  // Build items with date separators injected
  const listItems = useMemo(() => {
    const result: Array<Message | { type: 'separator'; label: string; id: string }> = [];
    let lastDate: Date | null = null;
    for (const msg of messages) {
      if (!lastDate || !isSameDay(lastDate, msg.sentAt)) {
        result.push({ type: 'separator', label: dateSeparatorLabel(msg.sentAt), id: `sep-${msg.id}` });
        lastDate = msg.sentAt;
      }
      result.push(msg);
    }
    return result;
  }, [messages]);

  const otherAvatar = deterministicAvatar(otherId).url;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="chat-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View testID="chat-header" style={styles.header}>
        <Pressable testID="chat-back-btn" style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>

        {/* Recipient info */}
        <Pressable style={styles.recipientRow} hitSlop={8}>
          <View style={styles.recipientAvatarWrap}>
            <Image
              source={{ uri: otherAvatar }}
              style={styles.recipientAvatar}
              contentFit="cover"
              placeholder={Colors.warmGrey}
              transition={200}
            />
            {conv.isOnline && <View style={styles.onlineDot} />}
          </View>
          <View>
            <Text style={styles.recipientName}>{conv.participantName}</Text>
            <Text style={styles.recipientStatus}>
              {conv.isOnline ? 'Active now' : 'Offline'}
            </Text>
          </View>
        </Pressable>

        {/* Action icons */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIconBtn} hitSlop={10}>
            <Ionicons name="call-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.headerIconBtn} hitSlop={10}>
            <Ionicons name="videocam-outline" size={22} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        {/* ── Message list ── */}
        <FlatList
          testID="chat-messages-list"
          ref={listRef}
          data={listItems}
          keyExtractor={(item) => ('type' in item ? item.id : item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if ('type' in item) {
              return <DateSeparator label={item.label} />;
            }
            const isMe = item.senderId === meId;
            return (
              <MessageBubble
                message={item}
                isMe={isMe}
                otherAvatar={otherAvatar}
                showAvatar={
                  !isMe &&
                  (index === listItems.length - 1 ||
                    ('senderId' in listItems[index + 1]! &&
                      (listItems[index + 1] as Message).senderId !== item.senderId))
                }
                isReacting={activeReaction === item.id}
                onLongPress={() => setActiveReaction(activeReaction === item.id ? null : item.id)}
                onReact={(emoji) => handleReact(item.id, emoji)}
              />
            );
          }}
          ListFooterComponent={
            isTyping ? (
              <TypingIndicator avatar={otherAvatar} />
            ) : null
          }
        />

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
          {/* Emoji stub */}
          <Pressable style={styles.inputIconBtn} hitSlop={10}>
            <Ionicons name="happy-outline" size={22} color={Colors.textMuted} />
          </Pressable>

          {/* Text input */}
          <TextInput
            testID="chat-input"
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
            returnKeyType="default"
            onSubmitEditing={Platform.OS === 'ios' ? undefined : handleSend}
          />

          <AnimatePresence exitBeforeEnter>
            {inputText.trim().length > 0 ? (
              /* Send button */
              <MotiView
                key="send"
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy }}
              >
                <Pressable
                  testID="chat-send-btn"
                  style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
                  onPress={handleSend}
                >
                  <LinearGradient
                    colors={[Colors.peach, Colors.peachDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendBtnGrad}
                  >
                    <Ionicons name="arrow-up" size={18} color={Colors.white} />
                  </LinearGradient>
                </Pressable>
              </MotiView>
            ) : (
              /* Image picker (shown when idle) */
              <MotiView
                key="image"
                from={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', ...Motion.spring.snappy }}
              >
                <Pressable style={styles.inputIconBtn} hitSlop={10}>
                  <Ionicons name="image-outline" size={22} color={Colors.textMuted} />
                </Pressable>
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateSep}>
      <View style={styles.dateSepLine} />
      <Text style={styles.dateSepLabel}>{label}</Text>
      <View style={styles.dateSepLine} />
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ avatar }: { avatar: string }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
      style={styles.typingWrap}
    >
      <Image
        source={{ uri: avatar }}
        style={styles.typingAvatar}
        contentFit="cover"
        placeholder={Colors.warmGrey}
        transition={200}
      />
      <View style={styles.typingBubble}>
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ translateY: 0 }}
            animate={{ translateY: -4 }}
            transition={{
              loop: true,
              type: 'timing',
              duration: 400,
              delay: i * 120,
              repeatReverse: true,
            }}
            style={styles.typingDot}
          />
        ))}
      </View>
    </MotiView>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  message: Message;
  isMe: boolean;
  otherAvatar: string;
  showAvatar: boolean;
  isReacting: boolean;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
}

function MessageBubble({
  message, isMe, otherAvatar, showAvatar, isReacting, onLongPress, onReact,
}: BubbleProps) {
  const timeLabel = format(message.sentAt, 'HH:mm');
  const isLastMsg = message.status === 'delivered' || message.status === 'read';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 6, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', ...Motion.spring.gentle }}
      style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}
    >
      {/* Other user avatar (shown on last message in group) */}
      {!isMe && (
        <View style={styles.bubbleAvatarSlot}>
          {showAvatar ? (
            <Image
              source={{ uri: otherAvatar }}
              style={styles.bubbleAvatar}
              contentFit="cover"
              placeholder={Colors.warmGrey}
              transition={150}
            />
          ) : (
            <View style={styles.bubbleAvatarSlot} />
          )}
        </View>
      )}

      <View style={[styles.bubbleCol, isMe && styles.bubbleColMe]}>
        {/* Reaction picker */}
        <AnimatePresence>
          {isReacting && (
            <MotiView
              from={{ opacity: 0, scale: 0.8, translateY: 4 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', ...Motion.spring.snappy }}
              style={[styles.reactionPicker, isMe && styles.reactionPickerMe]}
            >
              {REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={({ pressed }) => [styles.reactionEmoji, pressed && { transform: [{ scale: 1.3 }] }]}
                  onPress={() => onReact(emoji)}
                  hitSlop={6}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </MotiView>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <Pressable
          testID="chat-message-bubble"
          style={({ pressed }) => [pressed && { opacity: 0.88 }]}
          onLongPress={onLongPress}
          delayLongPress={350}
        >
          {isMe ? (
            <LinearGradient
              colors={[Colors.peach, Colors.peachDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.bubbleMe]}
            >
              <Text style={styles.bubbleTextMe}>{message.text}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.bubbleOther]}>
              <Text style={styles.bubbleTextOther}>{message.text}</Text>
            </View>
          )}
        </Pressable>

        {/* Reactions row */}
        {(message.reactions ?? []).length > 0 && (
          <View style={[styles.reactionsRow, isMe && styles.reactionsRowMe]}>
            {[...new Set(message.reactions)].map((emoji, i) => (
              <View key={i} style={styles.reactionTag}>
                <Text style={{ fontSize: 13 }}>{emoji}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Timestamp + delivery ticks (own messages only) */}
        <View style={[styles.metaRow, isMe && styles.metaRowMe]}>
          <Text style={styles.timeLabel}>{timeLabel}</Text>
          {isMe && <DeliveryIcon status={message.status} />}
        </View>
      </View>
    </MotiView>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recipientAvatarWrap: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.divider,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.sentimentPositive,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  recipientName: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  recipientStatus: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.sentimentPositive,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 2,
  },

  // Date separator
  dateSep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  dateSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  dateSepLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },

  // Message row
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  bubbleRowMe: {
    flexDirection: 'row-reverse',
  },
  bubbleAvatarSlot: {
    width: 28,
    height: 28,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  bubbleCol: {
    maxWidth: BUBBLE_MAX_W,
    alignItems: 'flex-start',
  },
  bubbleColMe: {
    alignItems: 'flex-end',
  },

  // Reaction picker
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    gap: 4,
    marginBottom: 4,
    ...Shadow.card,
    alignSelf: 'flex-start',
  },
  reactionPickerMe: {
    alignSelf: 'flex-end',
  },
  reactionEmoji: {
    padding: 2,
  },

  // Bubble
  bubble: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    maxWidth: BUBBLE_MAX_W,
  },
  bubbleMe: {
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  bubbleTextMe: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.white,
    lineHeight: 22,
  },
  bubbleTextOther: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Reactions row
  reactionsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  reactionsRowMe: {
    alignSelf: 'flex-end',
  },
  reactionTag: {
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.divider,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  metaRowMe: {
    alignSelf: 'flex-end',
  },
  timeLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Typing indicator
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  typingAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderBottomLeftRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.textMuted,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputIconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.warmGrey,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    marginBottom: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.button,
  },
  sendBtnPressed: { transform: [{ scale: 0.93 }] },
  sendBtnGrad: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
