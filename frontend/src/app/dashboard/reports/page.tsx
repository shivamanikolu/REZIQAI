'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { FileText, ChevronRight, Calendar, ArrowLeft, Download, Loader2, Trash2, ExternalLink } from 'lucide-react';
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

interface DatabaseReport {
  id: string;
  user_id: string;
  report_title: string;
  job_title: string;
  job_link?: string;
  output_text: string;
  pdf_url: string;
  created_at: string;
  updated_at: string;
}

export default function ReportsPage() {
  const { user } = useAppStore();
  const [dbReports, setDbReports] = useState<DatabaseReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<DatabaseReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setDbReports(data);
      } catch (err) {
        console.warn('Failed to retrieve reports from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const handleDeleteReport = async (reportId: string, pdfUrl: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this report? This will remove the database record and the generated PDF file.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Delete database row
      const { error: dbError } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);
        
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
      setDbReports((prev) => prev.filter((r) => r.id !== reportId));
      setSelectedReport(null);
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      alert('Delete failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedReport?.pdf_url) return;
    
    // Open in new tab or trigger direct download
    const link = document.createElement('a');
    link.href = selectedReport.pdf_url;
    link.target = '_blank';
    link.download = `${selectedReport.report_title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedReport) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto animate-fade-in-up">
        <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />
        
        {/* Detail View Header */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDeleteReport(selectedReport.id, selectedReport.pdf_url)}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-error/10 hover:bg-error text-error hover:text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all border border-error/20 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Report
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity shadow-premium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Report Metadata Block */}
        <div className="glass-panel rounded-[28px] p-6 border border-accent-soft/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40">
          <div>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">{selectedReport.report_title}</h2>
            <p className="text-xs text-text-secondary font-medium mt-1">
              Role: <strong className="text-text-primary">{selectedReport.job_title}</strong> 
              {selectedReport.job_link && (
                <span className="ml-2">
                  &bull; <a href={selectedReport.job_link} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1 ml-1 hover:text-accent transition-colors">Link <ExternalLink className="w-3 h-3" /></a>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 text-text-muted font-bold text-xs">
            <Calendar className="w-4 h-4" />
            {new Date(selectedReport.created_at).toLocaleString()}
          </div>
        </div>

        {/* Report Content */}
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
              {selectedReport.output_text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2">
          Assessment Reports
        </h1>
        <p className="text-sm text-text-secondary">
          Browse and retrieve your previously generated Premium AI Career Intelligence reports.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
          <p className="text-xs text-text-secondary font-medium">Retrieving reports from database...</p>
        </div>
      ) : dbReports.length === 0 ? (
        <div className="text-center py-20 bg-[rgba(255,255,255,0.4)] backdrop-blur-[10px] rounded-[36px] border border-accent-soft shadow-premium max-w-2xl mx-auto w-full">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold text-text-primary mb-1">No Assessment Reports</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-6">
            You haven't run any forensic reports yet. Complete your first resume audit on the main workspace.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dbReports.map((report) => {
            // Generate a small preview snippet of the output_text
            const previewText = report.output_text
              .replace(/#+\s+/g, '') // remove headings
              .replace(/[*_~`\-]/g, '') // remove markdown symbols
              .substring(0, 140) + '...';

            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="glass-panel rounded-[28px] p-6 border border-accent-soft bg-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.85)] transition-all shadow-sm hover:shadow-premium cursor-pointer flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30 truncate max-w-[140px]">
                      {report.job_title}
                    </span>
                    <span className="text-[10px] font-semibold text-text-muted flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-text-primary tracking-tight mb-2 truncate">
                    {report.report_title}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed mb-4">
                    {previewText}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-accent-soft/40 mt-4">
                  <button
                    onClick={(e) => handleDeleteReport(report.id, report.pdf_url, e)}
                    disabled={isDeleting}
                    className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-accent flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                    Open Report
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
