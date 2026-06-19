"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

const LANG_STRINGS: Record<string, {
  heading: string;
  subheading: string;
  continueBtn: string;
  enteringText: string;
  tagline: string;
  chipLabel: string;
}> = {
  en: { heading: 'Choose your\nlanguage', subheading: 'You can change this later in your profile', continueBtn: 'Continue', enteringText: 'Entering the Circle…', tagline: 'Your postpartum village awaits', chipLabel: 'English' },
  hi: { heading: 'अपनी भाषा\nचुनें', subheading: 'आप इसे बाद में अपनी प्रोफाइल में बदल सकती हैं', continueBtn: 'आगे बढ़ें', enteringText: 'प्रवेश हो रहा है…', tagline: 'आपका प्रसवोत्तर गाँव इंतज़ार कर रहा है', chipLabel: 'हिन्दी' },
  te: { heading: 'మీ భాషను\nఎంచుకోండి', subheading: 'మీరు దీన్ని తర్వాత మీ ప్రొఫైల్‌లో మార్చవచ్చు', continueBtn: 'కొనసాగించు', enteringText: 'సర్కిల్‌లోకి ప్రవేశిస్తోంది…', tagline: 'మీ ప్రసవానంతర గ్రామం వేచి ఉంది', chipLabel: 'తెలుగు' },
  ta: { heading: 'உங்கள் மொழியை\nதேர்ந்தெடுங்கள்', subheading: 'இதை நீங்கள் பின்னர் மாற்றலாம்', continueBtn: 'தொடரவும்', enteringText: 'சர்க்கிளில் நுழைகிறது…', tagline: 'உங்கள் பிரசவகால கிராமம் காத்திருக்கிறது', chipLabel: 'தமிழ்' },
  kn: { heading: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು\nಆಯ್ಕೆಮಾಡಿ', subheading: 'ನೀವು ಇದನ್ನು ನಂತರ ಬದಲಾಯಿಸಬಹುದು', continueBtn: 'ಮುಂದುವರಿಯಿರಿ', enteringText: 'ಸರ್ಕಲ್‌ಗೆ ಪ್ರವೇಶಿಸುತ್ತಿದೆ…', tagline: 'ನಿಮ್ಮ ಪ್ರಸವೋತ್ತರ ಗ್ರಾಮ ಕಾಯುತ್ತಿದೆ', chipLabel: 'ಕನ್ನಡ' },
};

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी',  flag: '🇮🇳' },
  { code: 'te', label: 'Telugu',   native: 'తెలుగు',  flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada',  native: 'ಕನ್ನಡ',  flag: '🇮🇳' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/signup');
  }, [user, loading, router]);

  useEffect(() => {
    if (userProfile?.language) {
      setSelectedLang(userProfile.language);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nmc_selected_language');
      if (saved) setSelectedLang(saved);
    }
  }, [userProfile]);

  const handleSelect = (code: string) => {
    setSelectedLang(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nmc_selected_language', code);
      const existing = localStorage.getItem('nmc_mock_profile');
      if (existing) {
        try {
          const profile = JSON.parse(existing);
          profile.language = code;
          localStorage.setItem('nmc_mock_profile', JSON.stringify(profile));
        } catch { /* ignore */ }
      }
    }
  };

  const handleContinue = () => {
    setIsContinuing(true);
    setTimeout(() => router.push('/feed'), 350);
  };

  const t = LANG_STRINGS[selectedLang] ?? LANG_STRINGS.en;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0705]">
        <div className="w-9 h-9 rounded-full border-2 border-t-[#FF9F7C] border-white/10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0E0705] flex items-center justify-center overflow-hidden" data-testid="onboarding-screen">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[35%] w-[500px] h-[500px] rounded-full bg-[#E8734A]/8 blur-[140px]" />
        <div className="absolute bottom-0 right-[15%] w-[350px] h-[350px] rounded-full bg-[#FF9F7C]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[360px] mx-auto px-5 py-12 flex flex-col min-h-screen">

        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.15"/>
              <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
              <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
              <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.85"/>
            </svg>
            <span className="text-[13px] font-bold text-white/60 font-poppins tracking-tight">
              NewMom<span className="text-[#FF9F7C]">Circle</span>
            </span>
          </div>
        </div>

        {/* Heading — animated */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLang}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h1
              className="text-[28px] font-bold text-white font-poppins leading-tight"
              style={{ whiteSpace: 'pre-line' }}
            >
              {t.heading}
            </h1>
            <p className="text-[13px] text-white/40 mt-2 font-inter">
              {t.subheading}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Language List */}
        <div className="space-y-2.5 flex-grow">
          {LANGUAGES.map((lang, idx) => {
            const isSelected = selectedLang === lang.code;
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handleSelect(lang.code)}
                data-testid={`onboarding-lang-${lang.code}-btn`}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] border transition-all duration-150 text-left ${
                  isSelected
                    ? 'bg-white/[0.10] border-white/25 shadow-[0_2px_16px_rgba(255,159,124,0.12)]'
                    : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07] hover:border-white/12'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[20px] leading-none">{lang.flag}</span>
                  <div>
                    <span className="text-[14.5px] font-semibold text-white font-poppins">{lang.native}</span>
                    {lang.code !== 'en' && (
                      <span className="text-[11.5px] text-white/40 ml-1.5">· {lang.label}</span>
                    )}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#FF9F7C] border-[#FF9F7C]'
                      : 'bg-transparent border-white/20'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-[#2D1B13]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue */}
        <div className="mt-8 pb-4">
          <motion.button
            onClick={handleContinue}
            disabled={isContinuing}
            whileHover={{ scale: isContinuing ? 1 : 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-[14px] rounded-full font-poppins font-semibold text-[15px] text-[#2D1B13] transition-all duration-200 disabled:opacity-60"
            data-testid="onboarding-continue-btn"
            style={{
              background: 'linear-gradient(135deg, #FFCFBB 0%, #FF9F7C 50%, #E8734A 100%)',
              boxShadow: isContinuing ? 'none' : '0 6px 24px rgba(232,115,74,0.40)',
            }}
          >
            {isContinuing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t.enteringText}
              </span>
            ) : (
              t.continueBtn
            )}
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.p
              key={selectedLang + '-tagline'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center text-[11.5px] text-white/25 mt-4 font-inter"
            >
              {t.tagline}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
