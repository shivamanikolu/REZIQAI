import { create } from 'zustand';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  career_goals?: string;
  resume_url?: string;
  avatar_url?: string;
  auth_provider?: string;
}

export interface SkillGapReport {
  id: string;
  job_title: string;
  job_link?: string;
  job_description: string;
  ats_score: number;
  recruiter_score: number;
  technical_score: number;
  verdict: string;
  missing_skills: string[];
  suggested_improvements: string[];
  career_timeline: Array<{ day: string; topic: string; details: string }>;
  hiring_probability: string;
  created_at: string;
}

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  careerGoals: string;
  setCareerGoals: (goals: string) => void;
  reports: SkillGapReport[];
  setReports: (reports: SkillGapReport[]) => void;
  addReport: (report: SkillGapReport) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  careerGoals: '',
  setCareerGoals: (careerGoals) => set({ careerGoals }),
  reports: [],
  setReports: (reports) => set({ reports }),
  addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
