import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Student, Admin, Recruiter, JobDrive, Application, TestResult, Notification, Placement, UserRole } from '../types';
import { sampleUsers, sampleStudents, sampleAdmins, sampleRecruiters, sampleJobDrives, sampleApplications, sampleTestResults, sampleNotifications, samplePlacements } from '../data/sampleData';

interface AppState {
  users: User[];
  students: Student[];
  admins: Admin[];
  recruiters: Recruiter[];
  jobDrives: JobDrive[];
  applications: Application[];
  testResults: TestResult[];
  notifications: Notification[];
  placements: Placement[];
}

interface AppContextType extends AppState {
  currentUser: User | null;
  currentStudent: Student | null;
  currentAdmin: Admin | null;
  currentRecruiter: Recruiter | null;
  login: (email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  signup: (email: string, password: string, role: UserRole, data: any) => { success: boolean; message: string };
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => void;
  markNotificationRead: (id: string) => void;
  addApplication: (app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) => Application;
  updateApplicationStatus: (id: string, status: Application['status']) => void;
  addTestResult: (result: Omit<TestResult, 'id' | 'submittedAt'>) => void;
  addJobDrive: (drive: Omit<JobDrive, 'id' | 'createdAt'>) => void;
  updateJobDrive: (id: string, data: Partial<JobDrive>) => void;
  deleteJobDrive: (id: string) => void;
  updateRecruiterApproval: (id: string, status: Recruiter['approvalStatus']) => void;
  updateStudentProfile: (id: string, data: Partial<Student>) => void;
  addPlacement: (placement: Omit<Placement, 'id'>) => void;
  getUnreadCount: (userId: string) => number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'spms_data';
const AUTH_KEY = 'spms_auth';

function loadState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return {
    users: sampleUsers,
    students: sampleStudents,
    admins: sampleAdmins,
    recruiters: sampleRecruiters,
    jobDrives: sampleJobDrives,
    applications: sampleApplications,
    testResults: sampleTestResults,
    notifications: sampleNotifications,
    placements: samplePlacements,
  };
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [currentUser]);

  const currentStudent = currentUser?.role === 'student' ? state.students.find(s => s.userId === currentUser.id) || null : null;
  const currentAdmin = currentUser?.role === 'admin' ? state.admins.find(a => a.userId === currentUser.id) || null : null;
  const currentRecruiter = currentUser?.role === 'recruiter' ? state.recruiters.find(r => r.userId === currentUser.id) || null : null;

  const login = (email: string, password: string) => {
    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Invalid email or password' };
    setCurrentUser(user);
    return { success: true, message: 'Login successful' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = (email: string, password: string, role: UserRole, data: any) => {
    if (state.users.find(u => u.email === email)) {
      return { success: false, message: 'Email already registered' };
    }
    const userId = generateId();
    const newUser: User = { id: userId, email, password, role, createdAt: new Date().toISOString().split('T')[0] };
    
    setState(prev => {
      const newState = { ...prev, users: [...prev.users, newUser] };
      if (role === 'student') {
        newState.students = [...prev.students, { id: generateId(), userId, name: data.name, rollNumber: data.rollNumber, phone: data.phone, dob: data.dob, branch: data.branch, year: data.year, cgpa: data.cgpa, skills: data.skills || [], placementStatus: 'NOT_PLACED' as const }];
      } else if (role === 'recruiter') {
        newState.recruiters = [...prev.recruiters, { id: generateId(), userId, companyName: data.companyName, recruiterName: data.recruiterName, phone: data.phone, address: data.address || '', website: data.website || '', description: data.description || '', approvalStatus: 'PENDING' as const }];
        newState.notifications = [...prev.notifications, { id: generateId(), userId: prev.admins[0]?.userId || '', title: 'New Company Registration', message: `${data.companyName} has registered and is pending approval.`, read: false, createdAt: new Date().toISOString().split('T')[0], type: 'warning' as const }];
      }
      return newState;
    });
    setCurrentUser(newUser);
    return { success: true, message: 'Registration successful' };
  };

  const addNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, { id: generateId(), userId, title, message, read: false, createdAt: new Date().toISOString().split('T')[0], type }]
    }));
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const getUnreadCount = (userId: string) => {
    return state.notifications.filter(n => n.userId === userId && !n.read).length;
  };

  const addApplication = (app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newApp: Application = { ...app, id: generateId(), appliedAt: now, updatedAt: now };
    setState(prev => ({ ...prev, applications: [...prev.applications, newApp] }));
    return newApp;
  };

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    setState(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString().split('T')[0] } : a)
    }));
  };

  const addTestResult = (result: Omit<TestResult, 'id' | 'submittedAt'>) => {
    const newResult: TestResult = { ...result, id: generateId(), submittedAt: new Date().toISOString().split('T')[0] };
    setState(prev => ({ ...prev, testResults: [...prev.testResults, newResult] }));
  };

  const addJobDrive = (drive: Omit<JobDrive, 'id' | 'createdAt'>) => {
    const newDrive: JobDrive = { ...drive, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
    setState(prev => ({ ...prev, jobDrives: [...prev.jobDrives, newDrive] }));
  };

  const updateJobDrive = (id: string, data: Partial<JobDrive>) => {
    setState(prev => ({
      ...prev,
      jobDrives: prev.jobDrives.map(jd => jd.id === id ? { ...jd, ...data } : jd)
    }));
  };

  const deleteJobDrive = (id: string) => {
    setState(prev => ({
      ...prev,
      jobDrives: prev.jobDrives.filter(jd => jd.id !== id),
      applications: prev.applications.filter(a => a.jobDriveId !== id),
    }));
  };

  const updateRecruiterApproval = (id: string, status: Recruiter['approvalStatus']) => {
    setState(prev => {
      const recruiter = prev.recruiters.find(r => r.id === id);
      const newNotifications = [...prev.notifications];
      if (recruiter) {
        newNotifications.push({
          id: generateId(),
          userId: recruiter.userId,
          title: status === 'APPROVED' ? 'Company Approved' : 'Company Rejected',
          message: status === 'APPROVED' ? `Your company ${recruiter.companyName} has been approved. You can now create job drives.` : `Your company ${recruiter.companyName} registration has been rejected.`,
          read: false,
          createdAt: new Date().toISOString().split('T')[0],
          type: status === 'APPROVED' ? 'success' : 'error'
        });
      }
      return {
        ...prev,
        recruiters: prev.recruiters.map(r => r.id === id ? { ...r, approvalStatus: status } : r),
        notifications: newNotifications,
      };
    });
  };

  const updateStudentProfile = (id: string, data: Partial<Student>) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...data } : s)
    }));
  };

  const addPlacement = (placement: Omit<Placement, 'id'>) => {
    const newPlacement: Placement = { ...placement, id: generateId() };
    setState(prev => ({
      ...prev,
      placements: [...prev.placements, newPlacement],
      students: prev.students.map(s => s.id === placement.studentId ? { ...s, placementStatus: 'PLACED' as const } : s)
    }));
  };

  return (
    <AppContext.Provider value={{
      ...state,
      currentUser,
      currentStudent,
      currentAdmin,
      currentRecruiter,
      login,
      logout,
      signup,
      addNotification,
      markNotificationRead,
      addApplication,
      updateApplicationStatus,
      addTestResult,
      addJobDrive,
      updateJobDrive,
      deleteJobDrive,
      updateRecruiterApproval,
      updateStudentProfile,
      addPlacement,
      getUnreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
