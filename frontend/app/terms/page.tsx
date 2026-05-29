'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function TermsPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setHasSession(true);
      }
    };
    checkSession();
  }, []);

  const handleBack = () => {
    if (hasSession) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans bg-bg-primary text-text-primary min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full bg-[rgba(245,245,242,0.65)] backdrop-blur-xl border-b border-accent-soft/30">
        <div className="max-w-4xl mx-auto h-20 px-6 flex justify-between items-center">
          <Link href={hasSession ? "/dashboard" : "/"} className="font-extrabold text-xl tracking-tight text-text-primary">
            REZIQ
          </Link>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {hasSession ? "Back to Dashboard" : "Back to Home"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-premium">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Terms of Service</h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">Last Updated: May 2026</p>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-8 border border-accent-soft/60 bg-white/40 shadow-sm flex flex-col gap-6 text-xs text-text-secondary font-semibold leading-relaxed">
          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using REZIQ ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms, do not access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">2. Use of Service</h2>
            <p>
              REZIQ provides resume analysis, ATS simulation scoring, and learning roadmap suggestions. You must not use the Service for any illegal, unauthorized, or abusive purposes. You are solely responsible for all files, data, and descriptions uploaded to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">3. User Data & AI Parsing</h2>
            <p>
              You grant REZIQ a non-exclusive license to process your resume text and target descriptions solely for compiling your career reports. You acknowledge that AI generation may contain inaccuracies and that you should verify critical skills and credentials manually.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">4. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available". REZIQ does not guarantee that using the Service will secure employment, passing ATS filters, or specific interview outcomes. We disclaim all warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">5. Support Contact</h2>
            <p>
              For questions regarding these Terms or for support, please email us at <a href="mailto:support@reziqai.vercel.app" className="text-text-primary underline">support@reziqai.vercel.app</a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#ECECE7]/40 border-t border-accent-soft/40 py-8 px-6 text-center select-none mt-auto">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
          &copy; 2026 REZIQ. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
