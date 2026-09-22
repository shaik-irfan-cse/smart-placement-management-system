# Recruiter Registration Email Column Fix

## Issue
Recruiter registration was failing with the error:
```
Failed to create recruiter record: Could not find the 'email' column of 'recruiters' in the schema cache
```

## Root Cause
The production database's `recruiters` table does NOT have an `email` column, but the code was attempting to insert an email value into it.

**Actual Production Schema:**
```sql
CREATE TABLE recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  recruiter_name TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  description TEXT,
  approval_status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** No `email` column exists in the production database.

## Changes Made

### 1. src/contexts/AppContext.tsx

#### Removed email from recruiter INSERT (Line 565-575)
**Before:**
```typescript
const recruiterInsertData = {
  user_id: userId,
  company_name: data.companyName,
  recruiter_name: data.recruiterName,
  email: email,  // ❌ This column doesn't exist in production
  phone: data.phone,
  address: data.address || '',
  website: data.website || '',
  description: data.description || '',
  approval_status: 'PENDING',
};
```

**After:**
```typescript
const recruiterInsertData = {
  user_id: userId,
  company_name: data.companyName,
  recruiter_name: data.recruiterName,
  phone: data.phone,
  address: data.address || '',
  website: data.website || '',
  description: data.description || '',
  approval_status: 'PENDING',
};
```

#### Updated mapRecruiter function (Line 73-86)
**Before:**
```typescript
function mapRecruiter(row: any): Recruiter {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    recruiterName: row.recruiter_name,
    email: row.email || '',  // ❌ This column doesn't exist
    phone: row.phone,
    address: row.address || '',
    website: row.website || '',
    description: row.description || '',
    approvalStatus: row.approval_status || 'PENDING',
  };
}
```

**After:**
```typescript
function mapRecruiter(row: any): Recruiter {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    recruiterName: row.recruiter_name,
    phone: row.phone,
    address: row.address || '',
    website: row.website || '',
    description: row.description || '',
    approvalStatus: row.approval_status || 'PENDING',
  };
}
```

### 2. src/types/index.ts

#### Made email field optional in Recruiter interface (Line 40-51)
**Before:**
```typescript
export interface Recruiter {
  id: string;
  userId: string;
  companyName: string;
  recruiterName: string;
  email: string;  // ❌ Required but doesn't exist in DB
  phone: string;
  address: string;
  website: string;
  description: string;
  approvalStatus: ApprovalStatus;
}
```

**After:**
```typescript
export interface Recruiter {
  id: string;
  userId: string;
  companyName: string;
  recruiterName: string;
  email?: string;  // ✅ Optional field
  phone: string;
  address: string;
  website: string;
  description: string;
  approvalStatus: ApprovalStatus;
}
```

### 3. src/pages/recruiter/RecruiterDashboard.tsx

#### Updated CompanyProfilePage to use currentUser.email (Line 206, 264)
**Before:**
```typescript
function CompanyProfilePage() {
  const { currentRecruiter, loading } = useApp();
  // ...
  <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-medium text-sm break-all">{currentRecruiter.email}</p></div>
```

**After:**
```typescript
function CompanyProfilePage() {
  const { currentRecruiter, currentUser, loading } = useApp();
  // ...
  <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-medium text-sm break-all">{currentUser?.email || 'N/A'}</p></div>
```

## How Email is Now Handled

The recruiter's email is stored in:
1. **auth.users** table (Supabase Auth) - Primary source
2. **profiles** table - Copied from auth.users during registration

The email is accessed via `currentUser.email` which comes from the `profiles` table, NOT from the `recruiters` table.

## Build Status
✅ Build successful - No TypeScript errors
✅ Bundle size: 954.09 kB (gzip: 254.02 kB)

## Testing Checklist
- [ ] Register a new recruiter account
- [ ] Verify recruiter record is created in database
- [ ] Login as recruiter
- [ ] Verify dashboard loads without errors
- [ ] Check Company Profile page shows email from currentUser
- [ ] Verify all other recruiter features work (job drives, applications, etc.)

## Notes
- Student and Admin registration flows are NOT affected by this change
- The role-specific metadata fix from the previous change is preserved
- Email remains accessible through the auth/profile system
- No database schema changes were made
