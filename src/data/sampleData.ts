import { Student, Admin, Recruiter, JobDrive, Application, TestQuestion, TestResult, Notification, Placement, User } from '../types';

export const sampleUsers: User[] = [
  { id: 'u1', email: 'arjun@college.edu', password: 'pass123', role: 'student', createdAt: '2025-01-15' },
  { id: 'u2', email: 'rahul@college.edu', password: 'pass123', role: 'student', createdAt: '2025-01-15' },
  { id: 'u3', email: 'sneha@college.edu', password: 'pass123', role: 'student', createdAt: '2025-01-16' },
  { id: 'u4', email: 'priya@college.edu', password: 'pass123', role: 'student', createdAt: '2025-01-16' },
  { id: 'u5', email: 'kiran@college.edu', password: 'pass123', role: 'student', createdAt: '2025-01-17' },
  { id: 'u6', email: 'admin@college.edu', password: 'admin123', role: 'admin', createdAt: '2024-06-01' },
  { id: 'u7', email: 'hr@tcs.com', password: 'pass123', role: 'recruiter', createdAt: '2025-02-01' },
  { id: 'u8', email: 'hr@infosys.com', password: 'pass123', role: 'recruiter', createdAt: '2025-02-05' },
  { id: 'u9', email: 'hr@wipro.com', password: 'pass123', role: 'recruiter', createdAt: '2025-02-10' },
  { id: 'u10', email: 'hr@deloitte.com', password: 'pass123', role: 'recruiter', createdAt: '2025-03-01' },
  { id: 'u11', email: 'hr@techm.com', password: 'pass123', role: 'recruiter', createdAt: '2025-03-05' },
];

export const sampleStudents: Student[] = [
  { id: 's1', userId: 'u1', name: 'Arjun Kumar', rollNumber: '21CS001', phone: '9876543210', dob: '2003-05-15', branch: 'CSE', year: 4, cgpa: 8.5, skills: ['Java', 'Python', 'React', 'SQL'], placementStatus: 'IN_PROCESS' },
  { id: 's2', userId: 'u2', name: 'Rahul Sharma', rollNumber: '21CS002', phone: '9876543211', dob: '2003-07-22', branch: 'CSE', year: 4, cgpa: 7.8, skills: ['Python', 'Machine Learning', 'SQL'], placementStatus: 'IN_PROCESS' },
  { id: 's3', userId: 'u3', name: 'Sneha Reddy', rollNumber: '21IT003', phone: '9876543212', dob: '2003-03-10', branch: 'IT', year: 4, cgpa: 9.1, skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'], placementStatus: 'PLACED' },
  { id: 's4', userId: 'u4', name: 'Priya Singh', rollNumber: '21EC004', phone: '9876543213', dob: '2003-09-05', branch: 'ECE', year: 4, cgpa: 8.2, skills: ['C++', 'VLSI', 'Python', 'MATLAB'], placementStatus: 'IN_PROCESS' },
  { id: 's5', userId: 'u5', name: 'Kiran Kumar', rollNumber: '21ME005', phone: '9876543214', dob: '2003-11-20', branch: 'ME', year: 4, cgpa: 7.2, skills: ['AutoCAD', 'Python', 'SolidWorks'], placementStatus: 'NOT_PLACED' },
];

export const sampleAdmins: Admin[] = [
  { id: 'a1', userId: 'u6', name: 'Dr. Rajesh Verma', employeeId: 'EMP001', phone: '9876500001', department: 'Training & Placement' },
];

export const sampleRecruiters: Recruiter[] = [
  { id: 'r1', userId: 'u7', companyName: 'TCS', recruiterName: 'Anita Desai', phone: '9876500010', address: 'Mumbai, Maharashtra', website: 'https://tcs.com', description: 'Tata Consultancy Services is a global leader in IT services, consulting, and business solutions.', approvalStatus: 'APPROVED' },
  { id: 'r2', userId: 'u8', companyName: 'Infosys', recruiterName: 'Vikram Patel', phone: '9876500011', address: 'Bengaluru, Karnataka', website: 'https://infosys.com', description: 'Infosys is a global leader in next-generation digital services and consulting.', approvalStatus: 'APPROVED' },
  { id: 'r3', userId: 'u9', companyName: 'Wipro', recruiterName: 'Meera Joshi', phone: '9876500012', address: 'Bengaluru, Karnataka', website: 'https://wipro.com', description: 'Wipro Limited is a leading technology services and consulting company.', approvalStatus: 'APPROVED' },
  { id: 'r4', userId: 'u10', companyName: 'Deloitte', recruiterName: 'Suresh Menon', phone: '9876500013', address: 'Hyderabad, Telangana', website: 'https://deloitte.com', description: 'Deloitte provides audit, consulting, financial advisory, risk management, and tax services.', approvalStatus: 'PENDING' },
  { id: 'r5', userId: 'u11', companyName: 'Tech Mahindra', recruiterName: 'Pooja Gupta', phone: '9876500014', address: 'Pune, Maharashtra', website: 'https://techmahindra.com', description: 'Tech Mahindra is a leading provider of IT services and digital transformation solutions.', approvalStatus: 'APPROVED' },
];

export const sampleJobDrives: JobDrive[] = [
  { id: 'jd1', recruiterId: 'r1', companyName: 'TCS', jobRole: 'Software Developer', jobDescription: 'Develop and maintain software applications using modern technologies. Work on enterprise solutions for global clients.', package: '₹7 LPA', location: 'Bengaluru', jobType: 'Full-time', eligibilityCGPA: 7.0, eligibleBranches: ['CSE', 'IT'], requiredSkills: ['Java', 'Python', 'SQL'], openings: 15, deadline: '2026-09-30', testDuration: 30, testPassPercentage: 60, status: 'ACTIVE', createdAt: '2025-06-01' },
  { id: 'jd2', recruiterId: 'r2', companyName: 'Infosys', jobRole: 'Data Analyst', jobDescription: 'Analyze business data, create reports, and provide insights to stakeholders using advanced analytics tools.', package: '₹6.5 LPA', location: 'Pune', jobType: 'Full-time', eligibilityCGPA: 7.5, eligibleBranches: ['CSE', 'IT', 'ECE'], requiredSkills: ['Python', 'SQL', 'Excel', 'Tableau'], openings: 8, deadline: '2026-09-15', testDuration: 25, testPassPercentage: 65, status: 'ACTIVE', createdAt: '2025-06-05' },
  { id: 'jd3', recruiterId: 'r3', companyName: 'Wipro', jobRole: 'Frontend Developer', jobDescription: 'Build responsive web applications using React and modern frontend technologies. Collaborate with design and backend teams.', package: '₹6 LPA', location: 'Hyderabad', jobType: 'Full-time', eligibilityCGPA: 7.0, eligibleBranches: ['CSE', 'IT'], requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML'], openings: 10, deadline: '2026-08-30', testDuration: 30, testPassPercentage: 55, status: 'ACTIVE', createdAt: '2025-06-10' },
  { id: 'jd4', recruiterId: 'r5', companyName: 'Tech Mahindra', jobRole: 'Backend Developer', jobDescription: 'Design and implement scalable backend services using Node.js and cloud technologies.', package: '₹8 LPA', location: 'Mumbai', jobType: 'Full-time', eligibilityCGPA: 7.5, eligibleBranches: ['CSE', 'IT'], requiredSkills: ['Node.js', 'Express', 'MongoDB', 'AWS'], openings: 6, deadline: '2026-10-15', testDuration: 35, testPassPercentage: 60, status: 'ACTIVE', createdAt: '2025-06-15' },
  { id: 'jd5', recruiterId: 'r1', companyName: 'TCS', jobRole: 'Java Developer', jobDescription: 'Develop enterprise Java applications using Spring Boot framework. Work on microservices architecture.', package: '₹7.5 LPA', location: 'Chennai', jobType: 'Full-time', eligibilityCGPA: 7.0, eligibleBranches: ['CSE', 'IT', 'ECE'], requiredSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs'], openings: 12, deadline: '2026-10-30', testDuration: 30, testPassPercentage: 60, status: 'ACTIVE', createdAt: '2025-06-20' },
  { id: 'jd6', recruiterId: 'r2', companyName: 'Infosys', jobRole: 'Software Developer', jobDescription: 'Join our digital engineering team to build next-gen applications for Fortune 500 clients.', package: '₹9 LPA', location: 'Bengaluru', jobType: 'Full-time', eligibilityCGPA: 8.0, eligibleBranches: ['CSE', 'IT'], requiredSkills: ['Java', 'Python', 'Cloud', 'Microservices'], openings: 5, deadline: '2026-11-15', testDuration: 40, testPassPercentage: 70, status: 'ACTIVE', createdAt: '2025-07-01' },
];

export const sampleApplications: Application[] = [
  { id: 'app1', studentId: 's1', jobDriveId: 'jd1', status: 'SELECTED', appliedAt: '2025-07-01', updatedAt: '2025-07-20' },
  { id: 'app2', studentId: 's1', jobDriveId: 'jd3', status: 'PASSED', appliedAt: '2025-07-05', updatedAt: '2025-07-15' },
  { id: 'app3', studentId: 's1', jobDriveId: 'jd4', status: 'TEST_PENDING', appliedAt: '2025-07-10', updatedAt: '2025-07-10' },
  { id: 'app4', studentId: 's2', jobDriveId: 'jd1', status: 'PASSED', appliedAt: '2025-07-02', updatedAt: '2025-07-18' },
  { id: 'app5', studentId: 's2', jobDriveId: 'jd2', status: 'APPLIED', appliedAt: '2025-07-08', updatedAt: '2025-07-08' },
  { id: 'app6', studentId: 's3', jobDriveId: 'jd3', status: 'SELECTED', appliedAt: '2025-07-03', updatedAt: '2025-07-22' },
  { id: 'app7', studentId: 's3', jobDriveId: 'jd6', status: 'UNDER_REVIEW', appliedAt: '2025-07-12', updatedAt: '2025-07-20' },
  { id: 'app8', studentId: 's4', jobDriveId: 'jd1', status: 'FAILED', appliedAt: '2025-07-04', updatedAt: '2025-07-16' },
  { id: 'app9', studentId: 's4', jobDriveId: 'jd5', status: 'TEST_PENDING', appliedAt: '2025-07-11', updatedAt: '2025-07-11' },
  { id: 'app10', studentId: 's5', jobDriveId: 'jd1', status: 'REJECTED', appliedAt: '2025-07-06', updatedAt: '2025-07-19' },
];

export const sampleTestQuestions: TestQuestion[] = [
  { id: 'q1', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1 },
  { id: 'q2', question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 1 },
  { id: 'q3', question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'System Query Language'], correctAnswer: 0 },
  { id: 'q4', question: 'Which of the following is NOT a programming paradigm?', options: ['Object-Oriented', 'Functional', 'Procedural', 'Sequential'], correctAnswer: 3 },
  { id: 'q5', question: 'What is the default port for HTTP?', options: ['443', '8080', '80', '3000'], correctAnswer: 2 },
  { id: 'q6', question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Selection Sort', 'Insertion Sort'], correctAnswer: 1 },
  { id: 'q7', question: 'What is polymorphism in OOP?', options: ['Multiple inheritance', 'Many forms', 'Data hiding', 'Code reuse'], correctAnswer: 1 },
  { id: 'q8', question: 'Which protocol is used for secure web communication?', options: ['FTP', 'HTTP', 'HTTPS', 'SMTP'], correctAnswer: 2 },
  { id: 'q9', question: 'What is a primary key in a database?', options: ['Foreign reference', 'Unique identifier', 'Index column', 'Default value'], correctAnswer: 1 },
  { id: 'q10', question: 'Which of these is a NoSQL database?', options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'], correctAnswer: 2 },
  { id: 'q11', question: 'What does API stand for?', options: ['Application Programming Interface', 'Advanced Program Integration', 'Automated Process Interface', 'Application Process Integration'], correctAnswer: 0 },
  { id: 'q12', question: 'Which language is primarily used for Android development?', options: ['Swift', 'Kotlin', 'Ruby', 'PHP'], correctAnswer: 1 },
  { id: 'q13', question: 'What is the purpose of a firewall?', options: ['Speed up network', 'Network security', 'Data compression', 'File sharing'], correctAnswer: 1 },
  { id: 'q14', question: 'Which of these is a JavaScript framework?', options: ['Django', 'Flask', 'React', 'Laravel'], correctAnswer: 2 },
  { id: 'q15', question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Unit'], correctAnswer: 0 },
  { id: 'q16', question: 'Which cloud platform is owned by Amazon?', options: ['Azure', 'GCP', 'AWS', 'IBM Cloud'], correctAnswer: 2 },
  { id: 'q17', question: 'What is recursion?', options: ['Loop iteration', 'Function calling itself', 'Variable assignment', 'Array sorting'], correctAnswer: 1 },
  { id: 'q18', question: 'Which design pattern ensures only one instance of a class?', options: ['Factory', 'Observer', 'Singleton', 'Strategy'], correctAnswer: 2 },
  { id: 'q19', question: 'What is the full form of HTML?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correctAnswer: 0 },
  { id: 'q20', question: 'Which of these is used for version control?', options: ['Docker', 'Git', 'Kubernetes', 'Jenkins'], correctAnswer: 1 },
];

export const sampleTestResults: TestResult[] = [
  { id: 'tr1', applicationId: 'app1', studentId: 's1', jobDriveId: 'jd1', score: 17, totalQuestions: 20, percentage: 85, passed: true, submittedAt: '2025-07-10' },
  { id: 'tr2', applicationId: 'app2', studentId: 's1', jobDriveId: 'jd3', score: 16, totalQuestions: 20, percentage: 80, passed: true, submittedAt: '2025-07-12' },
  { id: 'tr3', applicationId: 'app4', studentId: 's2', jobDriveId: 'jd1', score: 15, totalQuestions: 20, percentage: 75, passed: true, submittedAt: '2025-07-11' },
  { id: 'tr4', applicationId: 'app6', studentId: 's3', jobDriveId: 'jd3', score: 18, totalQuestions: 20, percentage: 90, passed: true, submittedAt: '2025-07-09' },
  { id: 'tr5', applicationId: 'app7', studentId: 's3', jobDriveId: 'jd6', score: 19, totalQuestions: 20, percentage: 95, passed: true, submittedAt: '2025-07-18' },
  { id: 'tr6', applicationId: 'app8', studentId: 's4', jobDriveId: 'jd1', score: 10, totalQuestions: 20, percentage: 50, passed: false, submittedAt: '2025-07-13' },
  { id: 'tr7', applicationId: 'app10', studentId: 's5', jobDriveId: 'jd1', score: 14, totalQuestions: 20, percentage: 70, passed: true, submittedAt: '2025-07-14' },
];

export const sampleNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', title: 'Application Selected', message: 'Congratulations! You have been selected by TCS for Software Developer role.', read: false, createdAt: '2025-07-20', type: 'success' },
  { id: 'n2', userId: 'u1', title: 'Test Available', message: 'Technical test for Tech Mahindra - Backend Developer is now available.', read: false, createdAt: '2025-07-10', type: 'info' },
  { id: 'n3', userId: 'u1', title: 'Test Result', message: 'Your test for Wipro - Frontend Developer has been evaluated. You passed!', read: true, createdAt: '2025-07-15', type: 'success' },
  { id: 'n4', userId: 'u3', title: 'Application Selected', message: 'Congratulations! You have been selected by Wipro for Frontend Developer role.', read: false, createdAt: '2025-07-22', type: 'success' },
  { id: 'n5', userId: 'u6', title: 'New Company Registration', message: 'Deloitte has registered and is pending approval.', read: false, createdAt: '2025-07-01', type: 'warning' },
  { id: 'n6', userId: 'u7', title: 'New Applications', message: '5 new applications received for TCS - Software Developer.', read: false, createdAt: '2025-07-08', type: 'info' },
  { id: 'n7', userId: 'u4', title: 'Test Failed', message: 'Unfortunately, you did not pass the technical test for TCS.', read: true, createdAt: '2025-07-16', type: 'error' },
];

export const samplePlacements: Placement[] = [
  { id: 'p1', studentId: 's1', jobDriveId: 'jd1', companyName: 'TCS', jobRole: 'Software Developer', package: '₹7 LPA', selectionDate: '2025-07-20', status: 'PLACED' },
  { id: 'p2', studentId: 's3', jobDriveId: 'jd3', companyName: 'Wipro', jobRole: 'Frontend Developer', package: '₹6 LPA', selectionDate: '2025-07-22', status: 'PLACED' },
];
