'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/env';
import { supabase } from '@/lib/supabaseClient';
import { Cpu, ShieldCheck, Activity, Terminal, ShieldAlert, Heart, MessageSquare, Trash2, CheckSquare, Eye, Filter, ArrowUpDown } from 'lucide-react';

interface FeedbackItem {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  feedback_type: string;
  feedback_message: string;
  rating: number;
  browser_metadata?: {
    userAgent?: string;
    language?: string;
  };
  device_metadata?: {
    screen_width?: number;
    screen_height?: number;
    device_pixel_ratio?: number;
  };
  is_reviewed: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters & Sorting state
  const [filterType, setFilterType] = useState('All');
  const [filterRating, setFilterRating] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const fetchAdminData = async () => {
    try {
      const apiUrl = getApiUrl();
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token || '';

      const headers = {
        'Authorization': `Bearer ${sessionToken}`
      };
      
      // Fetch metrics
      const metRes = await fetch(`${apiUrl}/api/admin/telemetry`, { headers });
      const metData = await metRes.json();
      setTelemetry(metData);

      // Fetch feedback
      const feedRes = await fetch(`${apiUrl}/api/admin/feedback`, { headers });
      const feedData = await feedRes.json();
      setFeedbacks(feedData);
    } catch (err) {
      console.warn('Failed to retrieve admin telemetry logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this feedback entry?')) {
      return;
    }
    setActionLoadingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token || '';

      const res = await fetch(`${getApiUrl()}/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!res.ok) throw new Error('Delete failed.');
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete feedback item.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReviewFeedback = async (id: string) => {
    setActionLoadingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token || '';

      const res = await fetch(`${getApiUrl()}/api/admin/feedback/${id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (!res.ok) throw new Error('Update failed.');
      
      // Update local state
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_reviewed: true } : f))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to mark feedback as reviewed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading || !telemetry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <Activity className="w-12 h-12 text-text-secondary animate-pulse mb-4" />
        <p className="text-xs text-text-secondary">Retrieving system telemetry metrics...</p>
      </div>
    );
  }

  const { system_health, chart_data, failover_logs } = telemetry;

  // Filter and sort feedback list
  const filteredFeedbacks = feedbacks
    .filter((f) => {
      const typeMatch = filterType === 'All' || f.feedback_type === filterType;
      const ratingMatch = filterRating === 'All' || f.rating.toString() === filterRating;
      return typeMatch && ratingMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const feedbackTypes = [
    'Bug Report',
    'Feature Request',
    'UI/UX Feedback',
    'General Feedback',
    'Performance Issue',
    'AI Quality Feedback'
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up pb-16">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary mb-2">
          Admin Telemetry
        </h1>
        <p className="text-sm text-text-secondary">
          Monitor system health, API response latency, failover telemetry, and moderate user evaluations.
        </p>
      </div>

      {/* SYSTEM HEALTH WIDGETS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel rounded-[24px] p-5 border border-[#DADAD4] text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Server API Status</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-bold text-text-primary">{system_health.api_status}</span>
          </div>
        </div>

        <div className="glass-panel rounded-[24px] p-5 border border-[#DADAD4] text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">CPU Load</p>
          <div className="flex items-center justify-center gap-1.5">
            <Cpu className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-bold text-text-primary">{system_health.cpu_usage}</span>
          </div>
        </div>

        <div className="glass-panel rounded-[24px] p-5 border border-[#DADAD4] text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">NVIDIA Endpoint</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              system_health.nvidia_api_status === 'Operational' ? 'bg-success' : 'bg-warning animate-pulse'
            }`} />
            <span className="text-sm font-bold text-text-primary">{system_health.nvidia_api_status}</span>
          </div>
        </div>

        <div className="glass-panel rounded-[24px] p-5 border border-[#DADAD4] text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Active Sockets</p>
          <div className="flex items-center justify-center gap-1.5">
            <Activity className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-bold text-text-primary">{system_health.active_websockets} Active</span>
          </div>
        </div>
      </div>

      {/* METRICS & CUSTOM BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* QUERY VOLUME CHART */}
        <div className="lg:col-span-2 glass-panel rounded-[32px] p-6 md:p-8 border border-[#DADAD4] shadow-premium flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-1">Query Assessment Volume</h3>
            <p className="text-xs text-text-muted">Total queries logged: {telemetry.total_queries} queries &bull; Avg Latency: {telemetry.avg_latency_ms}ms</p>
          </div>

          {/* CUSTOM BAR CHART GRAPH */}
          <div className="h-60 flex items-end justify-between gap-4 border-b border-[#DADAD4]/60 pb-2 pt-6">
            {chart_data.map((d: any) => {
              const totalVal = d.NVIDIA + d.Fallback;
              const nvidiaHeight = totalVal > 0 ? (d.NVIDIA / 35) * 100 : 0;
              const fallbackHeight = totalVal > 0 ? (d.Fallback / 35) * 100 : 0;
              
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 bg-accent text-white text-[9px] px-2 py-1 rounded absolute -translate-y-16 transition-opacity shadow-sm pointer-events-none font-bold">
                    NV: {d.NVIDIA} | FB: {d.Fallback} | {d.latency}ms
                  </div>
                  
                  {/* Bar stack */}
                  <div className="w-full max-w-[40px] flex flex-col justify-end h-full rounded-t-md overflow-hidden bg-[#ECECE7]/30">
                    <div className="bg-[#B42318] transition-all duration-500" style={{ height: `${fallbackHeight}%` }} />
                    <div className="bg-[#111111] transition-all duration-500" style={{ height: `${nvidiaHeight}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-text-secondary">{d.date}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-6 text-[10px] font-bold tracking-wider uppercase text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#111111]" />
              <span>NVIDIA Model Calls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#B42318]" />
              <span>Groq Fallback Calls</span>
            </div>
          </div>
        </div>

        {/* FAILOVER RATE */}
        <div className="glass-panel rounded-[32px] p-6 border border-[#DADAD4] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Failover Telemetry</h3>
            <p className="text-xs text-text-primary leading-relaxed mb-6">
              Our triple-redundant failover routing ensures that if the primary NVIDIA API key is throttled, the secondary key connects, and ultimately switches to Llama 3 via Groq.
            </p>
          </div>

          <div className="border-t border-[#ECECE7]/60 pt-6 flex flex-col gap-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary">Active Failovers:</span>
              <span className="bg-error/10 text-error px-2 py-0.5 rounded font-bold">{telemetry.failover_count} events</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-text-secondary">NVIDIA Failover Rate:</span>
              <span className="text-text-primary">{( (telemetry.failover_count / Math.max(telemetry.total_queries, 1)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAILOVER LOGS */}
      <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-[#DADAD4] shadow-premium">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5" /> Failover Logs Event Stream
        </h3>

        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
          {failover_logs.map((log: any) => (
            <div key={log.id} className="p-4 bg-[#ECECE7]/40 border border-[#DADAD4]/30 rounded-2xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                <span className="flex items-center gap-1.5 text-error">
                  <ShieldAlert className="w-3.5 h-3.5" /> Failover Alert
                </span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs font-bold text-text-primary leading-tight">
                Endpoint {log.endpoint} failed over to {log.fallback_used}.
              </p>
              <p className="text-[10px] text-error bg-error/5 p-2 rounded-lg border border-error/10 overflow-x-auto font-mono whitespace-nowrap scrollbar-none">
                {log.error}
              </p>
              <div className="flex gap-4 text-[9px] font-semibold text-text-muted">
                <span>Primary: {log.primary}</span>
                <span>&bull;</span>
                <span>Latency: {log.latency}ms</span>
              </div>
            </div>
          ))}

          {failover_logs.length === 0 && (
            <p className="text-xs text-text-muted text-center py-6">No failover events logged.</p>
          )}
        </div>
      </div>

      {/* USER FEEDBACK MONITOR AND MODERATION */}
      <div className="glass-panel rounded-[32px] p-6 md:p-8 border border-[#DADAD4] shadow-premium flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#ECECE7]/60">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5" /> User Feedback Monitor
          </h3>
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Category */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-text-muted" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 pl-2 pr-6 rounded-lg border border-accent-soft text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/30 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {feedbackTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Filter Rating */}
            <div className="flex items-center gap-1.5">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="h-8 pl-2 pr-6 rounded-lg border border-accent-soft text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/30 focus:outline-none cursor-pointer"
              >
                <option value="All">All Ratings</option>
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>

            {/* Sort Date */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSortBy(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="h-8 px-3 rounded-lg border border-accent-soft text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/30 flex items-center gap-1.5 hover:bg-[#ECECE7]/60 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortBy === 'newest' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredFeedbacks.map((f: FeedbackItem) => {
            const browserStr = f.browser_metadata?.userAgent || 'Unknown Browser';
            const screenStr = f.device_metadata?.screen_width 
              ? `${f.device_metadata.screen_width}x${f.device_metadata.screen_height} (@${f.device_metadata.device_pixel_ratio}x)`
              : 'Unknown Resolution';

            return (
              <div key={f.id} className="p-5 bg-white border border-[#DADAD4]/60 rounded-[24px] flex flex-col gap-3 transition-shadow hover:shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                      {f.full_name}
                      <span className="text-[10px] font-semibold text-text-muted">({f.email})</span>
                    </h4>
                    <div className="flex gap-2 items-center mt-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#ECECE7]/60 text-text-secondary rounded-md border border-accent-soft/30">
                        {f.feedback_type}
                      </span>
                      <span className="text-[9px] font-semibold text-text-muted">
                        {new Date(f.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-xs ${i < f.rating ? 'text-warning' : 'text-text-muted'}`}>★</span>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed bg-[#ECECE7]/20 p-4 rounded-2xl border border-[#DADAD4]/30 font-medium italic">
                  “{f.feedback_message}”
                </p>

                {/* Metadata details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[9px] font-semibold text-text-muted bg-[#ECECE7]/10 p-3 rounded-xl border border-[#DADAD4]/20">
                  <div className="truncate"><strong>Browser:</strong> {browserStr}</div>
                  <div><strong>Resolution:</strong> {screenStr}</div>
                  <div><strong>Status:</strong> <span className={f.is_reviewed ? 'text-success' : 'text-warning'}>{f.is_reviewed ? 'Reviewed' : 'Pending Review'}</span></div>
                  <div className="truncate"><strong>Log ID:</strong> {f.id}</div>
                </div>

                {/* Moderate Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-[#ECECE7]/40">
                  <button
                    onClick={() => handleDeleteFeedback(f.id)}
                    disabled={actionLoadingId === f.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-error/10 hover:bg-error text-error hover:text-white border border-error/10 hover:border-error transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>

                  {!f.is_reviewed && (
                    <button
                      onClick={() => handleReviewFeedback(f.id)}
                      disabled={actionLoadingId === f.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-success/10 hover:bg-success text-success hover:text-white border border-success/10 hover:border-success transition-all cursor-pointer disabled:opacity-50"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredFeedbacks.length === 0 && (
            <p className="text-xs text-text-muted text-center py-10 bg-white/50 border border-dashed border-[#DADAD4] rounded-2xl">
              No matching feedback logs found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
