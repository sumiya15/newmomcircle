"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';

// -------------------------------------------------------------
// Seed Datasets for Toolbox
// -------------------------------------------------------------
const AFFIRMATIONS = [
  { id: '1', text: "I am doing the best I can, and that is more than enough.", reflection: "What is one thing you did well today, no matter how small?" },
  { id: '2', text: "My body is strong, healing, and capable of amazing things.", reflection: "Write down one way your body has supported you and your baby." },
  { id: '3', text: "I deserve rest, patience, and compassion from myself.", reflection: "How can you carve out 5 minutes of absolute rest today?" },
  { id: '4', text: "It is okay to ask for help; I do not have to carry this alone.", reflection: "Who is one person you could reach out to for support today?" },
  { id: '5', text: "My baby chose me, and I am the perfect mother for them.", reflection: "What is a moment of connection you shared with your baby today?" },
  { id: '6', text: "I am allowed to feel tired and overwhelmed. All my feelings are valid.", reflection: "Take a moment to write down what is overwhelming you, then let it go." }
];

const JOKES = [
  "Sleep when the baby sleeps. Clean when the baby cleans. Fold laundry when the baby folds laundry. Simple! 👶🧹",
  "The fact that you haven't run away yet? Chef's kiss! 👨‍🍳 You are doing great.",
  "Current mood: My baby has been asleep for 20 minutes and I already miss them, but also if they wake up I will cry. 🤷‍♀️",
  "I love my kids. Except when they wake up. And when they go to sleep. And the 12 hours in between. Other than that, they are angels! 👼",
  "My baby chose YOU specifically. Out of all the humans on Earth. Think about that when you are covered in spit-up."
];

// ─── VISUALIZATION VIDEOS ────────────────────────────────────────────────────
const VISUALIZATION_VIDEOS = [
  { id: "v1", title: "Beach Escape", duration: "5 min", youtubeId: "hEBej29G8yQ", thumbnail: "https://img.youtube.com/vi/hEBej29G8yQ/maxresdefault.jpg", description: "A peaceful beach visualization to calm postpartum anxiety" },
  { id: "v2", title: "Garden Path", duration: "7 min", youtubeId: "z0-MGBMY7aM", thumbnail: "https://img.youtube.com/vi/z0-MGBMY7aM/maxresdefault.jpg", description: "Walk through a healing garden in this guided meditation" },
  { id: "v3", title: "Mountain Sunrise", duration: "10 min", youtubeId: "1vx8iUvfyCY", thumbnail: "https://img.youtube.com/vi/1vx8iUvfyCY/maxresdefault.jpg", description: "A peaceful sunrise mountain scene for deep relaxation" },
  { id: "v4", title: "Forest Rain", duration: "15 min", youtubeId: "q76bMs-NwRk", thumbnail: "https://img.youtube.com/vi/q76bMs-NwRk/maxresdefault.jpg", description: "Gentle rain sounds in a peaceful forest" },
  { id: "v5", title: "Ocean Waves", duration: "20 min", youtubeId: "bn9F19Hi1Lk", thumbnail: "https://img.youtube.com/vi/bn9F19Hi1Lk/maxresdefault.jpg", description: "Calming ocean waves for postpartum stress relief" },
  { id: "v6", title: "Healing Light", duration: "8 min", youtubeId: "inpok4MKVLM", thumbnail: "https://img.youtube.com/vi/inpok4MKVLM/maxresdefault.jpg", description: "A loving-kindness meditation for new mothers" },
];

// ─── EXERCISE PROGRAM (7-Day) ────────────────────────────────────────────────
const EXERCISE_PROGRAM = [
  {
    day: 1, theme: "Gentle Awakening",
    exercises: [
      { name: "Pelvic Floor Breathing", duration: "3 min", youtubeId: "OO1y0k2BROU", thumbnail: "https://img.youtube.com/vi/OO1y0k2BROU/maxresdefault.jpg" },
      { name: "Ankle Circles", duration: "2 min", youtubeId: "BAPHPoGxkPM", thumbnail: "https://img.youtube.com/vi/BAPHPoGxkPM/maxresdefault.jpg" },
    ]
  },
  {
    day: 2, theme: "Gentle Core Activation",
    exercises: [
      { name: "Diaphragmatic Breathing", duration: "5 min", youtubeId: "ri2p4ljpkFI", thumbnail: "https://img.youtube.com/vi/ri2p4ljpkFI/maxresdefault.jpg" },
      { name: "Cat-Cow Stretch", duration: "4 min", youtubeId: "kqnua4rHVVA", thumbnail: "https://img.youtube.com/vi/kqnua4rHVVA/maxresdefault.jpg" },
    ]
  },
  {
    day: 3, theme: "Hip & Pelvis Care",
    exercises: [
      { name: "Supported Bridge", duration: "5 min", youtubeId: "OmYNpD2OoUk", thumbnail: "https://img.youtube.com/vi/OmYNpD2OoUk/maxresdefault.jpg" },
      { name: "Hip Flexor Stretch", duration: "4 min", youtubeId: "YqF8GBnpChU", thumbnail: "https://img.youtube.com/vi/YqF8GBnpChU/maxresdefault.jpg" },
    ]
  },
  {
    day: 4, theme: "Upper Body Release",
    exercises: [
      { name: "Shoulder Rolls & Neck Stretch", duration: "5 min", youtubeId: "cMp9Y3kNt88", thumbnail: "https://img.youtube.com/vi/cMp9Y3kNt88/maxresdefault.jpg" },
    ]
  },
  {
    day: 5, theme: "Walking & Breathing",
    exercises: [
      { name: "Mindful Walking Meditation", duration: "10 min", youtubeId: "YFCcW7QHFQM", thumbnail: "https://img.youtube.com/vi/YFCcW7QHFQM/maxresdefault.jpg" },
    ]
  },
  {
    day: 6, theme: "Full Body Gentle Flow",
    exercises: [
      { name: "Postpartum Yoga Flow", duration: "15 min", youtubeId: "Sng8rNNQtMQ", thumbnail: "https://img.youtube.com/vi/Sng8rNNQtMQ/maxresdefault.jpg" },
    ]
  },
  {
    day: 7, theme: "Rest & Restore",
    exercises: [
      { name: "Restorative Yin Yoga", duration: "20 min", youtubeId: "UBMk30rjy0o", thumbnail: "https://img.youtube.com/vi/UBMk30rjy0o/maxresdefault.jpg" },
    ]
  }
];

export default function ToolboxPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // 1. Affirmations State
  const [affIndex, setAffIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bookmarkedAff, setBookmarkedAff] = useState<string[]>([]);

  // 2. Breathing State
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathTimer, setBreathTimer] = useState(4);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathingSession, setBreathingSession] = useState(1);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Grounding State
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<string[]>(['', '', '', '', '']);

  // 4. Laughter State
  const [jokeIndex, setJokeIndex] = useState(0);
  const [jokeLikes, setJokeLikes] = useState<Record<number, number>>({});

  // 5. YouTube Video Modal (shared between visualization & movement)
  const [ytModal, setYtModal] = useState<{ youtubeId: string; title: string; description: string } | null>(null);

  // 6. Movement State
  const [activeDay, setActiveDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  // Load completed days from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('newmomcircle_completed_days');
    if (saved) setCompletedDays(JSON.parse(saved));
  }, []);

  // Clean intervals
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    };
  }, []);

  // Breathing loop
  useEffect(() => {
    if (isBreathingRunning) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === 'Inhale') return 'Hold';
              if (currentPhase === 'Hold') return 'Exhale';
              if (currentPhase === 'Exhale') return 'Rest';
              setBreathingSession((s) => (s < 5 ? s + 1 : 1));
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathingIntervalRef.current) { clearInterval(breathingIntervalRef.current); breathingIntervalRef.current = null; }
    }
    return () => { if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current); };
  }, [isBreathingRunning]);

  // Helpers
  const toggleBookmarkAffirmation = (id: string) => {
    setBookmarkedAff((prev) => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleNextGrounding = () => { if (groundingStep < 5) setGroundingStep((s) => s + 1); };

  const handleJokeLike = (idx: number) => {
    setJokeLikes(prev => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
  };

  const toggleDayComplete = (day: number) => {
    const updated = completedDays.includes(day)
      ? completedDays.filter(d => d !== day)
      : [...completedDays, day];
    setCompletedDays(updated);
    localStorage.setItem('newmomcircle_completed_days', JSON.stringify(updated));
  };

  const currentDayData = EXERCISE_PROGRAM.find(d => d.day === activeDay)!;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full pb-10" data-testid="toolbox-screen">
      
      {/* Page Header */}
      <div className="mb-1">
        <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Wellness Toolbox</h1>
        <p className="text-[13px] text-white/40 mt-0.5">Daily tools for calm and clarity</p>
      </div>

      {/* Grid Suite of 6 tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Tool 1: Affirmations */}
        <GlassCard onClick={() => setActiveTool('affirmations')} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-affirmations-btn">
          <div className="w-10 h-10 rounded-xl bg-[#FF9F7C]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">Affirmations</h3>
          <p className="text-xs text-white/60 leading-relaxed">Flip cards to read daily affirmations and self-reflection prompts.</p>
        </GlassCard>

        {/* Tool 2: Breathing */}
        <GlassCard onClick={() => setActiveTool('breathing')} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-breathing-btn">
          <div className="w-10 h-10 rounded-xl bg-[#A8C5A0]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">Box Breathing</h3>
          <p className="text-xs text-white/60 leading-relaxed">Standard 4-4-4 breathing cycle with circular SVG pacing gauges.</p>
        </GlassCard>

        {/* Tool 3: Grounding */}
        <GlassCard onClick={() => { setActiveTool('grounding'); setGroundingStep(0); setGroundingInputs(['', '', '', '', '']); }} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-grounding-btn">
          <div className="w-10 h-10 rounded-xl bg-[#FFCFBB]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFCFBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">5-Sense Grounding</h3>
          <p className="text-xs text-white/60 leading-relaxed">Calm anxiety by returning to the present moment using five senses.</p>
        </GlassCard>

        {/* Tool 4: Laughter */}
        <GlassCard onClick={() => setActiveTool('laughter')} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-laughter-btn">
          <div className="w-10 h-10 rounded-xl bg-[#F4A1A1]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4A1A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">Laughter &amp; Light</h3>
          <p className="text-xs text-white/60 leading-relaxed">Read uplifting parenting quotes and jokes from modern motherhood.</p>
        </GlassCard>

        {/* Tool 5: Visualization */}
        <GlassCard onClick={() => setActiveTool('visualization')} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-visualization-btn">
          <div className="w-10 h-10 rounded-xl bg-[#A8C5A0]/15 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A8C5A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6s1-1 4-1 5 2 8 2 4-1 4-1V22s-1 1-4 1-5-2-8-2-4 1-4 1V6z"/><line x1="1" y1="2" x2="1" y2="6"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">Visualization</h3>
          <p className="text-xs text-white/60 leading-relaxed">Guided meditations to transport your mind to tranquil landscapes.</p>
        </GlassCard>

        {/* Tool 6: Gentle Movement */}
        <GlassCard onClick={() => setActiveTool('movement')} hoverEffect={true} className="p-6 cursor-pointer flex flex-col space-y-3 items-start text-left" data-testid="toolbox-movement-btn">
          <div className="w-10 h-10 rounded-xl bg-[#FF9F7C]/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2a2 2 0 100 4 2 2 0 000-4z"/><path d="M5 7l2 7h2l2-5 2 5h2l2-7"/><path d="M5 19l2-4h6l2 4"/></svg>
          </div>
          <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">Gentle Movement</h3>
          <p className="text-xs text-white/60 leading-relaxed">Safe, physical postpartum exercises supporting soft body healing.</p>
        </GlassCard>
      </div>

      {/* ── YouTube Video Modal (shared) ────────────────────────────────── */}
      {ytModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setYtModal(null)} className="text-white/70 hover:text-white text-2xl font-bold bg-white/10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">×</button>
            </div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/20 bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ytModal.youtubeId}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="px-1">
              <h4 className="text-lg font-bold text-white font-poppins">{ytModal.title}</h4>
              <p className="text-sm text-white/60 mt-1">{ytModal.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Affirmations Overlay */}
      {activeTool === 'affirmations' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-8 relative space-y-6 border border-white/20">
            <button onClick={() => setActiveTool(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
            <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Affirmations</h3>

            <div onClick={() => setIsFlipped(!isFlipped)} className="w-full h-48 cursor-pointer perspective">
              <div className={`relative w-full h-full duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center backface-hidden">
                  <p className="text-lg font-medium text-white italic font-poppins leading-relaxed">
                    &ldquo;{AFFIRMATIONS[affIndex].text}&rdquo;
                  </p>
                  <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-4">Tap to read reflection prompt</span>
                </div>
                <div className="absolute inset-0 bg-[#FF9F7C]/10 border border-[#FF9F7C]/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                  <span className="text-xs font-bold text-[#FF9F7C] uppercase tracking-wider mb-2">Reflection Prompt</span>
                  <p className="text-sm font-semibold text-white/95 leading-relaxed font-poppins">{AFFIRMATIONS[affIndex].reflection}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={(e) => { e.stopPropagation(); toggleBookmarkAffirmation(AFFIRMATIONS[affIndex].id); }} className="btn-secondary !px-4 !py-2 !text-xs flex items-center gap-1.5">
                <span>{bookmarkedAff.includes(AFFIRMATIONS[affIndex].id) ? '❤️' : '♡'}</span>
                <span>Bookmark</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsFlipped(false); setAffIndex((idx) => (idx > 0 ? idx - 1 : AFFIRMATIONS.length - 1)); }} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center" data-testid="toolbox-prev-affirmation-btn">←</button>
                <button onClick={() => { setIsFlipped(false); setAffIndex((idx) => (idx < AFFIRMATIONS.length - 1 ? idx + 1 : 0)); }} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center" data-testid="toolbox-next-affirmation-btn">→</button>
              </div>
              <PeachButton onClick={() => { setIsFlipped(false); setAffIndex(Math.floor(Math.random() * AFFIRMATIONS.length)); }} className="!px-4 !py-2 !text-xs">Shuffle</PeachButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 2. Box Breathing Overlay */}
      {activeTool === 'breathing' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-8 relative flex flex-col items-center text-center space-y-6 border border-white/20">
            <button onClick={() => { setActiveTool(null); setIsBreathingRunning(false); }} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
            <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Box Breathing (4-4-4)</h3>
            <div className="relative w-56 h-56 flex items-center justify-center mt-4">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="112" cy="112" r="100" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                <circle cx="112" cy="112" r="100" stroke="#FF9F7C" strokeWidth="8" fill="transparent" strokeDasharray="628" strokeDashoffset={628 - (628 * (4 - breathTimer)) / 4} className="transition-all duration-1000 ease-linear" />
              </svg>
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#FF9F7C]/30 to-[#E8734A]/30 border-2 border-[#FF9F7C]/50 flex flex-col items-center justify-center transition-all ease-linear" style={{ transform: `scale(${breathPhase === 'Inhale' ? 0.7 + (0.3 * (4 - breathTimer)) / 4 : breathPhase === 'Hold' ? 1.0 : breathPhase === 'Exhale' ? 1.0 - (0.3 * (4 - breathTimer)) / 4 : 0.7})`, transitionDuration: '1000ms' }}>
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{breathPhase}</span>
                <span className="text-4xl font-bold text-white mt-1 font-poppins">{breathTimer}s</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/50 font-medium">Session {breathingSession} of 5</p>
              <p className="text-xs text-white/80 font-poppins leading-relaxed max-w-xs mx-auto">&ldquo;Exhale longer than you inhale to activate your parasympathetic nervous system.&rdquo;</p>
            </div>
            <PeachButton onClick={() => setIsBreathingRunning(!isBreathingRunning)} className="w-full !h-12 text-sm font-semibold" data-testid="toolbox-breath-btn">
              {isBreathingRunning ? 'Pause Session' : 'Start Breathing'}
            </PeachButton>
          </GlassCard>
        </div>
      )}

      {/* 3. 5-Sense Grounding Overlay */}
      {activeTool === 'grounding' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg p-8 relative space-y-6 border border-white/20">
            <button onClick={() => setActiveTool(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
            <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">5-Sense Grounding</h3>
            {groundingStep < 5 ? (
              <div className="space-y-4 animate-fade-slide-up">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF9F7C]" style={{ width: `${(groundingStep * 100) / 5}%` }}></div>
                </div>
                {[
                  { emoji: '👁️', label: 'Name 5 things you can SEE right now' },
                  { emoji: '✋', label: 'Name 4 things you can TOUCH right now' },
                  { emoji: '👂', label: 'Name 3 things you can HEAR right now' },
                  { emoji: '👃', label: 'Name 2 things you can SMELL right now' },
                  { emoji: '👅', label: 'Name 1 thing you can TASTE right now' },
                ].filter((_, i) => i === groundingStep).map((step, i) => (
                  <div key={i} className="space-y-3 animate-fade-slide-up">
                    <span className="text-4xl block">{step.emoji}</span>
                    <h4 className="text-base font-semibold text-white font-poppins">{step.label}</h4>
                    <input type="text" value={groundingInputs[groundingStep]} onChange={(e) => { const inputs = [...groundingInputs]; inputs[groundingStep] = e.target.value; setGroundingInputs(inputs); }} className="glass-input" placeholder="Type details here..." />
                  </div>
                ))}
                <PeachButton onClick={handleNextGrounding} disabled={!groundingInputs[groundingStep].trim()} className="w-full !h-12 mt-4 text-xs font-semibold">Next →</PeachButton>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4 animate-fade-slide-up">
                <div className="w-14 h-14 rounded-full bg-[#FF9F7C]/15 border border-[#FF9F7C]/20 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </div>
                <h4 className="text-xl font-bold text-white font-poppins">You&apos;ve returned to the present moment.</h4>
                <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">Excellent work. Carry this feeling of presence and calmness into your next activity.</p>
                <PeachButton onClick={() => setActiveTool(null)} className="w-full mt-4 !h-12 text-xs font-semibold">Finish Exercise</PeachButton>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* 4. Laughter Overlay */}
      {activeTool === 'laughter' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-8 relative space-y-6 border border-white/20 text-center">
            <button onClick={() => setActiveTool(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
            <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Laughter &amp; Light</h3>
            <div className="relative w-full h-44 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-[#FF9F7C] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              <p className="text-sm font-semibold text-white leading-relaxed font-poppins">{JOKES[jokeIndex]}</p>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => handleJokeLike(jokeIndex)} className="btn-secondary !px-4 !py-2 !text-xs flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                <span>{jokeLikes[jokeIndex] || 0} Likes</span>
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setJokeIndex((idx) => (idx > 0 ? idx - 1 : JOKES.length - 1))} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center" data-testid="toolbox-prev-joke-btn">←</button>
                <button onClick={() => setJokeIndex((idx) => (idx < JOKES.length - 1 ? idx + 1 : 0))} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center" data-testid="toolbox-next-joke-btn">→</button>
              </div>
              <button onClick={() => alert("Copied link to clipboard!")} className="btn-secondary !px-4 !py-2 !text-xs">Share</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 5. Guided Visualization — YouTube Videos */}
      {activeTool === 'visualization' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-3xl p-8 relative space-y-6 border border-white/20 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveTool(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl z-20">×</button>
            <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Guided Visualization</h3>
            <p className="text-xs text-white/60">Choose a scene and let your mind find peace</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {VISUALIZATION_VIDEOS.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setYtModal({ youtubeId: video.youtubeId, title: video.title, description: video.description })}
                  className="relative rounded-2xl h-44 overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform border border-white/10 group"
                >
                  <img src={video.thumbnail} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" alt={video.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-[#FF9F7C]/90 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-[10px] bg-[#FF9F7C]/80 text-white font-bold px-2 py-0.5 rounded">{video.duration}</span>
                    <h4 className="text-sm font-bold text-white font-poppins mt-1">{video.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* 6. Gentle Movement — 7-Day Program */}
      {activeTool === 'movement' && (
        <div className="fixed inset-0 z-50 bg-[#140804]/90 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-2xl p-8 relative space-y-6 border border-white/20 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setActiveTool(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">×</button>
            
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Postpartum Movement</h3>
              <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-xl font-semibold text-[#FF9F7C]">
                {completedDays.length} of 7 days completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4CAF7D] to-[#2E8B57] transition-all duration-500" style={{ width: `${(completedDays.length / 7) * 100}%` }} />
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {EXERCISE_PROGRAM.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(day.day)}
                  className={`relative flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDay === day.day
                      ? 'bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  Day {day.day}
                  {completedDays.includes(day.day) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4CAF7D] rounded-full text-[8px] text-white flex items-center justify-center font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Day content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white font-poppins">Day {currentDayData.day}: {currentDayData.theme}</h4>
                  <p className="text-xs text-white/50 mt-0.5">{currentDayData.exercises.length} exercise{currentDayData.exercises.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-[10px] leading-relaxed flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Always consult your obstetrician or medical professional before commencing any physical exercises postpartum.</span>
              </div>

              {/* Exercise cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDayData.exercises.map((ex, i) => (
                  <div
                    key={i}
                    onClick={() => setYtModal({ youtubeId: ex.youtubeId, title: ex.name, description: `${ex.duration} · Day ${currentDayData.day}: ${currentDayData.theme}` })}
                    className="relative rounded-2xl overflow-hidden border border-white/10 cursor-pointer group hover:scale-[1.02] transition-transform"
                  >
                    <div className="aspect-video relative">
                      <img src={ex.thumbnail} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" alt={ex.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#FF9F7C]/80 backdrop-blur-sm flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <svg className="w-5 h-5 text-white fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      </div>
                      <span className="absolute top-3 right-3 text-[10px] bg-black/60 backdrop-blur-sm text-white font-bold px-2 py-0.5 rounded">{ex.duration}</span>
                    </div>
                    <div className="p-3">
                      <h5 className="text-sm font-bold text-white font-poppins">{ex.name}</h5>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mark Complete */}
              <PeachButton
                onClick={() => toggleDayComplete(activeDay)}
                className="w-full !h-12 text-sm font-semibold"
              >
                {completedDays.includes(activeDay) ? '✓ Day Completed — Tap to Undo' : 'Mark Day Complete ✓'}
              </PeachButton>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
