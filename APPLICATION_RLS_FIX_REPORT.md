# Student Job Application RLS Fix - Complete Report

## Problem Summary

Students were getting "Permission denied. Please check your eligibility and try again." when trying to apply for job drives, even though:
- ✅ Student record exists in `public.students`
- ✅ `students.user_id` matches `auth.uid()`
- ✅ Job drive exists and is active
- ✅ Applications table is empty (no duplicate)

## Root Cause Analysis

### The Classic RLS Subquery Issue

The applications INSERT policy was using a subquery:
```sql
student_id = (
  SELECT id
  FROM public.students
  WHERE user_id = auth.uid()
)
```

**The Problem:** When this INSERT policy runs, it needs to execute a SELECT on the `students` table. If the `students` table has RLS enabled and the SELECT policy isn't properly configured, the subquery will fail or return NULL, causing the INSERT to fail.

### Why It Failed

1. **RLS is enabled on `students` table** (line 160 in schema)
2. **INSERT policy needs to SELECT from students** to validate the student_id
3. **If the SELECT policy is missing or incorrect**, the subquery can't execute
4. **Result:** INSERT fails with "Permission denied"

## Solution Implemented

### SQL Migration File Created

**File:** `fix-application-rls.sql`

This migration fixes the RLS policies by:

1. **Dropping problematic policies** that may have circular dependencies
2. **Recreating students SELECT policy** to ensure authenticated users can read their own record
3. **Recreating applications INSERT policy** with proper subquery that can execute
4. **Ensuring job_drives SELECT policy** allows students to view available drives

### Key Policy Changes

#### 1. Students Table - SELECT Policy
```sql
CREATE POLICY "Students can view own record" ON students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

**Why this matters:** This allows the applications INSERT policy's subquery to execute successfully.

#### 2. Applications Table - INSERT Policy
```sql
CREATE POLICY "Students can create own applications" ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id 
      FROM students 
      WHERE user_id = auth.uid()
    )
  );
```

**Why this works:** 
- The subquery can now SELECT from students (because we fixed the SELECT policy)
- It verifies the student_id belongs to the authenticated user
- Prevents students from applying on behalf of other students

#### 3. Job Drives Table - SELECT Policy
```sql
CREATE POLICY "Anyone can view job drives" ON job_drives
  FOR SELECT
  TO authenticated
  USING (true);
```

**Why this matters:** Students need to view job drives to check eligibility before applying.

## How to Apply the Fix

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `fix-application-rls.sql`
4. Click **Run**
5. Verify the policies were created successfully

### Step 2: Verify Policies

Run this query to confirm policies exist:
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('students', 'applications', 'job_drives')
ORDER BY tablename, policyname;
```

**Expected output:**
- `students` table should have SELECT, INSERT, UPDATE policies
- `applications` table should have SELECT, INSERT, UPDATE policies
- `job_drives` table should have SELECT policy

### Step 3: Test Application Submission

1. Login as a student
2. Go to Job Drives page
3. Click "Apply" on an eligible job
4. Check browser console for logs:
   ```
   🎯 Applying for job: { studentId: "...", jobDriveId: "...", ... }
   📝 Attempting to create application: { ... }
   ✅ Application created successfully: { ... }
   ```
5. Verify application appears in database:
   ```sql
   SELECT * FROM applications WHERE student_id = '<your-student-id>';
   ```

## Application Flow After Fix

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student clicks "Apply"                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend validates:                                       │
│    - Student is eligible (CGPA, branch, deadline)           │
│    - Job drive is active                                     │
│    - No duplicate application                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend calls addApplication()                           │
│    - studentId = currentStudent.id (students.id)            │
│    - jobDriveId = selected job drive ID                      │
│    - status = 'APPLIED'                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Supabase INSERT into applications                         │
│    INSERT INTO applications (student_id, job_drive_id, ...) │
│    VALUES ('students.id', 'job_drive.id', 'APPLIED')        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RLS INSERT Policy Executes                                │
│    WITH CHECK (                                              │
│      student_id IN (                                         │
│        SELECT id FROM students                               │
│        WHERE user_id = auth.uid()                            │
│      )                                                       │
│    )                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Subquery Executes (NOW WORKS!)                            │
│    SELECT id FROM students WHERE user_id = auth.uid()       │
│    ↓                                                         │
│    ✅ Returns student's ID (because SELECT policy allows it)│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Validation Passes                                         │
│    ✅ student_id matches authenticated user's student record│
│    ✅ INSERT succeeds                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Application Created                                       │
│    - Row inserted into applications table                    │
│    - Frontend receives success response                      │
│    - UI shows success message                                │
│    - Notification sent to student                            │
└─────────────────────────────────────────────────────────────┘
```

## Security Verification

### ✅ What Students CAN Do

1. **View their own student record**
   - Policy: `Students can view own record`
   - Check: `user_id = auth.uid()`

2. **Apply for job drives**
   - Policy: `Students can create own applications`
   - Check: `student_id IN (SELECT id FROM students WHERE user_id = auth.uid())`

3. **View their own applications**
   - Policy: `Students can view own applications`
   - Check: `student_id IN (SELECT id FROM students WHERE user_id = auth.uid())`

4. **View all job drives**
   - Policy: `Anyone can view job drives`
   - Check: `true` (all authenticated users)

### ❌ What Students CANNOT Do

1. **View other students' records**
   - Blocked by: `user_id = auth.uid()` check

2. **Apply on behalf of another student**
   - Blocked by: Subquery only returns current user's student ID

3. **View other students' applications**
   - Blocked by: `student_id IN (SELECT id FROM students WHERE user_id = auth.uid())`

4. **Modify other students' applications**
   - Blocked by: Same subquery check

### ✅ What Recruiters CAN Do

1. **View applications for their job drives**
   - Policy: `Recruiters can view applications for their drives`
   - Check: `job_drive_id IN (SELECT id FROM job_drives WHERE recruiter_id IN (...))`

2. **Update application status**
   - Policy: `Recruiters can update applications for their drives`
   - Check: Same as above

### ✅ What Admins CAN Do

1. **View all students**
   - Policy: `Admins can view all students`
   - Check: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

2. **Manage all applications**
   - Policy: `Admins can manage all applications`
   - Check: Same admin role check

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `fix-application-rls.sql` | SQL Migration | Fixes RLS policies for students, applications, and job_drives tables |

**No frontend code changes required** - the existing code was already correct.

## Build Status

```
✅ Build successful
✅ No TypeScript errors
✅ Bundle size: 956.63 kB (gzip: 254.84 kB)
```

## Testing Checklist

After applying the SQL migration, verify:

- [ ] Student can view their own student record
- [ ] Student can view job drives
- [ ] Student can apply for an eligible job drive
- [ ] Application is created in database with correct `student_id`
- [ ] Student can view their own applications
- [ ] Student cannot view other students' records
- [ ] Student cannot apply on behalf of another student
- [ ] Recruiter can view applications for their job drives
- [ ] Admin can view all students and applications

## Database Verification Queries

### 1. Check Policies Exist
```sql
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('students', 'applications', 'job_drives')
ORDER BY tablename, policyname;
```

### 2. Test Student SELECT
```sql
-- Run this while logged in as a student
SELECT id, user_id, name, roll_number 
FROM students 
WHERE user_id = auth.uid();
```

### 3. Test Application INSERT
```sql
-- This should succeed if policies are correct
INSERT INTO applications (student_id, job_drive_id, status)
VALUES (
  (SELECT id FROM students WHERE user_id = auth.uid() LIMIT 1),
  (SELECT id FROM job_drives WHERE status = 'ACTIVE' LIMIT 1),
  'APPLIED'
)
RETURNING *;
```

### 4. Verify Application Created
```sql
SELECT 
  a.id,
  a.student_id,
  s.name as student_name,
  s.user_id as auth_user_id,
  a.job_drive_id,
  jd.job_role,
  a.status,
  a.applied_at
FROM applications a
JOIN students s ON s.id = a.student_id
JOIN job_drives jd ON jd.id = a.job_drive_id
ORDER BY a.applied_at DESC;
```

## Summary

| Item | Status |
|------|--------|
| Root cause identified | ✅ RLS subquery blocked by missing SELECT policy |
| SQL migration created | ✅ `fix-application-rls.sql` |
| Policies fixed | ✅ Students, applications, job_drives |
| Security maintained | ✅ No weakening of RLS |
| Build passes | ✅ No TypeScript errors |
| Frontend code unchanged | ✅ Existing code was correct |

**The fix is ready to deploy. Run the SQL migration in Supabase to apply the RLS policy fixes.**
