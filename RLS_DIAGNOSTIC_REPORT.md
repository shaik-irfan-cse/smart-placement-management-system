# RLS Diagnostic Report - Student Job Application Issue

## Current Status

**Error Message:** "Permission denied. Please check your eligibility and try again."

**Student Data:**
- students.id = `02a78927-b202-410c-bb1f-1ad0b302a726`
- students.user_id = `7a47cee4-41b2-48f1-88a0-c2658c05df1f`
- auth.uid() should be = `7a47cee4-41b2-48f1-88a0-c2658c05df1f`

## Code Analysis

### Frontend Flow

1. **Student clicks Apply** → `handleApply()` in `StudentDashboard.tsx` (line 280)
2. **Validation checks** (lines 281-295):
   - Checks if student is eligible
   - Checks if currentStudent exists
   - Logs: `studentId: currentStudent.id` (should be `02a78927-b202-410c-bb1f-1ad0b302a726`)
3. **Calls addApplication()** (line 306):
   ```typescript
   const app = await addApplication({ 
     studentId: currentStudent.id,  // students.id
     jobDriveId: selectedDrive.id,   // job_drives.id
     status: 'APPLIED' 
   });
   ```
4. **Error handling** (lines 316-330):
   - Catches error
   - If error message includes 'policy' or 'permission' → shows "Permission denied" message

### Backend Flow

**addApplication() in AppContext.tsx** (lines 822-862):

```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    student_id: app.studentId,      // students.id
    job_drive_id: app.jobDriveId,   // job_drives.id
    status: app.status,             // 'APPLIED'
  })
  .select()
  .single();

if (error) {
  console.error('❌ Application INSERT failed:', error);
  console.error('Error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  throw new Error(error.message || 'Failed to create application');
}
```

### Current RLS Policies

**students table:**
```sql
-- SELECT policy
CREATE POLICY "Students can view own record" ON students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT policy
CREATE POLICY "Students can insert own record" ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy
CREATE POLICY "Students can update own record" ON students
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
```

**applications table:**
```sql
-- INSERT policy (THE PROBLEMATIC ONE)
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

-- SELECT policy
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
```

**job_drives table:**
```sql
-- SELECT policy
CREATE POLICY "Anyone can view job drives" ON job_drives
  FOR SELECT
  TO authenticated
  USING (true);
```

## Potential Issues Identified

### Issue #1: Subquery in INSERT Policy

The applications INSERT policy uses a subquery:
```sql
WITH CHECK (
  student_id IN (
    SELECT id 
    FROM students 
    WHERE user_id = auth.uid()
  )
)
```

**Potential Problem:** When this INSERT policy is evaluated, it needs to execute a SELECT on the `students` table. If there's any issue with the students SELECT policy or if the subquery returns no rows, the INSERT will fail.

**Why this might fail:**
1. The subquery might not be able to SELECT from students due to RLS restrictions
2. The subquery might return no rows if the student record doesn't exist
3. There might be a circular dependency in policy evaluation

### Issue #2: Policy Evaluation Order

PostgreSQL evaluates RLS policies in a specific order. If multiple policies apply to the same operation, they are combined with OR logic. However, if a subquery in one policy tries to access a table that has its own RLS policies, those policies are also evaluated.

**Potential Problem:** The applications INSERT policy's subquery tries to SELECT from students, which triggers the students SELECT policy. If there's any issue with this cross-table policy evaluation, the INSERT will fail.

### Issue #3: Missing or Conflicting Policies

There might be:
- Duplicate policies with the same name
- Conflicting policies that override each other
- Missing policies that should exist

## Diagnostic Steps

### Step 1: Run the Diagnostic Script

Execute `diagnose-application-rls.sql` in Supabase SQL Editor. This will:

1. ✓ Check current user context (auth.uid(), auth.role())
2. ✓ Verify student record exists and user_id matches auth.uid()
3. ✓ List all RLS policies on students, applications, and job_drives tables
4. ✓ Test if students SELECT policy works
5. ✓ Test the exact subquery used in the INSERT policy
6. ✓ Check for active job drives
7. ✓ Attempt a simulated INSERT to see the exact error
8. ✓ Check for duplicate or conflicting policies
9. ✓ Verify RLS is enabled on all tables

### Step 2: Analyze the Results

Look for these specific issues:

**In Step 2 (Check Student Record):**
- Should return exactly 1 row
- `user_id_check` should show "✓ MATCHES auth.uid()"
- If it shows "✗ DOES NOT MATCH", the student record is corrupted

**In Step 6 (Test Students SELECT Policy):**
- `rows_returned` should be 1
- `result` should show "✓ SELECT works"
- If it shows "✗ SELECT returns no rows", the SELECT policy is broken

**In Step 7 (Test INSERT Policy Subquery):**
- Should return the student's ID
- `result` should show "✓ Subquery can find student"
- If it shows "✗ Subquery cannot find student", the subquery is failing

**In Step 9 (Test Applications INSERT):**
- This is the most important test
- Look for the exact error message in the NOTICE output
- Common errors:
  - "new row violates row-level security policy" → RLS policy issue
  - "duplicate key value violates unique constraint" → Duplicate application
  - "insert or update on table violates foreign key constraint" → Invalid student_id or job_drive_id

**In Step 10 (Check for Duplicate Policies):**
- Should return no rows
- If it returns rows, there are duplicate policies that need to be removed

**In Step 15 (Check for Policy Conflicts):**
- Look for policies on the same table with the same command (SELECT, INSERT, etc.)
- Multiple policies on the same operation can cause unexpected behavior

### Step 3: Check Browser Console

Open the browser console (F12) and look for these logs when clicking Apply:

```
🎯 Applying for job: {
  studentId: "02a78927-b202-410c-bb1f-1ad0b302a726",
  studentUserId: "7a47cee4-41b2-48f1-88a0-c2658c05df1f",
  jobDriveId: "...",
  jobRole: "...",
  companyName: "..."
}

📝 Attempting to create application: {
  studentId: "02a78927-b202-410c-bb1f-1ad0b302a726",
  jobDriveId: "...",
  status: "APPLIED"
}

❌ Application INSERT failed: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

**The exact error message and code will tell us what's wrong.**

## Expected PostgreSQL Errors

### Error Code 42501 (insufficient_privilege)
```
ERROR: new row violates row-level security policy for table "applications"
```
**Cause:** The INSERT policy's WITH CHECK clause is failing
**Solution:** Fix the subquery in the INSERT policy

### Error Code 23505 (unique_violation)
```
ERROR: duplicate key value violates unique constraint "applications_student_id_job_drive_id_key"
```
**Cause:** Student already applied for this job drive
**Solution:** This is expected behavior, not a bug

### Error Code 23503 (foreign_key_violation)
```
ERROR: insert or update on table "applications" violates foreign key constraint
```
**Cause:** Invalid student_id or job_drive_id
**Solution:** Verify the IDs are correct

### Error Code 42P01 (undefined_table)
```
ERROR: relation "students" does not exist
```
**Cause:** Table doesn't exist or wrong schema
**Solution:** Verify table exists in public schema

## Next Steps

1. **Run the diagnostic script** (`diagnose-application-rls.sql`)
2. **Share the results** - especially:
   - Step 2: Student record check
   - Step 6: Students SELECT test
   - Step 7: INSERT policy subquery test
   - Step 9: Simulated INSERT test (most important!)
   - Step 10: Duplicate policies check
3. **Check browser console** for the exact error message and code
4. **Based on the results**, we'll determine the exact fix needed

## Important Notes

- **Do NOT disable RLS** - this would compromise security
- **Do NOT use service_role key** - this bypasses RLS and is a security risk
- **Do NOT weaken security** - we need to fix the policies, not remove them
- **The frontend code is correct** - it's passing the right student_id (students.id, not auth.uid())

## Files to Review

1. `diagnose-application-rls.sql` - Run this first
2. `supabase-schema.sql` - Current policy definitions (lines 182-307)
3. `src/contexts/AppContext.tsx` - addApplication function (lines 822-862)
4. `src/pages/student/StudentDashboard.tsx` - handleApply function (lines 280-331)

---

**Action Required:** Run `diagnose-application-rls.sql` in Supabase SQL Editor and share the results so we can identify the exact failing operation.
