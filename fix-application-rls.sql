-- Fix RLS policies for student job applications
-- This fixes the "Permission denied" error when students try to apply for jobs

-- ============================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================

-- Drop old applications INSERT policies
DROP POLICY IF EXISTS "Students can create own applications" ON applications;
DROP POLICY IF EXISTS "Students can apply to job drives" ON applications;

-- Drop old students SELECT policies (we'll recreate them properly)
DROP POLICY IF EXISTS "Students can view own record" ON students;

-- ============================================================
-- STEP 2: Fix students table RLS policies
-- ============================================================

-- Students can SELECT their own record
-- This is CRITICAL because the applications INSERT policy needs to query this table
CREATE POLICY "Students can view own record" ON students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Students can INSERT their own record (for registration)
CREATE POLICY "Students can insert own record" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Students can UPDATE their own record
CREATE POLICY "Students can update own record" ON students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all students
CREATE POLICY "Admins can view all students" ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- STEP 3: Fix applications table RLS policies
-- ============================================================

-- Students can INSERT applications using their own student_id
-- The subquery MUST be able to SELECT from students table (which we fixed above)
CREATE POLICY "Students can create own applications" ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify the student_id belongs to the authenticated user
    student_id IN (
      SELECT id 
      FROM students 
      WHERE user_id = auth.uid()
    )
  );

-- Students can SELECT their own applications
CREATE POLICY "Students can view own applications" ON applications
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE user_id = auth.uid()
    )
  );

-- Students can UPDATE their own applications (for status changes)
CREATE POLICY "Students can update own applications" ON applications
  FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE user_id = auth.uid()
    )
  );

-- Recruiters can view applications for their job drives
CREATE POLICY "Recruiters can view applications for their drives" ON applications
  FOR SELECT
  TO authenticated
  USING (
    job_drive_id IN (
      SELECT id 
      FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

-- Recruiters can update applications for their job drives
CREATE POLICY "Recruiters can update applications for their drives" ON applications
  FOR UPDATE
  TO authenticated
  USING (
    job_drive_id IN (
      SELECT id 
      FROM job_drives 
      WHERE recruiter_id IN (
        SELECT id FROM recruiters WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications" ON applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- STEP 4: Verify job_drives SELECT policy
-- ============================================================

-- Ensure students can view job drives (needed for eligibility checks)
DROP POLICY IF EXISTS "Anyone can view active job drives" ON job_drives;

CREATE POLICY "Anyone can view job drives" ON job_drives
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- STEP 5: Verification queries
-- ============================================================

-- Run these queries to verify the policies are working:

-- 1. Check that students can SELECT their own record
-- SELECT * FROM students WHERE user_id = auth.uid();

-- 2. Check that the applications INSERT policy works
-- This should succeed if all policies are correct:
-- INSERT INTO applications (student_id, job_drive_id, status)
-- VALUES (
--   (SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1),
--   (SELECT id FROM job_drives WHERE status = 'ACTIVE' LIMIT 1),
--   'APPLIED'
-- );

-- 3. Verify policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('students', 'applications', 'job_drives')
ORDER BY tablename, policyname;
