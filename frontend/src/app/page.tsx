'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Cpu, FileText, CheckCircle2, ShieldCheck, ChevronDown, Award, Sparkles, Target, Zap, Shield, Star, Lock } from 'lucide-react';

const row1Tags = [
  "Software Engineers",
  "Frontend Developers",
  "Backend Developers",
  "Full Stack Engineers",
  "AI Engineers",
  "ML Engineers",
  "DevOps Engineers",
  "Cloud Engineers",
  "Cybersecurity Analysts",
  "Data Scientists",
  "Data Analysts",
  "Product Managers",
  "Technical Product Managers",
  "UI Designers",
  "UX Designers"
];

const row2Tags = [
  "Graphic Designers",
  "Startup Founders",
  "Recruiters",
  "Hiring Managers",
  "Career Coaches",
  "Consultants",
  "Business Analysts",
  "Marketing Specialists",
  "Sales Professionals",
  "Students",
  "Fresh Graduates",
  "Freelancers",
  "Remote Professionals",
  "Enterprise Teams"
];

const marqueeRow1 = [...row1Tags, ...row1Tags];
const marqueeRow2 = [...row2Tags, ...row2Tags];

const faqs = [
  {
    q: "How does REZIQ analyze resumes?",
    a: "REZIQ evaluates both semantic meaning and keyword distributions. Instead of simple text matching, our system uses LLMs trained to evaluate layout readability, project impact metrics, and alignment with targeted technical components."
  },
  {
    q: "Does REZIQ support ATS optimization?",
    a: "Yes. REZIQ parses your resume using simulated Applicant Tracking System (ATS) parsers. It identifies structure violations, fonts that block parsing, and keyword density issues that cause auto-rejections."
  },
  {
    q: "Is my resume data secure?",
    a: "Security is our highest priority. All resume uploads and analyses are encrypted in transit and at rest. We adhere to industry-standard data hygiene practices to keep your background private."
  },
  {
    q: "Does REZIQ store uploaded files?",
    a: "By default, REZIQ processes files in memory and stores only the extracted text metadata for dashboard history. You can purge your complete profile and uploaded history at any time from your account settings."
  },
  {
    q: "How accurate is the AI analysis?",
    a: "The analysis is highly calibrated. It scores alignment based on real hiring manager criteria, grading language style, tech stack gaps, and formatting on a 1-100 scale."
  },
  {
    q: "Which AI models power REZIQ?",
    a: "Our analysis pipeline is powered by high-performance LLM engines optimized for forensic career intelligence and fast processing speeds."
  }
];

export default function LandingPage() {
  // FAQ Expand state
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({});

  const toggleFaq = (index: number) => {
    setFaqExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Skill Gap Mock Demo State
  const [demoState, setDemoState] = useState<'idle' | 'parsing' | 'completed'>('idle');
  const [parseProgress, setParseProgress] = useState(0);

  const runSkillGapDemo = () => {
    setDemoState('parsing');
    setParseProgress(0);
  };

  useEffect(() => {
    if (demoState === 'parsing') {
      const interval = setInterval(() => {
        setParseProgress((old) => {
          if (old >= 100) {
            clearInterval(interval);
            setTimeout(() => setDemoState('completed'), 300);
            return 100;
          }
          return old + 20;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [demoState]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col font-sans bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent selection:text-white">
      
      {/* FLOATING NAVBAR */}
      <header className="sticky top-0 z-50 w-full bg-[rgba(245,245,242,0.65)] backdrop-blur-xl border-b border-accent-soft/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-20 px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-text-primary select-none">
            REZIQ
          </Link>
          
          {/* Navigation Options */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </a>
            <a href="#reviews" className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
              Reviews
            </a>
            <a href="#faq" className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="h-10 px-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-wider hover:opacity-90 hover:shadow-premium transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        
        {/* HERO SECTION */}
        <section className="relative px-6 md:px-12 pt-32 pb-24 md:pt-44 md:pb-36 text-center max-w-6xl mx-auto flex flex-col items-center animate-fade-in-up">
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-soft/30 border border-accent-soft/60 text-[10px] font-extrabold uppercase tracking-wider mb-8 text-text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            Premium AI Career Intelligence Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-[0.95] text-text-primary mb-8 max-w-5xl select-none">
            Career Intelligence.<br />
            <span className="text-text-secondary font-semibold">Reimagined.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-xl text-text-secondary max-w-3xl leading-relaxed mb-12 font-medium">
            AI-powered forensic hiring intelligence built to analyze resumes, ATS systems, recruiter psychology, and market competitiveness.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2.5 bg-accent text-white font-bold h-12 px-8 rounded-full hover:opacity-95 hover:shadow-premium transition-all text-xs uppercase tracking-wider"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#ECECE7]/55 hover:bg-[#ECECE7]/85 text-text-primary font-bold h-12 px-8 border border-accent-soft/75 rounded-full transition-all text-xs uppercase tracking-wider"
            >
              Login
            </Link>
          </div>
        </section>

        {/* TRUST & USER STATISTICS SECTION */}
        <section className="px-6 md:px-12 py-16 bg-[#ECECE7]/30 border-y border-accent-soft/50">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Stat Card 1 */}
            <div className="glass-panel-secondary rounded-[24px] p-6 border border-accent-soft/50 text-center flex flex-col justify-center items-center shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 scroll-reveal delay-100">
              <p className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-1">50K+</p>
              <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Reports Generated</p>
            </div>

            {/* Stat Card 2 */}
            <div className="glass-panel-secondary rounded-[24px] p-6 border border-accent-soft/50 text-center flex flex-col justify-center items-center shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 scroll-reveal delay-200">
              <p className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-1">92%</p>
              <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">ATS Alignment Rate</p>
            </div>

            {/* Stat Card 3 */}
            <div className="glass-panel-secondary rounded-[24px] p-6 border border-accent-soft/50 text-center flex flex-col justify-center items-center shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 scroll-reveal delay-300">
              <p className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-1">4.9/5</p>
              <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">User Satisfaction</p>
            </div>

            {/* Stat Card 4 */}
            <div className="glass-panel-secondary rounded-[24px] p-6 border border-accent-soft/50 text-center flex flex-col justify-center items-center shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 scroll-reveal delay-400">
              <p className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-1">21 Days</p>
              <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold">Improvement Speed</p>
            </div>

          </div>
        </section>

        {/* LOGO GRID (TRUSTED BY) */}
        <section className="px-6 md:px-12 py-12 border-b border-accent-soft/30 bg-white/30 text-center select-none scroll-reveal">
          <p className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest mb-8">Trusted by talent scaling globally at</p>
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-45 grayscale contrast-200 font-bold tracking-[0.2em] text-xs text-text-primary">
            <span>VERCEL</span>
            <span>STRIPE</span>
            <span>LINEAR</span>
            <span>DUOLINGO</span>
            <span>AIRBNB</span>
            <span>NOTION</span>
            <span>COHERE</span>
          </div>
        </section>

        {/* PROFESSION TAGS AUTO-SCROLL ECOSYSTEM */}
        <section className="py-14 border-b border-accent-soft/30 bg-[#ECECE7]/10 overflow-hidden select-none relative scroll-reveal">
          {/* Edge Fade Masks for Cinematic Look */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-6 md:px-12 text-center mb-10">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">Ecosystem</span>
            <h3 className="text-xl md:text-3xl font-extrabold text-text-primary mt-4 tracking-tight">
              Calibrated for Global Tech Disciplines
            </h3>
            <p className="text-xs text-text-secondary mt-2.5 max-w-lg mx-auto font-medium">
              REZIQ parses resume signals and structures gaps for staff, seniors, and aspiring leads.
            </p>
          </div>

          <div className="relative flex flex-col gap-5 w-full py-2">
            {/* Row 1: Right to Left */}
            <div className="flex overflow-hidden w-full relative">
              <div className="animate-marquee-slow flex gap-5 pr-5">
                {marqueeRow1.map((tag, idx) => (
                  <div
                    key={`row1-${idx}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-panel-secondary border border-accent-soft/40 text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 hover:shadow-premium hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white transition-all duration-500 ease-out cursor-default bg-[#FDFDFB]/75"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/20" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Right to Left (offset slow speed) */}
            <div className="flex overflow-hidden w-full relative">
              <div className="animate-marquee-slower flex gap-5 pr-5">
                {marqueeRow2.map((tag, idx) => (
                  <div
                    key={`row2-${idx}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-panel-secondary border border-accent-soft/40 text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-accent/40 hover:shadow-premium hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white transition-all duration-500 ease-out cursor-default bg-[#FDFDFB]/75"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/20" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DEDICATED DEMO & CARD PREVIEW */}
        <section className="px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="flex flex-col gap-6">
              <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-premium">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">
                AI Skill Gap Intelligence
              </h2>
              <p className="text-text-secondary leading-relaxed font-medium text-sm">
                Paste your resume alongside any target job description. REZIQ parses the criteria, rates structural and technical alignment, and returns an expert consulting scorecard with a day-by-day learning roadmap.
              </p>
              <ul className="flex flex-col gap-3.5 text-text-secondary text-sm font-semibold">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Exact stack gap extraction
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> Recruiter-grade rating analytics
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success" /> 21-Day structural study schedule
                </li>
              </ul>
            </div>

            {/* INTERACTIVE SKILL GAP BOX */}
            <div className="glass-panel rounded-[36px] p-8 min-h-[400px] flex flex-col justify-between border border-accent-soft shadow-premium bg-[rgba(255,255,255,0.5)]">
              {demoState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="w-14 h-14 text-text-muted mb-4 animate-pulse" />
                  <p className="font-extrabold text-text-primary text-sm mb-2 uppercase tracking-wide">Simulate Resume Analysis</p>
                  <p className="text-xs text-text-secondary max-w-xs mb-6 font-medium">
                    See how the system parses skills and generates scoring telemetry.
                  </p>
                  <button
                    onClick={runSkillGapDemo}
                    className="bg-accent text-white px-6 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-premium uppercase tracking-wider cursor-pointer"
                  >
                    Analyze Sample Resume
                  </button>
                </div>
              )}

              {demoState === 'parsing' && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-accent-soft border-t-accent animate-spin mb-6" />
                  <p className="font-bold text-text-primary text-xs uppercase tracking-wider mb-2">Parsing PDF resume & indexing keywords...</p>
                  <div className="w-48 bg-[#ECECE7] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-200"
                      style={{ width: `${parseProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {demoState === 'completed' && (
                <div className="flex-1 flex flex-col gap-6 animate-scale-in">
                  <div className="flex justify-between items-center pb-4 border-b border-[#ECECE7]">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Analysis Complete</span>
                    <button
                      onClick={() => setDemoState('idle')}
                      className="text-xs text-text-secondary hover:text-text-primary underline font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  
                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#ECECE7]/40 p-4 rounded-2xl text-center border border-accent-soft/30">
                      <p className="text-[9px] text-text-secondary uppercase font-bold mb-1">ATS Score</p>
                      <p className="text-2xl font-extrabold text-success">92</p>
                    </div>
                    <div className="bg-[#ECECE7]/40 p-4 rounded-2xl text-center border border-accent-soft/30">
                      <p className="text-[9px] text-text-secondary uppercase font-bold mb-1">Recruiter</p>
                      <p className="text-2xl font-extrabold text-text-primary">89</p>
                    </div>
                    <div className="bg-[#ECECE7]/40 p-4 rounded-2xl text-center border border-[#DADAD4]/30">
                      <p className="text-[9px] text-text-secondary uppercase font-bold mb-1">Tech Fit</p>
                      <p className="text-2xl font-extrabold text-text-primary">95</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Identified Gaps</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-error/10 text-error text-[10px] px-3 py-1 rounded-full font-bold">Kubernetes</span>
                      <span className="bg-error/10 text-error text-[10px] px-3 py-1 rounded-full font-bold">GraphQL</span>
                      <span className="bg-error/10 text-error text-[10px] px-3 py-1 rounded-full font-bold">System Scaling</span>
                    </div>
                  </div>

                  {/* 21 Day Roadmap excerpt */}
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Roadmap Excerpt</p>
                    <div className="bg-[#ECECE7]/20 border border-accent-soft/40 p-3 rounded-xl flex gap-3 items-center">
                      <div className="text-center bg-accent text-white px-2.5 py-1 rounded text-[9px] font-bold uppercase">W1</div>
                      <div className="text-xs text-text-secondary font-medium">
                        <strong className="text-text-primary block font-bold">Kubernetes Fundamentals</strong>
                        Deploy microservices and study rolling updates.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="px-6 md:px-12 py-28 md:py-36 max-w-6xl mx-auto w-full border-t border-accent-soft/30 scroll-reveal">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">Capabilities</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mt-3">
              Recruiter-Grade Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: 'Skill Gap Intelligence', 
                desc: 'Locate stack gaps, missing frameworks, and methodologies required by job posting algorithms.',
                icon: Sparkles 
              },
              { 
                title: 'ATS Intelligence', 
                desc: 'Audits formatting, parsing constraints, section priorities, and text readability signals.',
                icon: Target 
              },
              { 
                title: 'Recruiter Psychology Analysis', 
                desc: 'Analyze how human reviewers evaluate technical ownership, timelines, and impact metrics.',
                icon: Cpu 
              },
              { 
                title: 'Market Competition Analysis', 
                desc: 'Align resume values against top 10% candidate pools and engineering benchmarks.',
                icon: Award 
              },
              { 
                title: 'Resume Intelligence', 
                desc: 'Pinpoint generic summaries, suspicious formatting styles, and word repetitions.',
                icon: FileText 
              },
              { 
                title: 'Career Positioning', 
                desc: 'Re-engineer project metrics to reflect concrete latency improvements, latency drops, and scale throughput.',
                icon: Zap 
              }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className={`glass-panel p-8 rounded-[32px] border border-accent-soft bg-[rgba(255,255,255,0.4)] flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all duration-300 group scroll-reveal delay-${(i % 3) * 100 + 100}`}>
                  <div className="w-12 h-12 rounded-2xl bg-accent-soft/30 flex items-center justify-center text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="px-6 md:px-12 py-28 md:py-36 bg-[#ECECE7]/20 border-y border-accent-soft/50 scroll-reveal">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-16">
              Three Steps. Infinite Clarity.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Paste Resume', desc: 'Securely input your raw resume plain text into the evaluation console.' },
                { step: '02', title: 'Add Job Link', desc: 'Provide the job description URL to map criteria parameters.' },
                { step: '03', title: 'Get Intelligence', desc: 'Download your recruiter-grade scorecard, stack gaps, and 21-day roadmap.' },
              ].map((item, idx) => (
                <div key={idx} className={`glass-panel p-8 rounded-[32px] border border-accent-soft bg-[rgba(255,255,255,0.6)] text-left flex flex-col justify-between min-h-[200px] shadow-sm scroll-reveal delay-${idx * 150 + 100}`}>
                  <p className="text-5xl font-extrabold text-accent/15 tracking-tight">{item.step}</p>
                  <div>
                    <h3 className="text-base font-extrabold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING PLANS */}
        <section id="pricing" className="px-6 md:px-12 py-28 md:py-36 max-w-6xl mx-auto w-full scroll-reveal">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">Membership</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mt-3">
              Calibrated SaaS Plans
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mt-6">
            {[
              {
                name: 'Essential Assessment',
                price: 'Free',
                description: 'Run basic technical audits and scan initial keyword misalignments.',
                features: [
                  '3 Skill Gap Assessments per month',
                  'Basic ATS keyword checklist',
                  'Standard 7-Day improvement roadmap',
                  'Standard response speeds'
                ],
                cta: 'Sign Up',
                popular: false,
                accent: 'border-accent-soft'
              },
              {
                name: 'Forensic Pro',
                price: '$29',
                period: '/month',
                description: 'Unleash recruiter-grade intelligence, system analytics, and detailed roadmap resource links.',
                features: [
                  'Unlimited Skill Gap Assessments',
                  'Full 21-Day detailed study roadmaps',
                  'Direct links to courses, docs, and tutorials',
                  'Advanced ATS Reverse-Engineering metrics',
                  'Priority failover inference queue',
                  'Print-optimized PDF report exports'
                ],
                cta: 'Get Started with Pro',
                popular: true,
                accent: 'border-accent shadow-premium bg-[rgba(255,255,255,0.72)]'
              },
              {
                name: 'Enterprise Agency',
                price: '$149',
                period: '/month',
                description: 'Engineered for recruitment agencies and career consulting partners requiring bulk volume.',
                features: [
                  'Dedicated custom prompt layouts',
                  'Multi-seat developer team logins (up to 10)',
                  'Custom white-labeled PDF exports',
                  'Raw telemetry API database integration',
                  '99.9% uptime SLA guarantee',
                  '24/7 dedicated engineering support'
                ],
                cta: 'Contact Partner Team',
                popular: false,
                accent: 'border-accent-soft'
              }
            ].map((plan, idx) => (
              <div
                key={plan.name}
                className={`glass-panel rounded-[36px] p-8 border flex flex-col justify-between relative overflow-hidden transition-all ${
                  plan.popular ? 'lg:-translate-y-4' : ''
                } ${plan.accent} scroll-reveal delay-${idx * 150 + 100}`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Zap className="w-2.5 h-2.5 fill-white" />
                    RECOMMENDED
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    {plan.name}
                  </p>
                  
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-xs text-text-muted font-bold tracking-wide uppercase">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-text-secondary leading-relaxed mb-6 font-semibold">
                    {plan.description}
                  </p>
                  
                  <hr className="border-accent-soft/40 mb-6" />
                  
                  <ul className="flex flex-col gap-3.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary font-medium">
                        <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/login"
                  className={`w-full h-12 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-accent text-white hover:opacity-90 shadow-premium'
                      : 'border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary'
                  }`}
                >
                  {plan.cta}
                  {plan.popular && <ArrowRight className="w-3.5 h-3.5" />}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted font-bold tracking-wide uppercase mt-12 max-w-sm mx-auto text-center select-none">
            <Shield className="w-4 h-4" />
            SECURE 256-BIT ENCRYPTED TELEMETRY TRANSACTIONS
          </div>
        </section>

        {/* TESTIMONIALS (REVIEWS) */}
        <section id="reviews" className="px-6 md:px-12 py-28 md:py-36 bg-[#ECECE7]/20 border-t border-accent-soft/50 scroll-reveal">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">Reviews</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mt-3">
                Vouched for by Lead Engineers
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote: "REZIQ completely parsed my stack and identified I lacked production GraphQL scale metrics. Landed my staff engineer role at Uber two weeks later.",
                  author: "Alex Mercer",
                  title: "Staff Engineer, Uber",
                  initials: "AM"
                },
                {
                  quote: "I transitioned from product design to frontend engineering. The 21-day timeline gave me a structured blueprint of what to build to bridge the gap.",
                  author: "Sarah Jenkins",
                  title: "Frontend Lead, Vercel",
                  initials: "SJ"
                },
                {
                  quote: "The recruiter psychology analysis is scary accurate. It showed me exactly how hiring committees read my bullet points. Worth every penny.",
                  author: "Marcus Chen",
                  title: "Director of Engineering, Stripe",
                  initials: "MC"
                },
                {
                  quote: "My resume was getting lost in the ATS black hole despite 8 years of experience. After adjusting my PM metrics using REZIQ's feedback, my callback rate doubled.",
                  author: "Elena Rostova",
                  title: "Senior Product Manager, Netflix",
                  initials: "ER"
                },
                {
                  quote: "As a developer shifting to AI, I didn't know how to demonstrate ML readiness. REZIQ mapped my gaps in PyTorch and tensor systems, helping me pass the Cohere screen.",
                  author: "David Kael",
                  title: "AI Engineer, Cohere",
                  initials: "DK"
                },
                {
                  quote: "Design resumes are hard to quantify. REZIQ helped me connect my UX iterations directly to business telemetry. The resulting clarity gave me supreme confidence.",
                  author: "Maya Lin",
                  title: "Lead UX Architect, Airbnb",
                  initials: "ML"
                }
              ].map((rev, i) => (
                <div
                  key={i}
                  className={`glass-panel p-8 rounded-[32px] border border-accent-soft flex flex-col justify-between shadow-sm bg-white/40 hover:bg-white/85 hover:-translate-y-1 hover:shadow-premium transition-all duration-500 ease-out scroll-reveal delay-${(i % 3) * 100 + 100}`}
                >
                  <div>
                    <div className="flex gap-1 mb-4 text-accent">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-text-secondary text-xs leading-relaxed mb-6 font-semibold italic">
                      “{rev.quote}”
                    </p>
                  </div>
                  <div className="flex items-center gap-3 border-t border-accent-soft/30 pt-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {rev.initials}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-text-primary">{rev.author}</p>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">{rev.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="px-6 md:px-12 py-28 md:py-36 max-w-6xl mx-auto w-full scroll-reveal">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mt-3">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column FAQs */}
            <div className="flex flex-col gap-4">
              {faqs.slice(0, 3).map((item, idx) => {
                const globalIdx = idx;
                return (
                  <div key={globalIdx} className="glass-panel border border-accent-soft/50 rounded-[24px] overflow-hidden bg-white/40 shadow-sm scroll-reveal">
                    <button
                      onClick={() => toggleFaq(globalIdx)}
                      aria-expanded={faqExpanded[globalIdx] ? 'true' : 'false'}
                      aria-controls={`faq-answer-${globalIdx}`}
                      className="w-full flex justify-between items-center p-6 text-left font-bold text-text-primary hover:bg-white/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${faqExpanded[globalIdx] ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                      id={`faq-answer-${globalIdx}`}
                      className={`faq-content ${faqExpanded[globalIdx] ? 'expanded px-6 pb-6 pt-4 border-t border-[#ECECE7]/40' : 'px-6 pb-0 pt-0'} text-xs text-text-secondary leading-relaxed font-semibold`}
                    >
                      {item.a}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column FAQs */}
            <div className="flex flex-col gap-4">
              {faqs.slice(3).map((item, idx) => {
                const globalIdx = 3 + idx;
                return (
                  <div key={globalIdx} className="glass-panel border border-accent-soft/50 rounded-[24px] overflow-hidden bg-white/40 shadow-sm scroll-reveal">
                    <button
                      onClick={() => toggleFaq(globalIdx)}
                      aria-expanded={faqExpanded[globalIdx] ? 'true' : 'false'}
                      aria-controls={`faq-answer-${globalIdx}`}
                      className="w-full flex justify-between items-center p-6 text-left font-bold text-text-primary hover:bg-white/40 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">{item.q}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${faqExpanded[globalIdx] ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                      id={`faq-answer-${globalIdx}`}
                      className={`faq-content ${faqExpanded[globalIdx] ? 'expanded px-6 pb-6 pt-4 border-t border-[#ECECE7]/40' : 'px-6 pb-0 pt-0'} text-xs text-text-secondary leading-relaxed font-semibold`}
                    >
                      {item.a}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="px-6 md:px-12 py-32 md:py-44 text-center max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl md:text-7xl font-extrabold tracking-tighter leading-none text-text-primary mb-6">
            Own Your Career Telemetry.
          </h2>
          <p className="text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed text-xs font-semibold">
            Stop guessing your hiring fit. Initialize your career assessment and start scanning your resume against target profiles today.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-accent text-white font-bold h-12 px-8 rounded-full hover:opacity-95 transition-opacity shadow-premium text-xs uppercase tracking-wider"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#ECECE7]/40 border-t border-accent-soft/40 py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 select-none">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">&copy; 2026 REZIQ. Crafted for global engineering elites.</p>
        <div className="flex gap-8 text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <Link href="/dashboard/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
          <Link href="/dashboard/help" className="hover:text-text-primary transition-colors">Support</Link>
          <Link href="/dashboard/feedback" className="hover:text-text-primary transition-colors">Feedback</Link>
        </div>
      </footer>

    </div>
  );
}
