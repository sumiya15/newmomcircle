"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ──────────────────────────────────────────────────────────────────── */

type FeedingType = 'breast' | 'bottle';
type BreastSide = 'L' | 'R' | 'both';
type DiaperType = 'wet' | 'dirty' | 'both';

interface FeedingLog {
  id: string;
  time: string;
  duration: number; // minutes
  type: FeedingType;
  side?: BreastSide;
}

interface SleepLog {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
}

interface DiaperLog {
  id: string;
  time: string;
  type: DiaperType;
}

/* ── Mock seed data ─────────────────────────────────────────────────────────── */

const seedFeedings: FeedingLog[] = [
  { id: 'f1', time: new Date(Date.now() - 3600000 * 2).toISOString(), duration: 20, type: 'breast', side: 'L' },
  { id: 'f2', time: new Date(Date.now() - 3600000 * 5).toISOString(), duration: 15, type: 'breast', side: 'R' },
  { id: 'f3', time: new Date(Date.now() - 3600000 * 8).toISOString(), duration: 8,  type: 'bottle' },
];

const seedSleeps: SleepLog[] = [
  { id: 's1', startTime: new Date(Date.now() - 3600000 * 4).toISOString(), endTime: new Date(Date.now() - 3600000 * 2).toISOString(), duration: 120 },
  { id: 's2', startTime: new Date(Date.now() - 3600000 * 9).toISOString(), endTime: new Date(Date.now() - 3600000 * 6).toISOString(), duration: 180 },
];

const seedDiapers: DiaperLog[] = [
  { id: 'd1', time: new Date(Date.now() - 3600000 * 1).toISOString(), type: 'wet' },
  { id: 'd2', time: new Date(Date.now() - 3600000 * 3).toISOString(), type: 'dirty' },
  { id: 'd3', time: new Date(Date.now() - 3600000 * 6).toISOString(), type: 'both' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const todayOnly = (logs: { time?: string; startTime?: string }[]) =>
  logs.filter(l => {
    const t = new Date((l as { time?: string }).time ?? (l as { startTime?: string }).startTime ?? '');
    const now = new Date();
    return t.toDateString() === now.toDateString();
  });

/* ── Section colors ─────────────────────────────────────────────────────────── */
const COLORS = {
  feeding: '#FF9F7C',
  sleep:   '#A8C5A0',
  diaper:  '#FFCFBB',
};

/* ── Modal wrapper ─────────────────────────────────────────────────────────── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <GlassCard className="p-6 space-y-4">{children}</GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function TrackerPage() {
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [sleeps, setSleeps]     = useState<SleepLog[]>([]);
  const [diapers, setDiapers]   = useState<DiaperLog[]>([]);

  // Quick-add modal state
  const [feedingModal, setFeedingModal] = useState(false);
  const [sleepModal, setSleepModal]     = useState(false);
  const [diaperModal, setDiaperModal]   = useState(false);

  // Feeding form
  const [fDuration, setFDuration] = useState('15');
  const [fType, setFType]         = useState<FeedingType>('breast');
  const [fSide, setFSide]         = useState<BreastSide>('L');

  // Sleep form
  const [sStart, setSStart] = useState('');
  const [sEnd, setSEnd]     = useState('');

  // Diaper form
  const [dType, setDType] = useState<DiaperType>('wet');

  const save = useCallback((
    f: FeedingLog[], s: SleepLog[], d: DiaperLog[]
  ) => {
    localStorage.setItem('nmc_tracker_feedings', JSON.stringify(f));
    localStorage.setItem('nmc_tracker_sleeps',   JSON.stringify(s));
    localStorage.setItem('nmc_tracker_diapers',  JSON.stringify(d));
  }, []);

  useEffect(() => {
    const f = localStorage.getItem('nmc_tracker_feedings');
    const s = localStorage.getItem('nmc_tracker_sleeps');
    const d = localStorage.getItem('nmc_tracker_diapers');
    setFeedings(f ? JSON.parse(f) as FeedingLog[] : seedFeedings);
    setSleeps(s   ? JSON.parse(s) as SleepLog[]   : seedSleeps);
    setDiapers(d  ? JSON.parse(d) as DiaperLog[]  : seedDiapers);
  }, []);

  const addFeeding = () => {
    const entry: FeedingLog = {
      id: `f-${Date.now()}`,
      time: new Date().toISOString(),
      duration: parseInt(fDuration) || 15,
      type: fType,
      side: fType === 'breast' ? fSide : undefined,
    };
    const next = [entry, ...feedings];
    setFeedings(next);
    save(next, sleeps, diapers);
    setFeedingModal(false);
  };

  const addSleep = () => {
    const start = sStart ? new Date(sStart).toISOString() : new Date(Date.now() - 3600000).toISOString();
    const end   = sEnd   ? new Date(sEnd).toISOString()   : new Date().toISOString();
    const duration = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
    const entry: SleepLog = { id: `s-${Date.now()}`, startTime: start, endTime: end, duration };
    const next = [entry, ...sleeps];
    setSleeps(next);
    save(feedings, next, diapers);
    setSleepModal(false);
    setSStart(''); setSEnd('');
  };

  const addDiaper = () => {
    const entry: DiaperLog = { id: `dp-${Date.now()}`, time: new Date().toISOString(), type: dType };
    const next = [entry, ...diapers];
    setDiapers(next);
    save(feedings, sleeps, next);
    setDiaperModal(false);
  };

  // Summary stats (today)
  const todayFeedings = todayOnly(feedings).length;
  const todaySleepMins = (todayOnly(sleeps) as SleepLog[]).reduce((sum, s) => sum + s.duration, 0);
  const todayDiapers = todayOnly(diapers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="tracker-screen">
      {/* Page Header */}
      <div>
        <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Baby &amp; Mom Tracker</h1>
        <p className="text-[13px] text-white/40 mt-0.5">Log feeds, sleep, and diapers with ease</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Feeds", value: todayFeedings, color: COLORS.feeding, icon: '🤱' },
          { label: 'Sleep Today', value: `${Math.floor(todaySleepMins / 60)}h ${todaySleepMins % 60}m`, color: COLORS.sleep, icon: '🌙' },
          { label: "Today's Diapers", value: todayDiapers, color: COLORS.diaper, icon: '🍼' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-4 text-center space-y-1.5">
            <span className="text-xl">{stat.icon}</span>
            <p className="text-[20px] font-bold font-poppins" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] text-white/40">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Feeding Section */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🤱</span>
            <h2 className="text-[15px] font-bold text-white font-poppins">Feeding</h2>
          </div>
          <PeachButton
            onClick={() => setFeedingModal(true)}
            className="!px-4 !py-1.5 !text-xs !font-bold"
            data-testid="tracker-feeding-btn"
          >
            + Log Feed
          </PeachButton>
        </div>
        <div className="space-y-2" data-testid="tracker-log-list">
          {feedings.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.feeding }} />
                <div>
                  <p className="text-[13px] font-semibold text-white">{log.type === 'breast' ? `Breast (${log.side})` : 'Bottle'}</p>
                  <p className="text-[11px] text-white/40">{fmtDate(log.time)} · {fmtTime(log.time)}</p>
                </div>
              </div>
              <span className="text-[12px] font-bold" style={{ color: COLORS.feeding }}>{log.duration} min</span>
            </div>
          ))}
          {feedings.length === 0 && <p className="text-xs text-white/35 italic py-2">No feedings logged yet.</p>}
        </div>
      </GlassCard>

      {/* Sleep Section */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌙</span>
            <h2 className="text-[15px] font-bold text-white font-poppins">Sleep</h2>
          </div>
          <PeachButton
            onClick={() => setSleepModal(true)}
            className="!px-4 !py-1.5 !text-xs !font-bold"
            data-testid="tracker-sleep-btn"
          >
            + Log Sleep
          </PeachButton>
        </div>
        <div className="space-y-2">
          {sleeps.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.sleep }} />
                <div>
                  <p className="text-[13px] font-semibold text-white">{fmtTime(log.startTime)} – {fmtTime(log.endTime)}</p>
                  <p className="text-[11px] text-white/40">{fmtDate(log.startTime)}</p>
                </div>
              </div>
              <span className="text-[12px] font-bold" style={{ color: COLORS.sleep }}>
                {Math.floor(log.duration / 60)}h {log.duration % 60}m
              </span>
            </div>
          ))}
          {sleeps.length === 0 && <p className="text-xs text-white/35 italic py-2">No sleep sessions logged yet.</p>}
        </div>
      </GlassCard>

      {/* Diaper Section */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🍼</span>
            <h2 className="text-[15px] font-bold text-white font-poppins">Diaper</h2>
          </div>
          <PeachButton
            onClick={() => setDiaperModal(true)}
            className="!px-4 !py-1.5 !text-xs !font-bold"
            data-testid="tracker-diaper-btn"
          >
            + Log Diaper
          </PeachButton>
        </div>
        <div className="space-y-2">
          {diapers.slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.diaper }} />
                <div>
                  <p className="text-[13px] font-semibold text-white capitalize">{log.type}</p>
                  <p className="text-[11px] text-white/40">{fmtDate(log.time)} · {fmtTime(log.time)}</p>
                </div>
              </div>
              <span className="text-[12px] font-bold capitalize" style={{ color: COLORS.diaper }}>{log.type}</span>
            </div>
          ))}
          {diapers.length === 0 && <p className="text-xs text-white/35 italic py-2">No diapers logged yet.</p>}
        </div>
      </GlassCard>

      {/* ── Feeding Modal ─────────────────────────────────────────────────── */}
      <Modal open={feedingModal} onClose={() => setFeedingModal(false)}>
        <h3 className="text-[16px] font-bold text-white font-poppins">Log Feeding</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2 mt-1">
              {(['breast', 'bottle'] as FeedingType[]).map(t => (
                <button
                  key={t}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${fType === t ? 'bg-[#FF9F7C] text-[#2D1B13]' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'}`}
                  onClick={() => setFType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {fType === 'breast' && (
            <div>
              <label className="label">Side</label>
              <div className="flex gap-2 mt-1">
                {(['L', 'R', 'both'] as BreastSide[]).map(s => (
                  <button
                    key={s}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${fSide === s ? 'bg-[#FF9F7C] text-[#2D1B13]' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'}`}
                    onClick={() => setFSide(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              value={fDuration}
              onChange={e => setFDuration(e.target.value)}
              className="glass-input w-full mt-1"
              min="1"
              max="60"
            />
          </div>
        </div>
        <PeachButton onClick={addFeeding} className="w-full !py-3 !font-bold">Save Feeding</PeachButton>
      </Modal>

      {/* ── Sleep Modal ─────────────────────────────────────────────────────── */}
      <Modal open={sleepModal} onClose={() => setSleepModal(false)}>
        <h3 className="text-[16px] font-bold text-white font-poppins">Log Sleep</h3>
        <div className="space-y-3">
          <div>
            <label className="label">Start Time</label>
            <input type="datetime-local" value={sStart} onChange={e => setSStart(e.target.value)} className="glass-input w-full mt-1" />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="datetime-local" value={sEnd} onChange={e => setSEnd(e.target.value)} className="glass-input w-full mt-1" />
          </div>
        </div>
        <PeachButton onClick={addSleep} className="w-full !py-3 !font-bold">Save Sleep</PeachButton>
      </Modal>

      {/* ── Diaper Modal ─────────────────────────────────────────────────────── */}
      <Modal open={diaperModal} onClose={() => setDiaperModal(false)}>
        <h3 className="text-[16px] font-bold text-white font-poppins">Log Diaper Change</h3>
        <div>
          <label className="label">Type</label>
          <div className="flex gap-2 mt-1">
            {(['wet', 'dirty', 'both'] as DiaperType[]).map(t => (
              <button
                key={t}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${dType === t ? 'bg-[#FF9F7C] text-[#2D1B13]' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'}`}
                onClick={() => setDType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <PeachButton onClick={addDiaper} className="w-full !py-3 !font-bold">Save Diaper</PeachButton>
      </Modal>
    </div>
  );
}
