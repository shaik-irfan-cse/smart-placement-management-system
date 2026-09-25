-- Safe seed script for test_questions table
-- This script inserts 20 technical aptitude questions for B.Tech CSE placement tests
-- Idempotent: Only inserts if table is empty to prevent duplicates

-- Check current count and only proceed if table is empty
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
    
    -- Insert 20 technical questions
    -- Each question has 4 options (0-indexed array)
    -- correct_answer is the 0-based index of the correct option
    
    INSERT INTO public.test_questions (question, options, correct_answer) VALUES
-- Question 1: Data Structures
(
    'What is the time complexity of binary search in a sorted array?',
    ARRAY['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    1
),
-- Question 2: Programming Concepts
(
    'Which of the following is NOT a principle of Object-Oriented Programming?',
    ARRAY['Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism'],
    2
),
-- Question 3: Database
(
    'What does SQL stand for?',
    ARRAY['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'],
    0
),
-- Question 4: Algorithms
(
    'Which sorting algorithm has the best average-case time complexity?',
    ARRAY['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'],
    1
),
-- Question 5: Operating Systems
(
    'What is a deadlock in operating systems?',
    ARRAY['A situation where two or more processes are waiting for each other to release resources', 'A type of memory allocation', 'A scheduling algorithm', 'A file system error'],
    0
),
-- Question 6: Computer Networks
(
    'Which protocol is used for secure web communication?',
    ARRAY['HTTP', 'FTP', 'HTTPS', 'SMTP'],
    2
),
-- Question 7: Data Structures
(
    'Which data structure uses LIFO (Last In First Out) principle?',
    ARRAY['Queue', 'Stack', 'Array', 'Linked List'],
    1
),
-- Question 8: Programming
(
    'What is the output of: printf("%d", 5/2); in C?',
    ARRAY['2.5', '2', '3', 'Error'],
    1
),
-- Question 9: Database
(
    'Which of the following is a NoSQL database?',
    ARRAY['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'],
    2
),
-- Question 10: Web Development
(
    'What does HTML stand for?',
    ARRAY['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'],
    0
),
-- Question 11: Programming Concepts
(
    'Which of the following is used to define a class in Java?',
    ARRAY['struct', 'class', 'object', 'define'],
    1
),
-- Question 12: Algorithms
(
    'What is the worst-case time complexity of quicksort?',
    ARRAY['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
    1
),
-- Question 13: Computer Architecture
(
    'What does CPU stand for?',
    ARRAY['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'],
    0
),
-- Question 14: Data Structures
(
    'Which traversal of a Binary Search Tree gives nodes in sorted order?',
    ARRAY['Preorder', 'Postorder', 'Inorder', 'Level order'],
    2
),
-- Question 15: Programming
(
    'What is the size of an int data type in Java?',
    ARRAY['2 bytes', '4 bytes', '8 bytes', 'Depends on the platform'],
    1
),
-- Question 16: Operating Systems
(
    'Which scheduling algorithm may cause starvation?',
    ARRAY['Round Robin', 'First Come First Serve', 'Shortest Job First', 'Priority Scheduling'],
    3
),
-- Question 17: Computer Networks
(
    'What is the default port number for HTTP?',
    ARRAY['21', '22', '80', '443'],
    2
),
-- Question 18: Database
(
    'Which SQL command is used to retrieve data from a database?',
    ARRAY['GET', 'FETCH', 'SELECT', 'RETRIEVE'],
    2
),
-- Question 19: Programming Concepts
(
    'What is recursion?',
    ARRAY['A loop that runs forever', 'A function that calls itself', 'A type of data structure', 'A memory allocation technique'],
    1
),
-- Question 20: Algorithms
    (
        'Which algorithm is used to find the shortest path in a graph with non-negative edge weights?',
        ARRAY['Breadth-First Search', 'Depth-First Search', 'Dijkstra''s Algorithm', 'Kruskal''s Algorithm'],
        2
    );
    
    RAISE NOTICE 'Successfully inserted 20 test questions';
END $$;

-- Verify the insertion
DO $$
DECLARE
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO new_count FROM public.test_questions;
    RAISE NOTICE 'Final test_questions count: %', new_count;
END $$;

-- Display sample questions to verify
SELECT 
    id,
    LEFT(question, 50) || '...' as question_preview,
    array_length(options, 1) as option_count,
    correct_answer
FROM public.test_questions
ORDER BY id
LIMIT 5;
