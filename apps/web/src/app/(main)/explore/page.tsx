"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { motion, AnimatePresence } from 'framer-motion';

interface Circle {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  topic: string;
  color: string;
}

interface CircleMember {
  id: string;
  name: string;
  initials: string;
  role: 'admin' | 'member';
}

const MOCK_CIRCLES: Circle[] = [
  {
    id: 'circle-1',
    name: 'Postpartum Depression Support',
    memberCount: 342,
    description: 'A safe, judgment-free space for moms navigating postpartum depression and anxiety. Share, heal, and grow together.',
    topic: 'Mental Health',
    color: '#A8C5A0',
  },
  {
    id: 'circle-2',
    name: 'Breastfeeding Mamas',
    memberCount: 891,
    description: 'Tips, struggles, wins, and advice on all things breastfeeding — latching, supply, weaning, and more.',
    topic: 'Feeding',
    color: '#FF9F7C',
  },
  {
    id: 'circle-3',
    name: 'Telugu Moms',
    memberCount: 214,
    description: 'Telugu moms connect! Share parenting experiences in Telugu and English. Regional traditions, recipes, and modern parenting.',
    topic: 'Regional',
    color: '#FFCFBB',
  },
  {
    id: 'circle-4',
    name: 'Newborn Care Q&A',
    memberCount: 1204,
    description: 'Your biggest newborn questions answered by experienced moms. From umbilical cord care to first smiles.',
    topic: 'Newborn',
    color: '#C9B8FF',
  },
  {
    id: 'circle-5',
    name: 'Sleep Training Support',
    memberCount: 567,
    description: 'Gentle and traditional sleep training methods discussed openly. Find what works for your baby and family.',
    topic: 'Sleep',
    color: '#98D4E8',
  },
  {
    id: 'circle-6',
    name: 'Working Moms India',
    memberCount: 443,
    description: 'Navigating career, maternity leave, daycare, and the constant working-mom guilt — together we make it work.',
    topic: 'Work & Life',
    color: '#FFD898',
  },
];

const MOCK_MEMBERS: CircleMember[] = [
  { id: 'm1', name: 'Priya Sharma', initials: 'PS', role: 'admin' },
  { id: 'm2', name: 'Anita Reddy', initials: 'AR', role: 'member' },
  { id: 'm3', name: 'Kavitha S', initials: 'KS', role: 'member' },
  { id: 'm4', name: 'Meena Iyer', initials: 'MI', role: 'member' },
  { id: 'm5', name: 'Sunita Patel', initials: 'SP', role: 'member' },
];

const MOCK_POSTS = [
  { id: 'p1', author: 'Priya Sharma', content: 'Has anyone tried the breathing exercises from the Toolbox? They really helped me this week.', time: '2h ago' },
  { id: 'p2', author: 'Anita Reddy', content: 'Week 6 check-in: still figuring things out but the support here is incredible 💕', time: '5h ago' },
  { id: 'p3', author: 'Kavitha S', content: 'Reminder: you are doing an amazing job, even on the hard days.', time: '1d ago' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function ExplorePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [joinedCircles, setJoinedCircles] = useState<Set<string>>(new Set());
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDesc, setNewCircleDesc] = useState('');

  // Load joined state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nmc_joined_circles');
    if (saved) {
      setJoinedCircles(new Set(JSON.parse(saved) as string[]));
    }
  }, []);

  const toggleJoin = (circleId: string) => {
    setJoinedCircles(prev => {
      const next = new Set(prev);
      if (next.has(circleId)) {
        next.delete(circleId);
      } else {
        next.add(circleId);
      }
      localStorage.setItem('nmc_joined_circles', JSON.stringify([...next]));
      return next;
    });
  };

  const filteredCircles = MOCK_CIRCLES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.topic.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="explore-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Explore Circles</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Join communities of mothers like you</p>
        </div>
        <PeachButton
          onClick={() => setShowCreateModal(true)}
          className="!px-5 !py-2 !text-sm !font-semibold"
          data-testid="explore-create-circle-btn"
        >
          + Create Circle
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
          placeholder="Search circles by name or topic..."
          className="!pl-10"
          data-testid="explore-search-input"
        />
      </div>

      {/* Circles Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="explore-circles-list"
      >
        <AnimatePresence>
          {filteredCircles.map((circle, i) => {
            const isJoined = joinedCircles.has(circle.id);
            return (
              <motion.div
                key={circle.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
              >
                <GlassCard
                  className="p-5 space-y-4 cursor-pointer hover:border-white/20 transition-all h-full flex flex-col"
                  onClick={() => setSelectedCircle(circle)}
                >
                  {/* Circle header */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: circle.color + '22', border: `1px solid ${circle.color}44` }}
                    >
                      <span style={{ color: circle.color }}>
                        {circle.topic === 'Mental Health' ? '💚' :
                         circle.topic === 'Feeding' ? '🤱' :
                         circle.topic === 'Regional' ? '🌸' :
                         circle.topic === 'Newborn' ? '👶' :
                         circle.topic === 'Sleep' ? '🌙' : '💼'}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: circle.color + '22', color: circle.color }}
                    >
                      {circle.topic}
                    </span>
                  </div>

                  {/* Circle info */}
                  <div className="flex-1 space-y-1.5">
                    <h3 className="text-[14px] font-bold text-white font-poppins leading-tight">{circle.name}</h3>
                    <p className="text-[12px] text-white/55 leading-relaxed">{circle.description}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.07]">
                    <span className="text-[11px] text-white/40">
                      <span className="font-semibold text-white/60">{circle.memberCount.toLocaleString()}</span> members
                    </span>
                    <button
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isJoined
                          ? 'bg-white/[0.07] text-white/60 hover:bg-red-500/10 hover:text-red-400'
                          : 'bg-[#FF9F7C] text-[#2D1B13] hover:bg-[#ff8c62]'
                      }`}
                      onClick={e => { e.stopPropagation(); toggleJoin(circle.id); }}
                      data-testid={`circle-join-btn-${circle.id}`}
                    >
                      {isJoined ? 'Leave' : 'Join'}
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCircles.length === 0 && (
          <div className="col-span-full">
            <GlassCard className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF9F7C]/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <p className="text-white/50 text-sm">No circles match &ldquo;{search}&rdquo;</p>
              <button onClick={() => setSearch('')} className="text-[#FF9F7C] text-xs font-semibold hover:underline">Clear search</button>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Circle Detail Modal */}
      <AnimatePresence>
        {selectedCircle && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCircle(null)}
          >
            <motion.div
              className="w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <GlassCard className="p-6 space-y-5">
                {/* Modal header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: selectedCircle.color + '22', color: selectedCircle.color }}
                    >
                      {selectedCircle.topic}
                    </span>
                    <h2 className="text-[17px] font-bold text-white font-poppins leading-tight">{selectedCircle.name}</h2>
                    <p className="text-[12px] text-white/50">{selectedCircle.memberCount.toLocaleString()} members</p>
                  </div>
                  <button
                    onClick={() => setSelectedCircle(null)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors flex-shrink-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <p className="text-[13px] text-white/65 leading-relaxed">{selectedCircle.description}</p>

                {/* Members */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Members</h4>
                  <div className="space-y-2">
                    {MOCK_MEMBERS.map(member => (
                      <div key={member.id} className="flex items-center gap-3 py-1">
                        <div className="w-8 h-8 rounded-full bg-[#FF9F7C]/20 border border-[#FF9F7C]/30 text-[#FF9F7C] font-bold flex items-center justify-center text-[11px] font-poppins flex-shrink-0">
                          {member.initials}
                        </div>
                        <span className="text-[13px] text-white/80 font-poppins">{member.name}</span>
                        {member.role === 'admin' && (
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#FF9F7C]/15 text-[#FF9F7C] font-semibold">Admin</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Posts */}
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Recent Posts</h4>
                  <div className="space-y-2">
                    {MOCK_POSTS.map(post => (
                      <div key={post.id} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/70 font-poppins">{post.author}</span>
                          <span className="text-[10px] text-white/35">{post.time}</span>
                        </div>
                        <p className="text-[12px] text-white/55 leading-relaxed">{post.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Join/Leave */}
                <PeachButton
                  onClick={() => { toggleJoin(selectedCircle.id); setSelectedCircle(null); }}
                  className="w-full !py-3 !font-bold"
                >
                  {joinedCircles.has(selectedCircle.id) ? 'Leave Circle' : 'Join Circle'}
                </PeachButton>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Circle Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <GlassCard className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-bold text-white font-poppins">Create a New Circle</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <GlassInput
                    value={newCircleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCircleName(e.target.value)}
                    placeholder="Circle name..."
                  />
                  <textarea
                    value={newCircleDesc}
                    onChange={e => setNewCircleDesc(e.target.value)}
                    placeholder="Describe your circle..."
                    className="glass-input w-full resize-none h-24"
                  />
                </div>
                <PeachButton
                  className="w-full !py-3 !font-bold"
                  onClick={() => {
                    if (newCircleName.trim()) {
                      setShowCreateModal(false);
                      setNewCircleName('');
                      setNewCircleDesc('');
                    }
                  }}
                >
                  Create Circle
                </PeachButton>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
