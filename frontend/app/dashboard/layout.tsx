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
  ShieldAlert,
  Sparkles,
  Lock,
  Compass,
  Settings,
  User
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Rebuilt Auth Guard & Profile Sync (Do not touch existing logic)
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


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  // Sidebar Core Items
  const coreItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, disabled: false },
    { label: 'Skill Gap', path: '#', icon: Sparkles, disabled: true },
    { label: 'Roadmap', path: '#', icon: Compass, disabled: true },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings, disabled: false },
  ];

  // Sidebar Assessment Tool Items (preserving existing pages)
  const assessmentItems = [
    { label: 'AI Optimizer', path: '/dashboard/optimize', icon: LayoutDashboard },
    { label: 'Reports', path: '/dashboard/reports', icon: FileText },
    { label: 'History', path: '/dashboard/history', icon: History },
    { label: 'Feedback', path: '/dashboard/feedback', icon: MessageSquare },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#F5F5F2] border-r border-[#ECECE7]/70 px-4 py-6 justify-between select-none">
      {/* Brand & Menu */}
      <div className="flex flex-col gap-8">
        {/* Brand Logo */}
        <div className="px-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-extrabold text-2xl tracking-tight text-text-primary">
            REZIQ
          </Link>
          <span className="text-[9px] bg-accent/5 text-text-secondary px-2.5 py-0.5 rounded-full border border-accent-soft font-bold uppercase tracking-wider">
            SaaS
          </span>
        </div>

        {/* Section: Core Menu */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-1">
            Core Menu
          </p>
          {coreItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            
            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between h-10 px-3 rounded-xl text-text-muted cursor-not-allowed border border-transparent font-bold text-xs transition-all opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#ECECE7] px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    SOON
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-accent text-white shadow-premium'
                    : 'hover:bg-[#ECECE7]/60 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Section: Assessment Tools */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-1">
            Assessment Tools
          </p>
          {assessmentItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center gap-2.5 h-10 px-3 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-accent text-white shadow-premium'
                    : 'hover:bg-[#ECECE7]/60 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer / Profile */}
      <div className="flex flex-col gap-4 border-t border-[#ECECE7] pt-6">
        <div className="flex items-center gap-3 px-2">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-[#DADAD4]" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'P'}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-text-primary truncate">{user?.full_name}</p>
            <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-10 rounded-[12px] flex items-center justify-center gap-2 bg-error/10 hover:bg-error text-error hover:text-white font-bold text-xs transition-all border border-error/20 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex min-h-screen bg-bg-primary relative">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block w-64 h-screen fixed left-0 top-0 z-40">
        {sidebarContent}
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex-1 flex flex-col md:pl-64">
        <header className="md:hidden w-full h-16 px-4 glass-panel border-b border-[#ECECE7]/60 flex justify-between items-center z-40 sticky top-0 bg-white/70">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg bg-[#ECECE7]/55 text-text-primary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-lg tracking-tight text-text-primary">REZIQ</span>
          </div>
          
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold"
          >
            {user?.full_name ? user.full_name.charAt(0) : 'P'}
          </button>
        </header>

        {/* MOBILE SLIDING DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[#0A0A0A]/20 backdrop-blur-sm z-50 transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] shadow-premium animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-full">
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-[#ECECE7]/85 flex items-center justify-center text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
                {sidebarContent}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE QUICK PROFILE SUMMARY DROPDOWN */}
        {profileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setProfileMenuOpen(false)} />
            <div className="absolute right-4 top-14 w-64 glass-panel border border-[#DADAD4] rounded-[24px] p-4 flex flex-col gap-3 shadow-premium z-50 animate-scale-in">
              <div className="pb-2 border-b border-[#ECECE7]/60">
                <p className="text-xs font-extrabold text-text-primary">{user?.full_name}</p>
                <p className="text-[9px] text-text-muted">{user?.email}</p>
              </div>
              <button
                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 bg-error/10 hover:bg-error text-error hover:text-white font-bold text-xs transition-all border border-error/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </>
        )}

        {/* MAIN PANELS AND CONTENT WORKSPACE */}
        <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
