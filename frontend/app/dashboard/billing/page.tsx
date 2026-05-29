'use client';

import React from 'react';
import { CreditCard, FileText, Download, Sparkles, RefreshCcw, ShieldCheck } from 'lucide-react';

export default function BillingPage() {
  const invoices = [
    { date: 'May 2026', id: 'INV-18302', amount: '$29.00', status: 'Paid' },
    { date: 'Apr 2026', id: 'INV-17482', amount: '$29.00', status: 'Paid' },
    { date: 'Mar 2026', id: 'INV-16942', amount: '$29.00', status: 'Paid' },
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full max-w-[1000px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2">
          Billing Operations
        </h1>
        <p className="text-sm text-text-secondary">
          Manage your active subscription telemetry, credit cards, and invoice history files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Columns - Payment Info & Card */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Active plan details */}
          <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-accent-soft shadow-sm bg-[rgba(255,255,255,0.4)] flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-soft/30 border border-accent-soft/60 text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-3">
                  <Sparkles className="w-2.5 h-2.5 text-accent animate-pulse" />
                  Forensic Pro Active
                </span>
                <h2 className="text-xl font-extrabold text-text-primary tracking-tight mb-1">
                  $29.00 / month
                </h2>
                <p className="text-xs text-text-muted">
                  Auto-renews on June 27, 2026. Billed via Visa ending in 4242.
                </p>
              </div>
              <button className="flex items-center gap-1.5 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all">
                <RefreshCcw className="w-3.5 h-3.5" />
                Change Plan
              </button>
            </div>

            <div className="border-t border-accent-soft/40 pt-4 flex gap-6 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              <span>Assessment usage: Unlimited</span>
              <span>&bull;</span>
              <span>Redundancy Queue: Priority</span>
            </div>
          </div>

          {/* Payment Method details */}
          <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-accent-soft shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
              <CreditCard className="w-4.5 h-4.5" /> Payment Method Details
            </h3>

            <div className="p-5 bg-white/70 border border-accent-soft/40 rounded-[20px] flex justify-between items-center shadow-inner">
              <div className="flex items-center gap-4">
                {/* Minimalist credit card vector/chip design */}
                <div className="w-12 h-8 bg-text-primary rounded-md flex items-center justify-center text-white font-extrabold text-[10px] tracking-widest relative overflow-hidden">
                  <div className="absolute top-1 left-1.5 w-3 h-2 bg-warning/60 rounded-sm" />
                  VISA
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">Visa ending in 4242</p>
                  <p className="text-[10px] text-text-muted">Expires 12/28 &bull; Default Payment Method</p>
                </div>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:underline">
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Invoices */}
        <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-accent-soft shadow-sm flex flex-col gap-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <FileText className="w-4.5 h-4.5" /> Invoice History
          </h3>

          <div className="flex flex-col gap-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 bg-white/60 hover:bg-white rounded-[20px] border border-accent-soft/50 flex justify-between items-center transition-colors shadow-sm"
              >
                <div>
                  <p className="text-[10px] font-extrabold text-text-primary">{inv.id}</p>
                  <p className="text-[9px] font-semibold text-text-muted">{inv.date} &bull; {inv.amount}</p>
                </div>
                
                <button
                  title="Download invoice"
                  className="w-8 h-8 rounded-full bg-[#ECECE7]/60 hover:bg-accent hover:text-white text-text-secondary flex items-center justify-center transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-accent-soft/40 pt-4 flex justify-center items-center gap-1.5 text-[9px] text-text-muted font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-success" />
            Invoice transmissions verified
          </div>
        </div>
      </div>
    </div>
  );
}
