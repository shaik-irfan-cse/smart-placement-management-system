-- Comprehensive RLS Migration for Smart Placement Management System
-- This ensures all necessary policies are in place for proper access control

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- ============================================================
-- STUDENTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Students can view own record" ON students;
DROP POLICY IF EXISTS "Students can insert own record" ON students;
DROP POLICY IF EXISTS "Students can update own record" ON students;
DROP POLICY IF EXISTS "Admins can view all students" ON students;

CREATE POLICY "Students can view own record" ON students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert own record" ON students
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own record" ON students
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all students" ON students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- ADMINS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can view own record" ON admins;
DROP POLICY IF EXISTS "Admins can insert own record" ON admins;
DROP POLICY IF EXISTS "Admins can update own record" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

CREATE POLICY "Admins can view own record" ON admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert own record" ON admins
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update own record" ON admins
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- RECRUITERS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Recruiters can view own record" ON recruiters;
DROP POLICY IF EXISTS "Recruiters can insert own record" ON recruiters;
DROP POLICY IF EXISTS "Recruiters can update own record" ON recruiters;
DROP POLICY IF EXISTS "Admins can view all recruiters" ON recruiters;
DROP POLICY IF EXISTS "Admins can update recruiters" ON recruiters;

CREATE POLICY "Recruiters can view own record" ON recruiters
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Recruiters can insert own record" ON recruiters
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Recruiters can update own record" ON recruiters
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all recruiters" ON recruiters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update recruiters" ON recruiters
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- JOB DRIVES TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view job drives" ON job_drives;
DROP POLICY IF EXISTS "Recruiters can manage own job drives" ON job_drives;
DROP POLICY IF EXISTS "Admins can manage all job drives" ON job_drives;

CREATE POLICY "Anyone can view job drives" ON job_drives
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Recruiters can manage own job drives" ON job_drives
  FOR ALL TO authenticated
  USING (
    recruiter_id IN (
      SELECT id FROM recruiters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all job drives" ON job_drives
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- APPLICATIONS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Students can view own applications" ON applications;
DROP POLICY IF EXISTS "Students can create own applications" ON applications;
DROP POLICY IF EXISTS "Students can update own applications" ON applications;
DROP POLICY IF EXISTS "Recruiters can view applications for their drives" ON applications;
DROP POLICY IF EXISTS "Recruiters can update applications for their drives" ON applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON applications;

CREATE POLICY "Students can view own applications" ON applications
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own applications" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own applications" ON applications
  FOR UPDATE TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view applications for their drives" ON applications
  FOR SELECT TO authenticated
  USING (
    job_drive_id IN (
      SELECT id FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Recruiters can update applications for their drives" ON applications
  FOR UPDATE TO authenticated
  USING (
    job_drive_id IN (
      SELECT id FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all applications" ON applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- TEST QUESTIONS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view test questions" ON test_questions;

CREATE POLICY "Authenticated users can view test questions" ON test_questions
  FOR SELECT TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================
-- TEST RESULTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Students can view own test results" ON test_results;
DROP POLICY IF EXISTS "Students can insert own test results" ON test_results;
DROP POLICY IF EXISTS "Recruiters can view test results for their drives" ON test_results;
DROP POLICY IF EXISTS "Admins can manage all test results" ON test_results;

CREATE POLICY "Students can view own test results" ON test_results
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert own test results" ON test_results
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view test results for their drives" ON test_results
  FOR SELECT TO authenticated
  USING (
    job_drive_id IN (
      SELECT id FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all test results" ON test_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- PLACEMENTS TABLE POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Students can view own placements" ON placements;
DROP POLICY IF EXISTS "Recruiters can view placements for their drives" ON placements;
DROP POLICY IF EXISTS "Admins can manage all placements" ON placements;
DROP POLICY IF EXISTS "Authenticated users can insert placements" ON placements;

CREATE POLICY "Students can view own placements" ON placements
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can view placements for their drives" ON placements
  FOR SELECT TO authenticated
  USING (
    job_drive_id IN (
      SELECT id FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all placements" ON placements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert placements" ON placements
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'authenticated');
