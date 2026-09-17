-- Smart Placement Management System - Supabase Schema Reference
-- This file documents the expected database schema for the application.
-- If your tables differ, adjust the column mappings in src/contexts/AppContext.tsx

-- ============================================================
-- PROFILES TABLE
-- Links Supabase Auth users to application roles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'recruiter')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  roll_number TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  branch TEXT NOT NULL,
  year INTEGER DEFAULT 4,
  cgpa REAL DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  placement_status TEXT DEFAULT 'NOT_PLACED' CHECK (placement_status IN ('PLACED', 'NOT_PLACED', 'IN_PROCESS')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMINS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_id TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECRUITERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  recruiter_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  approval_status TEXT DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOB DRIVES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS job_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  job_description TEXT,
  package TEXT,
  location TEXT,
  job_type TEXT DEFAULT 'Full-time',
  eligibility_cgpa REAL DEFAULT 0,
  eligible_branches TEXT[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  openings INTEGER DEFAULT 1,
  deadline DATE,
  test_duration INTEGER DEFAULT 30,
  test_pass_percentage INTEGER DEFAULT 60,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'EXPIRED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_drive_id UUID NOT NULL REFERENCES job_drives(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'TEST_PENDING', 'TEST_COMPLETED', 'PASSED', 'FAILED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED')),
  applied_at DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, job_drive_id)
);

-- ============================================================
-- TEST QUESTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEST RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_drive_id UUID NOT NULL REFERENCES job_drives(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage REAL NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at DATE DEFAULT CURRENT_DATE
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLACEMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  job_drive_id UUID NOT NULL REFERENCES job_drives(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_role TEXT NOT NULL,
  package TEXT,
  selection_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'PLACED' CHECK (status IN ('PLACED', 'NOT_PLACED', 'IN_PROCESS')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SAMPLE RLS POLICIES (adjust as needed for your use case)
-- ============================================================

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Students: Students can view/update own, admins can view all
CREATE POLICY "Students can view own record" ON students
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students can update own record" ON students
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recruiters: Recruiters can view own, admins can view/update all
CREATE POLICY "Recruiters can view own record" ON recruiters
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all recruiters" ON recruiters
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update recruiters" ON recruiters
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Job Drives: Everyone can view active drives, recruiters manage own, admins manage all
CREATE POLICY "Anyone can view active job drives" ON job_drives
  FOR SELECT USING (true);
CREATE POLICY "Recruiters can manage own job drives" ON job_drives
  FOR ALL USING (recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all job drives" ON job_drives
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Applications: Students view own, recruiters view for their drives, admins view all
CREATE POLICY "Students can view own applications" ON applications
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can create own applications" ON applications
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Recruiters can view applications for their drives" ON applications
  FOR SELECT USING (job_drive_id IN (SELECT id FROM job_drives WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid())));
CREATE POLICY "Recruiters can update applications for their drives" ON applications
  FOR UPDATE USING (job_drive_id IN (SELECT id FROM job_drives WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid())));
CREATE POLICY "Admins can manage all applications" ON applications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Test Questions: Everyone authenticated can view
CREATE POLICY "Authenticated users can view test questions" ON test_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Test Results: Students view own, recruiters view for their drives, admins view all
CREATE POLICY "Students can view own test results" ON test_results
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can insert own test results" ON test_results
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Recruiters can view test results for their drives" ON test_results
  FOR SELECT USING (job_drive_id IN (SELECT id FROM job_drives WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid())));
CREATE POLICY "Admins can manage all test results" ON test_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Notifications: Users can view/update own, admins can insert for anyone
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Placements: Students view own, admins view all
CREATE POLICY "Students can view own placements" ON placements
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Recruiters can view placements for their drives" ON placements
  FOR SELECT USING (job_drive_id IN (SELECT id FROM job_drives WHERE recruiter_id IN (SELECT id FROM recruiters WHERE user_id = auth.uid())));
CREATE POLICY "Admins can manage all placements" ON placements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Authenticated users can insert placements" ON placements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
