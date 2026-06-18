"use client";

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

type NotifType = 'like' | 'comment' | 'guardian_sos' | 'circle_invite' | 'system';
type FilterTab = 'all' | 'unread' | 'alerts';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

/* ── Mock notifications ─────────────────────────────────────────────────── */

const INITIAL_NOTIFS: Notification[] = [
  {
    id: 'n1',
    type: 'guardian_sos',
    title: 'SOS Alert from Priya',
    body: 'Your guardian Priya Sharma sent a wellness check. Please respond when you can.',
    timestamp: '5 min ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'like',
    title: 'Anita Reddy liked your post',
    body: '"Day 15 postpartum. Finally managed a shower AND made chai…"',
    timestamp: '20 min ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'comment',
    title: 'Kavitha S commented on your post',
    body: '"Small wins are EVERYTHING! You go mama! 🎉"',
    timestamp: '45 min ago',
    read: false,
  },
  {
    id: 'n4',
    type: 'circle_invite',
    title: 'You\'re invited to join a Circle',
    body: 'Meena Iyer invited you to join "Telugu Moms" circle.',
    timestamp: '2h ago',
    read: false,
  },
  {
    id: 'n5',
    type: 'like',
    title: 'Sunita Patel liked your post',
    body: '"The breathing exercises in the Toolbox actually helped…"',
    timestamp: '3h ago',
    read: true,
  },
  {
    id: 'n6',
    type: 'comment',
    title: 'Lakshmi N replied to your comment',
    body: '"Totally agree! Sleep deprivation is no joke but you\'re doing great!"',
    timestamp: '5h ago',
    read: true,
  },
  {
    id: 'n7',
    type: 'system',
    title: 'Welcome to NewMomCircle! 🌸',
    body: 'Your account is ready. Explore circles, log your baby\'s milestones, and connect with other moms.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: 'n8',
    type: 'circle_invite',
    title: 'New circle you might like',
    body: '"Postpartum Depression Support" now has 342 members. Join and connect!',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: 'n9',
    type: 'system',
    title: 'Weekly Wellness Check-in',
    body: 'How are you feeling this week? Take a moment to fill out your mood tracker.',
    timestamp: '2 days ago',
    read: true,
  },
  {
    id: 'n10',
    type: 'like',
    title: 'Fatima Khan liked your comment',
    body: '"Thank you so much for sharing this 💕"',
    timestamp: '3 days ago',
    read: true,
  },
];

/* ── Icon by type ────────────────────────────────────────────────────────── */

function NotifIcon({ type }: { type: NotifType }) {
  const configs: Record<NotifType, { bg: string; icon: React.ReactNode }> = {
    like: {
      bg: '#FF9F7C',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      ),
    },
    comment: {
      bg: '#A8C5A0',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
    },
    guardian_sos: {
      bg: '#E85555',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
    },
    circle_invite: {
      bg: '#C9B8FF',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      ),
    },
    system: {
      bg: '#98D4E8',
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      ),
    },
  };

  const { bg, icon } = configs[type];
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ background: bg }}
    >
      {icon}
    </div>
  );
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'alerts', label: 'Alerts' },
];

/* ── Main component ────────────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);
  const [filter, setFilter] = useState<FilterTab>('all');

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'guardian_sos' || n.type === 'system';
    return true;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="notifications-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Notifications</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className="text-[12px] text-[#FF9F7C] font-semibold hover:text-[#ff8c62] transition-colors"
            onClick={markAllRead}
            data-testid="notifications-mark-all-btn"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-[12px] font-bold font-poppins transition-all ${
              filter === tab.key
                ? 'bg-[#FF9F7C] text-[#2D1B13]'
                : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80'
            }`}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-[#E85555] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2" data-testid="notifications-list">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <GlassCard className="p-12 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#FF9F7C]/10 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white font-poppins">All caught up!</h3>
                  <p className="text-[12px] text-white/40 mt-1">No {filter !== 'all' ? filter + ' ' : ''}notifications to show.</p>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
              >
                <button
                  className={`w-full text-left transition-all rounded-2xl overflow-hidden ${!notif.read ? 'border-l-2 border-[#FF9F7C]' : ''}`}
                  onClick={() => markRead(notif.id)}
                >
                  <div
                    className={`flex items-start gap-4 px-5 py-4 border border-white/[0.07] rounded-2xl transition-colors ${
                      !notif.read
                        ? 'bg-[#FF9F7C]/[0.06] hover:bg-[#FF9F7C]/[0.09]'
                        : 'bg-white/[0.03] hover:bg-white/[0.05]'
                    } ${!notif.read ? '!rounded-l-none' : ''}`}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[13px] font-poppins leading-snug ${!notif.read ? 'font-bold text-white' : 'font-semibold text-white/80'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-white/35 flex-shrink-0 pt-0.5">{notif.timestamp}</span>
                      </div>
                      <p className="text-[12px] text-white/50 leading-relaxed">{notif.body}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#FF9F7C] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
