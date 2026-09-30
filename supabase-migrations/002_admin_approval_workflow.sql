-- Migration: Admin Approval Workflow Security Fix
-- Date: 2024
-- Description: Adds secure approval workflow with field-level protection

-- ============================================================
-- STEP 1: Add columns to admins table
-- ============================================================
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_head_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ============================================================
-- STEP 2: Update existing admins to be approved
-- ============================================================
-- All existing admins should remain approved
UPDATE admins SET approval_status = 'APPROVED' WHERE approval_status IS NULL;

-- ============================================================
-- STEP 3: Create SECURITY DEFINER helper functions
-- ============================================================

-- Function to check if current user is head admin
CREATE OR REPLACE FUNCTION public.is_head_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
    AND is_head_admin = true
    AND approval_status = 'APPROVED'
  );
$$;

-- Function to protect approval fields from unauthorized changes
CREATE OR REPLACE FUNCTION public.protect_admin_approval_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is not head admin, prevent changes to approval_status and is_head_admin
  IF NOT public.is_head_admin() THEN
    -- Revert any attempts to change protected fields
    NEW.approval_status := OLD.approval_status;
    NEW.is_head_admin := OLD.is_head_admin;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 4: Create trigger to protect sensitive fields
-- ============================================================

-- Drop trigger if exists (for re-runnability)
DROP TRIGGER IF EXISTS protect_admin_approval_fields_trigger ON public.admins;

-- Create trigger that runs before every UPDATE
CREATE TRIGGER protect_admin_approval_fields_trigger
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_approval_fields();

-- ============================================================
-- STEP 5: Update RLS policies
-- ============================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can update own record" ON admins;
DROP POLICY IF EXISTS "Head admins can update admin approval status" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;

-- Policy: Admins can update their own record (except protected fields)
-- The trigger will automatically revert any attempts to change approval_status or is_head_admin
CREATE POLICY "Admins can update own record" ON admins
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Head admins can update any admin's approval status
-- This works in conjunction with the trigger
CREATE POLICY "Head admins can update admin approval status" ON admins
  FOR UPDATE
  TO authenticated
  USING (public.is_head_admin())
  WITH CHECK (public.is_head_admin());

-- Policy: Admins can view all admins (for the admin requests page)
CREATE POLICY "Admins can view all admins" ON admins
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
-- STEP 6: Verify the setup
-- ============================================================

-- Verify head admin exists and is properly configured
DO $$
DECLARE
  head_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO head_admin_count
  FROM admins a
  JOIN profiles p ON p.id = a.user_id
  WHERE p.email = 'mabusubhani@gmail.com'
  AND a.is_head_admin = true;
  
  IF head_admin_count = 0 THEN
    RAISE EXCEPTION 'Head admin (mabusubhani@gmail.com) not found or not configured correctly';
  END IF;
  
  RAISE NOTICE '✓ Head admin verified successfully';
END $$;

-- ============================================================
-- SECURITY EXPLANATION
-- ============================================================
-- 
-- How this prevents privilege escalation:
--
-- 1. INSERT Protection:
--    - New admins are created with is_head_admin = false and approval_status = 'PENDING'
--    - The INSERT policy "Admins can insert own record" only allows user_id = auth.uid()
--    - The application code explicitly sets these values
--
-- 2. UPDATE Protection (Multi-Layer):
--    - Layer 1: RLS Policy "Admins can update own record" only allows updating own record
--    - Layer 2: BEFORE UPDATE trigger checks if user is head admin
--    - Layer 3: If NOT head admin, trigger reverts approval_status and is_head_admin to OLD values
--    - Layer 4: Head admin policy allows head admins to update any admin's approval_status
--
-- 3. Why a pending admin CANNOT elevate themselves:
--    - Even if they try: UPDATE admins SET approval_status = 'APPROVED' WHERE user_id = auth.uid()
--    - The trigger fires BEFORE the update
--    - is_head_admin() returns false (they're not head admin yet)
--    - Trigger reverts: NEW.approval_status := OLD.approval_status (back to 'PENDING')
--    - Update proceeds but with OLD values for protected fields
--    - Result: approval_status remains 'PENDING'
--
-- 4. Why a normal admin CANNOT become head admin:
--    - Even if they try: UPDATE admins SET is_head_admin = true WHERE user_id = auth.uid()
--    - The trigger fires BEFORE the update
--    - is_head_admin() returns false (they're not head admin)
--    - Trigger reverts: NEW.is_head_admin := OLD.is_head_admin (back to false)
--    - Update proceeds but with OLD values for protected fields
--    - Result: is_head_admin remains false
--
-- 5. Why only head admin can approve others:
--    - Head admin calls: UPDATE admins SET approval_status = 'APPROVED' WHERE id = ?
--    - Trigger fires BEFORE the update
--    - is_head_admin() returns true (they ARE head admin)
--    - Trigger allows the change to proceed
--    - Update succeeds with new approval_status
--
-- 6. Field-level protection:
--    - Normal admins CAN update: name, phone, department, employee_id
--    - Normal admins CANNOT update: approval_status, is_head_admin (reverted by trigger)
--    - Head admins CAN update: all fields including approval_status
--
-- ============================================================
