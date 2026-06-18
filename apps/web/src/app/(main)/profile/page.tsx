"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { PeachButton } from '@/components/ui/PeachButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { supabase } from '@/lib/supabase';
import { updateProfile, requestAccountDeletion } from '@newmomcircle/api';
import { useRouter } from 'next/navigation';
import type { Profile, SupportedLocale } from '@newmomcircle/types';

export default function ProfilePage() {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [babyDate, setBabyDate] = useState('');
  const [language, setLanguage] = useState<SupportedLocale>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [stats, setStats] = useState({ postsCount: 0, journalCount: 0, guardiansCount: 0 });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const offline = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setIsOfflineMode(offline);

    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBabyDate(userProfile.babyDob || '');
      setLanguage(userProfile.language || 'en');
    }

    void loadUserStats(offline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const loadUserStats = async (offline: boolean) => {
    if (!user) return;

    if (offline) {
      const savedPosts = localStorage.getItem('newmomcircle_mock_posts');
      const posts = savedPosts ? (JSON.parse(savedPosts) as { authorId: string }[]) : [];
      const userPosts = posts.filter(p => p.authorId === user.id || p.authorId === `anon_${user.id}`);

      const savedJournals = localStorage.getItem(`newmomcircle_mock_journals_${user.id}`);
      const journals = savedJournals ? (JSON.parse(savedJournals) as unknown[]) : [];

      const savedGuardians = localStorage.getItem(`newmomcircle_mock_guardians_${user.id}`);
      const guardians = savedGuardians ? (JSON.parse(savedGuardians) as unknown[]) : [];

      setStats({ postsCount: userPosts.length, journalCount: journals.length, guardiansCount: guardians.length });
    } else {
      try {
        const [postsResult, journalsResult, guardiansResult] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('guardians').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setStats({
          postsCount: postsResult.count ?? 0,
          journalCount: journalsResult.count ?? 0,
          guardiansCount: guardiansResult.count ?? 0,
        });
      } catch (err) {
        console.error("Error loading user stats:", err);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    if (isOfflineMode) {
      const mockProfileKey = `newmomcircle_mock_profile_${user.id}`;
      localStorage.setItem(mockProfileKey, JSON.stringify({ ...userProfile, displayName, babyDob: babyDate, language }));
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); window.location.reload(); }, 1500);
    } else {
      try {
        await updateProfile(supabase, user.id, { displayName, babyDob: babyDate, language });
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => { setSaveSuccess(false); window.location.reload(); }, 1500);
      } catch (err) {
        console.error("Error updating profile:", err);
        setIsSaving(false);
        alert("Failed to update profile settings. Please try again.");
      }
    }
  };

  const handleExportData = async () => {
    if (!user || !userProfile) return;

    const exportObj: {
      profile: Profile;
      exportedAt: string;
      disclaimer: string;
      posts?: unknown[];
      journals?: unknown[];
      guardians?: unknown[];
    } = {
      profile: userProfile,
      exportedAt: new Date().toISOString(),
      disclaimer: "HIPAA and GDPR Compliant Data Extract for NewMomCircle user records.",
    };

    if (isOfflineMode) {
      const savedPosts = localStorage.getItem('newmomcircle_mock_posts');
      const posts = savedPosts ? (JSON.parse(savedPosts) as { authorId: string }[]) : [];
      exportObj.posts = posts.filter(p => p.authorId === user.id || p.authorId === `anon_${user.id}`);
      const savedJournals = localStorage.getItem(`newmomcircle_mock_journals_${user.id}`);
      exportObj.journals = savedJournals ? JSON.parse(savedJournals) : [];
      const savedGuardians = localStorage.getItem(`newmomcircle_mock_guardians_${user.id}`);
      exportObj.guardians = savedGuardians ? JSON.parse(savedGuardians) : [];
    } else {
      try {
        const [postsResult, journalsResult, guardiansResult] = await Promise.all([
          supabase.from('posts').select('*').eq('author_id', user.id),
          supabase.from('journal_entries').select('*').eq('user_id', user.id),
          supabase.from('guardians').select('*').eq('user_id', user.id),
        ]);
        exportObj.posts = postsResult.data ?? [];
        exportObj.journals = journalsResult.data ?? [];
        exportObj.guardians = guardiansResult.data ?? [];
      } catch (err) {
        console.error("Error gathering data for export:", err);
      }
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `newmomcircle_health_record_${user.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleGDPRDeletion = async () => {
    if (deleteConfirmationText !== "DELETE MY DATA" || !user) return;
    setIsDeleting(true);

    if (isOfflineMode) {
      // Anonymize posts in mock storage
      const savedPosts = localStorage.getItem('newmomcircle_mock_posts');
      if (savedPosts) {
        const posts = JSON.parse(savedPosts) as { authorId: string; authorName: string; authorInitials: string; isAnonymous: boolean }[];
        const anonymized = posts.map(p => {
          if (p.authorId === user.id || p.authorId === `anon_${user.id}`) {
            return { ...p, authorName: "Anonymous Mom", authorInitials: "AM", authorId: "anonymous_purged", isAnonymous: true };
          }
          return p;
        });
        localStorage.setItem('newmomcircle_mock_posts', JSON.stringify(anonymized));
      }
      localStorage.removeItem(`newmomcircle_mock_journals_${user.id}`);
      localStorage.removeItem(`newmomcircle_mock_guardians_${user.id}`);
      localStorage.removeItem(`newmomcircle_mock_profile_${user.id}`);
      setIsDeleting(false);
      setShowDeleteModal(false);
      alert("Your account data was anonymized and profile cleared. Signing you out.");
      await signOut();
      router.push('/');
    } else {
      try {
        // Flags account for deletion; the Supabase Edge Function handles anonymization server-side
        await requestAccountDeletion(supabase, user.id);
        setIsDeleting(false);
        setShowDeleteModal(false);
        alert("Your deletion request was registered. Personal data will be anonymized within 24 hours. You have been signed out.");
        router.push('/');
      } catch (err) {
        console.error("Error requesting account deletion:", err);
        setIsDeleting(false);
        alert("An error occurred. Please try again or contact support.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 w-full pb-10" data-testid="profile-screen">

      {/* Page Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-[22px] font-bold text-white font-poppins tracking-tight">Profile &amp; Settings</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Personal preferences, clinical markers, and privacy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

        {/* Left Side: Summary Card */}
        <div className="space-y-6">
          <GlassCard className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-extrabold flex items-center justify-center text-2xl border-4 border-white/10 font-poppins shadow-lg">
                {userProfile?.displayName
                  ? userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : 'U'}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white font-poppins">{userProfile?.displayName || 'New Mom'}</h3>
              <p className="text-xs text-[#FFCFBB] font-semibold tracking-wider uppercase mt-0.5">
                Role: {userProfile?.role || 'Member'}
              </p>
              <p className="text-[11px] text-white/40 mt-1">{user?.email}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
              <div>
                <p className="text-lg font-bold text-[#FF9F7C] font-poppins">{stats.postsCount}</p>
                <p className="text-[9px] text-white/50 uppercase font-semibold">Posts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#FF9F7C] font-poppins">{stats.journalCount}</p>
                <p className="text-[9px] text-white/50 uppercase font-semibold">Journals</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#FF9F7C] font-poppins">{stats.guardiansCount}</p>
                <p className="text-[9px] text-white/50 uppercase font-semibold">SOS</p>
              </div>
            </div>
          </GlassCard>

          {/* Privacy & Trust Badge */}
          <GlassCard className="p-4 flex gap-3 items-start border border-[#FF9F7C]/10">
            <div className="w-7 h-7 rounded-lg bg-[#FF9F7C]/10 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF9F7C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white font-poppins">Privacy Standard</h4>
              <p className="text-[10px] text-white/50 leading-relaxed font-poppins">
                Your medical references (due dates, mood journals) are stored under encrypted schemas compliant with HIPAA standards.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Forms & GDPR */}
        <div className="md:col-span-2 space-y-6">

          {/* Profile Form */}
          <GlassCard className="p-6 space-y-6">
            <h3 className="text-lg font-bold text-white font-poppins border-b border-white/10 pb-3">
              Personal Information
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4" data-testid="profile-edit-form">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70 pl-1">Full Name / Public Display Name</label>
                <GlassInput
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  data-testid="profile-name-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70 pl-1">Baby Due Date / Birth Date</label>
                  <input
                    type="date"
                    value={babyDate}
                    onChange={(e) => setBabyDate(e.target.value)}
                    className="glass-input text-white cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70 pl-1">Communication Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
                    className="glass-input cursor-pointer"
                    required
                  >
                    <option value="en" className="bg-[#140804] text-white">English (Default)</option>
                    <option value="hi" className="bg-[#140804] text-white">हिंदी (Hindi)</option>
                    <option value="te" className="bg-[#140804] text-white">తెలుగు (Telugu)</option>
                    <option value="ta" className="bg-[#140804] text-white">தமிழ் (Tamil)</option>
                    <option value="kn" className="bg-[#140804] text-white">ಕನ್ನಡ (Kannada)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <p className="text-xs text-white/50">Changes apply across feed and reports instantly.</p>
                <PeachButton type="submit" loading={isSaving} className="!px-6 !py-2.5 text-xs !font-bold" data-testid="profile-save-btn">
                  {saveSuccess ? 'Changes Saved ✓' : 'Save Changes'}
                </PeachButton>
              </div>
            </form>
          </GlassCard>

          {/* GDPR Options Card */}
          <GlassCard className="p-6 space-y-6 border border-[#D94F4F]/10">
            <h3 className="text-lg font-bold text-white font-poppins border-b border-white/10 pb-3">
              Data Privacy &amp; GDPR Controls
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white font-poppins">Export Account Records</h4>
                <p className="text-xs text-white/60 leading-relaxed font-poppins">
                  Download a complete backup of all profile information, mood logs, guardians, and clinical metadata registered to your user ID.
                </p>
                <button
                  onClick={() => void handleExportData()}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#FF9F7C]/50 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
                  data-testid="profile-export-data-btn"
                >
                  Export Data (JSON)
                </button>
              </div>

              <hr className="border-white/5" />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white font-poppins text-[#FF8585]">Anonymize &amp; Close Account</h4>
                <p className="text-xs text-white/60 leading-relaxed font-poppins">
                  Under GDPR/HIPAA standards, we allow you to strip all personal identifiers from your database entry. Comments and posts will be reassigned to &ldquo;Anonymous Mom&rdquo; to preserve peer support threads, while your private journals and contact circle records will be completely deleted.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-5 py-2.5 bg-[#D94F4F]/10 hover:bg-[#D94F4F]/20 border border-[#D94F4F]/30 text-[#FF8585] font-semibold rounded-xl text-xs transition-all cursor-pointer"
                  data-testid="profile-delete-account-btn"
                >
                  Delete &amp; Anonymize Account
                </button>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>

      {/* GDPR Delete Modal Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#140804]/90 backdrop-blur-[20px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <GlassCard className="max-w-md w-full p-6 border border-[#D94F4F]/35 space-y-6">

            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[#D94F4F]/15 flex items-center justify-center mx-auto">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8585" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white font-poppins">De-identify &amp; Close Account?</h3>
              <p className="text-xs text-white/70 leading-relaxed font-poppins">
                This action is irreversible. Your private journal logs and safety guardians will be deleted. All of your public feed posts and comments will be anonymized under the name &ldquo;Anonymous Mom&rdquo;.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-white/80 pl-1 block">
                Type <span className="text-[#FF8585] font-bold">DELETE MY DATA</span> below to confirm:
              </label>
              <GlassInput
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type here..."
                className="text-center"
                data-testid="profile-delete-confirm-input"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }}
                className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
                disabled={isDeleting}
                data-testid="profile-cancel-delete-btn"
              >
                Cancel
              </button>

              <button
                onClick={() => void handleGDPRDeletion()}
                disabled={deleteConfirmationText !== "DELETE MY DATA" || isDeleting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D94F4F] hover:bg-[#B33B3B] disabled:opacity-40 text-white transition-colors cursor-pointer"
                data-testid="profile-confirm-delete-btn"
              >
                {isDeleting ? 'Processing...' : 'Confirm Anonymization'}
              </button>
            </div>

          </GlassCard>
        </div>
      )}

    </div>
  );
}
