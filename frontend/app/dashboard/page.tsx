'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  Sparkles,
  Lock,
  Loader2
} from 'lucide-react';

interface UserProfileData {
  full_name: string;
  target_role: string | null;
  experience_level: string | null;
}

export default function DashboardPage() {
  const { user } = useAppStore();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch users_profile with fallback to profiles table
  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Try to query users_profile table
      const { data, error } = await supabase
        .from('users_profile')
        .select('full_name, target_role, experience_level')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        // Log error and fallback to profiles table
        console.warn('Failed to query users_profile table, trying profiles table fallback:', error);
        await fallbackToProfiles();
      } else if (data) {
        setProfileData({
          full_name: data.full_name || user.full_name || 'Candidate',
          target_role: data.target_role || null,
          experience_level: data.experience_level || null
        });
      } else {
        // Row is missing completely, check profiles or create local defaults
        await fallbackToProfiles();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Resilient fallback
      setProfileData({
        full_name: user.full_name || 'Candidate',
        target_role: null,
        experience_level: null
      });
    } finally {
      setLoading(false);
    }
  };

  const fallbackToProfiles = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const fullName = (data && data.full_name) || user.full_name || 'Candidate';
      
      // Check local storage as a secondary offline fallback
      const cached = localStorage.getItem(`reziq_profile_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfileData({
            full_name: fullName,
            target_role: parsed.target_role || null,
            experience_level: parsed.experience_level || null
          });
          return;
        } catch (e) {
          // ignore cache error
        }
      }

      setProfileData({
        full_name: fullName,
        target_role: null,
        experience_level: null
      });
    } catch (e) {
      setProfileData({
        full_name: user.full_name || 'Candidate',
        target_role: null,
        experience_level: null
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
        <p className="text-xs text-text-secondary font-medium">Loading dashboard telemetry...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in-up">
      {/* Title block */}
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary">
          Welcome back, {profileData?.full_name || 'Candidate'}. Here is your career intelligence overview.
        </p>
      </div>

      {/* Grid Layout for Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION 1: User Summary Card */}
        <div className="glass-panel rounded-[32px] p-6 border border-accent-soft/60 bg-white/40 flex flex-col justify-between min-h-[240px] shadow-sm hover:shadow-premium transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">
                User Profile
              </span>
              <User className="w-4 h-4 text-text-muted" />
            </div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight mb-4">
              {profileData?.full_name}
            </h3>
            
            <div className="flex flex-col gap-2.5 text-xs text-text-secondary font-semibold">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>Target Role: <strong className="text-text-primary">{profileData?.target_role || 'Not specified'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>Experience: <strong className="text-text-primary">{profileData?.experience_level || 'Not specified'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Skill Gap Placeholder Panel */}
        <div className="glass-panel rounded-[32px] p-6 border border-accent-soft/60 bg-white/40 flex flex-col justify-between min-h-[240px] shadow-sm hover:shadow-premium transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">
                AI Engine
              </span>
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </div>
            
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight mb-2">
              Skill Gap Analysis
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed font-semibold mb-4">
              AI Skill Gap Engine will appear here. The system will audit your resume alignment and build a custom 21-day timeline.
            </p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/5 border border-accent/15 text-[9px] font-bold text-text-secondary select-none">
              <Lock className="w-2.5 h-2.5 text-text-muted" />
              FUTURE SYSTEM MODULE
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
