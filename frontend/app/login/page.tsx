'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Lock, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || 'Candidate User',
        });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Decorative calm background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#DADAD4]/20 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#DADAD4]/20 to-transparent blur-[120px] pointer-events-none" />

      <Link href="/" className="font-extrabold text-2xl tracking-tight text-text-primary mb-8 select-none hover:opacity-80 transition-opacity">
        REZIQ
      </Link>

      <div className="glass-panel w-full max-w-md rounded-[32px] p-8 md:p-10 border border-[#DADAD4] shadow-premium bg-[rgba(255,255,255,0.4)] animate-scale-in">
        <div className="text-center mb-8">
          <h2 className="text-xl font-extrabold text-text-primary mb-1">Access Career Intelligence</h2>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Secure Telemetry Console</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-error/10 border border-error/25 rounded-2xl flex gap-3 items-center text-xs text-error font-medium animate-scale-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full h-14 pl-12 pr-4 rounded-[20px] border border-accent-soft bg-white/70 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-14 pl-12 pr-4 rounded-[20px] border border-accent-soft bg-white/70 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-accent text-white font-bold rounded-full hover:opacity-90 transition-opacity text-xs uppercase tracking-wider shadow-premium flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8 text-center select-none">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#DADAD4]/60"></div>
          </div>
          <span className="relative bg-bg-primary px-3 text-[10px] text-text-muted uppercase tracking-wider font-bold">
            Or
          </span>
        </div>

        {/* Google Login button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-12 bg-white border border-accent-soft hover:bg-[#ECECE7]/30 text-text-primary text-xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center gap-2 mb-6 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-[10px] font-bold text-center text-text-secondary uppercase tracking-wider">
          New to REZIQ?{' '}
          <Link href="/signup" className="text-text-primary font-bold hover:underline">
            Initiate assessment
          </Link>
        </p>
      </div>
    </div>
  );
}
