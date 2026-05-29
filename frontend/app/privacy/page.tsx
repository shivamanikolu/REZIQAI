'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Privacy Policy</h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mt-1">Last Updated: May 2026</p>
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-8 border border-accent-soft/60 bg-white/40 shadow-sm flex flex-col gap-6 text-xs text-text-secondary font-semibold leading-relaxed">
          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">1. Overview</h2>
            <p>
              REZIQ is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and process your personal information and resume data. By using the REZIQ application, you consent to the practices described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">2. Information We Collect</h2>
            <p>
              We collect the following information when you register or use our service:
            </p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1.5">
              <li><strong>Account Information:</strong> Your name, email address, and avatar image (when using OAuth providers like Google).</li>
              <li><strong>Resume Data:</strong> The raw text or parsed content extracted from files (PDF/DOCX) you upload to run assessments.</li>
              <li><strong>Usage Data:</strong> Telemetry regarding job links submitted, score calculations, and system diagnostic logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">3. How We Process Data</h2>
            <p>
              Your resume data is processed in-memory by our AI engines (powered by Groq / LLaMA) to produce ATS compatibility scores and skill gap reports. We do not sell or share your raw resume files or plain text resume content with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">4. Third-Party Services</h2>
            <p>
              We utilize Supabase for hosting, user authentication, and secure database storage. We utilize the Groq API to perform LLM-based resume evaluations. These services adhere to rigorous security and compliance standards.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-2">5. Data Retention & Deletion</h2>
            <p>
              You maintain full ownership of your data. You may request permanent deletion of your profile, saved reports, and history at any time. To submit a data deletion request, please email us at <a href="mailto:support@reziqai.vercel.app" className="text-text-primary underline">support@reziqai.vercel.app</a>. We will process your request within 72 hours.
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
