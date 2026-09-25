# RLS Diagnostic Analysis - Read-Only Approach

## Current Situation

**Error Message:** "Permission denied. Please check your eligibility and try again."

**Student Data:**
- students.id = `02a78927-b202-410c-bb1f-1ad0b302a726`
- students.user_id = `7a47cee4-41b2-48f1-88a0-c2658c05df1f`
- auth.uid() should be = `7a47cee4-41b2-48f1-88a0-c2658c05df1f`

## Read-Only Diagnostic Script

I've created `diagnose-application-rls-readonly.sql` which performs ONLY read operations:

1. ✓ Checks RLS status on all tables
2. ✓ Lists all policies on students, applications, and job_drives tables
3. ✓ Shows the exact WITH CHECK and USING expressions
4. ✓ Checks for duplicate/conflicting policies
5. ✓ Verifies student record exists
6. ✓ Tests the subquery logic WITHOUT inserting data
7. ✓ Checks foreign key and unique constraints

**This script will NOT modify any data.**

## Code Analysis

### Frontend Flow

**File:** `src/pages/student/StudentDashboard.tsx`

**Lines 280-331:** `handleApply()` function
```typescript
const handleApply = async () => {
  // Line 281-289: Validation checks
  if (!eligibilityResult?.eligible || !selectedDrive || !currentUser) {
    console.error('❌ Cannot apply: Missing required data', {...});
    return;
  }

  // Line 291-295: Check currentStudent exists
  if (!currentStudent) {
    console.error('❌ currentStudent is null - cannot apply');
    showToast('Student profile not loaded...', 'error');
    return;
  }

  // Line 297-303: Log what we're about to do
  console.log('🎯 Applying for job:', {
    studentId: currentStudent.id,        // ← students.id
    studentUserId: currentStudent.userId, // ← auth.uid()
    jobDriveId: selectedDrive.id,
    ...
  });

  // Line 305-330: Try to create application
  try {
    const app = await addApplication({ 
      studentId: currentStudent.id,      // ← students.id
      jobDriveId: selectedDrive.id,       // ← job_drives.id
      status: 'APPLIED' 
    });
    
    if (app) {
      // Success path
      showToast('Application submitted successfully!', 'success');
    } else {
      showToast('Failed to submit application. You may have already applied.', 'error');
    }
  } catch (err: any) {
    // Line 316-330: Error handling
    console.error('❌ Application submission error:', err);
    const errorMessage = err.message || 'Failed to submit application';
    
    // Line 321-329: Specific error messages
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      showToast('You have already applied for this position.', 'error');
    } else if (errorMessage.includes('policy') || errorMessage.includes('permission')) {
      showToast('Permission denied. Please check your eligibility and try again.', 'error');
      // ↑ THIS IS THE ERROR WE'RE SEEING
    } else if (errorMessage.includes('foreign key')) {
      showToast('Invalid student or job drive reference...', 'error');
    } else {
      showToast(`Application failed: ${errorMessage}`, 'error');
    }
  }
};
```

### Backend Flow

**File:** `src/contexts/AppContext.tsx`

**Lines 822-862:** `addApplication()` function
```typescript
const addApplication = async (app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) => {
  // Line 823-827: Log the attempt
  console.log('📝 Attempting to create application:', {
    studentId: app.studentId,      // ← students.id
    jobDriveId: app.jobDriveId,    // ← job_drives.id
    status: app.status             // ← 'APPLIED'
  });

  // Line 829-834: Check for duplicate in local state
  const existing = state.applications.find(
    a => a.studentId === app.studentId && a.jobDriveId === app.jobDriveId
  );
  if (existing) {
    console.log('⚠️ Duplicate application found in local state');
    return null;
  }

  // Line 836-844: THE ACTUAL INSERT
  const { data, error } = await supabase
    .from('applications')
    .insert({
      student_id: app.studentId,      // ← students.id (02a78927-...)
      job_drive_id: app.jobDriveId,   // ← job_drives.id
      status: app.status,             // ← 'APPLIED'
    })
    .select()                          // ← THEN SELECT THE INSERTED ROW
    .single();

  // Line 846-857: Error handling
  if (error) {
    console.error('❌ Application INSERT failed:', error);
    console.error('Error details:', {
      message: error.message,    // ← THE EXACT POSTGRESQL ERROR
      details: error.details,
      hint: error.hint,
      code: error.code           // ← THE POSTGRESQL ERROR CODE
    });
    
    throw new Error(error.message || 'Failed to create application');
  }

  // Line 859-861: Success path
  console.log('✅ Application created successfully:', data);
  await refreshData();
  return data ? mapApplication(data) : null;
};
```

## The Exact INSERT Call

**What the frontend sends:**
```typescript
supabase
  .from('applications')
  .insert({
    student_id: '02a78927-b202-410c-bb1f-1ad0b302a726',  // students.id
    job_drive_id: '<job-drive-uuid>',                      // job_drives.id
    status: 'APPLIED'
  })
  .select()
  .single()
```

**What the RLS policy checks:**
```sql
WITH CHECK (
  student_id IN (
    SELECT id 
    FROM students 
    WHERE user_id = auth.uid()
  )
)
```

## Potential Failure Points

### Failure Point #1: The INSERT itself
The INSERT policy's WITH CHECK clause evaluates the subquery:
```sql
SELECT id FROM students WHERE user_id = auth.uid()
```

**This could fail if:**
- The subquery returns no rows (student record not found)
- The subquery returns multiple rows (shouldn't happen with UNIQUE constraint)
- The subquery cannot execute due to RLS on students table
- auth.uid() returns NULL or wrong value

### Failure Point #2: The SELECT after INSERT
After the INSERT succeeds, the code calls `.select().single()` to retrieve the inserted row.

**This could fail if:**
- The SELECT policy doesn't allow reading the newly inserted row
- The SELECT policy uses a different subquery than the INSERT policy

### Failure Point #3: Eligibility queries before INSERT
Before the INSERT, the frontend might run eligibility checks that query the database.

**Looking at the code:**
- Line 259: `const myAppJobIds = applications.filter(...)` - This uses local state, not a database query
- Line 268-278: `checkEligibility()` - This is a pure JavaScript function, no database queries
- No SELECT queries are executed before the INSERT

**Conclusion:** There are NO eligibility queries executed immediately before the INSERT.

## Most Likely Root Cause

Based on the code analysis, the most likely issue is:

**The INSERT policy's subquery is failing to execute or returning no rows.**

The subquery:
```sql
SELECT id FROM students WHERE user_id = auth.uid()
```

Should return: `02a78927-b202-410c-bb1f-1ad0b302a726`

But it might be:
1. Returning no rows (if auth.uid() doesn't match)
2. Failing to execute (if RLS on students table blocks it)
3. Returning an error (if there's a policy conflict)

## Why the Current Policies Might Be Failing

Looking at the current policies in `supabase-schema.sql`:

**students SELECT policy (lines 183-186):**
```sql
CREATE POLICY "Students can view own record" ON students
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

**applications INSERT policy (lines 269-278):**
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

**The issue:** When the INSERT policy's subquery tries to SELECT from the students table, it needs to pass the students SELECT policy. But there might be a circular dependency or the subquery might not be able to execute in the context of the INSERT policy evaluation.

## What We Need to Find Out

Run the read-only diagnostic script to get:

1. **Exact policy definitions** - Show the WITH CHECK and USING expressions
2. **Duplicate policies** - Check if there are conflicting policies
3. **Student record verification** - Confirm the student exists with correct user_id
4. **Subquery test** - Verify the subquery would work (without actually inserting)

## Next Steps

1. **Run the read-only diagnostic script** (`diagnose-application-rls-readonly.sql`)
2. **Check browser console** for the exact error message and code
3. **Based on the results**, determine if we need to:
   - Fix the policy syntax
   - Remove duplicate policies
   - Change the policy structure (e.g., use a function instead of subquery)
   - Add a SECURITY DEFINER function

## Important Notes

- ✓ The frontend code is correct - it's passing the right values
- ✓ The student_id being sent is students.id (not auth.uid())
- ✓ No eligibility queries are executed before the INSERT
- ✓ The error is coming from the INSERT operation itself
- ✓ We need the exact PostgreSQL error code to determine the fix

---

**Action Required:** Run `diagnose-application-rls-readonly.sql` in Supabase SQL Editor and share the results.
