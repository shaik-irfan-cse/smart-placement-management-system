# RLS Diagnostic - Read-Only Script & Source Code Analysis

## Summary

I've created a **completely read-only diagnostic script** that uses only SELECT statements and correct column names. I've also traced the source code to confirm the frontend is using the correct values.

---

## Source Code Trace Result

### ✅ The Frontend Code is CORRECT

**Finding:** The frontend uses `students.id` (NOT `auth.uid()`) for `applications.student_id`

**Complete Flow:**

1. **User logs in** → `currentUser.id = auth.uid()` (e.g., `'7a47cee4-41b2-48f1-88a0-c2658c05df1f'`)

2. **Find currentStudent** (AppContext.tsx, line 293):
   ```typescript
   const currentStudent = currentUser?.role === 'student' 
     ? state.students.find(s => s.userId === currentUser.id) || null 
     : null;
   ```
   - Finds student where `students.user_id = auth.uid()`
   - Returns: `{ id: '02a78927-...', userId: '7a47cee4-...', name: 'Raghav', ... }`

3. **User clicks Apply** (StudentDashboard.tsx, line 306):
   ```typescript
   const app = await addApplication({ 
     studentId: currentStudent.id,      // ← students.id
     jobDriveId: selectedDrive.id, 
     status: 'APPLIED' 
   });
   ```

4. **INSERT call** (AppContext.tsx, lines 836-844):
   ```typescript
   const { data, error } = await supabase
     .from('applications')
     .insert({
       student_id: app.studentId,      // ← students.id = '02a78927-...'
       job_drive_id: app.jobDriveId,   // ← job_drives.id
       status: app.status,             // ← 'APPLIED'
     })
     .select()
     .single();
   ```

**Conclusion:** The code correctly uses `students.id` for `applications.student_id`, NOT `auth.uid()`.

---

## Read-Only Diagnostic Script

**File:** `diagnose-application-rls-readonly.sql`

### What It Does

✓ Contains ONLY SELECT statements  
✓ Uses correct column names (`name`, `job_role`, etc.)  
✓ No CREATE, INSERT, UPDATE, DELETE, ALTER, DROP  
✓ No DO blocks or temporary tables  
✓ No policy changes  

### What It Checks

1. **RLS status** on all tables
2. **All policies** on students, applications, job_drives tables
3. **Duplicate/conflicting policies**
4. **Student record** exists with correct user_id
5. **Active job drives** available
6. **Existing applications** for the student
7. **Subquery logic** that the INSERT policy uses
8. **Foreign key constraints**
9. **Unique constraints**
10. **Column definitions** for all tables

### Key Diagnostic Steps

**Step 7:** Verify student record exists
```sql
SELECT id, user_id, name, roll_number, branch, cgpa
FROM public.students
WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f';
```

**Step 11:** Show the exact INSERT policy
```sql
SELECT policyname, with_check
FROM pg_policies
WHERE tablename = 'applications' AND cmd = 'INSERT';
```

**Step 12:** Test the subquery logic (READ-ONLY)
```sql
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.students 
      WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f'
    ) THEN '✓ Student record exists and can be found'
    ELSE '✗ Student record NOT found'
  END as result,
  (SELECT id FROM public.students 
   WHERE user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f' LIMIT 1) as student_id_that_would_be_used;
```

**Step 18:** Verify the correct student_id
```sql
SELECT 
  s.id as correct_student_id,
  s.user_id as auth_user_id,
  'applications.student_id should equal students.id (NOT auth.uid())' as important_note
FROM public.students s
WHERE s.user_id = '7a47cee4-41b2-48f1-88a0-c2658c05df1f';
```

---

## How to Run the Diagnostic

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `diagnose-application-rls-readonly.sql`
3. Click "Run"
4. Review the results, especially:
   - **Step 2-4:** All policies on each table
   - **Step 7:** Student record verification
   - **Step 11:** The exact INSERT policy definition
   - **Step 12:** Subquery logic test
   - **Step 18:** Correct student_id verification

---

## Expected Results

### If Everything is Correct

**Step 7:** Should return 1 row with the student record
```
id: 02a78927-b202-410c-bb1f-1ad0b302a726
user_id: 7a47cee4-41b2-48f1-88a0-c2658c05df1f
name: Raghav
...
```

**Step 11:** Should show the INSERT policy
```
policyname: "Students can create own applications"
with_check: student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
```

**Step 12:** Should show
```
result: ✓ Student record exists and can be found
student_id_that_would_be_used: 02a78927-b202-410c-bb1f-1ad0b302a726
```

**Step 18:** Should show
```
correct_student_id: 02a78927-b202-410c-bb1f-1ad0b302a726
auth_user_id: 7a47cee4-41b2-48f1-88a0-c2658c05df1f
```

### If There's a Problem

**Possible issues to look for:**

1. **Step 7 returns no rows** → Student record doesn't exist or user_id doesn't match
2. **Step 11 shows wrong policy** → INSERT policy is incorrect
3. **Step 12 shows "✗ Student record NOT found"** → Subquery can't find the student
4. **Step 5 shows duplicates** → Multiple conflicting policies exist
5. **Step 14 shows missing foreign keys** → Database constraints are broken

---

## Files Created

1. **`diagnose-application-rls-readonly.sql`** - Read-only diagnostic script
2. **`SOURCE_CODE_TRACE.md`** - Complete source code trace showing the data flow
3. **`RLS_DIAGNOSTIC_SUMMARY.md`** - This summary document

---

## Next Steps

1. **Run the diagnostic script** in Supabase SQL Editor
2. **Share the results** - especially Steps 7, 11, 12, and 18
3. **Based on the results**, we can identify the exact issue:
   - If student record exists but INSERT still fails → RLS policy issue
   - If student record doesn't exist → Registration issue
   - If policy is wrong → Need to fix the policy
   - If subquery fails → Need to fix the policy structure

---

## Important Notes

- ✓ The frontend code is correct (uses `students.id`, not `auth.uid()`)
- ✓ The diagnostic script is completely read-only
- ✓ No database modifications will be made
- ✓ The script uses correct column names
- ✓ Step 12 is useful for testing the subquery logic

**The issue is likely with the RLS policy itself, not the frontend code.**
