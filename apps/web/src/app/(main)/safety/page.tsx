"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { getGuardians, addGuardian, deleteGuardian, sendSosAlert } from '@newmomcircle/api';
import { supabase } from '@/lib/supabase';
import type { Guardian } from '@newmomcircle/types';

const DEFAULT_GUARDIANS: Guardian[] = [
  {
    id: 'mock-g-1',
    userId: 'user-mock',
    name: 'Rohan Sharma',
    phone: '+919876543210',
    relationship: 'Spouse',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-g-2',
    userId: 'user-mock',
    name: 'Meera Dev',
    phone: '+919998887776',
    relationship: 'Mother',
    createdAt: new Date().toISOString()
  }
];

const HOTLINES = [
  {
    name: "NIMHANS Helpline",
    description: "National Institute of Mental Health and Neurosciences. Free 24/7 clinical counseling.",
    phone: "080-46110007",
    tag: "Clinical Support"
  },
  {
    name: "Vandrevala Foundation",
    description: "Mental health support and crisis intervention. Available 24/7.",
    phone: "+919999666555",
    tag: "Crisis Line"
  },
  {
    name: "Kiran Helpline",
    description: "Govt. of India mental health support line run by Social Justice & Empowerment dept.",
    phone: "1800-599-0019",
    tag: "Government"
  },
  {
    name: "AASRA",
    description: "Professional and confidential helper network. Available 24 hours.",
    phone: "+919820466726",
    tag: "Suicide Prevention"
  },
  {
    name: "Fortis Stress Helpline",
    description: "Fortis Mental Health & Behavioral Sciences support system. 24/7.",
    phone: "+918376804102",
    tag: "Hospital Help"
  }
];

export default function SafetyPage() {
  const { user, userProfile } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // SOS States
  const [countdownActive, setCountdownActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [sosSent, setSosSent] = useState(false);
  const [method, setMethod] = useState<'button' | 'shake'>('button');

  // Add Guardian Form States
  const [gName, setGName] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gRelationship, setGRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countdownTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Sync Guardians
  useEffect(() => {
    const offline = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setIsOfflineMode(offline);

    if (!user) return;

    if (offline) {
      const savedGuardians = localStorage.getItem(`newmomcircle_mock_guardians_${user.id}`);
      if (savedGuardians) {
        setGuardians(JSON.parse(savedGuardians) as Guardian[]);
      } else {
        setGuardians(DEFAULT_GUARDIANS);
        localStorage.setItem(`newmomcircle_mock_guardians_${user.id}`, JSON.stringify(DEFAULT_GUARDIANS));
      }
    } else {
      void getGuardians(supabase, user.id).then(setGuardians);
    }
  }, [user]);

  // Countdown logic
  useEffect(() => {
    if (countdownActive && timeLeft > 0) {
      countdownTimer.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (countdownActive && timeLeft === 0) {
      void triggerSosAlert();
    }

    return () => {
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
    // triggerSosAlert intentionally omitted — it would cause re-registration on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownActive, timeLeft]);

  const startCountdown = () => {
    setTimeLeft(10);
    setCountdownActive(true);
    setSosSent(false);
    setMethod('button');
  };

  const cancelCountdown = () => {
    setCountdownActive(false);
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
  };

  const triggerSosAlert = async () => {
    setCountdownActive(false);
    setSosSent(true);

    if (!user) return;

    if (isOfflineMode) {
      console.log('Mock SOS sent!', { userId: user.id, recipientCount: guardians.length, method });
      const savedEvents = localStorage.getItem(`newmomcircle_mock_sos_${user.id}`) ?? '[]';
      const events = JSON.parse(savedEvents) as object[];
      events.push({ id: `mock-sos-${Date.now()}`, userId: user.id, recipientCount: guardians.length, method, triggeredAt: new Date().toISOString() });
      localStorage.setItem(`newmomcircle_mock_sos_${user.id}`, JSON.stringify(events));
    } else {
      try {
        const result = await sendSosAlert(supabase, user.id, method);
        if (!result.sent) {
          console.error('SOS alert failed:', result.reason);
        }
      } catch (err) {
        console.error('Error sending SOS alert:', err);
      }
    }

    alert(`🚨 SOS ALERT DISPATCHED!\nEmergency notifications sent to ${guardians.length} guardians: \n` +
      guardians.map(g => `- ${g.name} (${g.phone})`).join('\n')
    );
  };

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim() || !gPhone.trim() || !gRelationship.trim() || !user) return;
    setIsSubmitting(true);

    if (isOfflineMode) {
      const newMockG: Guardian = {
        id: `mock-g-${Date.now()}`,
        userId: user.id,
        name: gName,
        phone: gPhone,
        relationship: gRelationship,
        createdAt: new Date().toISOString()
      };
      const updated = [...guardians, newMockG];
      setGuardians(updated);
      localStorage.setItem(`newmomcircle_mock_guardians_${user.id}`, JSON.stringify(updated));
    } else {
      try {
        const newG = await addGuardian(supabase, { userId: user.id, name: gName, phone: gPhone, relationship: gRelationship });
        if (newG) setGuardians(prev => [...prev, newG]);
      } catch (err) {
        console.error('Error adding guardian:', err);
      }
    }

    setGName('');
    setGPhone('');
    setGRelationship('');
    setIsSubmitting(false);
  };

  const handleDeleteGuardian = async (guardianId: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to remove this contact from your safety circle?')) {
      if (isOfflineMode) {
        const updated = guardians.filter(g => g.id !== guardianId);
        setGuardians(updated);
        localStorage.setItem(`newmomcircle_mock_guardians_${user.id}`, JSON.stringify(updated));
      } else {
        try {
          await deleteGuardian(supabase, guardianId);
          setGuardians(prev => prev.filter(g => g.id !== guardianId));
        } catch (err) {
          console.error('Error deleting guardian:', err);
        }
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 w-full pb-10" data-testid="safety-screen">

      {/* Page Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">SOS Safety Console</h1>
            <span className="badge badge-danger">Emergency</span>
          </div>
          <p className="text-[13px] text-white/40 mt-0.5">Crisis support, hotlines, and your guardian network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Side: SOS Button & Instructions */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-8 text-center flex flex-col items-center justify-center border border-[#D94F4F]/20 relative overflow-hidden">
            {/* Background Red Glow */}
            <div className="absolute -inset-10 bg-[#D94F4F]/5 rounded-full filter blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold text-white font-poppins">Instant Guardian SOS</h2>
                <p className="text-sm text-white/70 mt-2 leading-relaxed">
                  Triggering the SOS button alerts all registered guardians in your Safety Circle immediately with your emergency distress status.
                </p>
              </div>

              {/* SOS Button Ring */}
              <div className="flex justify-center items-center py-4">
                <button
                  onClick={startCountdown}
                  className="w-48 h-48 rounded-full bg-gradient-to-br from-[#D94F4F] to-[#E8734A] border-8 border-white/10 flex flex-col justify-center items-center shadow-[0_0_50px_rgba(217,79,79,0.4)] hover:shadow-[0_0_70px_rgba(217,79,79,0.7)] active:scale-95 transition-all duration-300 relative group cursor-pointer"
                  data-testid="safety-sos-btn"
                >
                  {/* Pulsing Ripple Effect */}
                  <span className="absolute inset-0 rounded-full bg-[#D94F4F]/30 animate-ping opacity-75 group-hover:duration-75" />
                  <span className="text-3xl font-bold text-white tracking-widest font-poppins">SOS</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 mt-1">Press &amp; Hold</span>
                </button>
              </div>

              {sosSent && (
                <div className="p-4 bg-[#D94F4F]/10 border border-[#D94F4F]/30 rounded-xl max-w-md mx-auto animate-fade-slide-up">
                  <h3 className="text-sm font-bold text-[#FF8585] font-poppins flex items-center justify-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    EMERGENCY ALERTS DISPATCHED!
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    Notifications and automated SMS guidelines have been triggered for your safety circle. Please stay calm.
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* India Emergency Hotlines Directory */}
          <GlassCard className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white font-poppins">Certified India Crisis Hotlines</h3>
              <p className="text-xs text-white/50">Direct links to professional, free mental support networks in India</p>
            </div>

            <div className="divide-y divide-white/10 space-y-4">
              {HOTLINES.map((h, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 first:pt-0">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-poppins">{h.name}</span>
                      <span className="text-[9px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded">
                        {h.tag}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-poppins">{h.description}</p>
                  </div>

                  <a
                    href={`tel:${h.phone.replace(/[\s-+]/g, '')}`}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D94F4F]/10 hover:bg-[#D94F4F]/20 border border-[#D94F4F]/30 text-white font-bold rounded-xl text-xs transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>📞</span> {h.phone}
                  </a>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Safety Circle Guardians Manager */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-poppins">My Safety Circle</h3>
              <p className="text-xs text-white/50">Add trusted family or friends to contact in case of distress</p>
            </div>

            {/* Guardians List */}
            <div className="space-y-3">
              {guardians.length === 0 ? (
                <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs text-white/40 italic font-poppins">No guardians configured yet.</p>
                </div>
              ) : (
                guardians.map((g) => (
                  <div key={g.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-poppins">{g.name}</span>
                        <span className="text-[10px] bg-[#FF9F7C]/10 border border-[#FF9F7C]/20 text-[#FF9F7C] px-2 py-0.5 rounded-lg">
                          {g.relationship}
                        </span>
                      </div>
                      <a href={`tel:${g.phone}`} className="text-xs text-white/60 hover:text-[#FF9F7C] transition-colors flex items-center gap-1 font-poppins">
                        <span>📞</span> {g.phone}
                      </a>
                    </div>

                    <button
                      onClick={() => void handleDeleteGuardian(g.id)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-[#D94F4F]/20 text-white/55 hover:text-[#FF6666] transition-colors"
                      title="Remove Guardian"
                      data-testid={`safety-delete-guardian-${g.id}-btn`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Guardian Form */}
            <form onSubmit={handleAddGuardian} className="space-y-4 pt-4 border-t border-white/10" data-testid="safety-add-guardian-form">
              <h4 className="text-xs uppercase font-bold tracking-widest text-[#FFCFBB] font-poppins" data-testid="safety-add-guardian-btn">Add New Contact</h4>

              <div className="space-y-3">
                <GlassInput
                  type="text"
                  placeholder="Guardian's Name"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  required
                  data-testid="safety-guardian-name-input"
                />

                <GlassInput
                  type="tel"
                  placeholder="Phone Number (e.g. +91XXXXXXXXXX)"
                  value={gPhone}
                  onChange={(e) => setGPhone(e.target.value)}
                  required
                  data-testid="safety-guardian-phone-input"
                />

                <select
                  value={gRelationship}
                  onChange={(e) => setGRelationship(e.target.value)}
                  className="glass-input cursor-pointer"
                  required
                  data-testid="safety-guardian-relationship-select"
                >
                  <option value="" className="bg-[#140804] text-white/50">Select Relationship</option>
                  <option value="Spouse" className="bg-[#140804] text-white">Spouse / Partner</option>
                  <option value="Mother" className="bg-[#140804] text-white">Mother</option>
                  <option value="Father" className="bg-[#140804] text-white">Father</option>
                  <option value="Sister" className="bg-[#140804] text-white">Sister</option>
                  <option value="Brother" className="bg-[#140804] text-white">Brother</option>
                  <option value="Friend" className="bg-[#140804] text-white">Friend</option>
                  <option value="Doctor" className="bg-[#140804] text-white">Healthcare Professional</option>
                  <option value="Other" className="bg-[#140804] text-white">Other</option>
                </select>
              </div>

              <PeachButton type="submit" loading={isSubmitting} className="w-full" data-testid="safety-save-guardian-btn">
                Add Guardian
              </PeachButton>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* SOS Active Countdown Overlay Modal */}
      {countdownActive && (
        <div className="fixed inset-0 bg-[#140804]/90 backdrop-blur-[24px] z-50 flex flex-col justify-center items-center space-y-8 animate-fade-in px-4">
          <div className="absolute -inset-10 bg-[#D94F4F]/10 rounded-full filter blur-3xl pointer-events-none" />

          <div className="text-center space-y-4 max-w-md relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#D94F4F]/30 border-2 border-[#D94F4F]/60 flex items-center justify-center mx-auto animate-sos-pulse">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF8585" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-white font-poppins uppercase tracking-wider">SOS TRIGGER INITIALIZED</h2>
            <p className="text-sm text-white/70">
              Sending emergency warnings and locating contact numbers in <span className="text-[#FF8585] font-bold font-poppins">{timeLeft} seconds</span>.
            </p>
          </div>

          {/* Glowing Animated Countdown Circular Area */}
          <div className="relative w-44 h-44 flex items-center justify-center rounded-full bg-white/5 border-4 border-[#D94F4F] shadow-[0_0_60px_rgba(217,79,79,0.6)] animate-pulse">
            <span className="text-6xl font-extrabold text-white font-poppins">{timeLeft}</span>
          </div>

          <button
            onClick={cancelCountdown}
            className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#D94F4F]/50 text-white font-bold rounded-2xl text-sm transition-all hover:scale-105 shadow-xl cursor-pointer"
            data-testid="safety-sos-cancel-btn"
          >
            Cancel Alert (False Alarm)
          </button>
        </div>
      )}
    </div>
  );
}
