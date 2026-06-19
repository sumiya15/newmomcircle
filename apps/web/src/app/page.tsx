"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { HeroVideo } from '@/components/ui/HeroVideo';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playDemo, setPlayDemo] = useState(false);

  // Monitor scroll height to deepen Navbar background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#140804] text-white">
      {/* 4.1.1 — Fixed Navbar */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 font-poppins ${
          isScrolled
            ? 'bg-[#0E0705]/92 backdrop-blur-2xl py-3.5 border-b border-white/[0.07]'
            : 'bg-transparent backdrop-blur-sm py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="flex-shrink-0">
              <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.2"/>
              <circle cx="20" cy="20" r="18" fill="none" stroke="#FF9F7C" strokeWidth="1.5"/>
              <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
              <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
              <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.8"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-white">
              NewMom<span className="text-[#FF9F7C]">Circle</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <a href="#home" className="hover:text-[#FF9F7C] transition-colors">Home</a>
            <a href="#features" className="hover:text-[#FF9F7C] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#FF9F7C] transition-colors">How It Works</a>
            <a href="#testimonials" className="hover:text-[#FF9F7C] transition-colors">Community</a>
            <a href="#safety-support" className="hover:text-[#FF9F7C] transition-colors">Get Help</a>
          </div>

          {/* Desktop Auth CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="px-6 py-2.5 rounded-full border border-white/30 text-white text-sm font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
              data-testid="landing-signin-btn"
            >
              Sign In
            </Link>
            <Link href="/auth/signup" data-testid="landing-signup-btn">
              <PeachButton className="!px-6 !py-2.5 text-sm !font-semibold">
                Get Started Free →
              </PeachButton>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-[#FF9F7C] transition-colors focus:outline-none"
            aria-label="Toggle menu"
            data-testid="landing-mobile-menu-btn"
          >
            {isMobileMenuOpen ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Full-Screen Slide-Down Menu */}
        <div 
          className={`md:hidden fixed top-[73px] left-0 w-full h-[calc(100vh-73px)] bg-[#140804]/96 backdrop-blur-[24px] z-40 flex flex-col p-8 space-y-6 transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <a href="#home" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium hover:text-[#FF9F7C] transition-colors">Home</a>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium hover:text-[#FF9F7C] transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium hover:text-[#FF9F7C] transition-colors">How It Works</a>
          <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium hover:text-[#FF9F7C] transition-colors">Community</a>
          <a href="#safety-support" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium hover:text-[#FF9F7C] transition-colors">Get Help</a>
          
          <div className="pt-6 flex flex-col space-y-4">
            <Link 
              href="/auth/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-4 rounded-full border border-white/30 text-white text-base font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
            <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
              <PeachButton className="w-full !py-4 text-base !font-semibold">
                Get Started Free →
              </PeachButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* 4.1.2 — Hero Section — VIDEO BACKGROUND */}
      <span id="home" className="absolute top-0 w-full h-1" />
      <HeroVideo>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pt-24 pb-12">
          {/* Badge */}
          <div className="hero-badge cursor-default">
            🌸 Trusted by 2,400+ Indian mothers · Built with clinical research
          </div>

          {/* Heading */}
          <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold leading-tight font-poppins tracking-tight max-w-3xl mb-8 animate-fade-slide-up">
            You Are Not Alone
            <br />
            In This{' '}
            <span className="relative inline-block text-[#FF9F7C]">
              Journey
              <svg className="absolute left-0 -bottom-3 w-full h-4 text-[#FF9F7C]" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="currentColor" strokeWidth="3" className="animate-wave-draw" />
              </svg>
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-white/80 text-lg sm:text-xl font-poppins max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered mood support, real community, emergency safety, and a full wellness toolbox — all in one warm, private space built for Indian mothers.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link href="/auth/signup">
              <PeachButton data-testid="landing-hero-cta-btn" className="!px-10 !py-4.5 text-lg !font-semibold shadow-[0_8px_32px_rgba(232,115,74,0.45)] hover:scale-[1.02] transition-transform">
                Begin Your Journey →
              </PeachButton>
            </Link>
            <a 
              href="#demo"
              className="btn-secondary !px-8 !py-4.5 text-lg !font-semibold flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              Watch 90-Second Demo
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-sm font-semibold text-white/70 border-t border-white/10 pt-10 w-full max-w-3xl">
            <div className="flex items-center justify-center gap-2">
              <span>🔒</span> 100% Private & Encrypted
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>✅</span> Clinically Validated
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🌏</span> 5 Indian Languages
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>⭐</span> 4.9/5 from 800+ Reviews
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator animate-bounce-custom">
          <span>Scroll Down</span>
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </HeroVideo>

      {/* 4.1.3 — "How It Works" Section */}
      <section id="how-it-works" className="py-24 bg-[#0E0705] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <span className="text-[#FF9F7C] text-xs font-bold tracking-widest uppercase">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold font-poppins">Three Simple Steps</h2>
            <p className="text-white/50">A supportive ecosystem designed to walk with you at every stage.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col space-y-4">
              <span className="absolute -top-12 left-4 text-[#FF9F7C]/30 text-8xl font-bold font-poppins select-none leading-none">01</span>
              <GlassCard className="pt-16 p-8 relative flex-grow space-y-4">
                <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Create Your Profile</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {"Answer 5 simple check-in questions about how you're feeling. It takes less than 2 minutes and is completely secure."}
                </p>
              </GlassCard>
              {/* Desktop Arrow */}
              <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-[#FF9F7C] text-2xl font-bold select-none pointer-events-none z-20 animate-pulse">
                ➔
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col space-y-4">
              <span className="absolute -top-12 left-4 text-[#FF9F7C]/30 text-8xl font-bold font-poppins select-none leading-none">02</span>
              <GlassCard className="pt-16 p-8 relative flex-grow space-y-4">
                <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Journal Daily</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Write freely in your own language. Our empathetic AI reviews entries for early postpartum distress and offers warm, clinical suggestions.
                </p>
              </GlassCard>
              {/* Desktop Arrow */}
              <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-[#FF9F7C] text-2xl font-bold select-none pointer-events-none z-20 animate-pulse">
                ➔
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col space-y-4">
              <span className="absolute -top-12 left-4 text-[#FF9F7C]/30 text-8xl font-bold font-poppins select-none leading-none">03</span>
              <GlassCard className="pt-16 p-8 relative flex-grow space-y-4">
                <h3 className="text-xl font-bold text-[#FFCFBB] font-poppins">Grow Together</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Analyze weekly mood charts, consult with volunteer mentors, exchange stories in the feed, and trigger one-tap safety SOS if ever needed.
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* 4.1.4 — Stats Bar */}
      <section className="py-12 bg-gradient-to-r from-[#140804] via-[#1A0C08] to-[#140804] border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard className="!bg-[#FF9F7C]/8 flex items-center justify-between p-8">
              <div className="space-y-1">
                <span className="text-4xl font-bold text-[#FF9F7C] font-poppins">2,400+</span>
                <p className="text-white/70 text-sm font-medium">Mothers Supported</p>
              </div>
              <span className="text-3xl">🌸</span>
            </GlassCard>

            <GlassCard className="!bg-[#FF9F7C]/8 flex items-center justify-between p-8">
              <div className="space-y-1">
                <span className="text-4xl font-bold text-[#FF9F7C] font-poppins">94%</span>
                <p className="text-white/70 text-sm font-medium">Report Feeling Less Alone</p>
              </div>
              <span className="text-3xl">❤️</span>
            </GlassCard>

            <GlassCard className="!bg-[#FF9F7C]/8 flex items-center justify-between p-8">
              <div className="space-y-1">
                <span className="text-4xl font-bold text-[#FF9F7C] font-poppins">5</span>
                <p className="text-white/70 text-sm font-medium">Indian Languages Supported</p>
              </div>
              <span className="text-3xl">🌏</span>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 4.1.5 — Features Grid */}
      <section id="features" className="py-24 bg-[#140804]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <span className="text-[#FF9F7C] text-xs font-bold tracking-widest uppercase">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold font-poppins">Everything You Need</h2>
            <p className="text-white/50">A clinical-grade toolkit optimized for modern mothers, accessible privately at any time.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">🧠</span>
              <h3 className="text-xl font-bold text-white font-poppins">AI Mood Journal</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Write freely. Our proprietary sentiment model reviews entries for early signs of postpartum depression, offering support without clinical judgment.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>

            {/* Feature 2 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">📊</span>
              <h3 className="text-xl font-bold text-white font-poppins">Clinical Insights</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Review automated wellness graphs. Check-in results are compared directly against research data from over 1,500 clinical postpartum cases.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>

            {/* Feature 3 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">💬</span>
              <h3 className="text-xl font-bold text-white font-poppins">Community Circle</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Publish postings in your native dialect. Connect with local volunteers, request support, and share motherhood advice anonymously.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>

            {/* Feature 4 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">🆘</span>
              <h3 className="text-xl font-bold text-white font-poppins">Emergency SOS</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                One-tap activation or a physical phone shake triggers custom SMS warnings and automated phone calls to configured safety guardians instantly.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>

            {/* Feature 5 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">🧘‍♀️</span>
              <h3 className="text-xl font-bold text-white font-poppins">Wellness Toolbox</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Access curated box-breathing trackers, daily mental affirmations, 5-sense mindfulness grounding, and safe postnatal movement programs.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>

            {/* Feature 6 */}
            <GlassCard hoverEffect={true} className="flex flex-col space-y-4">
              <span className="text-5xl">🌏</span>
              <h3 className="text-xl font-bold text-white font-poppins">5 Indian Languages</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Read and compose in English, Hindi, Telugu, Tamil, or Kannada. Feel most comfortable speaking and healing in your mother tongue.
              </p>
              <Link href="/auth/signup" className="text-sm font-semibold text-[#FF9F7C] hover:text-[#FFCFBB] flex items-center gap-1 mt-auto pt-4 group">
                Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 4.1.6 — Demo Video Section */}
      <section id="demo" className="py-24 bg-[#140804] relative">
        <div className="absolute inset-0 bg-[#E8734A]/5 blur-[120px] rounded-full pointer-events-none max-w-3xl mx-auto top-12" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold font-poppins">See NewMomCircle In Action</h2>
            <p className="text-white/60">90 seconds. No signup needed.</p>
          </div>

          <div className="demo-video-wrapper relative w-full max-w-[900px] aspect-video rounded-[24px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/15 bg-black">
            {!playDemo ? (
              <div className="absolute inset-0 cursor-pointer" onClick={() => setPlayDemo(true)}>
                <img 
                  src="https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=1200" 
                  className="w-full h-full object-cover opacity-80"
                  alt="Video Demo Thumbnail"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center space-y-4">
                  <button 
                    className="play-btn w-[80px] h-[80px] rounded-full bg-gradient-to-br from-[#FF9F7C] to-[#E8734A] flex items-center justify-center shadow-[0_8px_32px_rgba(232,115,74,0.6)] hover:scale-[1.08] transition-transform duration-200 border-none cursor-pointer"
                    aria-label="Play demo video"
                  >
                    <svg className="w-8 h-8 text-white fill-current ml-1" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <p className="text-white font-semibold tracking-wide text-lg drop-shadow font-poppins">Watch the Demo</p>
                </div>
              </div>
            ) : (
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      </section>

      {/* 4.1.7 — Testimonials */}
      <section id="testimonials" className="py-24 bg-[#0E0705] border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <span className="text-[#FF9F7C] text-xs font-bold tracking-widest uppercase">Community</span>
            <h2 className="text-4xl md:text-5xl font-bold font-poppins">What Mothers Are Saying</h2>
            <p className="text-white/50">Real stories of recovery and connection from the NewMomCircle community.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <GlassCard className="flex flex-col space-y-4 justify-between">
              <div className="space-y-4">
                <div className="text-[#FF9F7C] text-lg">★★★★★</div>
                <p className="text-white/80 text-sm italic leading-relaxed">
                  &ldquo;I was skeptical but this app literally saved me during my third trimester. The AI journal felt like talking to a best friend.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-white/10 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-bold flex items-center justify-center text-sm font-poppins">
                  PM
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-poppins">Priya M.</h4>
                  <p className="text-white/50 text-xs">Chennai · Member since 2024</p>
                </div>
              </div>
            </GlassCard>

            {/* Review 2 */}
            <GlassCard className="flex flex-col space-y-4 justify-between">
              <div className="space-y-4">
                <div className="text-[#FF9F7C] text-lg">★★★★★</div>
                <p className="text-white/80 text-sm italic leading-relaxed">
                  &ldquo;The SOS button &mdash; I never used it but knowing it&rsquo;s there gave me so much peace of mind.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-white/10 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#E8734A] text-white font-bold flex items-center justify-center text-sm font-poppins">
                  AR
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-poppins">Ananya R.</h4>
                  <p className="text-white/50 text-xs">Hyderabad · Member since 2024</p>
                </div>
              </div>
            </GlassCard>

            {/* Review 3 */}
            <GlassCard className="flex flex-col space-y-4 justify-between">
              <div className="space-y-4">
                <div className="text-[#FF9F7C] text-lg">★★★★★</div>
                <p className="text-white/80 text-sm italic leading-relaxed">
                  &ldquo;Finally, a wellness app that speaks Tamil and doesn&rsquo;t feel foreign. The movement exercises are so gentle.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 border-t border-white/10 mt-6">
                <div className="w-10 h-10 rounded-full bg-[#FFCFBB] text-[#2D1B13] font-bold flex items-center justify-center text-sm font-poppins">
                  KS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-poppins">Kavitha S.</h4>
                  <p className="text-white/50 text-xs">Coimbatore · Member since 2025</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 4.1.8 — CTA Banner */}
      <section className="py-24 bg-gradient-to-b from-[#2A1208] to-[#1A0C08] relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[#FF9F7C]/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-bold font-poppins leading-tight max-w-2xl mx-auto text-white">
            Begin Your Healing Journey Today
          </h2>
          <p className="text-white/70 text-lg font-poppins max-w-md mx-auto">
            Join 2,400+ mothers. Free forever for core features.
          </p>
          <div className="pt-2">
            <Link href="/auth/signup">
              <PeachButton className="!px-12 !py-5 text-lg !font-semibold shadow-[0_12px_40px_rgba(232,115,74,0.5)]">
                Start Free →
              </PeachButton>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-white/50 pt-4">
            <div className="flex items-center gap-2">
              <span>✓</span> No credit card required
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span> Cancel account anytime
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span> HIPAA-aligned security
            </div>
          </div>
        </div>
      </section>

      {/* 4.1.9 — Footer */}
      <footer id="safety-support" className="bg-[#0D0503] border-t border-white/10 pt-20 pb-8 font-poppins">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            
            {/* Col 1: Logo & Tagline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.2"/>
                  <circle cx="20" cy="20" r="18" fill="none" stroke="#FF9F7C" strokeWidth="1.5"/>
                  <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
                  <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
                  <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.8"/>
                </svg>
                <span className="text-2xl font-bold tracking-tight text-white">NewMomCircle</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                &ldquo;You&rsquo;re Not Alone In This Journey&rdquo;
              </p>
              
              {/* Social Icons */}
              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Instagram">
                  📸
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="Twitter">
                  𝕏
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="LinkedIn">
                  💼
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors" aria-label="YouTube">
                  ▶
                </a>
              </div>
            </div>

            {/* Col 2: Product Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Product</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="#features" className="hover:text-[#FF9F7C] transition-colors">Features Grid</a></li>
                <li><a href="#how-it-works" className="hover:text-[#FF9F7C] transition-colors">Process Guide</a></li>
                <li><Link href="/auth/signup" className="hover:text-[#FF9F7C] transition-colors">Registration</Link></li>
                <li><Link href="/auth/login" className="hover:text-[#FF9F7C] transition-colors">Portal Log In</Link></li>
              </ul>
            </div>

            {/* Col 3: Support & Crisis Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Crisis Support</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><span className="font-semibold text-white">iCall India:</span> 9152987821</li>
                <li><span className="font-semibold text-white">Vandrevala:</span> 1860-2662-345</li>
                <li><span className="font-semibold text-white">NIMHANS:</span> 080-46110007</li>
                <li><span className="font-semibold text-white">Suicide Lifeline:</span> 988</li>
              </ul>
            </div>

            {/* Col 4: Legal Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Legal</h4>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li><a href="#" className="hover:text-[#FF9F7C] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#FF9F7C] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#FF9F7C] transition-colors">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-[#FF9F7C] transition-colors">GDPR Deletions</a></li>
              </ul>
            </div>
          </div>

          {/* Sub-footer metadata */}
          <div className="border-t border-white/15 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 text-center md:text-left gap-4 font-medium">
            <div>
              © 2025 NewMomCircle. Built with 💙 for Indian mothers.
            </div>
            <div className="max-w-md md:text-right leading-relaxed">
              ⚠️ <span className="font-bold">Disclaimer:</span> NewMomCircle is an informational and emotional wellness tool. It is not a substitute for professional medical diagnosis, advice, or psychiatric emergency response.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
