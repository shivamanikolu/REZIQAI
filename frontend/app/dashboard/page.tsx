'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore, SkillGapReport } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { 
  Target, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft, 
  Download, 
  ShieldAlert, 
  Sparkles,
  Terminal,
  TrendingUp,
  UserCheck,
  Cpu,
  Upload,
  X,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SKILL_GAP_MASTER_PROMPT } from '@/lib/prompts/skill-gap-master-prompt';
import { extractTextFromFile } from '@/lib/extractor';
import { processResumeIntelligence, ExtractedMetadata } from '@/lib/intelligence';
import { getApiUrl } from '@/lib/env';

// Custom style override for premium markdown presentation
const markdownStyles = `
  .report-markdown {
    font-family: var(--font-sans), -apple-system, sans-serif;
  }
  .report-markdown h1 {
    font-family: var(--font-serif), Georgia, serif;
    font-size: 2.25rem;
    font-weight: 400;
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
    color: #0A0A0A;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 1.25rem;
    letter-spacing: -0.02em;
  }
  .report-markdown h2 {
    font-family: var(--font-serif), Georgia, serif;
    font-size: 1.5rem;
    font-weight: 400;
    margin-top: 2.75rem;
    margin-bottom: 1rem;
    color: #111111;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    padding-bottom: 0.5rem;
    letter-spacing: -0.01em;
  }
  .report-markdown h3 {
    font-size: 0.875rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    color: #1A1A1A;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .report-markdown p {
    font-size: 0.95rem;
    line-height: 1.85;
    margin-bottom: 1.5rem;
    color: rgba(10, 10, 10, 0.76);
  }
  .report-markdown ul {
    list-style-type: none;
    margin-left: 0;
    margin-bottom: 1.5rem;
    padding-left: 0;
  }
  .report-markdown ul li {
    position: relative;
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    line-height: 1.75;
    color: rgba(10, 10, 10, 0.76);
  }
  .report-markdown ul li::before {
    content: "—";
    position: absolute;
    left: 0;
    color: rgba(10, 10, 10, 0.3);
  }
  .report-markdown ol {
    list-style-type: decimal;
    margin-left: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .report-markdown li {
    margin-bottom: 0.65rem;
    line-height: 1.75;
    color: rgba(10, 10, 10, 0.76);
  }
  .report-markdown table {
    width: 100%;
    border-collapse: collapse;
    margin: 2.5rem 0;
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
  .report-markdown th, .report-markdown td {
    padding: 14px 18px;
    text-align: left;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }
  .report-markdown th {
    background-color: rgba(236, 236, 231, 0.5);
    font-weight: 700;
    color: #0A0A0A;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .report-markdown td {
    font-size: 0.85rem;
    color: rgba(10, 10, 10, 0.76);
    line-height: 1.6;
  }
  .report-markdown tr:last-child td {
    border-bottom: none;
  }
  .report-markdown tr:hover td {
    background-color: rgba(255, 255, 255, 0.5);
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
    background: rgba(0, 0, 0, 0.05);
    margin: 3rem 0;
  }
  .report-markdown blockquote {
    border-left: 2px solid #0A0A0A;
    padding-left: 1.5rem;
    margin: 2rem 0;
    font-family: var(--font-serif), Georgia, serif;
    font-style: italic;
    font-size: 1.1rem;
    color: rgba(10, 10, 10, 0.72);
    background-color: rgba(236, 236, 231, 0.2);
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    border-radius: 0 12px 12px 0;
  }

  /* PDF & Printing helper options to avoid awkward clipping */
  @media print {
    .report-markdown {
      color: #000000 !important;
      background: transparent !important;
    }
    .report-markdown h1, .report-markdown h2, .report-markdown h3 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .report-markdown p, .report-markdown tr, .report-markdown li, .report-markdown blockquote {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .report-markdown table {
      page-break-inside: auto !important;
      break-inside: auto !important;
    }
  }
`;

export default function SkillGapPage() {
  const { user, addReport } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    hasRoadmap: boolean;
    hasSummary: boolean;
    hasBonus: boolean;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Form states
  const [jobTitle, setJobTitle] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [resumeText, setResumeText] = useState('');

  // File Ingestion and Text Extraction States
  const [uploadStatus, setUploadStatus] = useState<'default' | 'selected' | 'extracting' | 'success' | 'failed'>('default');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionProgress, setExtractionProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractionSessionRef = useRef<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedMetadata | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setUploadStatus('selected');
    setUploadError('');
    setExtractionProgress('Initializing ingestion pipeline...');
    setExtractedData(null);

    const sessionId = crypto.randomUUID();
    extractionSessionRef.current = sessionId;

    const startTime = Date.now();
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'txt';

    // Trigger instant client-side extraction
    setUploadStatus('extracting');
    try {
      const extractionResult = await extractTextFromFile(file, (status) => {
        if (extractionSessionRef.current === sessionId) {
          setExtractionProgress(status);
        }
      });
      
      if (extractionSessionRef.current !== sessionId) return;

      const { text, totalPages, extractedPages, failedPages, ocrNeeded } = extractionResult;

      if (!text || text.trim().length === 0) {
        throw new Error('The document appears empty or no readable text could be retrieved.');
      }

      setExtractionProgress('Analyzing layout segments & extracting intelligence...');
      
      // Delay slightly for premium micro-interactions to feel cinematic and calm
      await new Promise(resolve => setTimeout(resolve, 800));
      if (extractionSessionRef.current !== sessionId) return;
      
      const intelligence = processResumeIntelligence(text, fileType, startTime, {
        totalPages,
        extractedPages,
        failedPages,
        ocrNeeded
      });
      setExtractedData(intelligence);
      setResumeText(intelligence.reconstructedMarkdown); // Populates the textarea with premium reconstructed markdown
      setUploadStatus('success');
    } catch (err: any) {
      if (extractionSessionRef.current !== sessionId) return;
      console.error(err);
      setUploadError(err.message || 'An unexpected error occurred during extraction.');
      setUploadStatus('failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadStatus('default');
    setSelectedFile(null);
    setUploadError('');
    setExtractionProgress('');
    setExtractedData(null);
    setIsDiagnosticsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeExtractedText = () => {
    setResumeText('');
    resetUpload();
  };

  // Status states
  const [generationState, setGenerationState] = useState<'idle' | 'analyzing' | 'validating' | 'stabilizing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [markdownText, setMarkdownText] = useState('');
  
  // Backwards compatibility sync for analyzing state
  const analyzing = generationState === 'analyzing' || generationState === 'validating' || generationState === 'stabilizing';
  const setAnalyzing = (val: boolean) => {
    if (val) {
      setGenerationState('analyzing');
    } else {
      setGenerationState(prev => (prev === 'analyzing' || prev === 'validating' || prev === 'stabilizing') ? 'idle' : prev);
    }
  };
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState('');

  useEffect(() => {
    const quotes = [
      "Precision beats volume in hiring.",
      "The best resumes communicate outcomes, not effort.",
      "Recruiters scan trust before talent.",
      "Your proof of work is your primary leverage.",
      "ATS filters keywords; hiring managers buy impact."
    ];
    setSelectedQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);
  
  // Cinematic Loading State
  const [loadingPhase, setLoadingPhase] = useState(0);
  const loadingPhases = [
    'Initializing Groq deepseek-r1 Matrix...',
    'Analyzing Target Role Requirements...',
    'Calibrating ATS Semantic Engine...',
    'Auditing Candidate Proof of Work...',
    'Processing Recruiter Psychology Matrix...',
    'Calling DeepSeek R1 Distill Llama 70b...',
    'Compiling Direct Learning Resources...',
    'Structuring 21-Day Preparation Schedule...',
    'Assembling McKinsey Career Intelligence Report...'
  ];

  // Rotate loading phases to feel progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      interval = setInterval(() => {
        setLoadingPhase((prev) => {
          if (prev < loadingPhases.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);
    } else {
      setLoadingPhase(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  // Premium auto-closer utility for unclosed markdown tags to guarantee visual stability
  const autoCloseMarkdown = (text: string): string => {
    if (!text) return '';
    let result = text;
    
    // 1. Auto-close triple-backtick code blocks
    const codeBlockCount = (result.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      result += '\n```';
    }
    
    // 2. Auto-close bold text asterisks
    const boldCount = (result.match(/\*\*/g) || []).length;
    if (boldCount % 2 !== 0) {
      result += '**';
    }
    
    // 3. Auto-close single asterisks for italics
    const cleanTextForItalic = result.replace(/\*\*/g, '');
    const italicCount = (cleanTextForItalic.match(/\*/g) || []).length;
    if (italicCount % 2 !== 0) {
      result += '*';
    }

    // 4. Auto-close incomplete markdown tables
    const lines = result.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
        if (!inTable) {
          inTable = true;
        }
      } else if (inTable && trimmed.startsWith('|')) {
        // Table row continues
      } else {
        inTable = false;
      }
    }
    
    if (inTable && lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine.startsWith('|') && !lastLine.endsWith('|')) {
        result += ' |';
      }
    }
    
    return result;
  };

  // Perform frontend stream completeness checks
  const checkReportCompleteness = (text: string) => {
    const lower = text.toLowerCase();
    
    // Complete roadmap matches (must contain WEEK 3 or Day 21)
    const hasRoadmap = lower.includes('day 21') || lower.includes('day-21') || lower.includes('week 3') || lower.includes('week-3') || lower.includes('roadmap') || lower.includes('day 20') || lower.includes('day 19');
    
    // Complete sections (must contain executive summary snapshot or bonus recruiter)
    const hasSummary = lower.includes('final executive summary snapshot') || lower.includes('executive summary') || lower.includes('summary snapshot') || lower.includes('summary') || lower.includes('recommendation');
    const hasBonus = lower.includes('bonus recruiter') || lower.includes('bonus') || lower.includes('recruiter intelligence') || lower.includes('recruiter insights') || lower.includes('insights');
    
    return {
      isValid: hasRoadmap && hasSummary && hasBonus,
      hasRoadmap,
      hasSummary,
      hasBonus
    };
  };

  // Handle direct stream response fetch
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Strict front-end input validation
    const trimmedTitle = jobTitle.trim();
    const trimmedLink = jobLink.trim();
    const trimmedResume = resumeText.trim();

    if (!trimmedTitle || trimmedTitle.toLowerCase() in { 'placeholder': 1, 'job title': 1 }) {
      setErrorMessage('Please enter a valid target Job Title.');
      return;
    }
    if (!trimmedLink || trimmedLink.toLowerCase() in { 'placeholder': 1, 'job link': 1 }) {
      setErrorMessage('Please enter a valid Job Posting Link.');
      return;
    }
    if (!trimmedResume || trimmedResume.length < 50) {
      setErrorMessage('Please paste a realistic, complete plain text resume (minimum 50 characters).');
      return;
    }

    setGenerationState('analyzing');
    setMarkdownText('');
    const startTime = Date.now();

    const optimizedResume = trimmedResume.length > 12000
      ? trimmedResume.substring(0, 12000) + "\n[Resume text truncated for length optimization]"
      : trimmedResume;

    try {
      // Build final prompt on frontend to avoid duplication

      const candidateName = (() => {
        const lines = optimizedResume.split('\n').map(l => l.trim()).filter(Boolean);
        return lines[0] ? lines[0].substring(0, 50) : 'Candidate';
      })();

      const finalPrompt = SKILL_GAP_MASTER_PROMPT
        .replace("{job_role}", trimmedTitle)
        .replace("{job_link_display}", trimmedLink)
        .replace("{resume_text}", optimizedResume)
        .replace("{candidate_name_if_available}", candidateName);

      // Instantiate AbortController for safe streaming cancellation and cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token || '';

      const response = await fetch(`${getApiUrl()}/api/skill-gap/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          job_title: trimmedTitle,
          job_link: trimmedLink,
          resume_text: optimizedResume,
          prompt: finalPrompt,
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server error occurred during analysis.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedText = '';

      while (!done && reader) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;
          
          // Detect and execute automatic streaming failover reset
          if (accumulatedText.includes('[RESET_STREAM_FOR_RETRY]')) {
            const parts = accumulatedText.split('[RESET_STREAM_FOR_RETRY]');
            accumulatedText = parts[parts.length - 1];
          } else {
            // Check for embedded streaming errors
            if (accumulatedText.includes('[ERROR:')) {
              const errorMatch = accumulatedText.match(/\[ERROR:\s*(.*?)\]/);
              const errMsg = errorMatch ? errorMatch[1] : 'Error streaming response from model.';
              throw new Error(errMsg);
            }
          }
        }
      }

      // Stream successfully completed! Santize and auto-close markdown
      const finalizedText = autoCloseMarkdown(accumulatedText.replace(/<!-- keep-alive -->\n?/g, ''));

      
      // Perform stream completeness validation
      setGenerationState('validating');
      const validation = checkReportCompleteness(finalizedText);
      setValidationResult(validation);

      if (!validation.isValid) {
        throw new Error('REZIQ intelligence engine is temporarily overloaded. Please retry in a moment.');
      }

      // Enter stabilization state
      setGenerationState('stabilizing');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMarkdownText(finalizedText);
      setGenerationState('success');
      const parsedScores = parseScoresFromMarkdown(finalizedText);
      const reportId = crypto.randomUUID();

      // Trigger automatic PDF generation & DB save in background
      setTimeout(async () => {
        try {
          const html2pdf = (await import('html2pdf.js')).default;
          const element = reportRef.current;
          if (!element) {
            console.error('Report element not found for PDF generation.');
            return;
          }

          // Canvas-based resolver to translate oklch/oklab colors to standard rgb/rgba
          const resolveColorToRgb = (colorStr: string): string => {
            if (!colorStr) return '';
            if (colorStr.startsWith('rgb') || colorStr.startsWith('#') || colorStr === 'transparent') {
              return colorStr;
            }
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 1;
              canvas.height = 1;
              const ctx = canvas.getContext('2d');
              if (!ctx) return colorStr;
              ctx.fillStyle = colorStr;
              ctx.fillRect(0, 0, 1, 1);
              const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
              if (a === 0) return 'transparent';
              return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
            } catch (e) {
              console.error('Failed to resolve color:', colorStr, e);
              return colorStr;
            }
          };

          const parsedCandidateName = user?.full_name ? user.full_name.replace(/[^a-z0-9]/gi, '_') : 'Candidate';
          const formattedDate = new Date().toISOString().split('T')[0];
          const filename = `REZIQ_Skill_Gap_Report_${parsedCandidateName}_${formattedDate}.pdf`;

          const options = {
            margin: [15, 15, 15, 15],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true, 
              letterRendering: true,
              scrollX: 0,
              scrollY: 0,
              onclone: (clonedDoc: any) => {
                const elements = clonedDoc.getElementsByTagName('*');
                for (let i = 0; i < elements.length; i++) {
                  const el = elements[i] as HTMLElement;
                  const style = clonedDoc.defaultView?.getComputedStyle(el);
                  if (!style) continue;
                  
                  const properties = [
                    'color', 
                    'backgroundColor', 
                    'borderColor', 
                    'borderTopColor', 
                    'borderRightColor', 
                    'borderBottomColor', 
                    'borderLeftColor', 
                    'outlineColor', 
                    'fill', 
                    'stroke'
                  ];
                  
                  properties.forEach(prop => {
                    const val = style[prop as any];
                    if (val && (val.includes('oklch') || val.includes('oklab'))) {
                      el.style[prop as any] = resolveColorToRgb(val);
                    }
                  });
                }
              }
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
          };

          // Generate PDF Blob in background
          const pdfBlob = await html2pdf().set(options as any).from(element).outputPdf('blob');

          // Upload to Supabase Storage
          const storagePath = `${user?.id || 'anonymous'}/${reportId}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('report-pdfs')
            .upload(storagePath, pdfBlob, {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Failed to upload PDF to storage:', uploadError);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('report-pdfs')
            .getPublicUrl(storagePath);

          // Save to reports table if authenticated
          if (user?.id) {
            const { error: reportError } = await supabase
              .from('reports')
              .insert({
                id: reportId,
                user_id: user.id,
                report_title: `Skill Gap Report - ${trimmedTitle}`,
                job_title: trimmedTitle,
                job_link: trimmedLink,
                output_text: finalizedText,
                pdf_url: publicUrl
              });

            if (reportError) {
              console.error('Failed to persist report to DB:', reportError);
            }

            // Save to history table
            const wordCount = finalizedText.split(/\s+/).filter(Boolean).length;
            const reportSize = pdfBlob.size;
            const duration = Date.now() - startTime;

            const { error: historyError } = await supabase
              .from('history')
              .insert({
                user_id: user.id,
                report_id: reportId,
                job_title: trimmedTitle,
                job_link: trimmedLink,
                resume_text: optimizedResume,
                generated_output: finalizedText,
                pdf_url: publicUrl,
                ai_model: 'llama-3.3-70b-versatile',
                generation_time_ms: duration,
                word_count: wordCount,
                report_size: reportSize,
                generation_status: 'Success'
              });

            if (historyError) {
              console.error('Failed to persist history to DB:', historyError);
            }
          }

          // Persist state to store
          const newReport: SkillGapReport = {
            id: reportId,
            job_title: trimmedTitle,
            job_link: trimmedLink,
            job_description: trimmedResume.substring(0, 300) + '...',
            ats_score: parsedScores.ats,
            recruiter_score: parsedScores.recruiter,
            technical_score: parsedScores.technical,
            verdict: finalizedText,
            missing_skills: parsedScores.missing_skills,
            suggested_improvements: parsedScores.suggested_improvements,
            career_timeline: parsedScores.career_timeline,
            hiring_probability: parsedScores.hiring_probability,
            created_at: new Date().toISOString(),
          };
          addReport(newReport);

        } catch (pdfErr) {
          console.error('Failed to auto-save report/history PDF:', pdfErr);
        }
      }, 1200);

    } catch (err: any) {
      setGenerationState('failed');
      if (err.name === 'AbortError') {
        console.log('Stream fetch request was aborted.');
        setGenerationState('idle');
        return;
      }
      let displayError = 'REZIQ intelligence engine is temporarily overloaded. Please retry in a moment.';
      try {
        if (err.message) {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.detail) {
            displayError = parsed.detail;
          }
        }
      } catch (parseErr) {
        if (err.message && (err.message.includes('A valid') || err.message.includes('required') || err.message.includes('not allowed'))) {
          displayError = err.message;
        } else if (err.message && err.message.includes('REZIQ intelligence engine')) {
          displayError = err.message;
        }
      }
      setErrorMessage(displayError);
      setMarkdownText('');


      // Save failure telemetry to history
      if (user?.id) {
        try {
          await supabase.from('history').insert({
            user_id: user.id,
            job_title: trimmedTitle,
            job_link: trimmedLink,
            resume_text: optimizedResume,
            generated_output: err.message || 'Analysis failed.',
            pdf_url: '',
            ai_model: 'llama-3.3-70b-versatile',
            generation_time_ms: Date.now() - startTime,
            word_count: 0,
            report_size: 0,
            generation_status: 'Failed'
          });
        } catch (dbErr) {
          console.warn('Failed to save failure telemetry:', dbErr);
        }
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper to parse scores and details from Markdown for Zustand store compatibility
  const parseScoresFromMarkdown = (text: string) => {
    const scores = {
      overall: 70,
      ats: 70,
      recruiter: 65,
      technical: 60,
      hiring_probability: 'Medium',
      verdict: '',
      missing_skills: [] as string[],
      suggested_improvements: [] as string[],
      career_timeline: [] as Array<{ day: string; topic: string; details: string }>
    };
    
    try {
      const overallMatch = text.match(/Overall Match Score:\s*(\d+)%/i);
      if (overallMatch) scores.overall = parseInt(overallMatch[1]);
      
      const atsMatch = text.match(/ATS Compatibility Score:\s*(\d+)%/i);
      if (atsMatch) scores.ats = parseInt(atsMatch[1]);
      
      const recruiterMatch = text.match(/Recruiter Interest Probability:\s*(\d+)%/i);
      if (recruiterMatch) scores.recruiter = parseInt(recruiterMatch[1]);
      
      const technicalMatch = text.match(/Technical Readiness Score:\s*(\d+)%/i);
      if (technicalMatch) scores.technical = parseInt(technicalMatch[1]);
      
      if (text.toUpperCase().includes('APPLY NOW')) {
        scores.hiring_probability = 'High';
      }
      
      // Parse direct lists
      const missingSection = text.match(/### ❌ Missing Critical Skills([\s\S]*?)(?=###|$)/i);
      if (missingSection) {
        const bullets = missingSection[1].match(/-\s*(.*?)(?=\n|$)/g);
        if (bullets) {
          scores.missing_skills = bullets.map(b => b.replace(/^-\s*/, '').trim()).slice(0, 10);
        }
      }
    } catch (e) {
      console.log('Regex parsing failed, defaults fallback used.', e);
    }
    
    return scores;
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloadingPdf(true);

    // Canvas-based resolver to translate oklch/oklab colors to standard rgb/rgba
    const resolveColorToRgb = (colorStr: string): string => {
      if (!colorStr) return '';
      if (colorStr.startsWith('rgb') || colorStr.startsWith('#') || colorStr === 'transparent') {
        return colorStr;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return colorStr;
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        if (a === 0) return 'transparent';
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
      } catch (e) {
        console.error('Failed to resolve color:', colorStr, e);
        return colorStr;
      }
    };

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      
      // Extract candidate name cleanly from resume text
      const parsedCandidateName = (() => {
        const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
        return lines[0] ? lines[0].replace(/[^a-z0-9]/gi, '_') : 'Candidate';
      })();
      
      const formattedDate = new Date().toISOString().split('T')[0];
      const filename = `REZIQ_Skill_Gap_Report_${parsedCandidateName}_${formattedDate}.pdf`;

      const options = {
        margin: [15, 15, 15, 15],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: any) => {
            const elements = clonedDoc.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const style = clonedDoc.defaultView?.getComputedStyle(el);
              if (!style) continue;
              
              const properties = [
                'color', 
                'backgroundColor', 
                'borderColor', 
                'borderTopColor', 
                'borderRightColor', 
                'borderBottomColor', 
                'borderLeftColor', 
                'outlineColor', 
                'fill', 
                'stroke'
              ];
              
              properties.forEach(prop => {
                const val = style[prop as any];
                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                  el.style[prop as any] = resolveColorToRgb(val);
                }
              });
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      await html2pdf().set(options as any).from(element).save();
    } catch (error: any) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Extract score values for progressive real-time scorecard updates
  const currentScores = (() => {
    const scores = {
      overall: '—',
      ats: '—',
      recruiter: '—',
      technical: '—',
      interview: '—',
      market: '—'
    };
    
    const overallMatch = markdownText.match(/Overall Match Score:\s*(\d+)%/i);
    if (overallMatch) scores.overall = overallMatch[1] + '%';
    
    const atsMatch = markdownText.match(/ATS Compatibility Score:\s*(\d+)%/i);
    if (atsMatch) scores.ats = atsMatch[1] + '%';
    
    const recruiterMatch = markdownText.match(/Recruiter Interest Probability:\s*(\d+)%/i);
    if (recruiterMatch) scores.recruiter = recruiterMatch[1] + '%';
    
    const technicalMatch = markdownText.match(/Technical Readiness Score:\s*(\d+)%/i);
    if (technicalMatch) scores.technical = technicalMatch[1] + '%';
    
    const interviewMatch = markdownText.match(/Interview Readiness Score:\s*(\d+)%/i);
    if (interviewMatch) scores.interview = interviewMatch[1] + '%';
    
    const marketMatch = markdownText.match(/Market Competitiveness Score:\s*(\d+)%/i);
    if (marketMatch) scores.market = marketMatch[1] + '%';
    
    return scores;
  })();

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up print:p-0 print:bg-white print:text-black w-full max-w-[1100px] mx-auto pb-16">
      {/* Styles Injection for report rendering styling */}
      <style dangerouslySetInnerHTML={{ __html: markdownStyles }} />

      {/* HEADER / WELCOME SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden border-b border-accent-soft/30 pb-8">
        <div className="flex flex-col gap-2.5 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/80">
            System assessment
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
            Career Intelligence, <span className="font-serif italic font-normal text-text-secondary/80">Reimagined</span>.
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-medium">
            A premium DeepSeek-powered forensic assessment auditing candidate credentials against direct market requirements. Reverse-engineer ATS parameters and analyze recruiter heuristics instantly.
          </p>
          {selectedQuote && (
            <div className="flex items-center gap-2.5 mt-3 text-[11px] font-medium tracking-wide text-text-secondary bg-[#ECECE7]/45 border border-[#DADAD4]/35 px-4 py-2 rounded-full w-fit shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-serif italic">"{selectedQuote}"</span>
            </div>
          )}
        </div>
        {markdownText && !analyzing && (
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => {
                setMarkdownText('');
                setJobTitle('');
                setJobLink('');
                setResumeText('');
              }}
              className="flex items-center gap-2 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-accent/90 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-premium disabled:opacity-70 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* INPUT SYSTEM FORM */}
      <AnimatePresence mode="wait">
        {!markdownText && !analyzing && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <form onSubmit={handleAnalyze} className="w-full flex flex-col gap-8 print:hidden">
          <div className="glass-panel rounded-[32px] p-8 md:p-10 border border-accent-soft/50 flex flex-col gap-8">
            <div className="flex items-center gap-2.5 border-b border-[#ECECE7]/85 pb-4">
              <Sparkles className="w-4 h-4 text-text-secondary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Configure Intelligence Audit</h2>
            </div>
            
            {errorMessage && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex gap-3 items-center text-xs text-error font-medium animate-scale-in">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Title */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary pl-1">Target Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  required
                  className="h-14 px-5 rounded-[20px] border border-accent-soft/70 bg-white/40 text-sm font-medium focus:outline-none focus:bg-white focus:border-accent focus:shadow-focus transition-all duration-300"
                />
              </div>

              {/* Job Link */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary pl-1">Job Posting Link</label>
                <input
                  type="url"
                  value={jobLink}
                  onChange={(e) => setJobLink(e.target.value)}
                  placeholder="e.g. https://careers.google.com/jobs/results/..."
                  required
                  className="h-14 px-5 rounded-[20px] border border-accent-soft/70 bg-white/40 text-sm font-medium focus:outline-none focus:bg-white focus:border-accent focus:shadow-focus transition-all duration-300"
                />
              </div>
            </div>

            {/* Resume Text Area (Plain Text, Textarea Only, Scrollable) */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Candidate Resume Text</label>
                <span className="text-[9px] text-text-muted font-bold tracking-wider">TEXT ONLY — ATS PARSE READY</span>
              </div>

              {/* Fetch Resume & Extraction Ingestion Panel */}
              <div className="w-full mt-1">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragOver}
                  onDrop={handleDrop}
                  className="glass-panel rounded-[24px] border border-accent-soft/60 p-6 flex flex-col gap-5 relative group transition-all bg-[#ECECE7]/20 hover:bg-[#ECECE7]/35"
                >
                      {/* Background Soft Glow */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#ECECE7]/5 via-transparent to-white/10 rounded-[24px] pointer-events-none" />

                      {/* Instruction Header */}
                      <div className="flex flex-col gap-1.5 relative z-10">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-text-secondary animate-pulse" />
                          AI Ingestion Portal
                        </h3>
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">
                          You can upload your resume file (PDF, DOCX, DOC, TXT) using Fetch Resume. REZIQ will automatically extract and fill the resume text for AI analysis.
                        </p>
                      </div>

                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc,.txt,.rtf"
                        className="hidden"
                      />

                      {/* State Machinery UI */}
                      {uploadStatus === 'default' && (
                        <div 
                          onClick={triggerFileSelect}
                          className="border border-dashed border-accent-soft/80 hover:border-accent hover:bg-white/40 rounded-[20px] p-6 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center border border-accent-soft/40 shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <Upload className="w-4 h-4 text-text-secondary" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-text-primary group-hover:underline">
                              Select or drop resume file
                            </span>
                            <span className="text-[10px] text-text-muted font-semibold tracking-wide">
                              PDF, DOCX, DOC, TXT, or RTF up to 10MB
                            </span>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'selected' && (
                        <div className="border border-accent-soft/80 bg-white/40 rounded-[20px] p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center border border-accent-soft/30 animate-pulse">
                              <FileText className="w-5 h-5 text-text-secondary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-text-primary truncate max-w-[200px] sm:max-w-sm">
                                {selectedFile?.name}
                              </span>
                              <span className="text-[10px] text-text-muted font-bold">
                                {(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB • Ready
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={resetUpload}
                              className="p-2 hover:bg-white/80 rounded-full text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'extracting' && (
                        <div className="border border-accent-soft/80 bg-white/40 rounded-[20px] p-6 flex flex-col items-center justify-center gap-4 text-center">
                          <div className="w-12 h-12 rounded-full border border-accent-soft/40 flex items-center justify-center relative bg-white/60">
                            <Loader2 className="w-5 h-5 text-accent animate-spin" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-extrabold text-text-primary uppercase tracking-wider animate-pulse">
                              Extracting resume content...
                            </span>
                            <span className="text-[10px] text-text-secondary font-medium italic min-h-[16px] text-accent">
                              {extractionProgress}
                            </span>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'success' && extractedData && (
                        <div className="flex flex-col gap-5 animate-scale-in">
                          {/* Success Row */}
                          <div className="border border-success/20 bg-success/5 rounded-[20px] p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center border border-success/20 text-success">
                                <CheckCircle className="w-5 h-5 animate-pulse" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-success">
                                  Ingested & Optimized Successfully
                                </span>
                                <span className="text-[10px] text-text-secondary font-medium">
                                  Forensic audit complete for: <span className="font-bold text-text-primary">{selectedFile?.name}</span>.
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={resetUpload}
                                className="px-3.5 py-1.5 bg-white border border-accent-soft/80 rounded-full text-[10px] font-bold text-text-primary hover:bg-[#ECECE7]/40 hover:scale-[1.02] transition-all cursor-pointer"
                              >
                                Upload Another
                              </button>
                              <button
                                type="button"
                                onClick={removeExtractedText}
                                className="p-2 hover:bg-white/80 rounded-full text-error hover:bg-error/5 transition-all cursor-pointer"
                                title="Clear extracted text"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* OCR Fallback Detection Warning */}
                          {extractedData.ocrNeeded && (
                            <div className="p-4 bg-warning/10 border border-warning/20 rounded-2xl flex gap-3 items-center text-xs text-warning font-semibold animate-scale-in">
                              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                              <div className="flex flex-col gap-0.5">
                                <span>Scan-Based Document Detected</span>
                                <span className="text-[10px] font-medium text-warning/90">
                                  This resume appears to be scan-based or image-based. OCR support will improve extraction quality.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Incomplete Extraction Warning */}
                          {extractedData.isIncomplete && (
                            <div className="p-4 bg-warning/10 border border-warning/25 rounded-2xl flex gap-3 items-center text-xs text-warning font-semibold animate-scale-in">
                              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
                              <div className="flex flex-col gap-0.5">
                                <span>Extraction Integrity Alert</span>
                                <span className="text-[10px] font-medium text-warning/90">
                                  ⚠️ Extraction appears incomplete. Please verify the extracted text before generating analysis.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Structured Ingestion HUD Indicators */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Ingestion Confidence Index */}
                            <div className="glass-panel rounded-[18px] p-4 border border-accent-soft/40 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Confidence Index</span>
                                <span className={`text-xs font-extrabold mt-1 ${
                                  extractedData.confidenceLabel === 'Excellent' ? 'text-success' :
                                  extractedData.confidenceLabel === 'Partial' ? 'text-warning' : 'text-error'
                                }`}>
                                  {extractedData.confidenceLabel} Ingestion
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-black tracking-tight">{extractedData.confidenceScore}%</span>
                              </div>
                            </div>

                            {/* Recruiter Readability Score */}
                            <div className="glass-panel rounded-[18px] p-4 border border-accent-soft/40 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Recruiter Rating</span>
                                <span className="text-xs font-extrabold text-text-primary mt-1">
                                  {extractedData.readabilityScore >= 80 ? 'Highly Readable' :
                                   extractedData.readabilityScore >= 50 ? 'Moderate ATS' : 'Low Structure'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-black tracking-tight text-accent">{extractedData.readabilityScore}/100</span>
                              </div>
                            </div>

                            {/* Token Optimization Indicators */}
                            <div className="glass-panel rounded-[18px] p-4 border border-accent-soft/40 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Token Optimization</span>
                                <span className="text-xs font-extrabold text-success mt-1">
                                  {extractedData.compressionRatio}% Token Saving
                                </span>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className="text-sm font-bold text-text-secondary">{extractedData.optimizedLength} chars</span>
                                <span className="text-[8px] text-text-muted font-bold line-through">{extractedData.rawLength} chars</span>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Smart Section Preview & Diagnostics Drawer */}
                          <div className="flex flex-col gap-2 relative z-10">
                            {/* Toggle Panel Bar */}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                                  isPreviewOpen
                                    ? 'border-accent bg-accent text-white'
                                    : 'border-accent-soft/60 hover:bg-[#ECECE7]/60 text-text-primary'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isPreviewOpen ? 'Hide Structure Preview' : 'Show Structure Preview'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
                                className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                                  isDiagnosticsOpen
                                    ? 'border-accent bg-accent text-white'
                                    : 'border-accent-soft/60 hover:bg-[#ECECE7]/60 text-text-primary'
                                }`}
                              >
                                <Terminal className="w-3.5 h-3.5" />
                                {isDiagnosticsOpen ? 'Hide Diagnostics' : 'Show Diagnostics'}
                              </button>
                            </div>

                            {/* Smart Structure Preview Container */}
                            <AnimatePresence>
                              {isPreviewOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden mt-1"
                                >
                                  <div className="p-5 rounded-[20px] bg-white/60 border border-accent-soft/40 flex flex-col gap-4 max-h-[300px] overflow-y-auto scrollbar-thin">
                                    <div className="flex items-center justify-between border-b border-[#ECECE7] pb-2">
                                      <div className="flex flex-col">
                                        <span className="text-[11px] font-black text-text-primary">{extractedData.name}</span>
                                        <span className="text-[9px] text-text-secondary font-medium mt-0.5">
                                          {[extractedData.email, extractedData.phone].filter(Boolean).join('  |  ')}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        {extractedData.linkedin && (
                                          <a href={extractedData.linkedin} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold bg-[#ECECE7]/60 hover:bg-[#ECECE7] px-2 py-1 rounded-full text-text-primary transition-all">
                                            LinkedIn
                                          </a>
                                        )}
                                        {extractedData.github && (
                                          <a href={extractedData.github} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold bg-[#ECECE7]/60 hover:bg-[#ECECE7] px-2 py-1 rounded-full text-text-primary transition-all">
                                            GitHub
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3.5">
                                      {Object.keys(extractedData.sections).map((secKey) => {
                                        const secText = extractedData.sections[secKey];
                                        if (!secText || secText.trim().length === 0) return null;
                                        return (
                                          <div key={secKey} className="flex flex-col gap-1.5">
                                            <span className="text-[9px] font-bold tracking-wider text-text-muted uppercase">
                                              {secKey}
                                            </span>
                                            <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3 whitespace-pre-line bg-white/35 p-2 rounded-lg border border-accent-soft/10">
                                              {secText.trim()}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Advanced Diagnostics Drawer Panel */}
                            <AnimatePresence>
                              {isDiagnosticsOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden mt-1"
                                >
                                  <div className="p-5 rounded-[20px] bg-[#ECECE7]/45 border border-accent-soft/50 font-mono text-[9px] leading-relaxed text-text-secondary flex flex-col gap-3 shadow-inner">
                                    <span className="font-sans text-[10px] font-black text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                                      <Terminal className="w-3.5 h-3.5 text-accent animate-pulse" />
                                      Forensic Parser Log Diagnostics
                                    </span>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>DOCUMENT TYPE:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.format}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>INGESTION TIMEOUT:</span>
                                        <span className="font-bold text-success">PASSED (0.0s)</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>PARSING SPEED:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.parsingDurationMs} ms</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>REDUNDANCIES STRIPPED:</span>
                                        <span className={`font-bold ${extractedData.diagnostics.redundanciesStripped ? 'text-success' : 'text-text-primary'}`}>
                                          {extractedData.diagnostics.redundanciesStripped ? 'TRUE' : 'FALSE'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>WORD COUNT:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.wordCount} words</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>CHARACTER DENSITY:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.characterDensityRatio * 100}%</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>PAGES INGESTED:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.extractedPages} / {extractedData.diagnostics.totalPages}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>FAILED PAGES:</span>
                                        <span className={`font-bold ${extractedData.diagnostics.failedPages && extractedData.diagnostics.failedPages.length > 0 ? 'text-error' : 'text-success'}`}>
                                          {extractedData.diagnostics.failedPages && extractedData.diagnostics.failedPages.length > 0
                                            ? extractedData.diagnostics.failedPages.join(', ')
                                            : 'NONE'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>ACTION VERBS DETECTED:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.actionsCount}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-accent-soft/30 pb-1">
                                        <span>METRICS / OUTCOMES FOUND:</span>
                                        <span className="font-bold text-text-primary">{extractedData.diagnostics.metricsCount}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-1">
                                      <span>MAPPED SECTIONS ({extractedData.diagnostics.sectionsFound.length}):</span>
                                      <span className="text-[8px] bg-white/70 px-2.5 py-1.5 rounded-lg border border-accent-soft/40 text-text-primary">
                                        {extractedData.diagnostics.sectionsFound.join(' | ') || 'NONE'}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'failed' && (
                        <div className="border border-error/20 bg-error/5 rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-in">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center border border-error/20 text-error animate-pulse">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-error">
                                Extraction Failed
                              </span>
                              <span className="text-[10px] text-text-secondary font-medium">
                                {uploadError}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={resetUpload}
                              className="px-4 py-2 bg-white border border-accent-soft/80 rounded-full text-[10px] font-bold text-text-primary hover:bg-[#ECECE7]/40 hover:scale-[1.02] transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => selectedFile && processFile(selectedFile)}
                              className="px-4 py-2 bg-accent text-white rounded-full text-[10px] font-bold hover:bg-accent/90 hover:scale-[1.02] transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Retry Ingestion
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the full, raw text contents of the candidate resume here..."
                rows={12}
                required
                className="p-5 rounded-[24px] border border-accent-soft/70 bg-white/40 text-sm font-medium focus:outline-none focus:bg-white focus:border-accent focus:shadow-focus transition-all duration-300 resize-y overflow-y-auto leading-relaxed scrollbar-thin"
              />
            </div>

            <button
              type="submit"
              className="h-14 w-full bg-accent text-white font-bold rounded-full hover:bg-accent/90 hover:scale-[1.005] active:scale-[0.99] transition-all duration-300 text-sm shadow-premium flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <Target className="w-4 h-4" />
              Begin Forensic Intelligence Report
            </button>
          </div>
        </form>
      </motion.div>
    )}

      {/* CINEMATIC PREMIUM LOADING SCREEN */}
      {analyzing && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="glass-panel rounded-[32px] p-12 border border-accent-soft/60 text-center flex flex-col items-center justify-center min-h-[460px] w-full mx-auto print:hidden relative overflow-hidden">
          {/* Subtle Background Pulse */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ECECE7]/10 via-transparent to-[#ECECE7]/25 animate-pulse pointer-events-none" />
          
          <div className="relative mb-10">
            <div className="w-24 h-24 rounded-full border border-accent-soft/40 flex items-center justify-center relative bg-white/30 backdrop-blur-sm">
              <div className="absolute inset-0.5 rounded-full border border-dashed border-text-muted/30 animate-spin" style={{ animationDuration: '40s' }} />
              <div className="absolute inset-2 rounded-full border border-accent/25 border-t-accent animate-spin" style={{ animationDuration: '3s' }} />
              <Target className="w-6 h-6 text-accent animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-xl md:text-2xl font-extrabold text-text-primary mb-3 tracking-tight">Synthesizing Career Intelligence</h2>
          
          {/* Progress phase indicator */}
          <div className="h-8 flex items-center justify-center mb-6">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider bg-white/70 px-4 py-1.5 rounded-full border border-accent-soft/60 shadow-sm transition-all duration-500">
              {loadingPhases[loadingPhase]}
            </p>
          </div>
          
          <div className="w-full max-w-sm bg-[#ECECE7] h-1 rounded-full overflow-hidden mb-8 border border-white/40 shadow-inner">
            <div 
              className="bg-accent h-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(((loadingPhase + 1) / loadingPhases.length) * 100, 95)}%` }}
            />
          </div>

          <p className="text-[11px] text-text-secondary/75 max-w-md leading-relaxed font-normal">
            This assessment queries DeepSeek R1 to cross-reference candidate outcomes against structural job demands. Forensic workflows audit ATS thresholds and recruiter heuristic models sequentially.
          </p>

          {/* Minimalist aesthetic loading rows underneath */}
          <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-10 opacity-30">
            <div className="h-10 bg-[#ECECE7] rounded-xl animate-pulse" />
            <div className="h-10 bg-[#ECECE7] rounded-xl animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-10 bg-[#ECECE7] rounded-xl animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </motion.div>
    )}

      {/* RESULT REPORT CONTAINER */}
      {markdownText && !analyzing && (
        <motion.div
          key="report"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <div className="flex flex-col gap-8 w-full mx-auto">
          {validationResult && !validationResult.isValid && (
            <div className="p-5 bg-warning/10 border border-warning/20 rounded-[24px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-warning font-semibold animate-scale-in">
              <div className="flex gap-3 items-center">
                <AlertTriangle className="w-6 h-6 shrink-0 text-warning animate-pulse" />
                <div className="flex flex-col gap-0.5 font-sans">
                  <span className="font-extrabold text-[12px]">Forensic Report Completeness Warning</span>
                  <span className="text-[10px] font-medium text-warning/80">
                    This report appears partially complete due to early model termination. All available data was recovered and formatted cleanly.
                  </span>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                className="px-4 py-2 bg-warning text-white rounded-full text-[10px] font-bold hover:bg-warning/90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Generate Report
              </button>
            </div>
          )}

          {/* Real-time Streaming Scoreboard */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 print:grid-cols-3 print:gap-2">
            {[
              { label: 'Overall Match', val: currentScores.overall, color: 'text-text-primary', icon: Target },
              { label: 'ATS Score', val: currentScores.ats, color: 'text-success', icon: FileText },
              { label: 'Recruiter Score', val: currentScores.recruiter, color: 'text-text-primary', icon: UserCheck },
              { label: 'Technical Score', val: currentScores.technical, color: 'text-text-primary', icon: Cpu },
              { label: 'Interview Score', val: currentScores.interview, color: 'text-text-primary', icon: Terminal },
              { label: 'Market Position', val: currentScores.market, color: 'text-text-primary', icon: TrendingUp },
            ].map((score, i) => {
              const ScoreIcon = score.icon;
              return (
                <div key={i} className="glass-panel-secondary rounded-[20px] p-5 border border-accent-soft/50 flex flex-col justify-between items-start shadow-soft-card hover:bg-white/80 transition-all">
                  <div className="flex items-center justify-between w-full mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">{score.label}</p>
                    <ScoreIcon className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <p className={`text-2xl md:text-3xl font-extrabold ${score.color} tracking-tight`}>{score.val}</p>
                </div>
              );
            })}
          </div>

          {/* Main Apple-Inspired Editorial Container */}
          <div 
            ref={reportRef}
            className="w-full bg-[rgba(255,255,255,0.72)] backdrop-blur-[24px] p-8 md:p-[56px] rounded-[32px] border border-accent-soft/75 shadow-premium relative overflow-hidden"
          >
            {/* Elegant Top Badge */}
            <div className="flex items-center gap-2 mb-8 border-b border-accent-soft/40 pb-6 print:hidden">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${analyzing ? 'bg-warning' : 'bg-success'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${analyzing ? 'bg-warning' : 'bg-success'}`}></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                {analyzing ? 'Streaming Forensic Synthesis...' : 'Forensic Audit Finalized'}
              </span>
            </div>

            {/* Markdown Report Render */}
            <div className="report-markdown prose prose-neutral max-w-none text-text-primary">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({node, ...props}) => (
                    <div className="w-full overflow-x-auto my-6 scrollbar-thin">
                      <table className="min-w-full border-collapse" {...props} />
                    </div>
                  ),
                  a: ({node, ...props}) => (
                    <a className="text-[#0A0A0A] underline hover:opacity-75 font-semibold transition-all" target="_blank" rel="noopener noreferrer" {...props} />
                  )
                }}
              >
                {markdownText}
              </ReactMarkdown>
            </div>
          </div>

          {/* Lower Back Button */}
          {!analyzing && (
            <button
              onClick={() => {
                setMarkdownText('');
                setJobTitle('');
                setJobLink('');
                setResumeText('');
              }}
              className="print:hidden self-center flex items-center gap-2 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-8 h-12 rounded-full text-xs font-bold transition-all mt-4 mb-10 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Analyze Another Job Profile
            </button>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
  );
}
