-- Diagnostic Script for Student Job Application RLS Issue
-- Run this in Supabase SQL Editor to identify the exact failing operation

-- ============================================================
-- STEP 1: Check Current User Context
-- ============================================================
SELECT 
  auth.uid() as current_auth_uid,
  auth.role() as current_role,
  auth.jwt() as current_jwt;

-- ============================================================
-- STEP 2: Check Student Record
-- ============================================================
SELECT 
  id,
  user_id,
  name,
  roll_number,
  branch,
  cgpa,
  CASE 
    WHEN user_id = auth.uid() THEN '✓ MATCHES auth.uid()'
    ELSE '✗ DOES NOT MATCH auth.uid()'
  END as user_id_check
FROM students
WHERE user_id = auth.uid();

-- ============================================================
-- STEP 3: Check All RLS Policies on students Table
-- ============================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'students'
ORDER BY policyname;

-- ============================================================
-- STEP 4: Check All RLS Policies on applications Table
-- ============================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'applications'
ORDER BY policyname;

-- ============================================================
-- STEP 5: Check All RLS Policies on job_drives Table
-- ============================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_drives'
ORDER BY policyname;

-- ============================================================
-- STEP 6: Test Students SELECT Policy
-- ============================================================
-- This should return the student's own record
SELECT 
  'Testing students SELECT' as test_name,
  COUNT(*) as rows_returned,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ SELECT works'
    ELSE '✗ SELECT returns no rows'
  END as result
FROM students
WHERE user_id = auth.uid();

-- ============================================================
-- STEP 7: Test the Subquery Used in Applications INSERT Policy
-- ============================================================
-- This is the exact subquery from the INSERT policy
SELECT 
  'Testing INSERT policy subquery' as test_name,
  id as student_id,
  user_id,
  CASE 
    WHEN user_id = auth.uid() THEN '✓ Subquery can find student'
    ELSE '✗ Subquery cannot find student'
  END as result
FROM students
WHERE user_id = auth.uid();

-- ============================================================
-- STEP 8: Check Active Job Drives
-- ============================================================
SELECT 
  id,
  company_name,
  job_role,
  status,
  deadline,
  eligibility_cgpa,
  eligible_branches
FROM job_drives
WHERE status = 'ACTIVE'
LIMIT 5;

-- ============================================================
-- STEP 9: Test Applications INSERT (Simulated)
-- ============================================================
-- This simulates what the frontend is trying to do
-- Replace the UUIDs with actual values from your database
DO $$
DECLARE
  v_student_id UUID;
  v_job_drive_id UUID;
BEGIN
  -- Get the student's ID
  SELECT id INTO v_student_id
  FROM students
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Get an active job drive
  SELECT id INTO v_job_drive_id
  FROM job_drives
  WHERE status = 'ACTIVE'
  LIMIT 1;
  
  -- Log what we're trying to insert
  RAISE NOTICE 'Attempting to insert application:';
  RAISE NOTICE '  student_id: %', v_student_id;
  RAISE NOTICE '  job_drive_id: %', v_job_drive_id;
  RAISE NOTICE '  auth.uid(): %', auth.uid();
  
  -- Try the insert
  BEGIN
    INSERT INTO applications (student_id, job_drive_id, status)
    VALUES (v_student_id, v_job_drive_id, 'APPLIED')
    RETURNING id;
    
    RAISE NOTICE '✓ INSERT succeeded';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ INSERT failed: %', SQLERRM;
    RAISE NOTICE '  SQLSTATE: %', SQLSTATE;
  END;
END $$;

-- ============================================================
-- STEP 10: Check for Duplicate Policies
-- ============================================================
SELECT 
  tablename,
  policyname,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('students', 'applications', 'job_drives')
GROUP BY tablename, policyname
HAVING COUNT(*) > 1;

-- ============================================================
-- STEP 11: Check if RLS is Enabled
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('students', 'applications', 'job_drives', 'profiles');

-- ============================================================
-- STEP 12: Check Existing Applications for This Student
-- ============================================================
SELECT 
  a.id,
  a.student_id,
  a.job_drive_id,
  a.status,
  a.applied_at,
  jd.company_name,
  jd.job_role
FROM applications a
JOIN job_drives jd ON jd.id = a.job_drive_id
WHERE a.student_id = (
  SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1
);

-- ============================================================
-- STEP 13: Detailed Policy Analysis
-- ============================================================
-- This shows the exact policy definitions that might be causing issues
SELECT 
  'students SELECT policies' as category,
  policyname,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'students' AND cmd = 'SELECT'
UNION ALL
SELECT 
  'applications INSERT policies' as category,
  policyname,
  with_check as using_expression
FROM pg_policies
WHERE tablename = 'applications' AND cmd = 'INSERT'
UNION ALL
SELECT 
  'applications SELECT policies' as category,
  policyname,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'applications' AND cmd = 'SELECT';

-- ============================================================
-- STEP 14: Test Cross-Table Query (The Problematic Subquery)
-- ============================================================
-- This tests if the subquery in the INSERT policy can execute
SELECT 
  'Cross-table subquery test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM students WHERE user_id = auth.uid()
    ) THEN '✓ Subquery can execute'
    ELSE '✗ Subquery returns no rows'
  END as result;

-- ============================================================
-- STEP 15: Check for Policy Conflicts
-- ============================================================
-- Look for policies that might conflict with each other
SELECT 
  p1.tablename,
  p1.policyname as policy1,
  p1.cmd as cmd1,
  p2.policyname as policy2,
  p2.cmd as cmd2,
  'Potential conflict' as warning
FROM pg_policies p1
JOIN pg_policies p2 ON p1.tablename = p2.tablename 
  AND p1.cmd = p2.cmd 
  AND p1.policyname != p2.policyname
WHERE p1.tablename IN ('students', 'applications')
ORDER BY p1.tablename, p1.cmd;
