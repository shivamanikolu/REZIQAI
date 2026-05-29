'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeRun = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (exchangeRun.current) return;
      exchangeRun.current = true;

      try {
        const code = searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            router.replace('/login?error=auth_callback_failed');
            return;
          }
        } else {
          // If no code, check if there is an existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.replace('/login');
            return;
          }
        }
        router.replace('/dashboard');
      } catch (err) {
        console.error('Exception during code exchange:', err);
        router.replace('/login?error=auth_exception');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-accent-soft border-t-accent animate-spin" />
      <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
        Authenticating session...
      </p>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary text-text-primary">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent-soft border-t-accent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Loading...
          </p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
