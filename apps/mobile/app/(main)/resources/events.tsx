/**
 * app/(main)/resources/events.tsx — Screen 17: Local Events & Meetups
 *
 * Layout:
 *   - Header: back + "Events Near You" + city selector pill
 *   - Filter pills: All / This Week / Next Week / Online / In-Person / Free
 *   - Featured event (large hero card with gradient)
 *   - Event list: full-width cards with cover image, date badge, RSVP toggle
 *   - Skeleton loading · empty state
 *
 * Entry point: "Events" banner in resources/index.tsx list header
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  ScrollView, StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, addDays } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadow, Motion } from '../../../utils/theme';
import SkeletonBlock from '../../../components/primitives/SkeletonBlock';
import EmptyState from '../../../components/common/EmptyState';
import {
  outdoorWalks, groupOfMoms, postpartumWellness,
  nursingMoments, babySleeping,
} from '../../../lib/unsplashImages';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventMode   = 'online' | 'in-person';
type EventFilter = 'All' | 'This Week' | 'Next Week' | 'Online' | 'In-Person' | 'Free';

interface MomEvent {
  id: string;
  title: string;
  host: string;
  mode: EventMode;
  date: Date;
  durationMin: number;
  venue: string;
  city: string;
  coverUrl: string;
  coverBlur: string;
  isFree: boolean;
  price?: string;
  attendeeCount: number;
  tags: string[];
  isGoing?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const NOW = new Date();
const day = (d: number, h = 10, m = 0) => {
  const dt = addDays(new Date(NOW), d);
  dt.setHours(h, m, 0, 0);
  return dt;
};

const MOCK_EVENTS: MomEvent[] = [
  {
    id: 'e1',
    title: 'New Moms Support Circle — Bandra',
    host: 'Dr. Priya Nair',
    mode: 'in-person',
    date: day(2, 10, 30),
    durationMin: 90,
    venue: 'Bandra Community Hall, Mumbai',
    city: 'Mumbai',
    coverUrl: groupOfMoms[0]!.url,
    coverBlur: 'LHF~Wq~q_3D%IUoffQWBofj[t7j[',
    isFree: true,
    attendeeCount: 12,
    tags: ['support', 'mental health', 'community'],
  },
  {
    id: 'e2',
    title: 'Postpartum Yoga — Live Online',
    host: 'Anita Kapoor',
    mode: 'online',
    date: day(3, 19, 0),
    durationMin: 60,
    venue: 'Zoom · link sent on RSVP',
    city: 'Online',
    coverUrl: outdoorWalks[0]!.url,
    coverBlur: 'LGI{v?Rj?b%M?btRRjWB~qt7M{WB',
    isFree: true,
    attendeeCount: 34,
    tags: ['yoga', 'fitness', 'postpartum'],
  },
  {
    id: 'e3',
    title: 'Breastfeeding Latch Workshop',
    host: 'Maya Singh (IBCLC)',
    mode: 'in-person',
    date: day(6, 11, 0),
    durationMin: 120,
    venue: 'Koramangala Wellness Centre, Bengaluru',
    city: 'Bengaluru',
    coverUrl: nursingMoments[0]!.url,
    coverBlur: 'LKF~Wq~q_3D%IUoffQWBofj[t7j[',
    isFree: false,
    price: '₹499',
    attendeeCount: 8,
    tags: ['breastfeeding', 'lactation', 'newborn'],
  },
  {
    id: 'e4',
    title: 'Mom & Baby Sensory Playgroup',
    host: 'NewMomCircle Community',
    mode: 'in-person',
    date: day(4, 9, 30),
    durationMin: 60,
    venue: 'Jubilee Hills Park Pavilion, Hyderabad',
    city: 'Hyderabad',
    coverUrl: outdoorWalks[2]!.url,
    coverBlur: 'LBF6V9Di0KDj?bxuj[WB~qj[M{j[',
    isFree: true,
    attendeeCount: 22,
    tags: ['baby', 'play', 'development'],
  },
  {
    id: 'e5',
    title: 'Morning Meditation for New Moms',
    host: 'Deepa Ravi',
    mode: 'online',
    date: day(1, 6, 0),
    durationMin: 30,
    venue: 'Google Meet · daily',
    city: 'Online',
    coverUrl: postpartumWellness[0]!.url,
    coverBlur: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.',
    isFree: true,
    attendeeCount: 87,
    tags: ['meditation', 'mental health', 'daily'],
  },
  {
    id: 'e6',
    title: 'Baby First Aid & CPR Certification',
    host: 'St. John Ambulance India',
    mode: 'in-person',
    date: day(9, 9, 0),
    durationMin: 180,
    venue: 'T. Nagar Community Centre, Chennai',
    city: 'Chennai',
    coverUrl: groupOfMoms[2]!.url,
    coverBlur: 'LHF~Wq~q_3D%IUoffQWBofj[t7j[',
    isFree: false,
    price: '₹299',
    attendeeCount: 16,
    tags: ['safety', 'first aid', 'essential'],
  },
  {
    id: 'e7',
    title: 'Online Postpartum Nutrition Q&A',
    host: 'Asha Kumar, RD',
    mode: 'online',
    date: day(5, 20, 0),
    durationMin: 60,
    venue: 'Zoom · link sent on RSVP',
    city: 'Online',
    coverUrl: postpartumWellness[1]!.url,
    coverBlur: 'LBF6V9Di0KDj?bxuj[WB~qj[M{j[',
    isFree: true,
    attendeeCount: 45,
    tags: ['nutrition', 'diet', 'recovery'],
  },
  {
    id: 'e8',
    title: 'New Moms Coffee Meetup — Indiranagar',
    host: 'Circle: Bengaluru Moms',
    mode: 'in-person',
    date: day(7, 10, 0),
    durationMin: 90,
    venue: 'Blue Tokai, Indiranagar, Bengaluru',
    city: 'Bengaluru',
    coverUrl: groupOfMoms[1]!.url,
    coverBlur: 'LHF~Wq~q_3D%IUoffQWBofj[t7j[',
    isFree: true,
    attendeeCount: 9,
    tags: ['casual', 'coffee', 'community'],
  },
];

const FILTER_OPTIONS: EventFilter[] = [
  'All', 'This Week', 'Next Week', 'Online', 'In-Person', 'Free',
];

const CITIES = ['All Cities', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Online'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<EventFilter>('All');
  const [activeCity,   setActiveCity]   = useState('All Cities');
  const [showCities,   setShowCities]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [rsvpSet,      setRsvpSet]      = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = MOCK_EVENTS;
    if (activeCity !== 'All Cities') {
      list = list.filter((e) => e.city === activeCity);
    }
    switch (activeFilter) {
      case 'This Week':
        list = list.filter((e) => {
          const diff = (e.date.getTime() - NOW.getTime()) / 86400000;
          return diff >= 0 && diff < 7;
        });
        break;
      case 'Next Week':
        list = list.filter((e) => {
          const diff = (e.date.getTime() - NOW.getTime()) / 86400000;
          return diff >= 7 && diff < 14;
        });
        break;
      case 'Online':
        list = list.filter((e) => e.mode === 'online');
        break;
      case 'In-Person':
        list = list.filter((e) => e.mode === 'in-person');
        break;
      case 'Free':
        list = list.filter((e) => e.isFree);
        break;
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activeFilter, activeCity]);

  const [featured, ...rest] = filtered;

  const toggleRsvp = (id: string) => {
    setRsvpSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID="events-screen">
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable testID="events-back-btn" style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Events Near You</Text>
          <Pressable
            testID="events-city-picker"
            style={styles.cityPill}
            onPress={() => setShowCities((s) => !s)}
          >
            <Ionicons name="location-outline" size={12} color={Colors.peachDark} />
            <Text style={styles.cityPillText}>{activeCity}</Text>
            <Ionicons
              name={showCities ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={Colors.peachDark}
            />
          </Pressable>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* ── City picker dropdown ── */}
      <AnimatePresence>
        {showCities && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -8 }}
            transition={{ type: 'timing', duration: Motion.duration.fast }}
            style={styles.cityDropdown}
          >
            {CITIES.map((city) => (
              <Pressable
                key={city}
                testID={`events-city-${city.toLowerCase().replace(/ /g, '-')}-btn`}
                style={[
                  styles.cityOption,
                  city === activeCity && styles.cityOptionActive,
                ]}
                onPress={() => { setActiveCity(city); setShowCities(false); }}
              >
                <Text style={[
                  styles.cityOptionText,
                  city === activeCity && { color: Colors.peachDark },
                ]}>
                  {city}
                </Text>
                {city === activeCity && (
                  <Ionicons name="checkmark" size={14} color={Colors.peachDark} />
                )}
              </Pressable>
            ))}
          </MotiView>
        )}
      </AnimatePresence>

      {/* ── Filter pills ── */}
      <MotiView
        from={{ opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: Motion.duration.base }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_OPTIONS.map((f) => {
            const active = f === activeFilter;
            return (
              <Pressable
                key={f}
                testID={`events-filter-${f.toLowerCase().replace(/ /g, '-')}-btn`}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </MotiView>

      {/* ── Content ── */}
      {loading ? (
        <EventsSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🗓️"
          title="No events found"
          subtitle="Try changing the filter or city to find events near you."
        />
      ) : (
        <FlatList
          testID="events-list"
          data={rest}
          keyExtractor={(e) => e.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          ListHeaderComponent={
            featured ? (
              <FeaturedEventCard
                event={featured}
                going={rsvpSet.has(featured.id)}
                onRsvp={() => toggleRsvp(featured.id)}
              />
            ) : null
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: 'timing',
                duration: Motion.duration.base,
                delay: index * 60,
              }}
            >
              <EventCard
                event={item}
                going={rsvpSet.has(item.id)}
                onRsvp={() => toggleRsvp(item.id)}
              />
            </MotiView>
          )}
        />
      )}
    </View>
  );
}

// ─── Featured event card ──────────────────────────────────────────────────────

function FeaturedEventCard({
  event, going, onRsvp,
}: { event: MomEvent; going: boolean; onRsvp: () => void }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: Motion.duration.base }}
      style={{ marginBottom: Spacing.md }}
    >
      <View style={styles.featuredCard}>
        {/* Cover */}
        <View style={styles.featuredCover}>
          <Image
            source={{ uri: event.coverUrl }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            placeholder={event.coverBlur}
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(20,8,2,0.72)']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Date badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeDay}>{format(event.date, 'd')}</Text>
            <Text style={styles.dateBadgeMonth}>{format(event.date, 'MMM')}</Text>
          </View>
          {/* Mode badge */}
          <View style={[
            styles.modeBadge,
            { backgroundColor: event.mode === 'online' ? '#7B68C8' : Colors.peach },
          ]}>
            <Ionicons
              name={event.mode === 'online' ? 'wifi-outline' : 'location-outline'}
              size={10}
              color={Colors.white}
            />
            <Text style={styles.modeBadgeText}>
              {event.mode === 'online' ? 'Online' : 'In-Person'}
            </Text>
          </View>
          {/* Title overlay */}
          <View style={styles.featuredOverlay}>
            {!event.isFree && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>{event.price}</Text>
              </View>
            )}
            <Text style={styles.featuredTitle}>{event.title}</Text>
            <Text style={styles.featuredHost}>Hosted by {event.host}</Text>
          </View>
        </View>
        {/* Footer */}
        <EventCardFooter event={event} going={going} onRsvp={onRsvp} />
      </View>
    </MotiView>
  );
}

// ─── Regular event card ───────────────────────────────────────────────────────

function EventCard({
  event, going, onRsvp,
}: { event: MomEvent; going: boolean; onRsvp: () => void }) {
  return (
    <View style={styles.eventCard}>
      {/* Thumbnail */}
      <View style={styles.eventThumb}>
        <Image
          source={{ uri: event.coverUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          placeholder={event.coverBlur}
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(20,8,2,0.55)']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Date badge */}
        <View style={[styles.dateBadge, styles.dateBadgeSm]}>
          <Text style={[styles.dateBadgeDay, { fontSize: 16 }]}>{format(event.date, 'd')}</Text>
          <Text style={styles.dateBadgeMonth}>{format(event.date, 'MMM')}</Text>
        </View>
        {/* Mode badge */}
        <View style={[
          styles.modeBadge,
          styles.modeBadgeSm,
          { backgroundColor: event.mode === 'online' ? '#7B68C8' : Colors.peach },
        ]}>
          <Text style={styles.modeBadgeText}>
            {event.mode === 'online' ? 'Online' : 'In-Person'}
          </Text>
        </View>
      </View>
      {/* Body */}
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
        <EventCardFooter event={event} going={going} onRsvp={onRsvp} compact />
      </View>
    </View>
  );
}

// ─── Shared footer ────────────────────────────────────────────────────────────

function EventCardFooter({
  event, going, onRsvp, compact = false,
}: { event: MomEvent; going: boolean; onRsvp: () => void; compact?: boolean }) {
  const rsvpCount = event.attendeeCount + (going ? 1 : 0);

  return (
    <View style={compact ? styles.footerCompact : styles.footer}>
      {/* Time */}
      <View style={styles.footerRow}>
        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          {format(event.date, 'EEE d MMM · h:mm a')} · {event.durationMin} min
        </Text>
      </View>
      {/* Location */}
      <View style={styles.footerRow}>
        <Ionicons
          name={event.mode === 'online' ? 'wifi-outline' : 'location-outline'}
          size={13}
          color={Colors.textMuted}
        />
        <Text style={styles.footerText} numberOfLines={1}>{event.venue}</Text>
      </View>
      {/* Attendees + RSVP */}
      <View style={styles.footerBottom}>
        <View style={styles.attendees}>
          {/* 3 stacked avatar circles */}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.attendeeAvatar,
                { marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i },
              ]}
            >
              <Text style={styles.attendeeEmoji}>
                {['👩', '👩🏽', '👩🏻'][i]}
              </Text>
            </View>
          ))}
          <Text style={styles.attendeeCount}>
            {rsvpCount} {going ? '(incl. you)' : 'going'}
          </Text>
        </View>
        <Pressable
          testID={`events-rsvp-${event.id}-btn`}
          style={({ pressed }) => [
            styles.rsvpBtn,
            going && styles.rsvpBtnGoing,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          onPress={onRsvp}
        >
          <AnimatePresence exitBeforeEnter>
            {going ? (
              <MotiView
                key="going"
                from={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy }}
                style={styles.rsvpBtnInner}
              >
                <Ionicons name="checkmark" size={14} color={Colors.peachDark} />
                <Text style={[styles.rsvpBtnText, styles.rsvpBtnTextGoing]}>Going</Text>
              </MotiView>
            ) : (
              <MotiView
                key="join"
                from={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', ...Motion.spring.bouncy }}
                style={styles.rsvpBtnInner}
              >
                <Text style={styles.rsvpBtnText}>RSVP</Text>
              </MotiView>
            )}
          </AnimatePresence>
        </Pressable>
      </View>
      {/* Free badge */}
      {event.isFree && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>Free</Text>
        </View>
      )}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function EventsSkeleton() {
  return (
    <View style={styles.listContent}>
      <SkeletonBlock width="100%" height={220} radius={Radius.xl} />
      <View style={{ height: Spacing.md }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ marginBottom: Spacing.md }}>
          <SkeletonBlock width="100%" height={130} radius={Radius.lg} />
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
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.peachOverlay,
    borderWidth: 1,
    borderColor: Colors.peach,
  },
  cityPillText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.peachDark,
  },

  // City dropdown
  cityDropdown: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingVertical: Spacing.xs,
    ...Shadow.card,
    zIndex: 20,
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  cityOptionActive: { backgroundColor: Colors.peachOverlay },
  cityOptionText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // Filters
  filterRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.peach,
  },
  filterLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  filterLabelActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamilySemiBold,
  },

  listContent: { paddingHorizontal: Spacing.lg },

  // Featured card
  featuredCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    ...Shadow.card,
  },
  featuredCover: { height: 200, position: 'relative' },
  featuredOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: 4,
  },
  featuredTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.md,
    color: Colors.white,
    lineHeight: 24,
  },
  featuredHost: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.82)',
  },

  // Date badge
  dateBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 42,
  },
  dateBadgeSm: { top: Spacing.sm, left: Spacing.sm, paddingVertical: 4 },
  dateBadgeDay: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 22,
    color: Colors.peachDark,
    lineHeight: 26,
  },
  dateBadgeMonth: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Mode badge
  modeBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  modeBadgeSm: { top: Spacing.sm, right: Spacing.sm },
  modeBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: Colors.white,
  },

  // Price badge
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  priceBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },

  // Card footer
  footer: {
    padding: Spacing.md,
    gap: 6,
    backgroundColor: Colors.white,
  },
  footerCompact: {
    gap: 4,
    paddingTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    flex: 1,
  },
  footerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  attendeeAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.warmGrey,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  attendeeEmoji: { fontSize: 14 },
  attendeeCount: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginLeft: 6,
  },

  // RSVP button
  rsvpBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.peach,
    ...Shadow.button,
  },
  rsvpBtnGoing: {
    backgroundColor: Colors.peachOverlay,
    borderWidth: 1.5,
    borderColor: Colors.peach,
    ...Shadow.soft,
  },
  rsvpBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rsvpBtnText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },
  rsvpBtnTextGoing: { color: Colors.peachDark },

  // Free badge
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(92,184,122,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(92,184,122,0.4)',
    marginTop: 2,
  },
  freeBadgeText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: 10,
    color: '#4CAF7D',
  },

  // Regular event card
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.divider,
    ...Shadow.soft,
  },
  eventThumb: { height: 130, position: 'relative' },
  eventBody: { padding: Spacing.md },
  eventTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
});
