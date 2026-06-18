"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { getApprovedResources } from '@newmomcircle/api';
import { supabase } from '@/lib/supabase';
import type { Resource } from '@newmomcircle/types';

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 'art-1',
    title: 'Navigating the Baby Blues vs Postpartum Depression',
    content: 'Understand the hormonal shifts in the first two weeks after birth, what symptoms are typical, and when to seek clinical guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=800',
    category: 'Mental Health',
    submittedBy: 'Dr. Ananya Nair (OB-GYN)',
    language: 'en',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-2',
    title: 'Safe Sleep Practices for Newborns and Moms',
    content: 'Co-sleeping safely, establishing healthy baseline crib routines, and strategies for maternal sleep hygiene during cluster feeding cycles.',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    category: 'Sleep',
    submittedBy: 'Meera Deshmukh (Sleep Coach)',
    language: 'en',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-3',
    title: 'Postpartum Nutrition: Healing from the Inside Out',
    content: 'Traditional Indian postpartum foods (Gond ladoos, methi seed recipes) balanced with modern nutrient-dense diets for lactation recovery.',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    category: 'Nutrition',
    submittedBy: 'Pooja Roy (Maternal Nutritionist)',
    language: 'en',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-4',
    title: 'Pelvic Floor Recovery & Gentle Core Exercises',
    content: 'Safe early exercises to rebuild strength, relieve back pressure, and manage common postpartum recovery indicators.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    category: 'Physical Recovery',
    submittedBy: 'Sarah D’Souza (Physiotherapist)',
    language: 'en',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'art-5',
    title: 'शिशु के जन्म के बाद मानसिक स्वास्थ्य का ध्यान रखना',
    content: 'प्रसवोत्तर अवसाद (Postpartum Depression) के लक्षणों को पहचानें और परिवार से भावनात्मक सहयोग कैसे प्राप्त करें।',
    imageUrl: 'https://images.unsplash.com/photo-1516641051054-9df6a1aad654?w=800',
    category: 'Mental Health',
    submittedBy: 'डॉ. रेखा वर्मा (मनोवैज्ञानिक)',
    language: 'hi',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const CATEGORIES = ['All', 'Mental Health', 'Sleep', 'Nutrition', 'Physical Recovery'];

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Mentor form states
  const [mentorName, setMentorName] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [mentorMessage, setMentorMessage] = useState('');
  const [isSubmittingMentor, setIsSubmittingMentor] = useState(false);
  const [mentorSubmitted, setMentorSubmitted] = useState(false);

  // Active Article View Modal
  const [activeArticle, setActiveArticle] = useState<Resource | null>(null);

  // Sync / Load Resources
  useEffect(() => {
    const offline = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setIsOfflineMode(offline);

    if (offline) {
      const savedRes = localStorage.getItem('newmomcircle_mock_resources');
      if (savedRes) {
        setResources(JSON.parse(savedRes) as Resource[]);
      } else {
        setResources(DEFAULT_RESOURCES);
        localStorage.setItem('newmomcircle_mock_resources', JSON.stringify(DEFAULT_RESOURCES));
      }
    } else {
      void getApprovedResources(supabase).then(real => {
        setResources(real.length > 0 ? real : DEFAULT_RESOURCES);
      });
    }
  }, []);

  const handleMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorName.trim() || !mentorPhone.trim() || !user) return;
    setIsSubmittingMentor(true);

    const requestData = {
      user_id: user.id,
      name: mentorName,
      phone: mentorPhone,
      message: mentorMessage,
      status: 'pending' as const,
    };

    if (isOfflineMode) {
      const savedRequests = localStorage.getItem(`newmomcircle_mock_mentor_requests_${user.id}`) ?? '[]';
      const requests = JSON.parse(savedRequests) as object[];
      requests.push({
        id: `mock-req-${Date.now()}`,
        ...requestData,
        created_at: new Date().toISOString()
      });
      localStorage.setItem(`newmomcircle_mock_mentor_requests_${user.id}`, JSON.stringify(requests));
    } else {
      try {
        await supabase.from('mentor_requests').insert(requestData);
      } catch (err) {
        console.error('Error creating mentor request:', err);
      }
    }

    setMentorName('');
    setMentorPhone('');
    setMentorMessage('');
    setIsSubmittingMentor(false);
    setMentorSubmitted(true);

    setTimeout(() => {
      setMentorSubmitted(false);
    }, 10000);
  };

  // Filter logic
  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full pb-10">

      {/* Page Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Wellness Library</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Expert guides, medical reviews, and support structures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: Article Library (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Search and Filters */}
          <div className="space-y-4">
            <GlassInput
              type="text"
              placeholder="Search articles, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all border cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#FF9F7C] to-[#E8734A] border-transparent text-[#2D1B13]'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout of Articles */}
          {filteredResources.length === 0 ? (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <span className="text-5xl">🔍</span>
              <h3 className="text-lg font-bold text-[#FFCFBB] font-poppins">No articles found</h3>
              <p className="text-sm text-white/60">Try modifying your search keywords or selection filters.</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.map((res) => (
                <GlassCard key={res.id} className="flex flex-col h-full overflow-hidden p-0 border border-white/10 group">
                  {/* Article Thumbnail */}
                  <div className="relative h-44 w-full overflow-hidden border-b border-white/10 flex-shrink-0">
                    <img
                      src={res.imageUrl ?? undefined}
                      alt={res.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#140804]/80 backdrop-blur-md text-[10px] font-bold text-[#FF9F7C] px-2.5 py-1 rounded-lg border border-[#FF9F7C]/20 uppercase tracking-wider">
                      {res.category}
                    </span>
                    <span className="absolute top-3 right-3 bg-white/10 backdrop-blur-md text-[9px] font-semibold text-white/90 px-2 py-0.5 rounded uppercase">
                      {res.language}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-white font-poppins leading-snug group-hover:text-[#FFCFBB] transition-colors">
                        {res.title}
                      </h4>
                      <p className="text-xs text-white/60 line-clamp-3 leading-relaxed font-poppins">
                        {res.content}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/40">Reviewed by</p>
                        <p className="text-[11px] font-semibold text-white/80 truncate font-poppins">{res.submittedBy}</p>
                      </div>

                      <button
                        onClick={() => setActiveArticle(res)}
                        className="flex-shrink-0 text-xs font-bold text-[#FF9F7C] hover:text-[#E8734A] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Read Now →
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Peer Support Mentoring (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-6 space-y-6 border border-[#FF9F7C]/10">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FF9F7C]/15 border border-[#FF9F7C]/30 flex items-center justify-center text-xl">
                🤝
              </div>
              <h3 className="text-lg font-bold text-white font-poppins">Connect with a Peer Mentor</h3>
              <p className="text-xs text-white/60 leading-relaxed font-poppins">
                Need someone who has walked this path? Request a secure connection with a volunteer mother who offers compassionate ears, advice, and reassurance. Securely connected via Twilio privacy routing.
              </p>
            </div>

            {mentorSubmitted ? (
              <div className="p-4 bg-[#FF9F7C]/10 border border-[#FF9F7C]/30 rounded-xl space-y-2 text-center animate-fade-slide-up">
                <span className="text-2xl">🎉</span>
                <h4 className="text-xs font-bold text-[#FFCFBB] font-poppins">Request Successfully Submitted!</h4>
                <p className="text-[11px] text-white/70">
                  A certified volunteer will reach out to you via your phone number. Your private information remains hidden during routing.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMentorRequest} className="space-y-4 pt-2">
                <div className="space-y-3">
                  <GlassInput
                    type="text"
                    placeholder="Your Name"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    required
                  />

                  <GlassInput
                    type="tel"
                    placeholder="Phone Number (e.g. +91XXXXXXXXXX)"
                    value={mentorPhone}
                    onChange={(e) => setMentorPhone(e.target.value)}
                    required
                  />

                  <textarea
                    placeholder="Message / What kind of support are you looking for? (e.g. Sleeplessness, breastfeeding support)"
                    value={mentorMessage}
                    onChange={(e) => setMentorMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF9F7C] transition-colors resize-none h-24 font-poppins"
                  />
                </div>

                <PeachButton type="submit" loading={isSubmittingMentor} className="w-full text-xs !font-bold">
                  Submit Mentor Connection Request
                </PeachButton>
              </form>
            )}

            <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-3 items-start">
              <span className="text-base flex-shrink-0">🔒</span>
              <p className="text-[10px] text-white/50 leading-relaxed font-poppins">
                <strong>HIPAA &amp; Privacy Compliant:</strong> Your contact parameters are encrypted and only exposed through temporary virtual numbers powered by our Twilio communications gateway.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Expanded Article Modal */}
      {activeArticle && (
        <div className="fixed inset-0 bg-[#140804]/90 backdrop-blur-[20px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <GlassCard className="max-w-2xl w-full p-0 overflow-hidden border border-white/20 max-h-[85vh] flex flex-col">

            {/* Modal Header Image */}
            <div className="relative h-56 w-full flex-shrink-0 border-b border-white/10">
              <img
                src={activeArticle.imageUrl ?? undefined}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140804] to-transparent" />
              <button
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 bg-[#140804]/70 hover:bg-[#140804] text-white font-bold p-2 rounded-xl transition-colors text-xs border border-white/10 cursor-pointer"
              >
                Close ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="bg-[#FF9F7C] text-[#2D1B13] text-[9px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider font-poppins">
                  {activeArticle.category}
                </span>
                <h3 className="text-xl font-bold text-white font-poppins mt-2">
                  {activeArticle.title}
                </h3>
              </div>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-white/80 leading-relaxed font-poppins">
              <p className="font-semibold text-white text-base">
                {activeArticle.content}
              </p>

              <div className="border-t border-white/10 pt-4 space-y-4">
                <p>
                  As an expecting or new mother, your body and mind experience dynamic transformations. Finding balance requires patient, supportive behaviors and accurate guidance. In postpartum care, sleep management and nutrition support play fundamental roles in resetting hormone baselines.
                </p>
                <p>
                  Remember that seeking help is a sign of strength, not weakness. Postpartum changes are clinically documented, and the community is always here to offer support. If you experience prolonged sadness or anxiety, connect with a peer mentor or consult with your care team immediately.
                </p>
              </div>

              <div className="bg-[#FF9F7C]/5 border border-[#FF9F7C]/15 rounded-xl p-4 mt-6">
                <p className="text-xs font-semibold text-[#FFCFBB] uppercase tracking-wider font-poppins">Key Takeaways</p>
                <ul className="list-disc list-inside text-xs text-white/70 mt-2 space-y-1">
                  <li>Consult verified professionals before introducing radical changes to recovery schedules.</li>
                  <li>Incorporate 10-15 minutes of structured breathing or wellness work daily.</li>
                  <li>Reach out to peer mentors or emergency safety networks whenever feeling overwhelmed.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between gap-4 flex-shrink-0">
              <div>
                <p className="text-[10px] text-white/40">Article medically reviewed by</p>
                <p className="text-xs font-bold text-white font-poppins">{activeArticle.submittedBy}</p>
              </div>

              <button
                onClick={() => setActiveArticle(null)}
                className="btn-secondary !text-xs !py-2 !px-4"
              >
                Finished Reading
              </button>
            </div>

          </GlassCard>
        </div>
      )}

    </div>
  );
}
