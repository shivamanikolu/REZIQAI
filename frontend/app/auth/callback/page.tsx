'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch (err) {
        console.error('Error exchanging code for session:', err);
      } finally {
        window.location.href = '/dashboard';
      }
    };

    handleCallback();
  }, [searchParams]);

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
