"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { COPING_AVERAGES, POSTNATAL_PREVALENCE } from '@/lib/copingAverages';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

// Seeded visual datasets
const MOCK_WEEK_MOOD_DATA = [
  { day: 'Mon', score: 65, sentiment: 'neutral', fill: '#FF9F7C' },
  { day: 'Tue', score: 80, sentiment: 'positive', fill: '#4CAF7D' },
  { day: 'Wed', score: 45, sentiment: 'negative', fill: '#D94F4F' },
  { day: 'Thu', score: 70, sentiment: 'neutral', fill: '#FF9F7C' },
  { day: 'Fri', score: 85, sentiment: 'positive', fill: '#4CAF7D' },
  { day: 'Sat', score: 90, sentiment: 'positive', fill: '#4CAF7D' },
  { day: 'Sun', score: 75, sentiment: 'neutral', fill: '#FF9F7C' },
];

const MOCK_RADAR_DATA = [
  { strategy: 'Reframing', You: 15.5, Average: COPING_AVERAGES.positiveReframing },
  { strategy: 'Planning', You: 14.0, Average: COPING_AVERAGES.planning },
  { strategy: 'Active Coping', You: 14.5, Average: COPING_AVERAGES.activeCoping },
  { strategy: 'Acceptance', You: 13.0, Average: COPING_AVERAGES.acceptance },
  { strategy: 'Distraction', You: 11.0, Average: COPING_AVERAGES.selfDistraction },
  { strategy: 'Venting', You: 12.0, Average: COPING_AVERAGES.venting },
];

export default function InsightsPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [reportDownloading, setReportDownloading] = useState(false);

  // Mount check to prevent hydration mismatch with Recharts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownloadReport = () => {
    setReportDownloading(true);
    setTimeout(() => {
      setReportDownloading(false);
      
      // Dynamic mock PDF download trigger
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        report: "NewMomCircle Wellness Report",
        generatedAt: new Date().toISOString(),
        moodScoreAverage: 74,
        dominantSentiment: "mixed",
        streakDays: 12,
        anxietyLevelComparison: "68% in dataset",
        troubleSleepingComparison: "71% in dataset",
        copingRadarScores: MOCK_RADAR_DATA
      }));
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     dataStr     );
      downloadAnchor.setAttribute("download", `NewMomCircle_Report_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5 font-medium">
            <Link href="/journal" className="hover:text-[#FF9F7C] transition-colors">Journal</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="text-[#FF9F7C]">Insights</span>
          </div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Wellness Insights</h1>
          <p className="text-sm text-white/40 mt-0.5">Your mood patterns and coping strategy analysis</p>
        </div>

        {/* Week Selector */}
        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 self-start sm:self-center text-xs font-semibold font-poppins text-white/70">
          <button className="hover:text-[#FF9F7C] transition-colors">‹</button>
          <span>Jun 2 – Jun 8</span>
          <button className="hover:text-[#FF9F7C] transition-colors">›</button>
        </div>
      </div>

      {/* Stats Metric Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Avg Mood Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white font-poppins">74/100</span>
              <span className="text-xs font-bold text-[#4CAF7D]">↑ 4%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#4CAF7D]/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Current Streak</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white font-poppins">12</span>
              <span className="text-xs text-white/50">days in a row</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FF9F7C]/15 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Entries Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white font-poppins">6/7</span>
              <span className="text-xs text-white/50">this week</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFCFBB]/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFCFBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
        </GlassCard>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Bar Chart */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white font-poppins">7-Day Mood History</h3>
            <p className="text-xs text-white/50">Daily check-in scores categorized by sentiment</p>
          </div>

          <div className="h-[260px] w-full pt-4">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_WEEK_MOOD_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 8, 4, 0.9)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-white/5 rounded-xl animate-pulse flex items-center justify-center text-xs text-white/40">
                Loading graph...
              </div>
            )}
          </div>
          <div className="flex justify-center gap-6 text-[10px] font-semibold text-white/70">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4CAF7D]" /> Positive</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9F7C]" /> Neutral</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D94F4F]" /> Negative</span>
          </div>
        </GlassCard>

        {/* Coping Radar Chart */}
        <GlassCard className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white font-poppins">Coping Profile Comparison</h3>
            <p className="text-xs text-white/50">Your coping strategies vs antepartum dataset averages</p>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_RADAR_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="strategy" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Poppins' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8 }} />
                  <Radar name="You" dataKey="You" stroke="#FF9F7C" fill="#FF9F7C" fillOpacity={0.3} />
                  <Radar name="Average" dataKey="Average" stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.1)" fillOpacity={0.1} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.7)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-white/5 rounded-xl animate-pulse flex items-center justify-center text-xs text-white/40">
                Loading graph...
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Population comparison progress bars & Weekly reflection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Population progress bars */}
        <GlassCard className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white font-poppins">How You Compare</h3>
            <p className="text-xs text-white/50">Postnatal distress markers vs database prevalence rates</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Sleeping Marker */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/70">
                <span>Sleep issues <span className="text-white/40">(vs 71% avg)</span></span>
                <span className="font-semibold text-[#FFCFBB]">{Math.round(POSTNATAL_PREVALENCE.troubleSleeping * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] rounded-full"
                  style={{ width: `${POSTNATAL_PREVALENCE.troubleSleeping * 100}%` }}
                />
              </div>
            </div>

            {/* Anxiety Marker */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/70">
                <span>Anxiety markers <span className="text-white/40">(vs 68% avg)</span></span>
                <span className="font-semibold text-[#FFCFBB]">{Math.round(POSTNATAL_PREVALENCE.anxious * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] rounded-full"
                  style={{ width: `${POSTNATAL_PREVALENCE.anxious * 100}%` }}
                />
              </div>
            </div>

            {/* Concentrating Marker */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/70">
                <span>Concentration issues <span className="text-white/40">(vs 61% avg)</span></span>
                <span className="font-semibold text-[#FFCFBB]">{Math.round(POSTNATAL_PREVALENCE.troubleConcentrating * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] rounded-full"
                  style={{ width: `${POSTNATAL_PREVALENCE.troubleConcentrating * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-white/40 italic leading-relaxed pt-2 border-t border-white/5">
            * Remember: these comparisons indicate patterns computed from 1,503 mothers in our postnatal screening database. They are not medical diagnoses.
          </p>
        </GlassCard>

        {/* AI summary reflection */}
        <GlassCard className="p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white font-poppins">Weekly AI Reflection</h3>
              <p className="text-xs text-white/50">Personalized summary generated by NewMomCircle</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <span className="text-xs font-semibold text-[#FF9F7C] block mb-1">This Week&apos;s Focus</span>
              <p className="text-sm text-white/90 italic leading-relaxed font-poppins">
                This week had its ups and downs, which is completely normal. Your average mood score of 74 shows you&apos;re navigating each day thoughtfully. Mixed weeks often mean growth is happening. Keep journaling &mdash; you&apos;re building self-awareness that will serve you long-term.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-xs text-white/50 font-medium">Suggested Strategy: <span className="text-[#FF9F7C] font-semibold">Positive Reframing</span></span>
            <button 
              onClick={handleDownloadReport}
              disabled={reportDownloading}
              className="text-xs font-semibold btn-secondary !px-4 !py-2 flex items-center gap-1 cursor-pointer"
            >
              {reportDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-t-transparent border-white animate-spin"></div>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span>Download Report</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
