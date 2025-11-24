-- ============================================
-- TalentFlow ATS - Complete Database Schema
-- ============================================
-- This script creates all tables, policies, and storage buckets
-- Run this in your Supabase SQL Editor after creating a new project

-- ============================================
-- 1. JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    salary_range TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stages JSONB DEFAULT '[
        {"id": "applied", "label": "Applied", "color": "bg-blue-500"},
        {"id": "screening", "label": "Screening", "color": "bg-yellow-500"},
        {"id": "interview", "label": "Interview", "color": "bg-purple-500"},
        {"id": "offer", "label": "Offer", "color": "bg-green-500"},
        {"id": "rejected", "label": "Rejected", "color": "bg-red-500"}
    ]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs Policies
CREATE POLICY "Anyone can view active jobs"
    ON jobs FOR SELECT
    USING (status = 'active');

CREATE POLICY "Authenticated users can create jobs"
    ON jobs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own jobs"
    ON jobs FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own jobs"
    ON jobs FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- ============================================
-- 2. CANDIDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    current_stage TEXT DEFAULT 'applied',
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    linkedin_url TEXT,
    portfolio_url TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    notes TEXT,
    years_of_experience INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Candidates Policies
CREATE POLICY "Authenticated users can view all candidates"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone can insert candidates (for job applications)"
    ON candidates FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
    ON candidates FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete candidates"
    ON candidates FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- 3. INTERVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interview_type TEXT NOT NULL,
    duration INTEGER,
    location TEXT,
    meeting_link TEXT,
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Interviews Policies
CREATE POLICY "Authenticated users can view all interviews"
    ON interviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create interviews"
    ON interviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update interviews"
    ON interviews FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete interviews"
    ON interviews FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- 4. SCORECARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    technical_skills INTEGER CHECK (technical_skills >= 0 AND technical_skills <= 5),
    communication INTEGER CHECK (communication >= 0 AND communication <= 5),
    problem_solving INTEGER CHECK (problem_solving >= 0 AND problem_solving <= 5),
    cultural_fit INTEGER CHECK (cultural_fit >= 0 AND cultural_fit <= 5),
    experience INTEGER CHECK (experience >= 0 AND experience <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 0 AND overall_rating <= 5),
    comments TEXT,
    evaluated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;

-- Scorecards Policies
CREATE POLICY "Authenticated users can view all scorecards"
    ON scorecards FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create scorecards"
    ON scorecards FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update scorecards"
    ON scorecards FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete scorecards"
    ON scorecards FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- 5. ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Activity Log Policies
CREATE POLICY "Authenticated users can view all activity logs"
    ON activity_log FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create activity logs"
    ON activity_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_current_stage ON candidates(current_stage);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_candidate_id ON scorecards(candidate_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_candidate_id ON activity_log(candidate_id);

-- ============================================
-- 7. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scorecards_updated_at
    BEFORE UPDATE ON scorecards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. STORAGE BUCKET SETUP
-- ============================================
-- Note: Storage buckets must be created via Supabase Dashboard
-- After running this script, go to Storage and create a bucket named 'candidate-files'
-- Set it to PUBLIC and configure the following policies:

-- Storage Policy for candidate-files bucket (run after creating bucket):
-- 
-- INSERT policy:
-- CREATE POLICY "Anyone can upload candidate files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'candidate-files');
--
-- SELECT policy:
-- CREATE POLICY "Anyone can view candidate files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'candidate-files');
--
-- DELETE policy:
-- CREATE POLICY "Authenticated users can delete candidate files"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'candidate-files');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Create storage bucket 'candidate-files' in Supabase Dashboard
-- 2. Set bucket to PUBLIC
-- 3. Add storage policies (see comments above)
-- 4. Update your .env file with new Supabase credentials
