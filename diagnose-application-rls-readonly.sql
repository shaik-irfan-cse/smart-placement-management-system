-- READ-ONLY Diagnostic Script for Student Job Application RLS Issue
-- This script contains ONLY SELECT statements - NO modifications to the database
-- Uses correct column names based on verified schema

-- ============================================================
-- STEP 1: Check RLS Status on All Tables
-- ============================================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled,
  forcerowsecurity as force_rls
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('students', 'applications', 'job_drives', 'profiles')
ORDER BY tablename;

-- ============================================================
-- STEP 2: All Students Table Policies
-- ============================================================
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
WHERE tablename = 'students'
ORDER BY cmd, policyname;

-- ============================================================
-- STEP 3: All Applications Table Policies
-- ============================================================
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
WHERE tablename = 'applications'
ORDER BY cmd, policyname;

-- ============================================================
-- STEP 4: All Job Drives Table Policies
-- ============================================================
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
WHERE tablename = 'job_drives'
ORDER BY cmd, policyname;

-- ============================================================
-- STEP 5: Check for Duplicate Policies
-- ============================================================
SELECT 
  tablename,
  policyname,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('students', 'applications', 'job_drives')
GROUP BY tablename, policyname, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- ============================================================
-- STEP 6: Check for Conflicting Policies
-- ============================================================
SELECT 
  p1.tablename,
  p1.cmd,
  p1.policyname as policy1,
  p2.policyname as policy2,
  'Multiple policies on same operation' as warning
FROM pg_policies p1
JOIN pg_policies p2 ON p1.tablename = p2.tablename 
  AND p1.cmd = p2.cmd 
  AND p1.policyname < p2.policyname
WHERE p1.tablename IN ('students', 'applications', 'job_drives')
ORDER BY p1.tablename, p1.cmd;

-- ============================================================
-- STEP 7: Verify Student Record Exists
-- ============================================================
SELECT 
  id,
  user_id,
  name,
  roll_number,
  branch,
  cgpa,
  CASE 
    WHEN user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f' THEN '✓ MATCHES expected user_id'
    ELSE '✗ DOES NOT MATCH expected user_id'
  END as user_id_check
FROM public.students
WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f';

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
FROM public.job_drives
WHERE status = 'ACTIVE'
LIMIT 5;

-- ============================================================
-- STEP 9: Check Existing Applications for This Student
-- ============================================================
SELECT 
  a.id,
  a.student_id,
  a.job_drive_id,
  a.status,
  a.applied_at,
  s.name as student_name,
  s.user_id as student_user_id,
  jd.company_name,
  jd.job_role
FROM public.applications a
LEFT JOIN public.students s ON s.id = a.student_id
LEFT JOIN public.job_drives jd ON jd.id = a.job_drive_id
WHERE a.student_id = '02a78927-b202-410c-bb1f-1ad0b302a726'
ORDER BY a.applied_at DESC;

-- ============================================================
-- STEP 10: Detailed Policy Analysis - Students SELECT
-- ============================================================
SELECT 
  'Students SELECT policies' as category,
  policyname,
  qual as using_expression,
  'This controls what students can SELECT from students table' as purpose
FROM pg_policies
WHERE tablename = 'students' AND cmd = 'SELECT';

-- ============================================================
-- STEP 11: Detailed Policy Analysis - Applications INSERT
-- ============================================================
SELECT 
  'Applications INSERT policies' as category,
  policyname,
  with_check,
  'This controls what students can INSERT into applications table' as purpose
FROM pg_policies
WHERE tablename = 'applications' AND cmd = 'INSERT';

-- ============================================================
-- STEP 12: Test Subquery Logic (READ-ONLY)
-- ============================================================
-- This tests the subquery logic that the INSERT policy uses
-- NOTE: This runs in SQL Editor context (admin), NOT as the authenticated student
-- It verifies the student record exists and can be found by user_id
SELECT 
  'Subquery logic test' as test_name,
  'Testing if student can be found by user_id' as description,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.students WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f'
    ) THEN '✓ Student record exists and can be found'
    ELSE '✗ Student record NOT found'
  END as result,
  (SELECT id FROM public.students WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f' LIMIT 1) as student_id_that_would_be_used,
  'This student_id should be inserted into applications.student_id' as note;

-- ============================================================
-- STEP 13: Check All Tables with RLS Enabled
-- ============================================================
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity as rls_enabled,
  forcerowsecurity as force_rls
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- ============================================================
-- STEP 14: Verify Foreign Key Constraints
-- ============================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('applications', 'students')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================
-- STEP 15: Check Unique Constraints on Applications
-- ============================================================
SELECT
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'applications'
AND constraint_type = 'UNIQUE';

-- ============================================================
-- STEP 16: Check Column Definitions for Applications Table
-- ============================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
ORDER BY ordinal_position;

-- ============================================================
-- STEP 17: Check Column Definitions for Students Table
-- ============================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'students'
ORDER BY ordinal_position;

-- ============================================================
-- STEP 18: Verify the Student ID Being Used
-- ============================================================
-- This confirms which student_id should be inserted
SELECT 
  'Verification' as test_name,
  'The frontend should insert this student_id into applications' as description,
  s.id as correct_student_id,
  s.user_id as auth_user_id,
  'applications.student_id should equal students.id (NOT auth.uid())' as important_note
FROM public.students s
WHERE s.user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f';

-- ============================================================
-- END OF READ-ONLY DIAGNOSTIC SCRIPT
-- ============================================================
