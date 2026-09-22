-- Fix recruiter registration RLS policy
-- This migration ensures recruiters can insert their own records

-- Drop existing recruiter INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Recruiters can insert own record" ON recruiters;
DROP POLICY IF EXISTS "recruiters_insert_own" ON recruiters;
DROP POLICY IF EXISTS "recruiter_insert" ON recruiters;

-- Create the correct INSERT policy for recruiters
-- This allows authenticated users to insert a recruiter record where user_id matches their auth.uid()
CREATE POLICY "Recruiters can insert own record" ON recruiters
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Verify the policy was created
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
WHERE tablename = 'recruiters' 
AND cmd = 'INSERT';
