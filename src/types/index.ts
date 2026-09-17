export type UserRole = 'student' | 'admin' | 'recruiter';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApplicationStatus = 'APPLIED' | 'TEST_PENDING' | 'TEST_COMPLETED' | 'PASSED' | 'FAILED' | 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED';
export type PlacementStatus = 'PLACED' | 'NOT_PLACED' | 'IN_PROCESS';
export type DriveStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  dob: string;
  branch: string;
  year: number;
  cgpa: number;
  skills: string[];
  resumeUrl?: string;
  placementStatus: PlacementStatus;
}

export interface Admin {
  id: string;
  userId: string;
  name: string;
  employeeId: string;
  phone: string;
  department: string;
}

export interface Recruiter {
  id: string;
  userId: string;
  companyName: string;
  recruiterName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  approvalStatus: ApprovalStatus;
}

export interface JobDrive {
  id: string;
  recruiterId: string;
  companyName: string;
  jobRole: string;
  jobDescription: string;
  package: string;
  location: string;
  jobType: string;
  eligibilityCGPA: number;
  eligibleBranches: string[];
  requiredSkills: string[];
  openings: number;
  deadline: string;
  testDuration: number;
  testPassPercentage: number;
  status: DriveStatus;
  createdAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  jobDriveId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface TestResult {
  id: string;
  applicationId: string;
  studentId: string;
  jobDriveId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Placement {
  id: string;
  studentId: string;
  jobDriveId: string;
  companyName: string;
  jobRole: string;
  package: string;
  selectionDate: string;
  status: PlacementStatus;
}
