"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { supabase } from '@/lib/supabase';
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalSentiment,
  analyzeSentiment,
} from '@newmomcircle/api';
import type { JournalEntry, MoodLevel } from '@newmomcircle/types';

const MOODS = [
  { value: 'very_low', label: 'Very Low', emoji: '😢' },
  { value: 'low', label: 'Low', emoji: '😔' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'good', label: 'Good', emoji: '🙂' },
  { value: 'great', label: 'Great', emoji: '😊' },
] as const;

interface LocalSentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  sentimentAdvice: string;
  suggestedCoping: string;
}

const DEFAULT_ENTRIES: JournalEntry[] = [
  {
    id: 'mock-journal-1',
    userId: 'mock-user',
    mood: 'good',
    content: 'Had a wonderful stroll in the garden today with baby. The air was fresh and I feel much lighter.',
    wordCount: 18,
    language: 'en',
    sentiment: 'positive',
    sentimentScore: 85,
    sentimentAdvice: "You're doing beautifully. Keep nurturing yourself — your strength shows in every word.",
    suggestedCoping: 'Planning',
    allowRetraining: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'mock-journal-2',
    userId: 'mock-user',
    mood: 'low',
    content: 'Feeling extremely exhausted. Baby cried for hours last night and I feel like I am failing to comfort her. It is so tough.',
    wordCount: 25,
    language: 'en',
    sentiment: 'negative',
    sentimentScore: 72,
    sentimentAdvice: "This sounds really hard, and your feelings are valid. Please reach out to your safety circle. You deserve support.",
    suggestedCoping: 'Positive Reframing',
    allowRetraining: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
];

export default function JournalPage() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [entryContent, setEntryContent] = useState('');
  const [entryLanguage, setEntryLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<LocalSentimentResult | null>(null);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [selectedPastEntry, setSelectedPastEntry] = useState<JournalEntry | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    const offline = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setIsOfflineMode(offline);

    if (offline) {
      const saved = localStorage.getItem('newmomcircle_mock_journals');
      if (saved) {
        setPastEntries(JSON.parse(saved) as JournalEntry[]);
      } else {
        setPastEntries(DEFAULT_ENTRIES);
        localStorage.setItem('newmomcircle_mock_journals', JSON.stringify(DEFAULT_ENTRIES));
      }
    } else if (user) {
      void getJournalEntries(supabase, user.id, 7).then(setPastEntries);
    }
  }, [user]);

  const wordCount = entryContent.trim() ? entryContent.trim().split(/\s+/).length : 0;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || !entryContent.trim() || !user) return;

    setIsLoading(true);
    setAiResponse(null);
    setFeedbackSuccess(false);

    if (isOfflineMode) {
      // Offline heuristic analyzer
      const textLower = entryContent.toLowerCase();
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      let score = 50;
      let advice = "Take a gentle breath. It's okay to have uncertain days. You're not alone in this.";
      let coping = "Active Coping";

      if (selectedMood === 'very_low' || selectedMood === 'low' || textLower.includes('sad') || textLower.includes('depress') || textLower.includes('alone') || textLower.includes('fail') || textLower.includes('cry')) {
        sentiment = 'negative'; score = 80;
        advice = "This sounds really hard, and your feelings are completely valid. Please reach out to your safety circle or a counsellor. You deserve real support.";
        coping = "Positive Reframing";
      } else if (selectedMood === 'good' || selectedMood === 'great' || textLower.includes('happy') || textLower.includes('smile') || textLower.includes('love') || textLower.includes('sleep')) {
        sentiment = 'positive'; score = 90;
        advice = "You're doing beautifully. Keep nurturing yourself — your strength shows in every word.";
        coping = "Planning";
      }

      const result: LocalSentimentResult = { sentiment, sentimentScore: score, sentimentAdvice: advice, suggestedCoping: coping };

      const mockEntry: JournalEntry = {
        id: `mock-journal-${Date.now()}`,
        userId: user.id,
        mood: selectedMood,
        content: entryContent,
        wordCount,
        language: entryLanguage,
        sentiment: result.sentiment,
        sentimentScore: result.sentimentScore,
        sentimentAdvice: result.sentimentAdvice,
        suggestedCoping: result.suggestedCoping,
        allowRetraining: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [mockEntry, ...pastEntries];
      setPastEntries(updated);
      localStorage.setItem('newmomcircle_mock_journals', JSON.stringify(updated));

      setTimeout(() => { setAiResponse(result); setIsLoading(false); }, 1500);
    } else {
      try {
        // Create the journal entry first
        const created = await createJournalEntry(supabase, {
          userId: user.id,
          content: entryContent,
          mood: selectedMood,
          language: entryLanguage,
        });

        // Call AI sentiment via Supabase Edge Function
        const result = await analyzeSentiment(supabase, entryContent);

        if (created && result) {
          await updateJournalSentiment(supabase, created.id, {
            label: result.sentiment,
            score: result.sentimentScore,
            advice: result.sentimentAdvice,
            coping: result.suggestedCoping,
          });
          const fullEntry: JournalEntry = {
            ...created,
            sentiment: result.sentiment,
            sentimentScore: result.sentimentScore,
            sentimentAdvice: result.sentimentAdvice,
            suggestedCoping: result.suggestedCoping,
          };
          setPastEntries(prev => [fullEntry, ...prev]);
          setAiResponse(result);
        } else if (created) {
          setPastEntries(prev => [created, ...prev]);
          // Fallback when AI is unavailable
          const fallback: LocalSentimentResult = {
            sentiment: 'neutral',
            sentimentScore: 50,
            sentimentAdvice: "We encountered an issue calling our AI servers. Please take a gentle breath. You're doing great.",
            suggestedCoping: "Active Coping",
          };
          setAiResponse(fallback);
        }
      } catch (error) {
        console.error("Error saving journal entry:", error);
        const fallback: LocalSentimentResult = {
          sentiment: 'neutral',
          sentimentScore: 50,
          sentimentAdvice: "We encountered an issue calling our AI servers. Please take a gentle breath. You're doing great.",
          suggestedCoping: "Active Coping",
        };
        setAiResponse(fallback);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getMoodEmoji = (moodVal: string) => MOODS.find(m => m.value === moodVal)?.emoji || '😐';

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">My Journal</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/journal/insights" className="text-[12.5px] font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1.5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Insights
        </Link>
      </div>

      {/* Main entry card */}
      <GlassCard className="p-8 space-y-6">
        <form onSubmit={handleAnalyze} className="space-y-6">

          {/* Mood Picker */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-white/80 pl-1 block">How are you feeling today?</label>
            <div className="grid grid-cols-5 gap-2 md:gap-4">
              {MOODS.map((mood) => {
                const isActive = selectedMood === mood.value;
                return (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-br from-[#FF9F7C] to-[#E8734A] border-none text-white shadow-lg scale-105'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-1">{mood.emoji}</span>
                    <span className="text-[10px] font-semibold">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <textarea
              value={entryContent}
              onChange={(e) => setEntryContent(e.target.value)}
              placeholder="Write freely about how your body is healing, your sleep quality, baby feeding patterns, or whatever is on your mind. Everything you write stays strictly private."
              className="w-full bg-white/5 border border-white/20 rounded-2xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FF9F7C] transition-colors resize-none text-base font-poppins h-56"
              required
            />
          </div>

          {/* Metrics & Language Selection */}
          <div className="flex items-center justify-between text-xs text-white/50 pl-1">
            <div>
              Word Count: <span className="font-semibold text-[#FFCFBB]">{wordCount}</span>
            </div>
            <select
              value={entryLanguage}
              onChange={(e) => setEntryLanguage(e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg text-xs text-white py-1 px-3 focus:outline-none focus:border-[#FF9F7C] cursor-pointer"
            >
              <option value="en" className="bg-[#140804] text-white">🇬🇧 English</option>
              <option value="hi" className="bg-[#140804] text-white">🇮🇳 Hindi</option>
              <option value="te" className="bg-[#140804] text-white">Telugu</option>
              <option value="ta" className="bg-[#140804] text-white">Tamil</option>
              <option value="kn" className="bg-[#140804] text-white">Kannada</option>
            </select>
          </div>

          {/* Submit Button */}
          <PeachButton
            type="submit"
            disabled={!selectedMood || !entryContent.trim()}
            loading={isLoading}
            className="w-full !h-14 font-semibold text-base"
          >
            {!isLoading && "Analyze & Save"}
          </PeachButton>
        </form>
      </GlassCard>

      {/* Sentiment Analysis Loading Banner */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#FF9F7C] animate-spin"></div>
          <p className="text-sm font-medium text-white/70 font-poppins">Our AI is reading your entry with care...</p>
        </div>
      )}

      {/* AI Analysis Result Card */}
      {aiResponse && !isLoading && (
        <GlassCard className="p-8 space-y-6 border border-[#FF9F7C]/30 shadow-[0_8px_32px_rgba(232,115,74,0.1)] animate-fade-slide-up">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white font-poppins">AI Sentiment Response</h3>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${
              aiResponse.sentiment === 'positive'
                ? 'bg-[#4CAF7D]/20 text-[#4CAF7D] border border-[#4CAF7D]/30'
                : aiResponse.sentiment === 'negative'
                ? 'bg-[#D94F4F]/20 text-[#D94F4F] border border-[#D94F4F]/30'
                : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
            }`}>
              {aiResponse.sentiment}
            </span>
          </div>

          {/* Wellness Score bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-white/70">
              <span>Wellness Score</span>
              <span>{aiResponse.sentimentScore}/100</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] transition-all duration-1000"
                style={{ width: `${aiResponse.sentimentScore}%` }}
              />
            </div>
          </div>

          {/* Advice paragraph */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
            <span className="text-xs font-semibold text-white/50 block">A Gentle Thought For You</span>
            <p className="text-sm text-white/90 italic leading-relaxed font-poppins">{aiResponse.sentimentAdvice}</p>
          </div>

          {/* Suggested coping */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-white/70 font-medium">
              <span>Suggested coping strategy:</span>
              <span className="bg-[#FF9F7C]/20 border border-[#FF9F7C]/30 text-[#FFCFBB] font-bold rounded-lg px-2.5 py-1">
                {aiResponse.suggestedCoping}
              </span>
            </div>

            <button
              onClick={() => setFeedbackSuccess(true)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
                feedbackSuccess
                  ? 'bg-[#4CAF7D]/20 text-[#4CAF7D] border border-[#4CAF7D]/40'
                  : 'bg-white/5 border border-white/20 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {feedbackSuccess ? '👍 Saved to profile' : 'This helped me 👍'}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Past Entries */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#FFCFBB] pl-1 font-poppins">Past Entries</h3>
        {pastEntries.length === 0 ? (
          <p className="text-xs text-white/40 italic pl-1">Your past logs will appear here once saved.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pastEntries.map((entry) => {
              const dateLabel = new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <GlassCard
                  key={entry.id}
                  onClick={() => setSelectedPastEntry(entry)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/14 border-white/15 hover:border-white/30 transition-all hover:scale-[1.005]"
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white/50">{dateLabel}</span>
                      <span className="text-[#FF9F7C]">{getMoodEmoji(entry.mood ?? '')}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                        entry.sentiment === 'positive'
                          ? 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                          : entry.sentiment === 'negative'
                          ? 'bg-[#D94F4F]/20 text-[#D94F4F]'
                          : 'bg-amber-500/20 text-amber-500'
                      }`}>
                        {entry.sentiment ?? 'pending'}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 truncate leading-relaxed">{entry.content}</p>
                  </div>
                  <span className="text-white/40">➔</span>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Entry Modal */}
      {selectedPastEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140804]/90 backdrop-blur-md animate-fade-slide-up">
          <GlassCard className="w-full max-w-xl p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">
                  Entry on {new Date(selectedPastEntry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-xs text-white/50 flex items-center gap-1.5 mt-0.5">
                  Mood: <span className="text-[#FF9F7C] font-semibold">{getMoodEmoji(selectedPastEntry.mood ?? '')} ({selectedPastEntry.mood})</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPastEntry(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors font-poppins text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-poppins">
                  {selectedPastEntry.content}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/70">AI Sentiment Result</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    selectedPastEntry.sentiment === 'positive'
                      ? 'bg-[#4CAF7D]/20 text-[#4CAF7D]'
                      : selectedPastEntry.sentiment === 'negative'
                      ? 'bg-[#D94F4F]/20 text-[#D94F4F]'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    {selectedPastEntry.sentiment ?? 'pending'}
                  </span>
                </div>

                <div className="text-xs text-white/70 italic leading-relaxed">
                  <span className="font-semibold text-white/50 block mb-1">Coping Suggestion:</span>
                  {selectedPastEntry.suggestedCoping ?? '—'}
                </div>

                <div className="text-xs text-white/70 italic leading-relaxed border-t border-white/10 pt-3">
                  <span className="font-semibold text-white/50 block mb-1">Advice:</span>
                  {selectedPastEntry.sentimentAdvice ?? '—'}
                </div>
              </div>
            </div>

            <PeachButton onClick={() => setSelectedPastEntry(null)} className="w-full">
              Close Entry
            </PeachButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
