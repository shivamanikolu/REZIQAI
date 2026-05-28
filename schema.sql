-- REZIQ Database Schema
-- Target Database: Supabase PostgreSQL (with RLS Enabled)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reports Table (AI Skill Gap assessment outputs)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_title TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_link TEXT,
    output_text TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. History Table (Detailed telemetry of assessment actions)
CREATE TABLE IF NOT EXISTS public.history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    job_link TEXT,
    resume_text TEXT NOT NULL,
    generated_output TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    ai_model TEXT NOT NULL,
    generation_time_ms INTEGER NOT NULL,
    word_count INTEGER NOT NULL,
    report_size INTEGER NOT NULL,
    generation_status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Feedback Table (User feedback submissions & category rankings)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    feedback_type TEXT NOT NULL,
    feedback_message TEXT NOT NULL,
    rating INTEGER NOT NULL,
    browser_metadata JSONB,
    device_metadata JSONB,
    is_reviewed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Admin Users Table (Authorized administrator IDs)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AI Usage Logs Table (Backend latency and API auditing telemetry)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    primary_model TEXT NOT NULL,
    used_model TEXT NOT NULL,
    is_fallback BOOLEAN DEFAULT FALSE NOT NULL,
    error_message TEXT,
    latency_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;


-- 1. Profiles RLS Policies
CREATE POLICY "Allow users to view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Reports RLS Policies
CREATE POLICY "Users can view own reports" ON public.reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON public.reports
    FOR DELETE USING (auth.uid() = user_id);


-- 3. History RLS Policies
CREATE POLICY "Users can view own history" ON public.history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON public.history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.history
    FOR DELETE USING (auth.uid() = user_id);


-- 4. Feedback RLS Policies
CREATE POLICY "Anyone can submit feedback" ON public.feedback
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own feedback or admins can view all" ON public.feedback
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE public.admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update feedback" ON public.feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE public.admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete feedback" ON public.feedback
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE public.admin_users.user_id = auth.uid()
        )
    );


-- 5. Admin Users RLS Policies
CREATE POLICY "Allow public read check of admin status" ON public.admin_users
    FOR SELECT USING (TRUE);


-- 6. AI Usage Logs RLS Policies
CREATE POLICY "Allow public insert of logs" ON public.ai_usage_logs
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can view all logs" ON public.ai_usage_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE public.admin_users.user_id = auth.uid()
        )
    );


-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_report_id ON public.history(report_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON public.ai_usage_logs(created_at);


-- AUTOMATIC updated_at SYNC HANDLERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- AUTHENTICATION REGISTRATION PROFILE SYNCHRONIZATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, auth_provider)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- SUPABASE STORAGE BUCKET setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-pdfs', 'report-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up legacy/old interview buckets
DELETE FROM storage.buckets WHERE id NOT IN ('report-pdfs');

-- RLS policies for storage bucket 'report-pdfs'
CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'report-pdfs' AND auth.uid()::text = (regexp_split_to_array(name, '/'))[1]
    );

CREATE POLICY "Allow authenticated users to read own PDFs" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'report-pdfs' AND auth.uid()::text = (regexp_split_to_array(name, '/'))[1]
    );

CREATE POLICY "Allow authenticated users to delete own PDFs" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'report-pdfs' AND auth.uid()::text = (regexp_split_to_array(name, '/'))[1]
    );
