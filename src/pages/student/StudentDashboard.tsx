import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, Clock, BookOpen, User, Bell, LayoutDashboard, Search, Filter, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApp } from '../../contexts/AppContext';
import { StatsCard, StatusBadge, Modal, ConfirmDialog, showToast, EmptyState, SearchInput } from '../../components/UI';
import { JobDrive, Application, TestQuestion } from '../../types';

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Job Drives', path: '/student/jobs', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'My Applications', path: '/student/applications', icon: <FileText className="w-4 h-4" /> },
  { label: 'Technical Tests', path: '/student/tests', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Results', path: '/student/results', icon: <CheckCircle className="w-4 h-4" /> },
  { label: 'Notifications', path: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
  { label: 'Profile', path: '/student/profile', icon: <User className="w-4 h-4" /> },
];

export default function StudentDashboard() {
  const { currentStudent } = useApp();
  const location = useLocation();
  const path = location.pathname;

  const renderPage = () => {
    if (path.startsWith('/student/jobs')) return <JobDrivesPage />;
    if (path.startsWith('/student/applications')) return <ApplicationsPage />;
    if (path.startsWith('/student/tests')) return <TestsPage />;
    if (path.startsWith('/student/results')) return <ResultsPage />;
    if (path.startsWith('/student/notifications')) return <NotificationsPage />;
    if (path.startsWith('/student/profile')) return <ProfilePage />;
    return <DashboardHome />;
  };

  return (
    <DashboardLayout navItems={navItems} role="student" userName={currentStudent?.name || 'Student'}>
      {renderPage()}
    </DashboardLayout>
  );
}

function DashboardHome() {
  const { currentStudent, applications, jobDrives, testResults, currentUser } = useApp();
  if (!currentStudent || !currentUser) return null;

  const myApps = applications.filter(a => a.studentId === currentStudent.id);
  const eligibleDrives = jobDrives.filter(jd => jd.status === 'ACTIVE' && jd.eligibleBranches.includes(currentStudent.branch) && currentStudent.cgpa >= jd.eligibilityCGPA);
  const pendingTests = myApps.filter(a => a.status === 'TEST_PENDING');
  const selected = myApps.filter(a => a.status === 'SELECTED');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {currentStudent.name.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1">Here's your placement overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Applications" value={myApps.length} icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatsCard title="Eligible Drives" value={eligibleDrives.length} icon={<Briefcase className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Tests Pending" value={pendingTests.length} icon={<Clock className="w-5 h-5" />} color="orange" />
        <StatsCard title="Selected" value={selected.length} icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Eligible Job Drives */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Eligible Job Drives</h2>
            <span className="text-sm text-indigo-600 font-medium cursor-pointer">View All</span>
          </div>
          <div className="space-y-3">
            {eligibleDrives.slice(0, 4).map(jd => (
              <div key={jd.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{jd.jobRole}</p>
                  <p className="text-xs text-gray-500">{jd.companyName} • {jd.package}</p>
                </div>
                <StatusBadge status={jd.status} />
              </div>
            ))}
            {eligibleDrives.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No eligible drives currently</p>}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          </div>
          <div className="space-y-3">
            {myApps.slice(0, 4).map(app => {
              const jd = jobDrives.find(j => j.id === app.jobDriveId);
              return (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{jd?.jobRole || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{jd?.companyName || 'Unknown'}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              );
            })}
            {myApps.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No applications yet</p>}
          </div>
        </div>
      </div>

      {/* Student Summary */}
      <div className="mt-6 card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-500">Name</p><p className="font-medium text-sm">{currentStudent.name}</p></div>
          <div><p className="text-xs text-gray-500">Roll No.</p><p className="font-medium text-sm">{currentStudent.rollNumber}</p></div>
          <div><p className="text-xs text-gray-500">Branch</p><p className="font-medium text-sm">{currentStudent.branch}</p></div>
          <div><p className="text-xs text-gray-500">CGPA</p><p className="font-medium text-sm">{currentStudent.cgpa}</p></div>
        </div>
      </div>
    </div>
  );
}

function JobDrivesPage() {
  const { currentStudent, jobDrives, applications, addApplication, addNotification, currentUser, updateApplicationStatus } = useApp();
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [selectedDrive, setSelectedDrive] = useState<JobDrive | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reason: string } | null>(null);

  if (!currentStudent) return null;

  const myAppJobIds = applications.filter(a => a.studentId === currentStudent.id).map(a => a.jobDriveId);

  const filteredDrives = jobDrives.filter(jd => {
    if (jd.status !== 'ACTIVE') return false;
    if (search && !jd.jobRole.toLowerCase().includes(search.toLowerCase()) && !jd.companyName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBranch && !jd.eligibleBranches.includes(filterBranch)) return false;
    return true;
  });

  const checkEligibility = (jd: JobDrive) => {
    const reasons: string[] = [];
    if (currentStudent.cgpa < jd.eligibilityCGPA) reasons.push(`CGPA ${currentStudent.cgpa} is below required ${jd.eligibilityCGPA}`);
    if (!jd.eligibleBranches.includes(currentStudent.branch)) reasons.push(`Your branch ${currentStudent.branch} is not eligible. Required: ${jd.eligibleBranches.join(', ')}`);
    if (myAppJobIds.includes(jd.id)) reasons.push('You have already applied for this position');

    return {
      eligible: reasons.length === 0,
      reason: reasons.length === 0 ? 'You are eligible for this job.' : reasons.join('. ')
    };
  };

  const handleApply = async () => {
    if (!eligibilityResult?.eligible || !selectedDrive || !currentUser) return;
    const app = await addApplication({ studentId: currentStudent.id, jobDriveId: selectedDrive.id, status: 'APPLIED' });
    if (app) {
      await addNotification(currentUser.id, 'Application Submitted', `Your application for ${selectedDrive.jobRole} at ${selectedDrive.companyName} has been submitted.`, 'success');
      showToast('Application submitted successfully!', 'success');
      setShowApplyModal(false);
      setSelectedDrive(null);
      setEligibilityResult(null);
    } else {
      showToast('Failed to submit application. You may have already applied.', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Drives</h1>
        <p className="text-gray-500 mt-1">Explore available placement opportunities</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by role or company..." />
        </div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="input-field sm:w-48">
          <option value="">All Branches</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
          <option value="ME">ME</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredDrives.map(jd => {
          const alreadyApplied = myAppJobIds.includes(jd.id);
          return (
            <div key={jd.id} className="card hover:border-indigo-200 transition-all cursor-pointer" onClick={() => { setSelectedDrive(jd); setEligibilityResult(checkEligibility(jd)); }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{jd.jobRole}</h3>
                    <StatusBadge status={jd.status} />
                  </div>
                  <p className="text-sm text-gray-600">{jd.companyName}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    <span>💰 {jd.package}</span>
                    <span>📍 {jd.location}</span>
                    <span>🎓 CGPA ≥ {jd.eligibilityCGPA}</span>
                    <span>👥 {jd.openings} openings</span>
                    <span>📅 Deadline: {jd.deadline}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {jd.requiredSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  {alreadyApplied ? (
                    <span className="badge bg-green-100 text-green-700">Applied ✓</span>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setSelectedDrive(jd); setEligibilityResult(checkEligibility(jd)); }} className="btn-primary text-sm">
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredDrives.length === 0 && (
          <EmptyState icon={<Briefcase className="w-12 h-12" />} title="No Job Drives Found" description="There are no active job drives matching your criteria." />
        )}
      </div>

      {/* Job Details Modal */}
      <Modal isOpen={!!selectedDrive} onClose={() => { setSelectedDrive(null); setEligibilityResult(null); }} title="Job Drive Details" size="lg">
        {selectedDrive && (
          <div>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedDrive.jobRole}</h3>
              <p className="text-gray-600">{selectedDrive.companyName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Package</p><p className="font-semibold">{selectedDrive.package}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Location</p><p className="font-semibold">{selectedDrive.location}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Openings</p><p className="font-semibold">{selectedDrive.openings}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Job Type</p><p className="font-semibold">{selectedDrive.jobType}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Min CGPA</p><p className="font-semibold">{selectedDrive.eligibilityCGPA}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Deadline</p><p className="font-semibold">{selectedDrive.deadline}</p></div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Job Description</p>
              <p className="text-sm text-gray-600">{selectedDrive.jobDescription}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Eligible Branches</p>
              <div className="flex gap-2">{selectedDrive.eligibleBranches.map(b => <span key={b} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{b}</span>)}</div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">Required Skills</p>
              <div className="flex flex-wrap gap-2">{selectedDrive.requiredSkills.map(s => <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{s}</span>)}</div>
            </div>

            {/* Eligibility Check */}
            {eligibilityResult && (
              <div className={`p-4 rounded-lg mb-4 ${eligibilityResult.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {eligibilityResult.eligible ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                  <p className={`text-sm font-medium ${eligibilityResult.eligible ? 'text-green-800' : 'text-red-800'}`}>
                    {eligibilityResult.reason}
                  </p>
                </div>
              </div>
            )}

            {eligibilityResult?.eligible && (
              <button onClick={() => setShowApplyModal(true)} className="w-full btn-primary">
                Apply Now
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Apply Confirmation */}
      <ConfirmDialog
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleApply}
        title="Confirm Application"
        message={`Are you sure you want to apply for ${selectedDrive?.jobRole} at ${selectedDrive?.companyName}?`}
        confirmText="Apply"
        variant="primary"
      />
    </div>
  );
}

function ApplicationsPage() {
  const { currentStudent, applications, jobDrives, testResults } = useApp();
  if (!currentStudent) return null;

  const myApps = applications.filter(a => a.studentId === currentStudent.id);

  const getTimeline = (status: string) => {
    const steps = ['APPLIED', 'TEST_PENDING', 'TEST_COMPLETED', 'PASSED', 'UNDER_REVIEW', 'SELECTED'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, i) => ({
      label: step.replace('_', ' '),
      active: i <= currentIndex,
      current: step === status,
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-500 mt-1">Track your application status</p>
      </div>

      <div className="space-y-4">
        {myApps.map(app => {
          const jd = jobDrives.find(j => j.id === app.jobDriveId);
          const result = testResults.find(r => r.applicationId === app.id);
          const timeline = getTimeline(app.status);

          return (
            <div key={app.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{jd?.jobRole || 'Unknown Role'}</h3>
                  <p className="text-sm text-gray-500">{jd?.companyName || 'Unknown Company'}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {timeline.map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${step.active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'} ${step.current ? 'ring-2 ring-indigo-300' : ''}`}>
                      {step.active && <CheckCircle className="w-3 h-3" />}
                      {step.label}
                    </div>
                    {i < timeline.length - 1 && <div className={`w-4 h-0.5 ${step.active ? 'bg-indigo-300' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>

              {result && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Test Score: <span className="font-medium text-gray-900">{result.score}/{result.totalQuestions} ({result.percentage}%)</span></p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">Applied: {app.appliedAt}</p>
            </div>
          );
        })}
        {myApps.length === 0 && (
          <EmptyState icon={<FileText className="w-12 h-12" />} title="No Applications" description="You haven't applied to any job drives yet." />
        )}
      </div>
    </div>
  );
}

function TestsPage() {
  const { currentStudent, applications, jobDrives, testQuestions, addTestResult, updateApplicationStatus, addNotification, currentUser } = useApp();
  const [activeTest, setActiveTest] = useState<Application | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);

  if (!currentStudent) return null;

  const pendingTests = applications.filter(a => a.studentId === currentStudent.id && a.status === 'TEST_PENDING');
  const completedTests = applications.filter(a => a.studentId === currentStudent.id && (a.status === 'PASSED' || a.status === 'FAILED'));

  // Use testQuestions from Supabase, fallback to empty array
  const questions = testQuestions.length > 0 ? testQuestions.slice(0, 20) : [];

  const startTest = (app: Application) => {
    if (questions.length === 0) {
      showToast('No test questions available. Please contact admin.', 'error');
      return;
    }
    setActiveTest(app);
    setCurrentQ(0);
    setAnswers({});
    setTestSubmitted(false);
    const jd = jobDrives.find(j => j.id === app.jobDriveId);
    setTimeLeft((jd?.testDuration || 30) * 60);
  };

  const submitTest = () => {
    if (!activeTest || !currentUser || questions.length === 0) return;
    let score = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    const jd = jobDrives.find(j => j.id === activeTest.jobDriveId);
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= (jd?.testPassPercentage || 60);

    addTestResult({
      applicationId: activeTest.id,
      studentId: currentStudent.id,
      jobDriveId: activeTest.jobDriveId,
      score,
      totalQuestions: questions.length,
      percentage,
      passed,
    });

    updateApplicationStatus(activeTest.id, passed ? 'PASSED' : 'FAILED');
    addNotification(currentUser.id, passed ? 'Test Passed!' : 'Test Result', passed ? `You passed the test with ${percentage}%!` : `You scored ${percentage}%. Unfortunately, you did not pass.`, passed ? 'success' : 'error');
    setTestSubmitted(true);
    showToast(passed ? 'Test submitted! You passed!' : 'Test submitted. Unfortunately, you did not pass.', passed ? 'success' : 'error');
  };

  useEffect(() => {
    if (activeTest && timeLeft > 0 && !testSubmitted) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
    if (activeTest && timeLeft === 0 && !testSubmitted) {
      submitTest();
    }
  }, [activeTest, timeLeft, testSubmitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (activeTest && !testSubmitted) {
    const jd = jobDrives.find(j => j.id === activeTest.jobDriveId);
    const q = questions[currentQ];

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Technical Assessment</h1>
            <p className="text-gray-500">{jd?.companyName} - {jd?.jobRole}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        <div className="card max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">Question {currentQ + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)} className={`w-7 h-7 rounded text-xs font-medium ${i === currentQ ? 'bg-indigo-600 text-white' : answers[questions[i].id] !== undefined ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-6">{q.question}</h3>

          <div className="space-y-3 mb-8">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[q.id] === i ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <span className="font-medium text-sm">{String.fromCharCode(65 + i)}.</span> {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="btn-secondary" >
              Previous
            </button>
            {currentQ === questions.length - 1 ? (
              <button onClick={submitTest} className="btn-primary">
                Submit Test
              </button>
            ) : (
              <button onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} className="btn-primary">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (testSubmitted) {
    let score = 0;
    questions.forEach((q: any) => { if (answers[q.id] === q.correctAnswer) score++; });
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const jd = jobDrives.find(j => j.id === activeTest?.jobDriveId);
    const passed = percentage >= (jd?.testPassPercentage || 60);

    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed ? <CheckCircle className="w-10 h-10 text-green-600" /> : <AlertCircle className="w-10 h-10 text-red-600" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{passed ? 'Congratulations!' : 'Better Luck Next Time'}</h2>
        <p className="text-gray-500 mb-6">Your test has been evaluated</p>
        <div className="card text-left">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500">Score</p><p className="text-xl font-bold">{score}/{questions.length}</p></div>
            <div><p className="text-xs text-gray-500">Percentage</p><p className="text-xl font-bold">{percentage}%</p></div>
            <div><p className="text-xs text-gray-500">Result</p><p className={`text-xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{passed ? 'PASSED' : 'FAILED'}</p></div>
            <div><p className="text-xs text-gray-500">Pass %</p><p className="text-xl font-bold">{jd?.testPassPercentage}%</p></div>
          </div>
        </div>
        <button onClick={() => setActiveTest(null)} className="btn-primary mt-6">Back to Tests</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Technical Tests</h1>
        <p className="text-gray-500 mt-1">Take assessments and view results</p>
      </div>

      {pendingTests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tests</h2>
          <div className="grid gap-4">
            {pendingTests.map(app => {
              const jd = jobDrives.find(j => j.id === app.jobDriveId);
              return (
                <div key={app.id} className="card flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{jd?.jobRole}</h3>
                    <p className="text-sm text-gray-500">{jd?.companyName} • Duration: {jd?.testDuration} min • {jd?.testPassPercentage}% to pass</p>
                  </div>
                  <button onClick={() => startTest(app)} className="btn-primary">Start Test</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Tests</h2>
      <div className="grid gap-4">
        {completedTests.map(app => {
          const jd = jobDrives.find(j => j.id === app.jobDriveId);
          return (
            <div key={app.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{jd?.jobRole}</h3>
                <p className="text-sm text-gray-500">{jd?.companyName}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          );
        })}
        {completedTests.length === 0 && pendingTests.length === 0 && (
          <EmptyState icon={<BookOpen className="w-12 h-12" />} title="No Tests" description="No tests available at the moment." />
        )}
      </div>
    </div>
  );
}

function ResultsPage() {
  const { currentStudent, testResults, jobDrives } = useApp();
  if (!currentStudent) return null;

  const myResults = testResults.filter(r => r.studentId === currentStudent.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-500 mt-1">View your assessment results</p>
      </div>

      <div className="grid gap-4">
        {myResults.map(result => {
          const jd = jobDrives.find(j => j.id === result.jobDriveId);
          return (
            <div key={result.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{jd?.jobRole}</h3>
                  <p className="text-sm text-gray-500">{jd?.companyName}</p>
                </div>
                <span className={`badge ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-lg font-bold">{result.score}/{result.totalQuestions}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Percentage</p>
                  <p className="text-lg font-bold">{result.percentage}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-lg font-bold text-sm">{result.submittedAt}</p>
                </div>
              </div>
            </div>
          );
        })}
        {myResults.length === 0 && (
          <EmptyState icon={<CheckCircle className="w-12 h-12" />} title="No Results Yet" description="Complete a test to see your results here." />
        )}
      </div>
    </div>
  );
}

function NotificationsPage() {
  const { currentUser, notifications, markNotificationRead } = useApp();
  if (!currentUser) return null;

  const myNotifs = notifications.filter(n => n.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">Stay updated with your placement activities</p>
      </div>

      <div className="space-y-3">
        {myNotifs.map(n => (
          <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`card cursor-pointer ${!n.read ? 'border-l-4 border-l-indigo-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{n.createdAt}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-2" />}
            </div>
          </div>
        ))}
        {myNotifs.length === 0 && (
          <EmptyState icon={<Bell className="w-12 h-12" />} title="No Notifications" description="You're all caught up!" />
        )}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { currentStudent, updateStudentProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (!currentStudent) return null;

  const startEdit = () => {
    setFormData({
      name: currentStudent.name,
      email: currentStudent.email,
      phone: currentStudent.phone,
      skills: currentStudent.skills.join(', '),
      cgpa: currentStudent.cgpa,
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    await updateStudentProfile(currentStudent.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      cgpa: parseFloat(formData.cgpa),
      skills: formData.skills.split(',').map((s: string) => s.trim()),
    });
    setEditing(false);
    showToast('Profile updated successfully!', 'success');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information</p>
        </div>
        {!editing && <button onClick={startEdit} className="btn-primary">Edit Profile</button>}
      </div>

      <div className="card max-w-2xl">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
              <input type="number" step="0.01" value={formData.cgpa} onChange={e => setFormData({ ...formData, cgpa: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input type="text" value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="input-field" />
            </div>
            <div className="flex gap-3">
              <button onClick={saveProfile} className="btn-primary">Save Changes</button>
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                {currentStudent.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentStudent.name}</h2>
                <p className="text-gray-500">{currentStudent.rollNumber} • {currentStudent.branch}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-medium text-sm">{currentStudent.email}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Phone</p><p className="font-medium text-sm">{currentStudent.phone}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Date of Birth</p><p className="font-medium text-sm">{currentStudent.dob}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Branch</p><p className="font-medium text-sm">{currentStudent.branch}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">Year</p><p className="font-medium text-sm">{currentStudent.year}</p></div>
              <div><p className="text-xs text-gray-500 mb-1">CGPA</p><p className="font-medium text-sm">{currentStudent.cgpa}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Status</p><StatusBadge status={currentStudent.placementStatus} /></div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {currentStudent.skills.map(s => <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">{s}</span>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
