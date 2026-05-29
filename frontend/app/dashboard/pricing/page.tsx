'use client';

import React from 'react';
import { CheckCircle2, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Essential Assessment',
      price: 'Free',
      description: 'Run basic technical audits and scan initial keyword misalignments.',
      features: [
        '3 Skill Gap Assessments per month',
        'Basic ATS keyword checklist',
        'Standard 7-Day improvement roadmap',
        'Standard response speeds (Groq endpoints)'
      ],
      cta: 'Current Plan',
      active: false,
      popular: false,
      accent: 'border-accent-soft'
    },
    {
      name: 'Forensic Pro',
      price: '$29',
      period: '/month',
      description: 'Unleash CID-grade recruiter psychology evaluation and direct documentation resource mapping.',
      features: [
        'Unlimited Skill Gap Assessments',
        'Full 21-Day detailed study roadmaps',
        'Direct links to official docs, youtube tutorials, & courses',
        'Advanced ATS Reverse-Engineering metrics',
        'Priority high-speed generation fallback queue',
        'Print-optimized PDF report exports'
      ],
      cta: 'Upgrade to Forensic Pro',
      active: true,
      popular: true,
      accent: 'border-accent shadow-premium bg-[rgba(255,255,255,0.7)]'
    },
    {
      name: 'Enterprise Agency',
      price: '$149',
      period: '/month',
      description: 'Engineered for recruitment agencies and career consulting partners requiring bulk volume.',
      features: [
        'Dedicated custom prompt layouts',
        'Multi-seat developer team logins (up to 10 seats)',
        'Custom white-labeled PDF exports',
        'Raw telemetry API database integration',
        '99.9% uptime SLA guarantee',
        '24/7 dedicated engineering support channel'
      ],
      cta: 'Contact Partner Team',
      active: false,
      popular: false,
      accent: 'border-accent-soft'
    }
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-soft/40 border border-accent-soft/80 text-[10px] font-bold uppercase tracking-wider mb-4 text-text-secondary">
          <Sparkles className="w-3 h-3 text-accent animate-pulse" />
          Subscription Telemetry
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-3">
          Pragmatic Premium Plans.
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Select your preparation caliber. Upgrade your pipeline to reverse-engineer recruiter algorithms with absolute accuracy.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full mt-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`glass-panel rounded-[36px] p-8 border flex flex-col justify-between relative overflow-hidden transition-all ${
              plan.popular ? 'lg:-translate-y-4' : ''
            } ${plan.accent}`}
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
              
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
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

            <button
              disabled={plan.name === 'Essential Assessment'}
              className={`w-full h-12 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                plan.popular
                  ? 'bg-accent text-white hover:opacity-90 shadow-premium'
                  : plan.name === 'Essential Assessment'
                  ? 'bg-[#ECECE7] text-text-muted cursor-default'
                  : 'border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary'
              }`}
            >
              {plan.cta}
              {plan.popular && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-text-muted font-bold tracking-wide uppercase mt-6 max-w-sm mx-auto text-center">
        <Shield className="w-4 h-4" />
        SECURE 256-BIT ENCRYPTED TELEMETRY TRANSACTIONS
      </div>
    </div>
  );
}
