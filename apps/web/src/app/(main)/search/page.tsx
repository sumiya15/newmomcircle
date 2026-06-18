"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ───────────────────────────────────────────────────────────────── */

type SearchCategory = 'all' | 'community' | 'circles' | 'resources' | 'members';

interface SearchResult {
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  title: string;
  preview: string;
}

/* ── Mock search data ────────────────────────────────────────────────────── */

const ALL_RESULTS: SearchResult[] = [
  // Community posts
  { id: 'r1', category: 'community', title: 'Day 15 postpartum — small wins matter', preview: 'Finally managed a shower AND made chai. Every small win counts as a new mom.' },
  { id: 'r2', category: 'community', title: 'Breastfeeding struggles are REAL', preview: 'Week 3 breastfeeding journey — seeking support and advice from the community.' },
  { id: 'r3', category: 'community', title: 'Baby\'s first smile milestone!', preview: 'My baby smiled for the first time today — a moment I will treasure forever.' },
  { id: 'r4', category: 'community', title: 'Breathing exercises helped my anxiety', preview: 'Using the Toolbox breathing exercises every morning has made a huge difference.' },
  { id: 'r5', category: 'community', title: 'Sleep deprivation — Week 3 survivors', preview: 'These little faces make every sleepless night worth it. Who else is with me?' },

  // Circles
  { id: 'r6', category: 'circles', title: 'Postpartum Depression Support', preview: 'A safe, judgment-free space with 342 members navigating postpartum challenges.' },
  { id: 'r7', category: 'circles', title: 'Breastfeeding Mamas', preview: 'Tips, struggles, wins, and advice on all things breastfeeding — 891 members.' },
  { id: 'r8', category: 'circles', title: 'Telugu Moms', preview: 'Regional community for Telugu-speaking mothers — 214 members.' },
  { id: 'r9', category: 'circles', title: 'Sleep Training Support', preview: 'Gentle and traditional sleep training methods — 567 members.' },
  { id: 'r10', category: 'circles', title: 'Working Moms India', preview: 'Balancing career and new motherhood — 443 members.' },

  // Resources
  { id: 'r11', category: 'resources', title: 'Postpartum Recovery Guide', preview: 'A comprehensive guide to physical and emotional recovery in the weeks after birth.' },
  { id: 'r12', category: 'resources', title: 'Newborn Sleep Patterns Explained', preview: 'Understanding why newborns sleep the way they do and what to expect.' },
  { id: 'r13', category: 'resources', title: 'Breastfeeding Basics', preview: 'Latch techniques, supply tips, and common challenges — expert advice for new moms.' },
  { id: 'r14', category: 'resources', title: 'Managing Postpartum Anxiety', preview: 'Evidence-based strategies for coping with postpartum anxiety and depression.' },
  { id: 'r15', category: 'resources', title: 'Baby Milestones by Month', preview: 'Track your baby\'s development from birth through 12 months.' },

  // Members
  { id: 'r16', category: 'members', title: 'Priya Sharma', preview: 'Mom of a 3-month-old. Advocate for postpartum mental health support.' },
  { id: 'r17', category: 'members', title: 'Anita Reddy', preview: 'Second-time mom sharing real experiences about newborn care.' },
  { id: 'r18', category: 'members', title: 'Kavitha S', preview: 'Telugu mom, breastfeeding advocate, and member of 3 circles.' },
  { id: 'r19', category: 'members', title: 'Meena Iyer', preview: 'First-time mom, sleep training enthusiast, loves journaling.' },
  { id: 'r20', category: 'members', title: 'Sunita Patel', preview: 'Working mom of a 2-month-old navigating maternity leave.' },
];

const CATEGORY_TABS: { key: SearchCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'community', label: 'Community' },
  { key: 'circles', label: 'Circles' },
  { key: 'resources', label: 'Resources' },
  { key: 'members', label: 'Members' },
];

const CATEGORY_COLORS: Record<Exclude<SearchCategory, 'all'>, string> = {
  community: '#FF9F7C',
  circles:   '#C9B8FF',
  resources: '#A8C5A0',
  members:   '#98D4E8',
};

const RECENT_SEARCHES_KEY = 'nmc_recent_searches';

/* ── Main component ────────────────────────────────────────────────────────── */

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) setRecentSearches(JSON.parse(saved) as string[]);
  }, []);

  const saveRecent = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 8);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    searchTimer.current = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = ALL_RESULTS.filter(r => {
        const matchesCategory = category === 'all' || r.category === category;
        const matchesQuery = r.title.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
      setResults(filtered);
      setLoading(false);
      saveRecent(query.trim());
    }, 150);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, category, saveRecent]);

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showEmpty = query.trim().length >= 2 && !loading && results.length === 0;
  const showResults = query.trim().length >= 2 && !loading && results.length > 0;
  const showRecent = query.trim().length < 2 && recentSearches.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="search-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Search</h1>
        <p className="text-[13px] text-white/40 mt-0.5">Find posts, circles, resources, and members</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search everything..."
          className="glass-input w-full !pl-11 !pr-11 !py-4 !text-[15px]"
          data-testid="search-input"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              onClick={clearSearch}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              data-testid="search-clear-btn"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold font-poppins transition-all ${
              category === tab.key
                ? 'bg-[#FF9F7C] text-[#2D1B13]'
                : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading shimmer */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-5 space-y-2.5">
                <div className="skeleton h-3 w-20 rounded-full" />
                <div className="skeleton h-4 w-3/4 rounded-full" />
                <div className="skeleton h-3 w-full rounded-full" />
                <div className="skeleton h-3 w-5/6 rounded-full" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            data-testid="search-results-list"
          >
            <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider px-1">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="p-5 space-y-2.5 cursor-pointer hover:border-white/20 transition-all">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: CATEGORY_COLORS[result.category] + '22',
                        color: CATEGORY_COLORS[result.category],
                      }}
                    >
                      {result.category}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-white font-poppins leading-snug">{result.title}</h3>
                  <p className="text-[12px] text-white/50 leading-relaxed">{result.preview}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      <AnimatePresence>
        {showEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#FF9F7C]/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white font-poppins">No results found</h3>
                <p className="text-[12px] text-white/40 mt-1">Try a different search term or category.</p>
              </div>
              <button onClick={clearSearch} className="text-[#FF9F7C] text-xs font-semibold hover:underline">Clear search</button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Searches */}
      <AnimatePresence>
        {showRecent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Recent Searches</h3>
                <button
                  onClick={clearRecent}
                  className="text-[11px] text-white/35 hover:text-white/60 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map(recent => (
                  <button
                    key={recent}
                    onClick={() => handleRecentClick(recent)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 flex-shrink-0">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                    </svg>
                    <span className="text-[13px] text-white/65">{recent}</span>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial empty state (no query, no recent) */}
      {query.trim().length < 2 && recentSearches.length === 0 && (
        <GlassCard className="p-10 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#FF9F7C]/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white font-poppins">Start searching</h3>
            <p className="text-[12px] text-white/40 mt-1">Search for posts, circles, resources, or members.</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
