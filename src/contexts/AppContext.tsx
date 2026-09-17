import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Student, Admin, Recruiter, JobDrive, Application, TestResult, Notification, Placement, UserRole, TestQuestion } from '../types';

interface AppState {
  students: Student[];
  admins: Admin[];
  recruiters: Recruiter[];
  jobDrives: JobDrive[];
  applications: Application[];
  testResults: TestResult[];
  testQuestions: TestQuestion[];
  notifications: Notification[];
  placements: Placement[];
}

interface AppContextType extends AppState {
  currentUser: User | null;
  currentStudent: Student | null;
  currentAdmin: Admin | null;
  currentRecruiter: Recruiter | null;
  loading: boolean;
  authLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, role: UserRole, data: any) => Promise<{ success: boolean; message: string }>;
  addNotification: (userId: string, title: string, message: string, type: Notification['type']) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  addApplication: (app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) => Promise<Application | null>;
  updateApplicationStatus: (id: string, status: Application['status']) => Promise<void>;
  addTestResult: (result: Omit<TestResult, 'id' | 'submittedAt'>) => Promise<void>;
  addJobDrive: (drive: Omit<JobDrive, 'id' | 'createdAt'>) => Promise<void>;
  updateJobDrive: (id: string, data: Partial<JobDrive>) => Promise<void>;
  deleteJobDrive: (id: string) => Promise<void>;
  updateRecruiterApproval: (id: string, status: Recruiter['approvalStatus']) => Promise<void>;
  updateStudentProfile: (id: string, data: Partial<Student>) => Promise<void>;
  addPlacement: (placement: Omit<Placement, 'id'>) => Promise<void>;
  getUnreadCount: (userId: string) => number;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// Helper: map DB row (snake_case) to camelCase interface
function mapStudent(row: any): Student {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    rollNumber: row.roll_number,
    phone: row.phone,
    dob: row.dob,
    branch: row.branch,
    year: row.year,
    cgpa: row.cgpa,
    skills: Array.isArray(row.skills) ? row.skills : (row.skills ? String(row.skills).split(',').map((s: string) => s.trim()) : []),
    resumeUrl: row.resume_url,
    placementStatus: row.placement_status || 'NOT_PLACED',
  };
}

function mapAdmin(row: any): Admin {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    employeeId: row.employee_id,
    phone: row.phone,
    department: row.department,
  };
}

function mapRecruiter(row: any): Recruiter {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    recruiterName: row.recruiter_name,
    email: row.email || '',
    phone: row.phone,
    address: row.address || '',
    website: row.website || '',
    description: row.description || '',
    approvalStatus: row.approval_status || 'PENDING',
  };
}

function mapJobDrive(row: any): JobDrive {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    companyName: row.company_name,
    jobRole: row.job_role,
    jobDescription: row.job_description || '',
    package: row.package,
    location: row.location,
    jobType: row.job_type || 'Full-time',
    eligibilityCGPA: row.eligibility_cgpa,
    eligibleBranches: Array.isArray(row.eligible_branches) ? row.eligible_branches : (row.eligible_branches ? String(row.eligible_branches).split(',').map((s: string) => s.trim()) : []),
    requiredSkills: Array.isArray(row.required_skills) ? row.required_skills : (row.required_skills ? String(row.required_skills).split(',').map((s: string) => s.trim()) : []),
    openings: row.openings,
    deadline: row.deadline,
    testDuration: row.test_duration || 30,
    testPassPercentage: row.test_pass_percentage || 60,
    status: row.status || 'ACTIVE',
    createdAt: row.created_at,
  };
}

function mapApplication(row: any): Application {
  return {
    id: row.id,
    studentId: row.student_id,
    jobDriveId: row.job_drive_id,
    status: row.status || 'APPLIED',
    appliedAt: row.applied_at,
    updatedAt: row.updated_at,
  };
}

function mapTestQuestion(row: any): TestQuestion {
  return {
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options) ? row.options : (row.options ? String(row.options).split('|||') : []),
    correctAnswer: row.correct_answer,
  };
}

function mapTestResult(row: any): TestResult {
  return {
    id: row.id,
    applicationId: row.application_id,
    studentId: row.student_id,
    jobDriveId: row.job_drive_id,
    score: row.score,
    totalQuestions: row.total_questions,
    percentage: row.percentage,
    passed: row.passed,
    submittedAt: row.submitted_at,
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message || '',
    read: row.read || false,
    createdAt: row.created_at,
    type: row.type || 'info',
  };
}

function mapPlacement(row: any): Placement {
  return {
    id: row.id,
    studentId: row.student_id,
    jobDriveId: row.job_drive_id,
    companyName: row.company_name,
    jobRole: row.job_role,
    package: row.package,
    selectionDate: row.selection_date,
    status: row.status || 'PLACED',
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    students: [],
    admins: [],
    recruiters: [],
    jobDrives: [],
    applications: [],
    testResults: [],
    testQuestions: [],
    notifications: [],
    placements: [],
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Load all data from Supabase
  const refreshData = useCallback(async () => {
    try {
      const [studentsRes, adminsRes, recruitersRes, jobDrivesRes, applicationsRes, testResultsRes, testQuestionsRes, notificationsRes, placementsRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('admins').select('*'),
        supabase.from('recruiters').select('*'),
        supabase.from('job_drives').select('*'),
        supabase.from('applications').select('*'),
        supabase.from('test_results').select('*'),
        supabase.from('test_questions').select('*'),
        supabase.from('notifications').select('*'),
        supabase.from('placements').select('*'),
      ]);

      // Log any RLS or query errors for debugging
      const results = [
        { table: 'students', res: studentsRes },
        { table: 'admins', res: adminsRes },
        { table: 'recruiters', res: recruitersRes },
        { table: 'job_drives', res: jobDrivesRes },
        { table: 'applications', res: applicationsRes },
        { table: 'test_results', res: testResultsRes },
        { table: 'test_questions', res: testQuestionsRes },
        { table: 'notifications', res: notificationsRes },
        { table: 'placements', res: placementsRes },
      ];
      results.forEach(({ table, res }) => {
        if (res.error) {
          console.warn(`Query error on ${table}:`, res.error.message);
        }
      });

      setState({
        students: (studentsRes.data || []).map(mapStudent),
        admins: (adminsRes.data || []).map(mapAdmin),
        recruiters: (recruitersRes.data || []).map(mapRecruiter),
        jobDrives: (jobDrivesRes.data || []).map(mapJobDrive),
        applications: (applicationsRes.data || []).map(mapApplication),
        testResults: (testResultsRes.data || []).map(mapTestResult),
        testQuestions: (testQuestionsRes.data || []).map(mapTestQuestion),
        notifications: (notificationsRes.data || []).map(mapNotification),
        placements: (placementsRes.data || []).map(mapPlacement),
      });
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize: check Supabase session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
    refreshData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: profile.email || email,
          role: profile.role as UserRole,
          createdAt: profile.created_at,
        });
      } else {
        console.warn('No profile found for user ID:', userId);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const currentStudent = currentUser?.role === 'student' ? state.students.find(s => s.userId === currentUser.id) || null : null;
  const currentAdmin = currentUser?.role === 'admin' ? state.admins.find(a => a.userId === currentUser.id) || null : null;
  const currentRecruiter = currentUser?.role === 'recruiter' ? state.recruiters.find(r => r.userId === currentUser.id) || null : null;

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      // Step 1: Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Auth sign-in error:', error);
        return { success: false, message: error.message };
      }
      if (!data.user) {
        console.error('No user returned from sign-in');
        return { success: false, message: 'Login failed' };
      }

      console.log('Authenticated user ID:', data.user.id);

      // Step 2: Retrieve the profile using the authenticated user's ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      // Check for query errors (including RLS blocks)
      if (profileError) {
        console.error('Profile query error:', profileError);
        // Check if it's an RLS error
        if (profileError.message.includes('policy') || profileError.code === '42501') {
          return { 
            success: false, 
            message: 'Access denied. Please contact admin to verify your account permissions.' 
          };
        }
        return { success: false, message: 'Failed to load profile: ' + profileError.message };
      }

      // Step 3: Verify profile exists
      if (!profile) {
        console.error('Profile not found for user ID:', data.user.id);
        return { success: false, message: 'Profile not found. Please contact admin.' };
      }

      console.log('Profile found with role:', profile.role);

      // Step 4: Verify the profile role matches the login portal
      if (profile.role !== role) {
        console.error(`Role mismatch: expected ${role}, got ${profile.role}`);
        return { success: false, message: `This account is not registered as a ${role}. Please use the correct login portal.` };
      }

      // Step 5: Load the full user profile and student/admin/recruiter record
      await loadUserProfile(data.user.id, email);
      
      // Step 6: Refresh all data (students, job drives, applications, etc.)
      await refreshData();
      
      console.log('Login successful');
      return { success: true, message: 'Login successful' };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const signup = async (email: string, password: string, role: UserRole, data: any) => {
    try {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) return { success: false, message: authError.message };
      if (!authData.user) return { success: false, message: 'Signup failed' };

      const userId = authData.user.id;

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: userId, email, role });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { success: false, message: 'Failed to create profile: ' + profileError.message };
      }

      // Create role-specific record
      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: userId,
            name: data.name,
            roll_number: data.rollNumber,
            phone: data.phone,
            dob: data.dob || null,
            branch: data.branch,
            year: data.year || 4,
            cgpa: data.cgpa || 0,
            skills: data.skills || [],
            placement_status: 'NOT_PLACED',
          });
        if (studentError) {
          console.error('Student creation error:', studentError);
          return { success: false, message: 'Failed to create student record: ' + studentError.message };
        }
      } else if (role === 'recruiter') {
        const { error: recruiterError } = await supabase
          .from('recruiters')
          .insert({
            user_id: userId,
            company_name: data.companyName,
            recruiter_name: data.recruiterName,
            email: email,
            phone: data.phone,
            address: data.address || '',
            website: data.website || '',
            description: data.description || '',
            approval_status: 'PENDING',
          });
        if (recruiterError) {
          console.error('Recruiter creation error:', recruiterError);
          return { success: false, message: 'Failed to create recruiter record: ' + recruiterError.message };
        }

        // Notify admins about new registration
        const { data: adminProfiles } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (adminProfiles && adminProfiles.length > 0) {
          await supabase.from('notifications').insert({
            user_id: adminProfiles[0].id,
            title: 'New Company Registration',
            message: `${data.companyName} has registered and is pending approval.`,
            read: false,
            type: 'warning',
          });
        }
      } else if (role === 'admin') {
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            user_id: userId,
            name: data.name,
            employee_id: data.rollNumber,
            phone: data.phone,
            department: data.department || 'Training & Placement',
          });
        if (adminError) {
          console.error('Admin creation error:', adminError);
          return { success: false, message: 'Failed to create admin record: ' + adminError.message };
        }
      }

      await loadUserProfile(userId, email);
      await refreshData();
      return { success: true, message: 'Registration successful' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const addNotification = async (userId: string, title: string, message: string, type: Notification['type']) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      read: false,
      type,
    });
    if (!error) await refreshData();
  };

  const markNotificationRead = async (id: string) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const getUnreadCount = (userId: string) => {
    return state.notifications.filter(n => n.userId === userId && !n.read).length;
  };

  const addApplication = async (app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>) => {
    // Check for duplicate
    const existing = state.applications.find(a => a.studentId === app.studentId && a.jobDriveId === app.jobDriveId);
    if (existing) return null;

    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: app.studentId,
        job_drive_id: app.jobDriveId,
        status: app.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Application error:', error);
      return null;
    }

    await refreshData();
    return data ? mapApplication(data) : null;
  };

  const updateApplicationStatus = async (id: string, status: Application['status']) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      applications: prev.applications.map(a => a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a),
    }));
    await supabase.from('applications').update({ status }).eq('id', id);
    await refreshData();
  };

  const addTestResult = async (result: Omit<TestResult, 'id' | 'submittedAt'>) => {
    const { error } = await supabase.from('test_results').insert({
      application_id: result.applicationId,
      student_id: result.studentId,
      job_drive_id: result.jobDriveId,
      score: result.score,
      total_questions: result.totalQuestions,
      percentage: result.percentage,
      passed: result.passed,
    });
    if (!error) await refreshData();
  };

  const addJobDrive = async (drive: Omit<JobDrive, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('job_drives').insert({
      recruiter_id: drive.recruiterId,
      company_name: drive.companyName,
      job_role: drive.jobRole,
      job_description: drive.jobDescription,
      package: drive.package,
      location: drive.location,
      job_type: drive.jobType,
      eligibility_cgpa: drive.eligibilityCGPA,
      eligible_branches: drive.eligibleBranches,
      required_skills: drive.requiredSkills,
      openings: drive.openings,
      deadline: drive.deadline,
      test_duration: drive.testDuration,
      test_pass_percentage: drive.testPassPercentage,
      status: drive.status,
    });
    if (!error) await refreshData();
  };

  const updateJobDrive = async (id: string, data: Partial<JobDrive>) => {
    const dbData: any = {};
    if (data.jobRole !== undefined) dbData.job_role = data.jobRole;
    if (data.jobDescription !== undefined) dbData.job_description = data.jobDescription;
    if (data.package !== undefined) dbData.package = data.package;
    if (data.location !== undefined) dbData.location = data.location;
    if (data.jobType !== undefined) dbData.job_type = data.jobType;
    if (data.eligibilityCGPA !== undefined) dbData.eligibility_cgpa = data.eligibilityCGPA;
    if (data.eligibleBranches !== undefined) dbData.eligible_branches = data.eligibleBranches;
    if (data.requiredSkills !== undefined) dbData.required_skills = data.requiredSkills;
    if (data.openings !== undefined) dbData.openings = data.openings;
    if (data.deadline !== undefined) dbData.deadline = data.deadline;
    if (data.testDuration !== undefined) dbData.test_duration = data.testDuration;
    if (data.testPassPercentage !== undefined) dbData.test_pass_percentage = data.testPassPercentage;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.companyName !== undefined) dbData.company_name = data.companyName;

    await supabase.from('job_drives').update(dbData).eq('id', id);
    await refreshData();
  };

  const deleteJobDrive = async (id: string) => {
    await supabase.from('applications').delete().eq('job_drive_id', id);
    await supabase.from('job_drives').delete().eq('id', id);
    await refreshData();
  };

  const updateRecruiterApproval = async (id: string, status: Recruiter['approvalStatus']) => {
    const recruiter = state.recruiters.find(r => r.id === id);
    await supabase.from('recruiters').update({ approval_status: status }).eq('id', id);

    if (recruiter) {
      await supabase.from('notifications').insert({
        user_id: recruiter.userId,
        title: status === 'APPROVED' ? 'Company Approved' : 'Company Rejected',
        message: status === 'APPROVED'
          ? `Your company ${recruiter.companyName} has been approved. You can now create job drives.`
          : `Your company ${recruiter.companyName} registration has been rejected.`,
        read: false,
        type: status === 'APPROVED' ? 'success' : 'error',
      });
    }
    await refreshData();
  };

  const updateStudentProfile = async (id: string, data: Partial<Student>) => {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.phone !== undefined) dbData.phone = data.phone;
    if (data.cgpa !== undefined) dbData.cgpa = data.cgpa;
    if (data.skills !== undefined) dbData.skills = data.skills;
    if (data.resumeUrl !== undefined) dbData.resume_url = data.resumeUrl;

    // Optimistic update
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, ...data } : s),
    }));

    await supabase.from('students').update(dbData).eq('id', id);
    await refreshData();
  };

  const addPlacement = async (placement: Omit<Placement, 'id'>) => {
    await supabase.from('placements').insert({
      student_id: placement.studentId,
      job_drive_id: placement.jobDriveId,
      company_name: placement.companyName,
      job_role: placement.jobRole,
      package: placement.package,
      selection_date: placement.selectionDate,
      status: placement.status,
    });

    // Update student placement status
    await supabase.from('students').update({ placement_status: 'PLACED' }).eq('id', placement.studentId);
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      ...state,
      currentUser,
      currentStudent,
      currentAdmin,
      currentRecruiter,
      loading,
      authLoading,
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
      refreshData,
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
