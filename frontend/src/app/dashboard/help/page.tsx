'use client';

import React, { useState } from 'react';
import { HelpCircle, Mail, Send, CheckCircle2, ChevronRight, BookOpen, ShieldAlert, Sliders } from 'lucide-react';

export default function HelpSupportPage() {
  const [supportMessage, setSupportMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketId(`REQ-${Math.floor(100000 + Math.random() * 900000)}`);
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full max-w-[1000px] mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 md:w-12 md:h-12 text-accent" />
          Help & Support Hub
        </h1>
        <p className="text-sm text-text-secondary">
          Deep system documentation, operational manuals, and direct support lines for the REZIQ Career Intelligence Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Support Documentation Columns */}
        <div className="md:col-span-2 flex flex-col gap-8">
          
          {/* Section 1: ATS Engine Documentation */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-[rgba(255,255,255,0.4)]">
            <div className="flex items-center gap-3 border-b border-[#ECECE7] pb-4 mb-4">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text-primary">ATS & Resume Auditing Architecture</h2>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed flex flex-col gap-3">
              <p>
                REZIQ utilizes a customized semantic distance algorithm that maps plain text resume files against real-time job posting requirements. 
                Rather than checking for simple keyword density, our system evaluates the context of your skills, technologies, and achievements.
              </p>
              <h3 className="font-bold text-text-primary uppercase tracking-wider text-[10px] mt-2">Core Evaluation Parameters:</h3>
              <ul className="list-disc pl-4 flex flex-col gap-1.5">
                <li><strong>Semantic Relevancy:</strong> Analyzes whether candidate credentials solve the target job's performance objectives.</li>
                <li><strong>Keyword Gaps:</strong> Identifies essential tooling or methodologies explicitly listed in the posting that are missing from the resume.</li>
                <li><strong>Structure & Formatting:</strong> Audits layout readability, section organization, and parsing stability.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: AI Models & Failover Protocols */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-[rgba(255,255,255,0.4)]">
            <div className="flex items-center gap-3 border-b border-[#ECECE7] pb-4 mb-4">
              <Sliders className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-text-primary">AI Inference & Failover Operations</h2>
            </div>
            <div className="text-xs text-text-secondary leading-relaxed flex flex-col gap-3">
              <p>
                To provide instantaneous response times, REZIQ connects directly to two redundant, high-throughput cloud endpoints:
              </p>
              <ul className="list-decimal pl-4 flex flex-col gap-1.5">
                <li><strong>Groq DeepSeek R1:</strong> Utilizes deep reasoning distill models (70b parameters) to break down recruiter thinking, build structured learning lists, and outline the 21-day learning roadmap.</li>
                <li><strong>NVIDIA Llama 3.3 Nemotron:</strong> Operates as our primary fast-pass classifier and acts as a rate-limiting failover endpoint if upstream Groq connections experience high latency.</li>
              </ul>
              <p>
                You can select or adjust these endpoints under the <strong className="text-text-primary">Settings</strong> menu to match your preferred speed and depth of critique.
              </p>
            </div>
          </div>
          
        </div>

        {/* Contact and Direct Help Column */}
        <div className="flex flex-col gap-6">
          
          {/* Direct Email Contact Box */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-white/70 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-accent">
              <Mail className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Direct REZIQ Support</h2>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              If you require manual account recovery, have database sync issues, or want to report security concerns, write to us directly.
            </p>
            
            <a 
              href="mailto:shivamaniforwork@gmail.com"
              className="mt-2 flex items-center justify-between p-4 bg-[#ECECE7]/50 hover:bg-[#ECECE7]/85 border border-[#DADAD4]/60 rounded-[20px] transition-all group"
            >
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">Primary Email Support</p>
                <p className="text-xs font-bold text-text-primary truncate">shivamaniforwork@gmail.com</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary group-hover:translate-x-1 transition-transform shrink-0" />
            </a>
          </div>

          {/* Inline Support Ticket Form */}
          <div className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-white/70 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary mb-4">Create Support Ticket</h2>
            
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-6 text-center animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-success mb-3" />
                <p className="font-bold text-text-primary text-xs mb-1">Ticket Submitted</p>
                <p className="text-[10px] text-text-secondary mb-3">Your tracking identifier is:</p>
                <code className="bg-[#ECECE7]/80 border border-[#DADAD4]/80 px-3 py-1 rounded-md text-[10px] font-mono font-bold text-text-primary">
                  {ticketId}
                </code>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Priority Level</label>
                  <select 
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-accent-soft bg-[#ECECE7]/30 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="low">Low (General Query)</option>
                    <option value="medium">Medium (Standard Ticket)</option>
                    <option value="high">High (Inference Block)</option>
                    <option value="urgent">Urgent (Data Issue)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Ticket Description</label>
                  <textarea
                    rows={4}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    required
                    placeholder="Provide details of your issue..."
                    className="p-3 border border-accent-soft rounded-xl bg-[#ECECE7]/30 text-xs focus:outline-none focus:border-accent resize-none placeholder:text-text-muted"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!supportMessage.trim()}
                  className="h-11 w-full bg-accent text-white font-bold rounded-full text-xs shadow-premium hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Submit Support Ticket
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
