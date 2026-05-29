'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  History, 
  HelpCircle, 
  MessageSquare, 
  Sliders, 
  ShieldAlert
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Rebuilt Auth Guard & Profile Sync (Robust implementation to prevent race conditions)
  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (session?.user) {
          // Retrieve profile from Database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!active) return;

          const currentMeta = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Candidate',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            auth_provider: session.user.app_metadata?.provider || 'email',
          };

          if (profile) {
            if (
              profile.full_name !== currentMeta.full_name ||
              profile.avatar_url !== currentMeta.avatar_url ||
              profile.auth_provider !== currentMeta.auth_provider
            ) {
              await supabase
                .from('profiles')
                .update({
                  full_name: currentMeta.full_name,
                  avatar_url: currentMeta.avatar_url,
                  auth_provider: currentMeta.auth_provider,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', session.user.id);
            }
            setUser({
              id: profile.id,
              email: profile.email,
              full_name: currentMeta.full_name,
              avatar_url: currentMeta.avatar_url,
              auth_provider: currentMeta.auth_provider,
            });
          } else {
            // Create profile if missing
            await supabase.from('profiles').upsert(currentMeta);
            setUser(currentMeta);
          }
        } else {
          // No session, force login page
          setUser(null);
          router.push('/login');
        }
      } catch (err) {
        console.error('Error syncing user profile:', err);
        setUser(null);
        router.push('/login');
      }
    };
    
    syncUser();

    // Listen for auth state alterations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        syncUser();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setUser, router]);

  const navItems = [
    { label: 'Optimize', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Reports', path: '/dashboard/reports', icon: FileText },
    { label: 'History', path: '/dashboard/history', icon: History },
    { label: 'Feedback', path: '/dashboard/feedback', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-primary relative">
      {/* TOP NAVIGATION BAR */}
      <header className="w-full h-20 px-6 md:px-8 glass-panel border-b border-[#ECECE7]/60 flex justify-between items-center z-40 sticky top-0 bg-white/70">
        {/* Left Side: Logo (Desktop & Mobile) */}
        <div className="flex items-center">
          <Link href="/dashboard" className="font-extrabold text-xl tracking-tight text-text-primary">
            REZIQ
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {/* Desktop Navigation Items */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 h-10 px-4 rounded-[20px] text-xs font-bold tracking-wide uppercase transition-all ${
                    active
                      ? 'bg-accent text-white shadow-premium'
                      : 'hover:bg-[#ECECE7]/60 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Profile Pill */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3 bg-[#ECECE7]/40 border border-[#DADAD4]/50 rounded-[20px] py-1.5 pl-3 pr-2 hover:bg-[#ECECE7]/60 active:scale-98 transition-all cursor-pointer"
            >
              <div className="overflow-hidden max-w-[150px]">
                <p className="text-xs font-bold text-text-primary truncate">{user?.full_name}</p>
              </div>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-6 h-6 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                  {user?.full_name ? user.full_name.charAt(0) : 'P'}
                </div>
              )}
            </button>

            {/* Desktop Profile Dropdown Popover */}
            {profileMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setProfileMenuOpen(false)} />
                
                <div className="absolute right-0 top-12 w-80 glass-panel border border-[#DADAD4] rounded-[28px] p-5 flex flex-col gap-4 shadow-premium z-50 animate-scale-in">
                  {/* Dropdown User Info */}
                  <div className="px-1 pb-3 border-b border-[#ECECE7]/60 flex items-center gap-3">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold shadow-sm">
                        {user?.full_name ? user.full_name.charAt(0) : 'P'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-extrabold text-text-primary">{user?.full_name}</p>
                      <p className="text-[10px] text-text-muted">{user?.email}</p>
                    </div>
                  </div>

                  {/* Group 1: Navigation Actions (Background Color: Suitable Light Grey) */}
                  <div className="bg-[#ECECE7]/50 border border-[#DADAD4]/40 rounded-[20px] p-2 flex flex-col gap-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-primary hover:bg-[#ECECE7] transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Optimize
                    </Link>
                    <Link
                      href="/dashboard/reports"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-primary hover:bg-[#ECECE7] transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      My Reports
                    </Link>
                    <Link
                      href="/dashboard/history"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-primary hover:bg-[#ECECE7] transition-all"
                    >
                      <History className="w-3.5 h-3.5" />
                      History
                    </Link>
                  </div>

                  {/* Group 2: Privacy Policy, Feedback, Help & Support, Data Preferences (Background Color: Clean Soft White) */}
                  <div className="bg-white/80 border border-accent-soft/30 rounded-[20px] p-2 flex flex-col gap-1">
                    <Link
                      href="/privacy"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-text-muted" />
                      Privacy Policy
                    </Link>
                    <Link
                      href="/dashboard/feedback"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                      Feedback
                    </Link>
                    <Link
                      href="/dashboard/help"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
                      Help & Support
                    </Link>
                    <Link
                      href="/dashboard/preferences"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5 text-text-muted" />
                      Data Preferences
                    </Link>
                  </div>

                  {/* Sign Out Button (Red Theme) */}
                  <button
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                    className="w-full h-11 rounded-[16px] flex items-center justify-center gap-2 bg-error/10 hover:bg-error text-error hover:text-white font-bold text-xs transition-all border border-error/20 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Profile Toggle Button (Top Right, triggers Drawer Modal) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center gap-2 bg-[#ECECE7]/40 border border-[#DADAD4]/50 rounded-[20px] py-1.5 px-3 active:bg-[#ECECE7]/60 transition-colors"
          >
            <span className="text-xs font-bold text-text-primary">
              {user?.full_name ? user.full_name.split(' ')[0] : 'Profile'}
            </span>
            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
              {user?.full_name ? user.full_name.charAt(0) : 'P'}
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#0A0A0A]/20 backdrop-blur-md z-30 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-20 left-0 right-0 glass-panel border-b border-[#DADAD4] p-6 flex flex-col gap-4 animate-scale-in max-h-[85vh] overflow-y-auto scrollbar-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Area */}
            <div className="pb-3 border-b border-[#ECECE7]/60 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-text-primary">{user?.full_name}</p>
                <p className="text-[10px] text-text-muted">{user?.email}</p>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-[#ECECE7]/55 flex items-center justify-center text-text-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Group 1 (Background Color: Suitable Light Grey) */}
            <div className="bg-[#ECECE7]/50 border border-[#DADAD4]/40 rounded-[20px] p-2.5 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 h-11 px-3 rounded-xl text-xs font-bold transition-all ${
                      active ? 'bg-accent text-white shadow-premium' : 'text-text-primary hover:bg-[#ECECE7]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Group 2 (Background Color: Clean Soft White) */}
            <div className="bg-white/80 border border-accent-soft/30 rounded-[20px] p-2.5 flex flex-col gap-1">
              <Link
                href="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-text-muted" />
                Privacy Policy
              </Link>
              <Link
                href="/dashboard/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
              >
                <MessageSquare className="w-4 h-4 text-text-muted" />
                Feedback
              </Link>
              <Link
                href="/dashboard/help"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
              >
                <HelpCircle className="w-4 h-4 text-text-muted" />
                Help & Support
              </Link>
              <Link
                href="/dashboard/preferences"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-bold text-text-secondary hover:bg-[#ECECE7]/40 text-left transition-all"
              >
                <Sliders className="w-4 h-4 text-text-muted" />
                Data Preferences
              </Link>
            </div>

            {/* Mobile Sign Out (Red Theme) */}
            <button
              onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              className="w-full h-12 rounded-[16px] flex items-center justify-center gap-2 bg-error/10 hover:bg-error text-error hover:text-white font-bold text-xs transition-all border border-error/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
