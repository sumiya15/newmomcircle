"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

/* ── Mock data ───────────────────────────────────────────────────────────── */

const ME = 'me';

const MOCK_CONVOS: Conversation[] = [
  {
    id: 'c1',
    name: 'Priya Sharma',
    initials: 'PS',
    lastMessage: 'How are you feeling today? ❤️',
    timestamp: '2m ago',
    unread: 2,
    messages: [
      { id: 'm1', senderId: 'priya', text: 'Hey! Just checking in on you 🌸', time: '9:30 AM', read: true },
      { id: 'm2', senderId: ME, text: 'Hi! I\'m doing a bit better today, thanks for asking!', time: '9:32 AM', read: true },
      { id: 'm3', senderId: 'priya', text: 'So glad to hear that. Rest is so important ✨', time: '9:35 AM', read: true },
      { id: 'm4', senderId: ME, text: 'Baby slept 3 hours straight last night — felt like a miracle 😂', time: '9:40 AM', read: true },
      { id: 'm5', senderId: 'priya', text: 'AMAZING! Those long stretches are everything', time: '9:41 AM', read: true },
      { id: 'm6', senderId: 'priya', text: 'How are you feeling today? ❤️', time: '10:05 AM', read: false },
    ],
  },
  {
    id: 'c2',
    name: 'Anita Reddy',
    initials: 'AR',
    lastMessage: 'The lactation consultant tip really worked!',
    timestamp: '1h ago',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'anita', text: 'Did you try the lactation consultant I recommended?', time: '8:00 AM', read: true },
      { id: 'm2', senderId: ME, text: 'Yes! Had the appointment yesterday', time: '8:15 AM', read: true },
      { id: 'm3', senderId: 'anita', text: 'And?? How did it go??', time: '8:16 AM', read: true },
      { id: 'm4', senderId: ME, text: 'The lactation consultant tip really worked!', time: '8:20 AM', read: true },
      { id: 'm5', senderId: 'anita', text: 'I knew it! So happy for you 🎉', time: '8:21 AM', read: true },
    ],
  },
  {
    id: 'c3',
    name: 'Kavitha S',
    initials: 'KS',
    lastMessage: 'See you at the virtual meetup on Friday!',
    timestamp: '3h ago',
    unread: 1,
    messages: [
      { id: 'm1', senderId: ME, text: 'Are you joining the Telugu Moms virtual meetup?', time: '7:00 AM', read: true },
      { id: 'm2', senderId: 'kavitha', text: 'Of course! Wouldn\'t miss it 🌺', time: '7:10 AM', read: true },
      { id: 'm3', senderId: ME, text: 'Great, it\'s going to be so fun!', time: '7:12 AM', read: true },
      { id: 'm4', senderId: 'kavitha', text: 'See you at the virtual meetup on Friday!', time: '7:30 AM', read: false },
    ],
  },
  {
    id: 'c4',
    name: 'Meena Iyer',
    initials: 'MI',
    lastMessage: 'The breathing exercises really helped my anxiety',
    timestamp: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'meena', text: 'Hey, have you tried the breathing exercises in the Toolbox?', time: '2:00 PM', read: true },
      { id: 'm2', senderId: ME, text: 'Not yet, should I?', time: '2:05 PM', read: true },
      { id: 'm3', senderId: 'meena', text: 'Yes! The 4-7-8 breathing one is incredible', time: '2:06 PM', read: true },
      { id: 'm4', senderId: ME, text: 'I\'ll try it tonight when the baby naps', time: '2:10 PM', read: true },
      { id: 'm5', senderId: 'meena', text: 'The breathing exercises really helped my anxiety', time: '2:12 PM', read: true },
    ],
  },
  {
    id: 'c5',
    name: 'Sunita Patel',
    initials: 'SP',
    lastMessage: 'Week 8 — we made it! 🥳',
    timestamp: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'sunita', text: 'Can you believe we\'re almost at week 8?', time: '11:00 AM', read: true },
      { id: 'm2', senderId: ME, text: 'It feels like forever AND like yesterday at the same time 😅', time: '11:05 AM', read: true },
      { id: 'm3', senderId: 'sunita', text: 'Exactly! Time is so weird as a new mom', time: '11:06 AM', read: true },
      { id: 'm4', senderId: ME, text: 'Week 8 — we made it! 🥳', time: '11:10 AM', read: true },
      { id: 'm5', senderId: 'sunita', text: 'WE MADE IT! 🎉🎉🎉', time: '11:11 AM', read: true },
    ],
  },
  {
    id: 'c6',
    name: 'Lakshmi N',
    initials: 'LN',
    lastMessage: 'Sleep when the baby sleeps — best advice ever',
    timestamp: '2 days ago',
    unread: 0,
    messages: [
      { id: 'm1', senderId: 'lakshmi', text: 'How are you handling the sleep deprivation?', time: '9:00 PM', read: true },
      { id: 'm2', senderId: ME, text: 'Barely surviving 😂 Any tips?', time: '9:05 PM', read: true },
      { id: 'm3', senderId: 'lakshmi', text: 'Sleep when the baby sleeps — best advice ever', time: '9:07 PM', read: true },
      { id: 'm4', senderId: ME, text: 'Everyone says that but it\'s so hard to actually do!', time: '9:10 PM', read: true },
      { id: 'm5', senderId: 'lakshmi', text: 'Forget the laundry. Just sleep. I promise.', time: '9:12 PM', read: true },
    ],
  },
];

/* ── Sub-components ───────────────────────────────────────────────────────── */

function ReceiptIcon({ read }: { read: boolean }) {
  return read ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function MessagesPage() {
  const { user, userProfile } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>(MOCK_CONVOS);
  const [search, setSearch] = useState('');
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myInitials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'M').toUpperCase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeConvo) scrollToBottom();
  }, [activeConvo]);

  const openConvo = (convo: Conversation) => {
    // Mark as read
    const updated = convos.map(c =>
      c.id === convo.id
        ? { ...c, unread: 0, messages: c.messages.map(m => ({ ...m, read: true })) }
        : c
    );
    setConvos(updated);
    setActiveConvo(updated.find(c => c.id === convo.id) ?? convo);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !activeConvo) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: ME,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    const updatedMessages = [...activeConvo.messages, newMsg];
    const updated = convos.map(c =>
      c.id === activeConvo.id
        ? { ...c, lastMessage: newMsg.text, timestamp: 'Just now', messages: updatedMessages }
        : c
    );
    setConvos(updated);
    const updatedActive = { ...activeConvo, messages: updatedMessages };
    setActiveConvo(updatedActive);
    setInputText('');
    setTimeout(scrollToBottom, 50);
  };

  const filteredConvos = convos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = convos.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="messages-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Messages</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <PeachButton
          className="!px-5 !py-2 !text-sm !font-semibold"
          data-testid="messages-compose-btn"
          onClick={() => {}}
        >
          + New Message
        </PeachButton>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <GlassInput
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="!pl-10"
          data-testid="messages-search-input"
        />
      </div>

      {/* Conversations List */}
      <GlassCard className="divide-y divide-white/[0.05] !p-0 overflow-hidden" data-testid="messages-list">
        {filteredConvos.length === 0 ? (
          <div className="p-12 text-center text-white/40 text-sm">No conversations found.</div>
        ) : (
          filteredConvos.map(convo => (
            <motion.button
              key={convo.id}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.04] transition-colors text-left"
              onClick={() => openConvo(convo)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#FF9F7C]/20 border border-[#FF9F7C]/30 text-[#FF9F7C] font-bold flex items-center justify-center text-[13px] font-poppins">
                  {convo.initials}
                </div>
                {convo.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E85555] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {convo.unread}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[13.5px] font-poppins ${convo.unread > 0 ? 'font-bold text-white' : 'font-semibold text-white/80'}`}>
                    {convo.name}
                  </span>
                  <span className="text-[10px] text-white/35 flex-shrink-0">{convo.timestamp}</span>
                </div>
                <p className={`text-[12px] mt-0.5 truncate ${convo.unread > 0 ? 'text-white/70 font-semibold' : 'text-white/40'}`}>
                  {convo.lastMessage}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </GlassCard>

      {/* Chat Panel Modal */}
      <AnimatePresence>
        {activeConvo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveConvo(null)}
          >
            <motion.div
              className="w-full sm:max-w-lg sm:rounded-2xl overflow-hidden bg-[#1A0F0A] border border-white/[0.09] shadow-2xl flex flex-col"
              style={{ height: 'min(90vh, 600px)' }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07] bg-white/[0.03] flex-shrink-0">
                <button
                  onClick={() => setActiveConvo(null)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="w-9 h-9 rounded-full bg-[#FF9F7C]/20 border border-[#FF9F7C]/30 text-[#FF9F7C] font-bold flex items-center justify-center text-[12px] font-poppins flex-shrink-0">
                  {activeConvo.initials}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-white font-poppins">{activeConvo.name}</p>
                  <p className="text-[10px] text-[#A8C5A0]">Active now</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {activeConvo.messages.map(msg => {
                  const isMe = msg.senderId === ME;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-[#FF9F7C]/20 border border-[#FF9F7C]/20 text-[#FF9F7C] font-bold flex items-center justify-center text-[9px] font-poppins flex-shrink-0">
                          {activeConvo.initials}
                        </div>
                      )}
                      <div className={`max-w-[72%] space-y-1`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                            isMe
                              ? 'bg-[#FF9F7C] text-[#2D1B13] font-semibold rounded-br-sm'
                              : 'bg-white/[0.07] text-white/85 rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-white/30">{msg.time}</span>
                          {isMe && <ReceiptIcon read={msg.read} />}
                        </div>
                      </div>
                      {isMe && (
                        <div className="w-7 h-7 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-bold flex items-center justify-center text-[9px] font-poppins flex-shrink-0">
                          {myInitials}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/[0.07] flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Type a message..."
                  className="glass-input flex-1 !py-2.5 !text-[13px]"
                  data-testid="chat-message-input"
                />
                <PeachButton
                  onClick={sendMessage}
                  className="!px-4 !py-2.5 !rounded-xl flex-shrink-0"
                  data-testid="chat-send-btn"
                >
                  <svg className="w-4 h-4 text-white fill-current rotate-90" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </PeachButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
