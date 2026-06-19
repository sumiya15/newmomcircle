"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/* ── SVG icon primitives ──────────────────────────────────────────────────── */
const Icon = {
  Home: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Compass: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  Message: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  Book: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  ),
  Chart: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Toolbox: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Shield: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Library: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  User: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  SOS: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { name: 'Community',  path: '/feed',             icon: Icon.Home    },
  { name: 'Explore',    path: '/explore',           icon: Icon.Compass },
  { name: 'Tracker',    path: '/tracker',           icon: Icon.Chart   },
  { name: 'Messages',   path: '/messages',          icon: Icon.Message },
  { name: 'Journal',    path: '/journal',           icon: Icon.Book    },
  { name: 'Insights',   path: '/journal/insights',  icon: Icon.Chart   },
  { name: 'Toolbox',    path: '/toolbox',           icon: Icon.Toolbox },
  { name: 'Library',    path: '/resources',         icon: Icon.Library },
  { name: 'SOS Safety', path: '/safety',            icon: Icon.Shield, critical: true },
  { name: 'Profile',    path: '/profile',           icon: Icon.User    },
] as const;

/* Mobile tabs — max 5 items */
const MOBILE_TABS = [
  { name: 'Home',    path: '/feed',     icon: Icon.Home    },
  { name: 'Explore', path: '/explore',  icon: Icon.Compass },
  { name: 'Journal', path: '/journal',  icon: Icon.Book  },
  { name: 'Toolbox', path: '/toolbox',  icon: Icon.Toolbox },
  { name: 'SOS',     path: '/safety',   icon: Icon.Shield, critical: true },
  { name: 'Profile', path: '/profile',  icon: Icon.User  },
] as const;

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#FF9F7C" opacity="0.15"/>
    <circle cx="20" cy="11" r="3.5" fill="#FF9F7C"/>
    <circle cx="25" cy="17" r="2.5" fill="#FFCFBB"/>
    <path d="M14 28 Q14 20 20 18 Q24 16 26 20 Q28 24 24 26 Q20 28 14 28Z" fill="#FF9F7C" opacity="0.85"/>
  </svg>
);

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.18 } },
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0E0705] gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#FF9F7C] border-white/10 animate-spin" />
        <p className="text-xs font-semibold tracking-widest text-white/40 uppercase font-poppins">
          Loading…
        </p>
      </div>
    );
  }

  if (!user) return null;

  const userInitials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? 'U').toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isActive = (path: string) =>
    pathname === path || (path === '/journal' && pathname.startsWith('/journal/') && path !== '/journal/insights');

  return (
    <div className="min-h-screen bg-[#0E0705]">
      {/* ── Ambient background gradient ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-[30%] w-[600px] h-[400px] rounded-full bg-[#E8734A]/6 blur-[120px]" />
        <div className="absolute bottom-0 right-[20%] w-[400px] h-[400px] rounded-full bg-[#FF9F7C]/4 blur-[100px]" />
      </div>

      {/* ── Sidebar (desktop) ────────────────────────────────────────── */}
      <aside className="app-sidebar hidden md:flex">
        {/* Logo */}
        <div className="px-5 py-5 mb-2 border-b border-white/[0.06]">
          <Link href="/feed" className="flex items-center gap-2.5 group">
            <Logo />
            <div>
              <span className="text-[13.5px] font-bold tracking-tight text-white font-poppins leading-tight">
                NewMom<span className="text-[#FF9F7C]">Circle</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`sidebar-item ${active ? 'active' : ''} ${item.critical ? 'danger' : ''}`}
                data-testid={`nav-${item.name.toLowerCase().replace(/ /g, '-')}-link`}
              >
                <span className="sidebar-icon flex-shrink-0 w-[17px]">
                  <item.icon />
                </span>
                <span>{item.name}</span>
                {item.critical && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E85555] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile at bottom */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
            <Link href="/profile" className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-bold flex items-center justify-center text-[11px] font-poppins shadow-md">
                {userInitials}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate font-poppins leading-tight">
                {userProfile?.displayName || user.email?.split('@')[0] || 'Mom'}
              </p>
              <p className="text-[10.5px] text-white/40 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors flex-shrink-0"
              data-testid="profile-logout-btn"
            >
              <Icon.Logout />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────── */}
      <div className="app-main relative z-10">

        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-[#0E0705]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <Link href="/feed" className="flex items-center gap-2">
              <Logo />
              <span className="text-[14px] font-bold tracking-tight text-white font-poppins">
                NewMomCircle
              </span>
            </Link>
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full bg-[#FF9F7C] text-[#2D1B13] font-bold flex items-center justify-center text-[11px] font-poppins">
                {userInitials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content with transition */}
        <main className="flex-grow px-5 md:px-8 py-7 md:py-8 pb-24 md:pb-10 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0705]/95 backdrop-blur-xl border-t border-white/[0.07] flex items-end justify-around px-2 pb-safe py-2">
        {MOBILE_TABS.map((item) => {
          const active = isActive(item.path);
          if (item.critical) {
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center -mt-5"
                data-testid={`tab-${item.name.toLowerCase()}-link`}
              >
                <div className="w-12 h-12 rounded-full bg-[#E85555] flex items-center justify-center shadow-[0_4px_20px_rgba(232,85,85,0.5)] border-2 border-[#0E0705] animate-sos-pulse">
                  <span className="text-[10px] font-bold text-white font-poppins tracking-wide">SOS</span>
                </div>
                <span className="text-[9px] font-semibold text-[#FF8585] mt-1 font-poppins">Safety</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors ${
                active ? 'text-[#FF9F7C]' : 'text-white/40'
              }`}
              data-testid={`tab-${item.name.toLowerCase()}-link`}
            >
              <item.icon />
              <span className="text-[9px] font-semibold font-poppins">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
