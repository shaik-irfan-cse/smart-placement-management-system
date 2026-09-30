-- Migration: Admin Approval Workflow Security Fix (CORRECTED)
-- Date: 2024
-- Description: Adds secure approval workflow with field-level protection
--              and correct head admin identification via auth.users join

BEGIN;

-- ============================================================
-- STEP 1: Add columns to admins table
-- ============================================================
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_head_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'PENDING' 
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ============================================================
-- STEP 2: Update existing admins
-- ============================================================
-- All existing admins should remain approved
UPDATE public.admins 
SET approval_status = 'APPROVED' 
WHERE approval_status = 'PENDING';

-- Identify the head admin by joining through auth.users
-- This is the ONLY way to identify users by email since admins table has no email column
UPDATE public.admins
SET is_head_admin = true, approval_status = 'APPROVED'
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE lower(email) = lower('mabusubhani@gmail.com')
);

-- Verify head admin was configured correctly
DO $$
DECLARE
    head_admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO head_admin_count
    FROM public.admins a
    JOIN auth.users u ON u.id = a.user_id
    WHERE lower(u.email) = lower('mabusubhani@gmail.com')
    AND a.is_head_admin = true
    AND a.approval_status = 'APPROVED';
    
    IF head_admin_count = 0 THEN
        RAISE EXCEPTION 'Head admin (mabusubhani@gmail.com) not found or not configured correctly. Check auth.users table.';
    END IF;
    
    RAISE NOTICE '✓ Head admin verified successfully via auth.users join';
END $$;

-- ============================================================
-- STEP 3: Create SECURITY DEFINER helper functions
-- ============================================================

-- Function to check if current user is head admin
-- Uses SECURITY DEFINER to bypass RLS when checking
-- Uses fixed search_path to prevent schema hijacking
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

-- Function to check if current user is any approved admin
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
        AND approval_status = 'APPROVED'
    );
$$;

-- ============================================================
-- STEP 4: Create trigger function to protect sensitive fields
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_admin_approval_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If user is not head admin, prevent changes to approval_status and is_head_admin
    -- by reverting them to their OLD values
    IF NOT public.is_head_admin() THEN
        NEW.approval_status := OLD.approval_status;
        NEW.is_head_admin := OLD.is_head_admin;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 5: Attach trigger to admins table
-- ============================================================

DROP TRIGGER IF EXISTS protect_admin_approval_fields_trigger ON public.admins;

CREATE TRIGGER protect_admin_approval_fields_trigger
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_admin_approval_fields();

-- ============================================================
-- STEP 6: Update RLS policies
-- ============================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can insert own record" ON public.admins;
DROP POLICY IF EXISTS "Admins can update own record" ON public.admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can view own record" ON public.admins;
DROP POLICY IF EXISTS "Head admins can update admin approval status" ON public.admins;
DROP POLICY IF EXISTS "Head admins can view all admins" ON public.admins;

-- Policy: Allow self-insertion with enforced defaults
-- New admins MUST be inserted with is_head_admin=false and approval_status='PENDING'
CREATE POLICY "Admins can insert own record" ON public.admins
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        AND is_head_admin = false 
        AND approval_status = 'PENDING'
    );

-- Policy: Allow self-update for profile fields
-- Protected fields (approval_status, is_head_admin) are safeguarded by the BEFORE UPDATE trigger
-- which reverts them to OLD values if the user is not a head admin
CREATE POLICY "Admins can update own record" ON public.admins
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Head admins can update any admin's approval status and is_head_admin
-- This works in conjunction with the trigger - head admin bypasses the revert logic
CREATE POLICY "Head admins can update admin approval status" ON public.admins
    FOR UPDATE TO authenticated
    USING (public.is_head_admin())
    WITH CHECK (public.is_head_admin());

-- Policy: Head admins can view ALL admin records (for approval workflow)
-- This replaces the old "Admins can view all admins" which used USING (true) or is_admin()
-- Only head admins get unrestricted view access
CREATE POLICY "Head admins can view all admins" ON public.admins
    FOR SELECT TO authenticated
    USING (public.is_head_admin());

-- Policy: Approved admins can view their own record
-- Pending/rejected admins can also view their own record (to see their status)
CREATE POLICY "Admins can view own record" ON public.admins
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- ============================================================
-- STEP 7: Verification queries
-- ============================================================

-- Verify head admin exists and is properly configured
DO $$
DECLARE
    head_admin_record RECORD;
BEGIN
    SELECT a.id, a.name, a.is_head_admin, a.approval_status, u.email
    INTO head_admin_record
    FROM public.admins a
    JOIN auth.users u ON u.id = a.user_id
    WHERE lower(u.email) = lower('mabusubhani@gmail.com');
    
    IF head_admin_record IS NULL THEN
        RAISE EXCEPTION 'Head admin record not found';
    END IF;
    
    IF NOT head_admin_record.is_head_admin THEN
        RAISE EXCEPTION 'Head admin flag not set';
    END IF;
    
    IF head_admin_record.approval_status != 'APPROVED' THEN
        RAISE EXCEPTION 'Head admin not approved';
    END IF;
    
    RAISE NOTICE '✓ Head admin verified: % (%)', head_admin_record.name, head_admin_record.email;
END $$;

-- Verify trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'protect_admin_approval_fields_trigger'
    ) THEN
        RAISE EXCEPTION 'Trigger not created';
    END IF;
    RAISE NOTICE '✓ Trigger verified: protect_admin_approval_fields_trigger';
END $$;

-- Verify functions exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'is_head_admin'
    ) THEN
        RAISE EXCEPTION 'is_head_admin function not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'protect_admin_approval_fields'
    ) THEN
        RAISE EXCEPTION 'protect_admin_approval_fields function not created';
    END IF;
    
    RAISE NOTICE '✓ Helper functions verified';
END $$;

COMMIT;

-- ============================================================
-- SECURITY ARCHITECTURE EXPLANATION
-- ============================================================
--
-- HEAD ADMIN IDENTIFICATION:
-- -------------------------
-- The admins table does NOT have an email column. To identify the head admin
-- by email, we join through auth.users:
--
--   UPDATE public.admins
--   SET is_head_admin = true
--   WHERE user_id IN (
--       SELECT id FROM auth.users 
--       WHERE lower(email) = lower('mabusubhani@gmail.com')
--   );
--
-- The is_head_admin() SECURITY DEFINER function then checks:
--   SELECT EXISTS (
--       SELECT 1 FROM public.admins
--       WHERE user_id = auth.uid()
--       AND is_head_admin = true
--       AND approval_status = 'APPROVED'
--   );
--
-- This means only the user whose auth.uid() matches the admins.user_id
-- row with is_head_admin=true can be identified as head admin.
--
-- PRIVILEGE ESCALATION PREVENTION:
-- --------------------------------
-- Attack: Pending admin tries to approve themselves
--   UPDATE admins SET approval_status = 'APPROVED' WHERE user_id = auth.uid()
--
-- Defense:
--   1. BEFORE UPDATE trigger fires
--   2. Trigger calls is_head_admin() → returns false (not head admin)
--   3. Trigger executes: NEW.approval_status := OLD.approval_status
--   4. approval_status is reverted to 'PENDING'
--   5. UPDATE completes with OLD value
--   6. Result: approval_status remains 'PENDING' ❌ Attack failed
--
-- Attack: Normal admin tries to become head admin
--   UPDATE admins SET is_head_admin = true WHERE user_id = auth.uid()
--
-- Defense:
--   1. BEFORE UPDATE trigger fires
--   2. Trigger calls is_head_admin() → returns false
--   3. Trigger executes: NEW.is_head_admin := OLD.is_head_admin
--   4. is_head_admin is reverted to false
--   5. Result: is_head_admin remains false ❌ Attack failed
--
-- VIEW ACCESS CONTROL:
-- --------------------
-- Old policy "Admins can view all admins" used USING (true) or is_admin()
-- which allowed ALL authenticated admins (including pending) to see all records.
--
-- New policies:
--   - "Head admins can view all admins" → USING (is_head_admin())
--     Only head admins can see all admin records
--   - "Admins can view own record" → USING (user_id = auth.uid())
--     All admins can see their own record
--
-- Result:
--   - Head admin sees all admins (for approval workflow)
--   - Normal approved admin sees only their own record
--   - Pending admin sees only their own record
--   - Rejected admin sees only their own record
--
-- FIELD-LEVEL ACCESS:
-- -------------------
-- Normal admins CAN update: name, phone, department, employee_id
-- Normal admins CANNOT update: approval_status, is_head_admin (reverted by trigger)
-- Head admins CAN update: all fields including approval_status
--
-- ============================================================
