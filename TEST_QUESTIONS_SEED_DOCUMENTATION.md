# Test Questions Seed Script - Complete Documentation

## Overview

This document describes the safe seed script for populating the `test_questions` table with 20 technical aptitude questions suitable for B.Tech CSE placement tests.

## File Created

**File:** `seed-test-questions.sql`

## Schema Analysis

### Current Schema (from supabase-schema.sql)

```sql
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Points

1. **options** is a PostgreSQL TEXT[] array (not JSON)
2. **correct_answer** is an INTEGER representing the 0-based index of the correct option
3. **id** is auto-generated UUID
4. **created_at** is auto-generated timestamp

### Grading Logic (from StudentDashboard.tsx)

```typescript
// Line 632-634
questions.forEach((q: any) => {
  if (answers[q.id] === q.correctAnswer) score++;
});
```

**How it works:**
- `answers[q.id]` contains the student's selected option index (0, 1, 2, or 3)
- `q.correctAnswer` is the correct option index from the database
- They must match exactly for the answer to be marked correct

**Example:**
```
Question: "What is 2+2?"
Options: ["3", "4", "5", "6"]  (indices: 0, 1, 2, 3)
correct_answer: 1  (because "4" is at index 1)

Student selects option B (index 1)
answers[q.id] = 1
q.correctAnswer = 1
Match! Score incremented.
```

## Seed Script Details

### Idempotency

The script is **idempotent** - safe to run multiple times:

```sql
DO $$
DECLARE
    question_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO question_count FROM public.test_questions;
    RAISE NOTICE 'Current test_questions count: %', question_count;
    
    IF question_count > 0 THEN
        RAISE NOTICE 'Table already has % questions. Skipping insertion to prevent duplicates.', question_count;
        RETURN;
    END IF;
    
    -- Insert questions only if table is empty
    INSERT INTO public.test_questions ...
END $$;
```

**Behavior:**
- If `test_questions` is empty → Inserts 20 questions
- If `test_questions` has any questions → Skips insertion, no duplicates

### Questions Included

The script includes 20 questions covering:

1. **Data Structures** (4 questions)
   - Binary search time complexity
   - Stack data structure
   - BST traversal
   - LIFO principle

2. **Algorithms** (3 questions)
   - Sorting algorithms
   - Quicksort worst-case
   - Dijkstra's algorithm

3. **Programming Concepts** (4 questions)
   - OOP principles
   - Recursion
   - Java class definition
   - int data type size

4. **Database** (3 questions)
   - SQL acronym
   - NoSQL databases
   - SELECT command

5. **Operating Systems** (2 questions)
   - Deadlock
   - Scheduling algorithms

6. **Computer Networks** (2 questions)
   - HTTPS protocol
   - HTTP port number

7. **Web Development** (1 question)
   - HTML acronym

8. **Computer Architecture** (1 question)
   - CPU acronym

### Answer Key

| # | Question Topic | Correct Answer Index | Correct Answer Text |
|---|----------------|---------------------|---------------------|
| 1 | Binary search complexity | 1 | O(log n) |
| 2 | OOP principles | 2 | Compilation |
| 3 | SQL acronym | 0 | Structured Query Language |
| 4 | Sorting algorithms | 1 | Merge Sort |
| 5 | Deadlock | 0 | Processes waiting for each other |
| 6 | HTTPS | 2 | HTTPS |
| 7 | LIFO data structure | 1 | Stack |
| 8 | C printf output | 1 | 2 |
| 9 | NoSQL database | 2 | MongoDB |
| 10 | HTML acronym | 0 | Hyper Text Markup Language |
| 11 | Java class definition | 1 | class |
| 12 | Quicksort worst-case | 1 | O(n²) |
| 13 | CPU acronym | 0 | Central Processing Unit |
| 14 | BST traversal | 2 | Inorder |
| 15 | int size in Java | 1 | 4 bytes |
| 16 | Starvation scheduling | 3 | Priority Scheduling |
| 17 | HTTP port | 2 | 80 |
| 18 | SQL retrieve command | 2 | SELECT |
| 19 | Recursion | 1 | Function that calls itself |
| 20 | Shortest path algorithm | 2 | Dijkstra's Algorithm |

## How to Run the Seed Script

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

### Step 2: Copy and Paste the Script

1. Open `seed-test-questions.sql`
2. Copy the entire contents
3. Paste into the SQL Editor

### Step 3: Execute the Script

1. Click **Run** (or press Ctrl+Enter)
2. Check the output messages

### Expected Output

**If table is empty:**
```
NOTICE:  Current test_questions count: 0
NOTICE:  Successfully inserted 20 test questions
NOTICE:  Final test_questions count: 20
```

**If table already has questions:**
```
NOTICE:  Current test_questions count: 20
NOTICE:  Table already has 20 questions. Skipping insertion to prevent duplicates.
NOTICE:  Final test_questions count: 20
```

### Step 4: Verify the Questions

Run this query to verify:

```sql
SELECT 
    id,
    LEFT(question, 60) || '...' as question_preview,
    options,
    correct_answer
FROM public.test_questions
ORDER BY id
LIMIT 5;
```

**Expected result:**
```
id                  | question_preview                                      | options                                              | correct_answer
--------------------|-------------------------------------------------------|------------------------------------------------------|---------------
<uuid-1>           | What is the time complexity of binary search in...   | {O(n),O(log n),O(n²),O(1)}                          | 1
<uuid-2>           | Which of the following is NOT a principle of Obje... | {Encapsulation,Inheritance,Compilation,Polymorphism} | 2
<uuid-3>           | What does SQL stand for?                             | {Structured Query Language,Simple Query Language...} | 0
<uuid-4>           | Which sorting algorithm has the best average-case... | {Bubble Sort,Merge Sort,Selection Sort,Insertion...} | 1
<uuid-5>           | What is a deadlock in operating systems?             | {A situation where two or more processes are wa...}  | 0
```

## Impact on Application Workflow

### Before Running Seed Script

```
Student applies for job with test configured
    ↓
System checks: test_duration > 0 ✓
                test_pass_percentage > 0 ✓
                test_questions.length > 0 ✗ (0 questions)
    ↓
initialStatus = 'APPLIED'
    ↓
Student sees "No Tests Available"
```

### After Running Seed Script

```
Student applies for job with test configured
    ↓
System checks: test_duration > 0 ✓
                test_pass_percentage > 0 ✓
                test_questions.length > 0 ✓ (20 questions)
    ↓
initialStatus = 'TEST_PENDING'
    ↓
Student sees test in Technical Tests page
    ↓
Student takes test
    ↓
System grades test (compares answers[q.id] === q.correctAnswer)
    ↓
Status updates to 'PASSED' or 'FAILED'
```

## Testing the Complete Workflow

### Test Scenario 1: Job with Technical Test

1. **Run the seed script** to populate test_questions
2. **Login as student** (e.g., Raghav)
3. **Apply for Samsung Senior Developer** (has test_duration=30, test_pass_percentage=60)
4. **Check browser console:**
   ```
   📋 Application status determination: {
     hasTestConfig: true,
     testDuration: 30,
     testPassPercentage: 60,
     hasQuestions: true,
     questionCount: 20,
     initialStatus: 'TEST_PENDING'
   }
   ```
5. **Navigate to Technical Tests page**
6. **Verify:** Test appears in "Pending Tests" section
7. **Click "Start Test"**
8. **Answer questions** (try to get at least 60% correct)
9. **Submit test**
10. **Verify:** Status changes to 'PASSED' or 'FAILED'
11. **Check database:**
    ```sql
    SELECT status FROM applications 
    WHERE student_id = '<raghav-student-id>' 
    AND job_drive_id = '<samsung-job-id>';
    ```

### Test Scenario 2: Job without Technical Test

1. **Apply for a job with test_duration=0**
2. **Check browser console:**
   ```
   📋 Application status determination: {
     hasTestConfig: false,
     testDuration: 0,
     testPassPercentage: 0,
     hasQuestions: true,
     questionCount: 20,
     initialStatus: 'APPLIED'
   }
   ```
3. **Navigate to Technical Tests page**
4. **Verify:** "No Tests Available" message (correct behavior)

## Verification Queries

### Check Question Count

```sql
SELECT COUNT(*) as total_questions FROM public.test_questions;
```

**Expected:** 20

### Check All Questions Have 4 Options

```sql
SELECT 
    id,
    LEFT(question, 50) as question,
    array_length(options, 1) as option_count,
    correct_answer
FROM public.test_questions
WHERE array_length(options, 1) != 4;
```

**Expected:** 0 rows (all questions have exactly 4 options)

### Check Correct Answer Indices Are Valid

```sql
SELECT 
    id,
    LEFT(question, 50) as question,
    correct_answer,
    array_length(options, 1) as option_count
FROM public.test_questions
WHERE correct_answer < 0 OR correct_answer >= array_length(options, 1);
```

**Expected:** 0 rows (all correct_answer values are valid indices)

### Sample Questions with Answers

```sql
SELECT 
    id,
    question,
    options[correct_answer + 1] as correct_answer_text,
    correct_answer as correct_answer_index
FROM public.test_questions
ORDER BY id
LIMIT 10;
```

**Note:** PostgreSQL arrays are 1-indexed, so we use `correct_answer + 1` to get the correct option text.

## Build Status

```
✅ Build successful
✅ No TypeScript errors
✅ Bundle size: 957.15 kB (gzip: 255.01 kB)
```

## Summary

| Item | Status |
|------|--------|
| Seed script created | ✅ |
| Idempotent (safe to run multiple times) | ✅ |
| Matches existing schema | ✅ |
| Correct answer indices (0-based) | ✅ |
| 4 options per question | ✅ |
| Suitable for B.Tech CSE placement | ✅ |
| Build passes | ✅ |
| No schema changes | ✅ |
| No RLS changes | ✅ |

## Next Steps

1. **Run the seed script** in Supabase SQL Editor
2. **Verify** 20 questions were inserted
3. **Test** the complete workflow with a student account
4. **Confirm** applications now get status 'TEST_PENDING' for jobs with tests
5. **Deploy** to production when ready

## Important Notes

- ✅ The seed script is safe to run multiple times
- ✅ No existing data will be modified
- ✅ No schema changes required
- ✅ No RLS policy changes required
- ✅ Questions are suitable for B.Tech CSE placement tests
- ✅ All correct_answer values are valid 0-based indices
- ✅ All questions have exactly 4 options

**Status:** Ready to run the seed script in Supabase SQL Editor.
