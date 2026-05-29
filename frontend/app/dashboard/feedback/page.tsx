'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { getApiUrl } from '@/lib/env';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, Star, Send, CheckCircle2, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('General Feedback');
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Auto-dismiss toast notifications after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const feedbackTypes = [
    'Bug Report',
    'Feature Request',
    'UI/UX Feedback',
    'General Feedback',
    'Performance Issue',
    'AI Quality Feedback'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Validate feedback form fields properly
    if (!feedbackText.trim()) {
      setErrorMsg('Critique message cannot be empty.');
      setToast({ message: 'Critique message cannot be empty.', type: 'error' });
      return;
    }
    if (rating < 1 || rating > 5) {
      setErrorMsg('Rating must be between 1 and 5 stars.');
      setToast({ message: 'Invalid rating value.', type: 'error' });
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        user_id: user?.id || null,
        full_name: user?.full_name || 'Anonymous Candidate',
        email: user?.email || '',
        feedback_type: category,
        feedback_message: feedbackText,
        rating: rating,
        browser_metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language
        },
        device_metadata: {
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          device_pixel_ratio: window.devicePixelRatio
        }
      };

      // Step 2: Save feedback into Supabase database via FastAPI backend
      const res = await fetch(`${getApiUrl()}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to submit feedback.');
      }

      const resData = await res.json();
      const createdFeedback = resData.data?.[0];
      const feedbackId = createdFeedback?.id;

      if (!feedbackId) {
        console.warn('Backend warning: No database record ID returned.');
      }

      // Step 3: Invoke secure Edge Function using the returned feedback ID
      let emailSuccess = false;
      try {
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-feedback-email', {
          body: { id: feedbackId },
        });

        if (invokeError) {
          console.warn('Feedback persisted, but secure Edge Function returned an error:', invokeError);
        } else {
          emailSuccess = true;
        }
      } catch (invokeErr) {
        console.warn('Error invoking send-feedback-email Edge Function:', invokeErr);
      }

      // Step 4: Show success or warning toast based on email dispatch status
      if (emailSuccess) {
        setToast({ 
          message: 'Feedback submitted successfully and telemetry email dispatched!', 
          type: 'success' 
        });
      } else {
        setToast({ 
          message: 'Feedback saved, but telemetry notification email failed. Admin alerted.', 
          type: 'warning' 
        });
      }

      // Step 5: Refresh feedback UI and form state instantly
      setSubmitted(true);
      setFeedbackText('');
      setRating(5);
      setCategory('General Feedback');
    } catch (err: any) {
      const errMsgText = err.message || 'Submission failed. Please check backend server.';
      setErrorMsg(errMsgText);
      setToast({ message: errMsgText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up w-full max-w-[800px] mx-auto pb-10">
      {/* Mobile Back Button */}
      <div className="md:hidden">
        <button
          onClick={() => router.push('/dashboard')}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 border border-accent-soft bg-white/80 hover:bg-[#ECECE7]/60 text-text-primary rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Optimize
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 md:w-12 md:h-12 text-accent" />
          Feedback & Evaluation
        </h1>
        <p className="text-sm text-text-secondary">
          Critique our ATS evaluation engines, request model features, or report UI bugs directly.
        </p>
      </div>

      {submitted ? (
        <div className="glass-panel rounded-[36px] p-12 border border-accent-soft text-center flex flex-col items-center justify-center min-h-[300px] shadow-premium bg-white/70 animate-scale-in">
          <CheckCircle2 className="w-16 h-16 text-success mb-4 animate-pulse" />
          <h2 className="text-xl font-extrabold text-text-primary mb-2">Thank You for Your Feedback!</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
            Your review and critique have been successfully compiled and sent to our career telemetry team. We will leverage this data to fine-tune our LLM prompt models.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary px-6 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            Submit Another Feedback
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel rounded-[36px] p-8 md:p-10 border border-accent-soft flex flex-col gap-8 shadow-premium bg-[rgba(255,255,255,0.4)]">
          <div className="flex items-center gap-2.5 border-b border-[#ECECE7] pb-4">
            <MessageSquare className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-text-primary">Submit System Evaluation</h2>
          </div>

          {errorMsg && (
            <div className="p-4 bg-error/10 border border-error/25 rounded-2xl flex gap-3 items-center text-xs text-error font-medium animate-scale-in">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-6">
            
            {/* Star Rating */}
            <div className="flex flex-col gap-2 p-6 bg-[#ECECE7]/30 border border-[#DADAD4]/40 rounded-[24px]">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary text-center block mb-1">
                Rate the Accuracy of the ATS Audit Engine
              </label>
              <div className="flex gap-3 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-120 cursor-pointer"
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? 'fill-warning text-warning' : 'text-text-muted'}`} />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center text-text-muted font-semibold mt-1">
                {rating === 5 ? 'Extremely Accurate' : rating === 4 ? 'Very Good' : rating === 3 ? 'Neutral/Average' : rating === 2 ? 'Needs Calibration' : 'Inaccurate Results'}
              </p>
            </div>

            {/* Critique Category Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Evaluation Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {feedbackTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setCategory(type)}
                    className={`h-11 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      category === type 
                        ? 'bg-accent border-accent text-white shadow-sm' 
                        : 'border-accent-soft hover:bg-[#ECECE7]/60 text-text-secondary'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Details */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Critique Details</label>
              <textarea
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                required
                placeholder="Share your experience, feature requests, or bug details to help us calibrate the career intelligence engine..."
                className="p-5 rounded-[24px] border border-accent-soft bg-white/70 text-sm font-medium focus:outline-none focus:border-accent transition-colors resize-y leading-relaxed placeholder:text-text-muted"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full bg-accent text-white font-bold rounded-full hover:opacity-90 transition-opacity text-sm shadow-premium flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit System Feedback
              </>
            )}
          </button>
        </form>
      )}
      {/* Premium Glassmorphic Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-scale-in">
          <div className={`glass-panel flex items-center gap-3.5 px-6 py-4 rounded-[24px] border shadow-premium max-w-md bg-white/90 ${
            toast.type === 'success' 
              ? 'border-success/30' 
              : toast.type === 'error'
              ? 'border-error/30'
              : 'border-warning/30'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success shrink-0" />}
            {toast.type === 'error' && <ShieldAlert className="w-5 h-5 text-error shrink-0" />}
            {toast.type === 'warning' && <Star className="w-5 h-5 text-warning fill-warning shrink-0" />}
            
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">
                {toast.type === 'success' ? 'Telemetry Dispatch' : toast.type === 'error' ? 'Telemetry Failure' : 'Telemetry Warning'}
              </p>
              <p className="text-xs font-semibold text-text-primary leading-relaxed">{toast.message}</p>
            </div>
            
            <button 
              onClick={() => setToast(null)}
              className="ml-3 text-text-muted hover:text-text-primary transition-colors text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
