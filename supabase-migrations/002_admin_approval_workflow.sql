-- Migration: Add Head Admin Approval Workflow
-- Date: 2024
-- Description: Adds approval workflow for new admin registrations

-- Add columns to admins table if they don't exist
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_head_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Update existing admins to be approved (except the head admin)
-- The head admin (mabusubhani@gmail.com) should already have is_head_admin = true
UPDATE admins SET approval_status = 'APPROVED' WHERE approval_status IS NULL;

-- Add RLS policies for admin approval workflow
-- Only head admins can update approval status
DROP POLICY IF EXISTS "Head admins can update admin approval status" ON admins;
CREATE POLICY "Head admins can update admin approval status" ON admins
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.user_id = auth.uid()
      AND a.is_head_admin = true
    )
  );

-- All admins can view other admins (for the admin requests page)
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
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

-- Notifications for admin approval (already exists, but ensuring it's there)
-- Notifications are handled by the existing notification system
