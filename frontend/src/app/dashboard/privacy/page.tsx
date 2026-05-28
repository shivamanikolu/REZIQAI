'use client';

import React from 'react';
import { ShieldAlert, Lock, EyeOff, Server, FileCheck, Key, Database, RefreshCw } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full max-w-[1000px] mx-auto pb-16">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-3.5 mb-3">
          <span className="p-2.5 bg-accent-soft/30 rounded-2xl border border-accent-soft/60">
            <ShieldAlert className="w-8 h-8 text-accent animate-pulse" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Security Registry</span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary">
              Privacy & Data protection
            </h1>
          </div>
        </div>
        <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
          Comprehensive declaration of telemetry pipeline configurations, API data flows, Row-Level Security, and candidate record retention criteria.
        </p>
      </div>

      {/* Core Security Architecture (2 Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content Areas */}
        <div className="md:col-span-2 flex flex-col gap-8">
          
          {/* Section 1: In-Flight Data Pipelines */}
          <div className="glass-panel rounded-[32px] p-8 border border-accent-soft bg-[rgba(255,255,255,0.45)]">
            <div className="flex items-center gap-3 border-b border-[#ECECE7] pb-4 mb-5">
              <EyeOff className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text-primary tracking-tight">1. In-Flight Telemetry Pipelines</h2>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed flex flex-col gap-4">
              <p>
                When you initiate a skill-gap audit, REZIQ processes your resume content and the target job details through a stateless pipeline. 
                Unlike legacy systems, we do not store raw resume file copies on file servers.
              </p>
              
              <div className="flex gap-4 p-4.5 bg-white/70 border border-accent-soft/50 rounded-[20px]">
                <RefreshCw className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-text-primary text-xs mb-1">Stateless Inference Protocol</p>
                  <p className="text-[10px] leading-normal text-text-secondary">
                    Your candidate resume plain text undergoes semantic tokenization dynamically. 
                    The token strings are passed via TLS-encrypted HTTPS tunnels to our inference endpoints and are immediately cleared from temporary RAM buffers upon final stream assembly.
                  </p>
                </div>
              </div>

              <p>
                Our AI parsing models (DeepSeek R1 and Llama 3.3 Nemotron) are configured to operate statelessly. 
                This guarantees your private professional experience credentials, projects, and target career goals are never utilized for general LLM fine-tuning or training datasets.
              </p>
            </div>
          </div>

          {/* Section 2: Upstream Partners Compliance */}
          <div className="glass-panel rounded-[32px] p-8 border border-accent-soft bg-[rgba(255,255,255,0.45)]">
            <div className="flex items-center gap-3 border-b border-[#ECECE7] pb-4 mb-5">
              <Key className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text-primary tracking-tight">2. Upstream Endpoint Processing</h2>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed flex flex-col gap-4">
              <p>
                REZIQ coordinates analysis using APIs hosted by Groq and NVIDIA Cloud Foundations. Both hosting providers maintain high-grade enterprise compliance standard certificates:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-white/60 rounded-2xl border border-accent-soft/40">
                  <p className="font-bold text-text-primary text-xs mb-1.5">Groq Cloud Security</p>
                  <p className="text-[10px] leading-normal text-text-secondary">
                    Processes deep reasoning prompt requests statelessly. Under our API license, no user prompts or generated outputs are saved to persistent logs.
                  </p>
                </div>
                <div className="p-4 bg-white/60 rounded-2xl border border-accent-soft/40">
                  <p className="font-bold text-text-primary text-xs mb-1.5">NVIDIA Cloud Security</p>
                  <p className="text-[10px] leading-normal text-text-secondary">
                    Acts as our high-speed failover server. All prompt executions are covered under standard NVIDIA enterprise zero-data-retention agreements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Supabase Database Security */}
          <div className="glass-panel rounded-[32px] p-8 border border-accent-soft bg-[rgba(255,255,255,0.45)]">
            <div className="flex items-center gap-3 border-b border-[#ECECE7] pb-4 mb-5">
              <Database className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text-primary tracking-tight">3. Database Guardrails & Row-Level Isolation</h2>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed flex flex-col gap-4">
              <p>
                Report metadata and profile goals are synchronized to a cloud Postgres database managed by Supabase. 
                We enforce multi-tenant isolation protocols to safeguard user data:
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-2">
                <li><strong>Row-Level Security (RLS):</strong> The Postgres engine enforces strict RLS policies. No query can access or write to a report entry unless the executing request contains a valid JWT matching the entry's <code>user_id</code>.</li>
                <li><strong>JWT-Based Handshakes:</strong> All requests from the client require authentication tokens validated directly against our Supabase Auth servers.</li>
                <li><strong>Encrypted Connections:</strong> Database endpoints are restricted to TLS 1.3 encrypted connections. All data at rest is encrypted using AES-256 keys.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Info Sidebar (Right Column) */}
        <div className="flex flex-col gap-6">
          
          {/* Summary Stats Box */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-white/70 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-success" />
              Encryption Dashboard
            </h2>
            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex justify-between items-center py-1.5 border-b border-accent-soft/40">
                <span className="text-[10px] font-semibold text-text-secondary">Transit Protocol</span>
                <span className="text-[10px] font-bold text-text-primary uppercase bg-[#ECECE7]/60 px-2 py-0.5 rounded border border-accent-soft/30">TLS 1.3</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-accent-soft/40">
                <span className="text-[10px] font-semibold text-text-secondary">Storage Standard</span>
                <span className="text-[10px] font-bold text-text-primary uppercase bg-[#ECECE7]/60 px-2 py-0.5 rounded border border-accent-soft/30">AES-256</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-accent-soft/40">
                <span className="text-[10px] font-semibold text-text-secondary">RLS Isolation</span>
                <span className="text-[10px] font-bold text-success uppercase bg-success/10 px-2 py-0.5 rounded border border-success/20">Active</span>
              </div>
            </div>
          </div>

          {/* User Rights & Cascade Delete Info */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-white/70 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-accent" />
              Data Ownership Rights
            </h2>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              REZIQ respects global data protection regulations (including GDPR and CCPA). 
              You retain absolute ownership of all uploaded content. 
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              If you request report deletions or clear your local cache, the database cascade-deletes all associated telemetry rows from our servers permanently.
            </p>
            <div className="p-3 bg-[#ECECE7]/30 border border-[#DADAD4]/50 rounded-[16px] text-[10px] text-text-secondary">
              Need assistance? Email our Security Officer at{' '}
              <a href="mailto:shivamaniforwork@gmail.com" className="text-text-primary underline font-bold">
                shivamaniforwork@gmail.com
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
