'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, 
  Mail, 
  Briefcase, 
  Award, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles,
  Lock,
  Plus,
  Loader2,
  Check
} from 'lucide-react';

interface UserProfileData {
  full_name: string;
  target_role: string | null;
  experience_level: string | null;
  onboarding_completed: boolean;
}

export default function DashboardPage() {
  const { user } = useAppStore();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Onboarding modal/form state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch users_profile with fallback to profiles table
  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Try to query users_profile table
      const { data, error } = await supabase
        .from('users_profile')
        .select('full_name, target_role, experience_level, onboarding_completed')
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
          experience_level: data.experience_level || null,
          onboarding_completed: !!data.onboarding_completed
        });
        
        // Initialize form fields
        setTargetRole(data.target_role || '');
        setExperienceLevel(data.experience_level || '');
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
        experience_level: null,
        onboarding_completed: false
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
            experience_level: parsed.experience_level || null,
            onboarding_completed: !!parsed.onboarding_completed
          });
          setTargetRole(parsed.target_role || '');
          setExperienceLevel(parsed.experience_level || '');
          return;
        } catch (e) {
          // ignore cache error
        }
      }

      setProfileData({
        full_name: fullName,
        target_role: null,
        experience_level: null,
        onboarding_completed: false
      });
    } catch (e) {
      setProfileData({
        full_name: user.full_name || 'Candidate',
        target_role: null,
        experience_level: null,
        onboarding_completed: false
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!targetRole.trim()) {
      setFormError('Please enter a valid target role.');
      return;
    }
    if (!experienceLevel) {
      setFormError('Please select your experience level.');
      return;
    }

    setSavingOnboarding(true);
    setFormError('');

    const payload = {
      id: user.id,
      email: user.email,
      full_name: profileData?.full_name || user.full_name || 'Candidate',
      target_role: targetRole.trim(),
      experience_level: experienceLevel,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Attempt database save to users_profile table
      const { error } = await supabase
        .from('users_profile')
        .upsert(payload);

      if (error) {
        console.warn('Database save failed (table might be missing), saving profile locally:', error);
        // Save locally to local storage as fallback
        localStorage.setItem(`reziq_profile_${user.id}`, JSON.stringify(payload));
      }

      // 2. Update local state
      setProfileData({
        full_name: payload.full_name,
        target_role: payload.target_role,
        experience_level: payload.experience_level,
        onboarding_completed: true
      });

      setIsOnboardingOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingOnboarding(false);
    }
  };

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
        <div className="glass-panel rounded-[32px] p-6 border border-accent-soft/60 bg-white/40 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-premium transition-all duration-300">
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

        {/* SECTION 2: Onboarding Status Card */}
        <div className="glass-panel rounded-[32px] p-6 border border-accent-soft/60 bg-white/40 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-premium transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-[#ECECE7]/60 px-3 py-1 rounded-full border border-accent-soft/30">
                Onboarding Status
              </span>
              {profileData?.onboarding_completed ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-error" />
              )}
            </div>
            
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight mb-2">
              Onboarding Completed: {profileData?.onboarding_completed ? 'YES' : 'NO'}
            </h3>
            
            {!profileData?.onboarding_completed ? (
              <div className="mt-4 p-4 rounded-[20px] bg-error/5 border border-error/15 flex flex-col gap-3">
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Complete onboarding to unlock AI roadmap and begin scanning job gaps.
                </p>
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="w-full h-9 bg-accent text-white rounded-full flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
                >
                  Complete Onboarding
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-[20px] bg-success/5 border border-success/15">
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  Great job! Your profile telemetry is synchronized. You can now simulate your roadmaps and assessments.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 3: Skill Gap Placeholder Panel */}
      <div className="glass-panel rounded-[32px] p-8 border border-accent-soft/60 bg-[rgba(255,255,255,0.4)] flex flex-col items-center justify-center text-center min-h-[300px] shadow-sm hover:shadow-premium transition-all duration-300">
        <div className="w-14 h-14 rounded-full bg-accent-soft/20 flex items-center justify-center text-accent mb-4 shadow-sm">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="font-extrabold text-text-primary text-base mb-2 uppercase tracking-wide">
          Skill Gap Analysis
        </h3>
        <p className="text-xs text-text-secondary max-w-sm mb-6 font-semibold leading-relaxed">
          AI Skill Gap Engine will appear here. The system will audit your resume alignment and build a custom 21-day timeline.
        </p>
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent/5 border border-accent/15 text-[10px] font-bold text-text-secondary select-none">
          <Lock className="w-3 h-3 text-text-muted" />
          FUTURE SYSTEM MODULE
        </div>
      </div>

      {/* SECTION 4: Quick Actions */}
      <div className="glass-panel rounded-[32px] p-6 border border-accent-soft/60 bg-white/40 shadow-sm">
        <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="h-10 px-5 bg-accent text-white rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Start Onboarding
          </button>
          
          <button
            disabled
            className="h-10 px-5 border border-accent-soft bg-[#ECECE7]/40 text-text-muted rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-not-allowed select-none"
          >
            <Lock className="w-3.5 h-3.5" />
            Generate Roadmap (Disabled)
          </button>
        </div>
      </div>

      {/* Interactive Onboarding Form Modal */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A]/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-bg-primary rounded-[36px] border border-accent-soft p-6 shadow-premium animate-scale-in relative">
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight mb-1">
              Onboarding Survey
            </h3>
            <p className="text-xs text-text-secondary mb-6 font-semibold">
              Fill in your target background to configure your AI career engine.
            </p>

            <form onSubmit={handleSaveOnboarding} className="flex flex-col gap-5">
              
              {/* Target Role Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="target-role" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Target Role Name
                </label>
                <input
                  id="target-role"
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-semibold premium-input focus:bg-white text-text-primary"
                  required
                />
              </div>

              {/* Experience Level Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="experience-level" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Current Experience Level
                </label>
                <select
                  id="experience-level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full h-11 px-4 text-xs font-semibold premium-input focus:bg-white text-text-primary bg-transparent cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Level</option>
                  <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                  <option value="Mid-level (3-5 years)">Mid-level (3-5 years)</option>
                  <option value="Senior (6-10 years)">Senior (6-10 years)</option>
                  <option value="Lead / Staff (10+ years)">Lead / Staff (10+ years)</option>
                </select>
              </div>

              {formError && (
                <p className="text-[11px] text-error font-bold leading-relaxed">
                  {formError}
                </p>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(false)}
                  className="h-10 px-5 border border-accent-soft hover:bg-[#ECECE7]/60 text-text-primary rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOnboarding}
                  className="h-10 px-6 bg-accent text-white rounded-full flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-premium cursor-pointer disabled:opacity-50"
                >
                  {savingOnboarding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
