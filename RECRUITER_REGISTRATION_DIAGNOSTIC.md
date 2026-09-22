# Recruiter Registration Diagnostic Report

## Issue Summary
Recruiter registration creates auth user successfully but fails to insert into `public.recruiters` table.

**Test Account:** snowflake11@gmail.com
- ✅ Auth user exists
- ✅ raw_user_meta_data contains recruiter information
- ❌ public.recruiters has NO row for this user

## Root Cause Analysis

### What's Working
1. ✅ `supabase.auth.signUp()` creates auth user
2. ✅ User metadata is stored in `raw_user_meta_data`
3. ✅ Profile record is created in `profiles` table
4. ✅ RLS INSERT policy exists: `user_id = auth.uid()`

### What's Failing
❌ INSERT into `recruiters` table is being blocked

### Possible Causes

1. **RLS Policy Not Applied**
   - The policy exists in schema file but may not be applied in production
   - Need to verify with: `SELECT * FROM pg_policies WHERE tablename = 'recruiters';`

2. **Session Timing Issue**
   - Session may not be fully established before INSERT
   - Added explicit session verification before INSERT

3. **Foreign Key Constraint**
   - `user_id` references `profiles(id)`
   - If profile doesn't exist, INSERT will fail
   - But profile creation happens before recruiter INSERT

4. **Column Mismatch**
   - Schema shows `email` column exists
   - Previous fix removed email from INSERT
   - Added email back to match schema

## Code Changes Made

### File: `src/contexts/AppContext.tsx`

#### Change 1: Added email field back to INSERT (Line 568)
```typescript
const recruiterInsertData = {
  user_id: userId,
  company_name: data.companyName,
  recruiter_name: data.recruiterName,
  email: email,  // ✅ Added back - schema shows this column exists
  phone: data.phone,
  address: data.address || '',
  website: data.website || '',
  description: data.description || '',
  approval_status: 'PENDING',
};
```

#### Change 2: Added session verification before INSERT (Lines 564-570)
```typescript
// Verify session is still active before insert
console.log('🔐 Verifying session before recruiter INSERT...');
const { data: sessionCheck, error: sessionCheckError } = await supabase.auth.getSession();
if (sessionCheckError || !sessionCheck.session) {
  console.error('❌ Session not active before recruiter INSERT:', sessionCheckError);
  return { success: false, message: 'Session expired. Please try registering again.' };
}
console.log('✅ Session verified, current user ID:', sessionCheck.session.user.id);
```

#### Change 3: Enhanced error logging (Lines 583-605)
```typescript
if (recruiterError) {
  console.error('❌ Recruiter creation FAILED:', recruiterError);
  console.error('Full error object:', JSON.stringify(recruiterError, null, 2));
  console.error('Error details:', {
    message: recruiterError.message,
    details: recruiterError.details,
    hint: recruiterError.hint,
    code: recruiterError.code,
    name: recruiterError.name
  });
  
  let errorMessage = 'Failed to create recruiter record: ' + recruiterError.message;
  if (recruiterError.code === '42501' || recruiterError.message.includes('policy') || recruiterError.message.includes('RLS')) {
    errorMessage = 'Permission denied. RLS policy blocked the insert. Error: ' + recruiterError.message;
  } else if (recruiterError.code === '23505') {
    errorMessage = 'A recruiter record already exists for this account.';
  } else if (recruiterError.code === '23503') {
    errorMessage = 'Foreign key constraint violation. The user_id does not exist in profiles table.';
  } else if (recruiterError.code === '23502') {
    errorMessage = 'Missing required field. Error: ' + recruiterError.message;
  }
  
  return { success: false, message: errorMessage };
}
```

#### Change 4: Added verification query after INSERT (Lines 609-622)
```typescript
// Verify the record was actually created by querying it back
console.log('🔍 Verifying recruiter record exists in database...');
const { data: verifyData, error: verifyError } = await supabase
  .from('recruiters')
  .select('id, user_id, company_name')
  .eq('user_id', userId)
  .single();

if (verifyError || !verifyData) {
  console.error('❌ VERIFICATION FAILED: Recruiter record not found after insert');
  console.error('Verification error:', verifyError);
  console.error('This suggests the INSERT succeeded but RLS is blocking the SELECT');
} else {
  console.log('✅ Verification successful:', verifyData);
}
```

## Database Schema Verification

### Expected Schema (from supabase-schema.sql)
```sql
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  recruiter_name TEXT,
  email TEXT,                    -- ✅ This column exists
  phone TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  approval_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Expected RLS Policies
```sql
-- INSERT policy (must exist)
CREATE POLICY "Recruiters can insert own record" ON recruiters
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- SELECT policy (must exist)
CREATE POLICY "Recruiters can view own record" ON recruiters
  FOR SELECT 
  USING (user_id = auth.uid());
```

## Diagnostic SQL Queries

Run these in Supabase SQL Editor to diagnose the issue:

### 1. Check if RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'recruiters';
```
**Expected:** `rowsecurity = true`

### 2. Check existing RLS policies
```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'recruiters';
```
**Expected:** Should see INSERT policy with `with_check = (user_id = auth.uid())`

### 3. Check if test user exists
```sql
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data,
  p.id as profile_id,
  p.role,
  r.id as recruiter_id,
  r.company_name
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN recruiters r ON r.user_id = au.id
WHERE au.email = 'snowflake11@gmail.com';
```

### 4. Test INSERT manually
```sql
-- This simulates what the code is trying to do
-- Replace with actual UUID from auth.users
INSERT INTO recruiters (
  user_id,
  company_name,
  recruiter_name,
  email,
  phone,
  address,
  website,
  description,
  approval_status
) VALUES (
  'YOUR-AUTH-UUID-HERE',  -- Replace with actual UUID
  'Test Company',
  'Test Recruiter',
  'test@example.com',
  '1234567890',
  'Test Address',
  'https://test.com',
  'Test description',
  'PENDING'
)
RETURNING *;
```

### 5. Check current user context
```sql
-- Run this while logged in as the recruiter
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  current_setting('request.jwt.claims', true)::json->>'sub' as jwt_user_id;
```

## Build Status
✅ Build successful
✅ No TypeScript errors
✅ Bundle size: 955.30 kB (gzip: 254.44 kB)

## Next Steps for Production Debugging

1. **Deploy this code to production**
   - Push to GitHub
   - Vercel will auto-deploy

2. **Test registration again**
   - Register a new recruiter account
   - Open browser console (F12)
   - Look for these logs:
     ```
     💼 Creating recruiter record for user: xxx-xxx-xxx
     🔐 Verifying session before recruiter INSERT...
     ✅ Session verified, current user ID: xxx-xxx-xxx
     📋 Recruiter data to insert: { ... }
     🔍 Attempting INSERT with user_id: xxx-xxx-xxx
     📊 INSERT response: { ... }
     ```

3. **Check console for errors**
   - If you see `❌ Recruiter creation FAILED`, copy the full error
   - The error code will tell us exactly what's wrong:
     - `42501` = RLS policy violation
     - `23503` = Foreign key constraint (profile doesn't exist)
     - `23502` = Missing required field
     - `23505` = Duplicate record

4. **Run diagnostic SQL queries**
   - Use the queries above to check RLS policies
   - Verify the policies are actually applied in production

5. **If RLS policy is missing**
   - Run the SQL from `fix-recruiter-rls.sql`
   - Or manually create the policy:
     ```sql
     CREATE POLICY "Recruiters can insert own record" ON recruiters
       FOR INSERT 
       TO authenticated
       WITH CHECK (user_id = auth.uid());
     ```

## Files Changed

| File | Lines Changed | Description |
|------|---------------|-------------|
| `src/contexts/AppContext.tsx` | 548-622 | Added email field, session verification, enhanced error logging, verification query |

**Total:** 1 file modified, ~75 lines added/modified

## Expected Behavior After Fix

### Console Logs (Success Case)
```
🚀 Starting registration for: test@example.com
📝 Preparing auth signup with metadata: { role: 'recruiter', companyName: '...', ... }
✅ Auth user created with ID: xxx-xxx-xxx
📝 Creating profile record...
✅ Profile created successfully
💼 Creating recruiter record for user: xxx-xxx-xxx
🔐 Verifying session before recruiter INSERT...
✅ Session verified, current user ID: xxx-xxx-xxx
📋 Recruiter data to insert: { user_id: '...', company_name: '...', ... }
🔍 Attempting INSERT with user_id: xxx-xxx-xxx
📊 INSERT response: { recruiterData: {...}, recruiterError: null }
✅ Recruiter record created successfully: { id: '...', user_id: '...', ... }
🔍 Verifying recruiter record exists in database...
✅ Verification successful: { id: '...', user_id: '...', company_name: '...' }
✅✅✅ ALL RECORDS VERIFIED SUCCESSFULLY ✅✅✅
```

### Console Logs (Failure Case)
```
❌ Recruiter creation FAILED: { ... }
Full error object: { ... }
Error details: { 
  message: '...', 
  code: '42501', 
  ...
}
```

## Summary

| Item | Status |
|------|--------|
| Code updated with enhanced logging | ✅ |
| Email field added back to INSERT | ✅ |
| Session verification added | ✅ |
| Verification query added | ✅ |
| Build passes | ✅ |
| Ready for deployment | ✅ |

**Next:** Deploy to production and test with browser console open to see detailed logs.
