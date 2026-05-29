'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, Trash2, ShieldAlert, Cpu } from 'lucide-react';

export default function PreferencesPage() {
  const [saveLocalReports, setSaveLocalReports] = useState(true);
  const [fineTuningConsent, setFineTuningConsent] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const localSaved = localStorage.getItem('reziq_save_local');
    if (localSaved) setSaveLocalReports(localSaved === 'true');
    const consentSaved = localStorage.getItem('reziq_consent');
    if (consentSaved) setFineTuningConsent(consentSaved === 'true');
    const analyticsSaved = localStorage.getItem('reziq_analytics');
    if (analyticsSaved) setAnalyticsOptIn(analyticsSaved === 'true');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('reziq_save_local', saveLocalReports.toString());
    localStorage.setItem('reziq_consent', fineTuningConsent.toString());
    localStorage.setItem('reziq_analytics', analyticsOptIn.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear your local AI model configurations and session cache? This will reset all telemetry preferences.')) {
      localStorage.clear();
      alert('Local session cache cleared successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full max-w-[800px] mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2 flex items-center gap-3">
          <Sliders className="w-8 h-8 md:w-12 md:h-12 text-accent" />
          Data & Cache Preferences
        </h1>
        <p className="text-sm text-text-secondary">
          Configure telemetry capture parameters, fine-tuning consent, browser cache limits, and system reset keys.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl flex gap-3 items-center text-xs font-semibold animate-scale-in border bg-success/15 border-success/35 text-success">
          <CheckCircle2 className="w-5 h-5" />
          <span>Preferences applied successfully. Local storage tables updated.</span>
        </div>
      )}

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-8">
        
        {/* Section 1: Telemetry Data Consent */}
        <div className="glass-panel rounded-[28px] p-8 border border-accent-soft shadow-premium bg-[rgba(255,255,255,0.4)] flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-[#ECECE7] pb-4">
            <Cpu className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">Model Telemetry Consent</h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* Save Reports */}
            <div className="flex items-start justify-between gap-6 p-4 bg-white/60 border border-accent-soft/40 rounded-[20px]">
              <div className="max-w-[85%]">
                <p className="text-xs font-bold text-text-primary mb-0.5">Cache AI Reports Locally</p>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Saves generated markdown reports to local browser memory. Disabling this requires all report retrievals to fetch raw database rows via query streams.
                </p>
              </div>
              <input
                type="checkbox"
                checked={saveLocalReports}
                onChange={(e) => setSaveLocalReports(e.target.checked)}
                className="w-4.5 h-4.5 cursor-pointer accent-accent mt-1"
              />
            </div>

            {/* Fine Tuning Consent */}
            <div className="flex items-start justify-between gap-6 p-4 bg-white/60 border border-accent-soft/40 rounded-[20px]">
              <div className="max-w-[85%]">
                <p className="text-xs font-bold text-text-primary mb-0.5">Anonymized Prompt Telemetry Logging</p>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Permit our developers to gather parsed, strictly anonymized resume-job semantic reports to calibrate prompt embeddings and fine-tune DeepSeek reasoning weights.
                </p>
              </div>
              <input
                type="checkbox"
                checked={fineTuningConsent}
                onChange={(e) => setFineTuningConsent(e.target.checked)}
                className="w-4.5 h-4.5 cursor-pointer accent-accent mt-1"
              />
            </div>

            {/* Analytics Opt In */}
            <div className="flex items-start justify-between gap-6 p-4 bg-white/60 border border-accent-soft/40 rounded-[20px]">
              <div className="max-w-[85%]">
                <p className="text-xs font-bold text-text-primary mb-0.5">Usage Analytics Tracking</p>
                <p className="text-[10px] text-text-secondary leading-normal">
                  Allows tracking of interface performance, load speeds, report download clicks, and telemetry error metrics.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsOptIn}
                onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                className="w-4.5 h-4.5 cursor-pointer accent-accent mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Danger Zone */}
        <div className="glass-panel rounded-[28px] p-8 border border-error/20 bg-error/5 shadow-premium flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-error/25 pb-4 text-error">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="text-base font-bold">System Reset keys (Danger Zone)</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="max-w-md">
              <p className="text-xs font-bold text-error mb-0.5">Flush Browser Telemetry Cache</p>
              <p className="text-[10px] text-error/80 leading-normal">
                This will permanently wipe all local storage data, including your calibrated AI model selections, threshold target numbers, and telemetry configs. This action is irreversible.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="flex items-center gap-2 px-5 py-3 bg-error hover:bg-error/90 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Flush Local Cache
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="h-14 w-full bg-accent text-white font-bold rounded-full hover:opacity-90 transition-opacity text-sm shadow-premium flex items-center justify-center gap-2 mt-2"
        >
          <Save className="w-4 h-4" />
          Save System Preferences
        </button>
      </form>
    </div>
  );
}
