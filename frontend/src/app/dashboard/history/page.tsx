'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { FileText, ChevronRight, Calendar, ArrowLeft, Download, Loader2, Trash2, ShieldAlert, Cpu, Timer, Database, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownStyles = `
  .report-markdown h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin-top: 3rem;
    margin-bottom: 1.5rem;
    color: #0A0A0A;
    border-bottom: 2px solid rgba(17, 17, 17, 0.1);
    padding-bottom: 1rem;
    letter-spacing: -0.03em;
  }
  .report-markdown h2 {
    font-size: 1.65rem;
    font-weight: 750;
    margin-top: 2.5rem;
    margin-bottom: 1.25rem;
    color: #111111;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    padding-bottom: 0.6rem;
    letter-spacing: -0.02em;
  }
  .report-markdown h3 {
    font-size: 1.25rem;
    font-weight: 650;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    color: #1A1A1A;
    letter-spacing: -0.015em;
  }
  .report-markdown p {
    font-size: 0.975rem;
    line-height: 1.85;
    margin-bottom: 1.5rem;
    color: rgba(10, 10, 10, 0.8);
  }
  .report-markdown ul {
    list-style-type: disc;
    margin-left: 1.75rem;
    margin-bottom: 1.5rem;
  }
  .report-markdown ol {
    list-style-type: decimal;
    margin-left: 1.75rem;
    margin-bottom: 1.5rem;
  }
  .report-markdown li {
    margin-bottom: 0.65rem;
    line-height: 1.75;
    color: rgba(10, 10, 10, 0.8);
  }
  .report-markdown table {
    width: 100%;
    border-collapse: collapse;
    margin: 2.5rem 0;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02);
  }
  .report-markdown th, .report-markdown td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid rgba(10, 10, 10, 0.06);
  }
  .report-markdown th {
    background-color: rgba(236, 236, 231, 0.95);
    font-weight: 700;
    color: #0A0A0A;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .report-markdown td {
    font-size: 0.875rem;
    color: rgba(10, 10, 10, 0.8);
    line-height: 1.6;
  }
  .report-markdown tr:last-child td {
    border-bottom: none;
  }
  .report-markdown tr:hover td {
    background-color: rgba(236, 236, 231, 0.25);
  }
  .report-markdown a {
    color: #0A0A0A;
    text-decoration: underline;
    font-weight: 600;
    transition: opacity 0.2s;
  }
  .report-markdown a:hover {
    opacity: 0.75;
  }
  .report-markdown hr {
    border: 0;
    height: 1px;
    background: rgba(10, 10, 10, 0.1);
    margin: 3rem 0;
  }
  .report-markdown blockquote {
    border-left: 4px solid #111111;
    padding-left: 1.5rem;
    margin: 1.75rem 0;
    font-style: italic;
    color: rgba(10, 10, 10, 0.68);
    background-color: rgba(236, 236, 231, 0.15);
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-radius: 0 8px 8px 0;
  }
`;

interface DatabaseHistory {
  id: string;
  user_id: string;
  report_id?: string;
  job_title: string;
  job_link?: string;
  resume_text: string;
  generated_output: string;
  pdf_url: string;
  ai_model: string;
  generation_time_ms: number;
  word_count: number;
  report_size: number;
  generation_status: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAppStore();
  const [dbHistory, setDbHistory] = useState<DatabaseHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<DatabaseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setDbHistory(data);
      } catch (err) {
        console.warn('Failed to retrieve history logs from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleDeleteHistory = async (historyId: string, pdfUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this telemetry log? This will remove the database log and the generated PDF file if applicable.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Delete database row
      const { error: dbError } = await supabase
        .from('history')
        .delete()
        .eq('id', historyId);
        
      if (dbError) throw dbError;
      
      // 2. Remove PDF from storage
      if (pdfUrl) {
        const urlParts = pdfUrl.split('/report-pdfs/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          const { error: storageError } = await supabase.storage
            .from('report-pdfs')
            .remove([storagePath]);
            
          if (storageError) {
            console.warn('Could not delete PDF file from storage:', storageError);
          }
        }
      }
      
      // 3. Refresh UI instantly
      setDbHistory((prev) => prev.filter((h) => h.id !== historyId));
      setSelectedHistory(null);
    } catch (err: any) {
      console.error('Failed to delete history log:', err);
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedHistory?.pdf_url) return;
    const link = document.createElement('a');
    link.href = selectedHistory.pdf_url;
    link.target = '_blank';
    link.download = `REZIQ_Telemetry_${selectedHistory.job_title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedHistory) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto animate-fade-in-up">
        <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />
        
        {/* Detail Header */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setSelectedHistory(null)}
            className="flex items-center gap-2 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Telemetry
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDeleteHistory(selectedHistory.id, selectedHistory.pdf_url)}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-error/10 hover:bg-error text-error hover:text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all border border-error/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Log
            </button>
            {selectedHistory.pdf_url && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-premium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Stats Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 text-center">
            <div className="flex justify-center mb-1 text-text-muted"><Cpu className="w-4 h-4" /></div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">AI Model</p>
            <p className="text-sm font-extrabold text-text-primary mt-1 truncate">{selectedHistory.ai_model}</p>
          </div>

          <div className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 text-center">
            <div className="flex justify-center mb-1 text-text-muted"><Timer className="w-4 h-4" /></div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Latency</p>
            <p className="text-sm font-extrabold text-text-primary mt-1">{(selectedHistory.generation_time_ms / 1000).toFixed(2)}s</p>
          </div>

          <div className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 text-center">
            <div className="flex justify-center mb-1 text-text-muted"><Database className="w-4 h-4" /></div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">File Size</p>
            <p className="text-sm font-extrabold text-text-primary mt-1">
              {selectedHistory.report_size ? `${(selectedHistory.report_size / 1024).toFixed(1)} KB` : 'N/A'}
            </p>
          </div>

          <div className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 text-center">
            <div className="flex justify-center mb-1 text-text-muted"><FileText className="w-4 h-4" /></div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Word Count</p>
            <p className="text-sm font-extrabold text-text-primary mt-1">{selectedHistory.word_count || 0}</p>
          </div>

          <div className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 text-center col-span-2 md:col-span-1">
            <div className="flex justify-center mb-1">
              {selectedHistory.generation_status === 'Success' ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-error" />
              )}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Status</p>
            <p className={`text-sm font-extrabold mt-1 ${selectedHistory.generation_status === 'Success' ? 'text-success' : 'text-error'}`}>
              {selectedHistory.generation_status}
            </p>
          </div>
        </div>

        {/* Audit Details */}
        <div className="glass-panel rounded-[32px] p-8 border border-accent-soft/60 flex flex-col gap-6 bg-white/40">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Inference Session Parameters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Target Role</span>
              <p className="text-xs text-text-primary font-semibold bg-white/50 p-4 rounded-xl border border-accent-soft/30">{selectedHistory.job_title}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Job Link</span>
              <p className="text-xs text-text-primary font-semibold bg-white/50 p-4 rounded-xl border border-accent-soft/30 truncate select-all">{selectedHistory.job_link || 'Direct text analysis'}</p>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Input Resume Text</span>
              <textarea
                readOnly
                rows={6}
                value={selectedHistory.resume_text}
                className="w-full p-4 border border-accent-soft/40 bg-white/30 rounded-2xl text-xs font-mono leading-relaxed select-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Markdown Output */}
        <div
          ref={reportRef}
          className="w-full bg-[rgba(255,255,255,0.72)] backdrop-blur-[18px] p-8 md:p-[56px] rounded-[36px] border border-accent-soft shadow-premium relative overflow-hidden"
        >
          <div className="report-markdown prose prose-neutral max-w-none text-text-primary">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ node, ...props }) => (
                  <div className="w-full overflow-x-auto my-6 scrollbar-thin">
                    <table className="min-w-full border-collapse" {...props} />
                  </div>
                ),
                a: ({ node, ...props }) => (
                  <a className="text-[#0A0A0A] underline hover:opacity-75 font-semibold transition-all" target="_blank" rel="noopener noreferrer" {...props} />
                )
              }}
            >
              {selectedHistory.generated_output}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2 flex items-center gap-3">
          <Database className="w-8 h-8 md:w-12 md:h-12 text-accent" />
          Optimization History
        </h1>
        <p className="text-sm text-text-secondary">
          Track complete inference telemetry, execution speeds, and token size counts on our career engine.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
          <p className="text-xs text-text-secondary font-medium">Retrieving telemetry history...</p>
        </div>
      ) : dbHistory.length === 0 ? (
        <div className="text-center py-20 bg-[rgba(255,255,255,0.4)] backdrop-blur-[10px] rounded-[36px] border border-accent-soft shadow-premium max-w-2xl mx-auto w-full">
          <Database className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-1">No Optimization History</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6">
            You haven't run any forensic reports yet. Complete your first resume audit on the main workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbHistory.map((log) => {
            const previewText = log.generated_output
              .replace(/#+\s+/g, '')
              .replace(/[*_~`\-]/g, '')
              .substring(0, 130) + '...';

            return (
              <div
                key={log.id}
                onClick={() => setSelectedHistory(log)}
                className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.85)] transition-all shadow-sm hover:shadow-premium cursor-pointer flex flex-col justify-between min-h-[240px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      log.generation_status === 'Success' 
                        ? 'bg-success/10 text-success border-success/20' 
                        : 'bg-error/10 text-error border-error/20'
                    }`}>
                      {log.generation_status}
                    </span>
                    <span className="text-[10px] font-semibold text-text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-text-primary tracking-tight mb-1 truncate">
                    {log.job_title}
                  </h3>
                  <p className="text-[10px] text-text-muted font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-text-muted/70" /> {log.ai_model}
                  </p>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed mb-4">
                    {previewText}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-accent-soft/40 mt-4">
                  <button
                    onClick={(e) => handleDeleteHistory(log.id, log.pdf_url, e)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-accent flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                    Reopen Analysis
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
