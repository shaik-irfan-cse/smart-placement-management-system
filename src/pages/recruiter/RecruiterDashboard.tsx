import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Briefcase, FileText, Users, BookOpen, Bell, CheckCircle, XCircle, Plus, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApp } from '../../contexts/AppContext';
import { StatsCard, StatusBadge, Modal, ConfirmDialog, showToast, EmptyState, SearchInput } from '../../components/UI';
import { JobDrive } from '../../types';

const navItems = [
  { label: 'Dashboard', path: '/recruiter/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Company Profile', path: '/recruiter/profile', icon: <Building2 className="w-4 h-4" /> },
  { label: 'Job Drives', path: '/recruiter/drives', icon: <Briefcase className="w-4 h-4" /> },
  { label: 'Applications', path: '/recruiter/applications', icon: <FileText className="w-4 h-4" /> },
  { label: 'Candidates', path: '/recruiter/candidates', icon: <Users className="w-4 h-4" /> },
  { label: 'Test Results', path: '/recruiter/tests', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Notifications', path: '/recruiter/notifications', icon: <Bell className="w-4 h-4" /> },
];

export default function RecruiterDashboard() {
  const { currentRecruiter, loading, currentUser } = useApp();
  const location = useLocation();
  const path = location.pathname;

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout navItems={navItems} role="recruiter" userName="Recruiter">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if recruiter record doesn't exist
  if (currentUser && !currentRecruiter) {
    return (
      <DashboardLayout navItems={navItems} role="recruiter" userName="Recruiter">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Recruiter Record Not Found</h2>
            <p className="text-gray-600 mb-4">
              Your account is authenticated, but we couldn't find your recruiter record in the database.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-2">Possible causes:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Registration didn't complete successfully</li>
                <li>• Company approval is pending</li>
                <li>• Database synchronization delay</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Please contact the placement cell if the issue persists.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retry Loading
              </button>
              <button
                onClick={async () => {
                  const { supabase } = await import('../../lib/supabase');
                  await supabase.auth.signOut();
                  window.location.href = '/login/recruiter';
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Logout & Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderPage = () => {
    if (path.startsWith('/recruiter/profile')) return <CompanyProfilePage />;
    if (path.startsWith('/recruiter/drives')) return <JobDrivesPage />;
    if (path.startsWith('/recruiter/applications')) return <ApplicationsPage />;
    if (path.startsWith('/recruiter/candidates')) return <CandidatesPage />;
    if (path.startsWith('/recruiter/tests')) return <TestResultsPage />;
    if (path.startsWith('/recruiter/notifications')) return <NotificationsPage />;
    return <DashboardHome />;
  };

  return (
    <DashboardLayout navItems={navItems} role="recruiter" userName={currentRecruiter?.companyName || 'Recruiter'}>
      {renderPage()}
    </DashboardLayout>
  );
}

function DashboardHome() {
  const { currentRecruiter, jobDrives, applications, testResults, students, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600">Please refresh the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  const myDrives = jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id);
  const myDriveIds = myDrives.map(d => d.id);
  const myApps = applications.filter(a => myDriveIds.includes(a.jobDriveId));
  const testsCompleted = testResults.filter(r => myDriveIds.includes(r.jobDriveId));
  const passed = testsCompleted.filter(r => r.passed);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentRecruiter.companyName}</h1>
        <p className="text-gray-500 mt-1">Manage your recruitment drives</p>
      </div>

      {currentRecruiter.approvalStatus !== 'APPROVED' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">
              {currentRecruiter.approvalStatus === 'PENDING' ? '⏳ Pending Admin Approval' : '❌ Company Registration Rejected'}
            </p>
            <p className="text-sm text-yellow-600">
              {currentRecruiter.approvalStatus === 'PENDING'
                ? 'Your company is being reviewed by the admin. You can create job drives once approved.'
                : 'Your registration was rejected. Please contact the placement cell.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Active Drives" value={myDrives.filter(d => d.status === 'ACTIVE').length} icon={<Briefcase className="w-5 h-5" />} color="green" />
        <StatsCard title="Total Applicants" value={myApps.length} icon={<FileText className="w-5 h-5" />} color="blue" />
        <StatsCard title="Tests Completed" value={testsCompleted.length} icon={<BookOpen className="w-5 h-5" />} color="purple" />
        <StatsCard title="Candidates Passed" value={passed.length} icon={<CheckCircle className="w-5 h-5" />} color="indigo" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h2>
          <div className="space-y-3">
            {myApps.slice(0, 5).map(app => {
              const student = students.find(s => s.id === app.studentId);
              const drive = myDrives.find(d => d.id === app.jobDriveId);
              return (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{student?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{drive?.jobRole}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              );
            })}
            {myApps.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No applications yet</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Job Drives</h2>
          <div className="space-y-3">
            {myDrives.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">{d.jobRole}</p>
                  <p className="text-xs text-gray-500">{d.package} • {d.openings} openings</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
            {myDrives.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No job drives created yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyProfilePage() {
  const { currentRecruiter, currentUser, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Profile</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-500 mt-1">Your company information</p>
      </div>

      <div className="card max-w-2xl">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold">
            {currentRecruiter.companyName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentRecruiter.companyName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {currentRecruiter.approvalStatus === 'APPROVED' ? (
                <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Company Approved
                </span>
              ) : currentRecruiter.approvalStatus === 'PENDING' ? (
                <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                  ⏳ Pending Admin Approval
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                  <XCircle className="w-4 h-4" /> Registration Rejected
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-xs text-gray-500 mb-1">Recruiter Name</p><p className="font-medium text-sm">{currentRecruiter.recruiterName}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-medium text-sm break-all">{currentUser?.email || 'N/A'}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Phone</p><p className="font-medium text-sm">{currentRecruiter.phone}</p></div>
          <div><p className="text-xs text-gray-500 mb-1">Website</p><p className="font-medium text-sm">{currentRecruiter.website || 'N/A'}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Address</p><p className="font-medium text-sm">{currentRecruiter.address || 'N/A'}</p></div>
          <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-600">{currentRecruiter.description || 'No description provided'}</p></div>
        </div>
      </div>
    </div>
  );
}

function JobDrivesPage() {
  const { currentRecruiter, jobDrives, addJobDrive, updateJobDrive, deleteJobDrive, applications, loading } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [editingDrive, setEditingDrive] = useState<JobDrive | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobRole: '', jobDescription: '', package: '', location: '', jobType: 'Full-time',
    eligibilityCGPA: '7.0', eligibleBranches: 'CSE,IT', requiredSkills: '',
    openings: '10', deadline: '', testDuration: '30', testPassPercentage: '60',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Job Drives</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  const myDrives = jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id);

  const openCreate = () => {
    setFormData({ jobRole: '', jobDescription: '', package: '', location: '', jobType: 'Full-time', eligibilityCGPA: '7.0', eligibleBranches: 'CSE,IT', requiredSkills: '', openings: '10', deadline: '', testDuration: '30', testPassPercentage: '60' });
    setEditingDrive(null);
    setShowCreate(true);
  };

  const openEdit = (drive: JobDrive) => {
    setFormData({
      jobRole: drive.jobRole, jobDescription: drive.jobDescription, package: drive.package, location: drive.location, jobType: drive.jobType,
      eligibilityCGPA: drive.eligibilityCGPA.toString(), eligibleBranches: drive.eligibleBranches.join(','), requiredSkills: drive.requiredSkills.join(','),
      openings: drive.openings.toString(), deadline: drive.deadline, testDuration: drive.testDuration.toString(), testPassPercentage: drive.testPassPercentage.toString(),
    });
    setEditingDrive(drive);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRecruiter.approvalStatus !== 'APPROVED') {
      showToast('Your company must be approved before creating job drives', 'error');
      return;
    }

    const driveData = {
      recruiterId: currentRecruiter.id,
      companyName: currentRecruiter.companyName,
      jobRole: formData.jobRole,
      jobDescription: formData.jobDescription,
      package: formData.package,
      location: formData.location,
      jobType: formData.jobType,
      eligibilityCGPA: parseFloat(formData.eligibilityCGPA),
      eligibleBranches: formData.eligibleBranches.split(',').map(s => s.trim()),
      requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()),
      openings: parseInt(formData.openings),
      deadline: formData.deadline,
      testDuration: parseInt(formData.testDuration),
      testPassPercentage: parseInt(formData.testPassPercentage),
      status: 'ACTIVE' as const,
    };

    if (editingDrive) {
      await updateJobDrive(editingDrive.id, driveData);
      showToast('Job drive updated successfully!', 'success');
    } else {
      await addJobDrive(driveData);
      showToast('Job drive created successfully!', 'success');
    }
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    await deleteJobDrive(id);
    showToast('Job drive deleted', 'info');
  };

  const handleClose = async (id: string) => {
    await updateJobDrive(id, { status: 'CLOSED' });
    showToast('Job drive closed', 'info');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Drives</h1>
          <p className="text-gray-500 mt-1">Create and manage your recruitment drives</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2" disabled={currentRecruiter.approvalStatus !== 'APPROVED'}>
          <Plus className="w-4 h-4" /> Create Drive
        </button>
      </div>

      {currentRecruiter.approvalStatus !== 'APPROVED' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-700">⚠️ You need admin approval to create job drives.</p>
        </div>
      )}

      <div className="space-y-4">
        {myDrives.map(drive => {
          const appCount = applications.filter(a => a.jobDriveId === drive.id).length;
          return (
            <div key={drive.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{drive.jobRole}</h3>
                    <StatusBadge status={drive.status} />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{drive.package} • {drive.location} • {drive.openings} openings</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>📅 Deadline: {drive.deadline}</span>
                    <span>🎓 CGPA ≥ {drive.eligibilityCGPA}</span>
                    <span>📝 {appCount} applications</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(drive)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Edit className="w-4 h-4" /></button>
                  {drive.status === 'ACTIVE' && (
                    <button onClick={() => handleClose(drive.id)} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"><XCircle className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => setConfirmDelete(drive.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {myDrives.length === 0 && (
          <EmptyState icon={<Briefcase className="w-12 h-12" />} title="No Job Drives" description="Create your first job drive to start recruiting." action={<button onClick={openCreate} className="btn-primary">Create Drive</button>} />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={editingDrive ? 'Edit Job Drive' : 'Create Job Drive'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Role *</label>
              <input type="text" value={formData.jobRole} onChange={e => setFormData({ ...formData, jobRole: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package / Salary *</label>
              <input type="text" value={formData.package} onChange={e => setFormData({ ...formData, package: e.target.value })} className="input-field" placeholder="e.g., ₹7 LPA" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
            <textarea value={formData.jobDescription} onChange={e => setFormData({ ...formData, jobDescription: e.target.value })} className="input-field" rows={3} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select value={formData.jobType} onChange={e => setFormData({ ...formData, jobType: e.target.value })} className="input-field">
                <option>Full-time</option><option>Part-time</option><option>Internship</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min CGPA</label>
              <input type="number" step="0.1" value={formData.eligibilityCGPA} onChange={e => setFormData({ ...formData, eligibilityCGPA: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Openings</label>
              <input type="number" value={formData.openings} onChange={e => setFormData({ ...formData, openings: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Branches (comma sep.)</label>
              <input type="text" value={formData.eligibleBranches} onChange={e => setFormData({ ...formData, eligibleBranches: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma sep.)</label>
              <input type="text" value={formData.requiredSkills} onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Duration (min)</label>
              <input type="number" value={formData.testDuration} onChange={e => setFormData({ ...formData, testDuration: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pass %</label>
              <input type="number" value={formData.testPassPercentage} onChange={e => setFormData({ ...formData, testPassPercentage: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingDrive ? 'Update' : 'Create'} Job Drive</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Delete Job Drive"
        message="Are you sure you want to delete this job drive? All associated applications will also be removed."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

function ApplicationsPage() {
  const { currentRecruiter, jobDrives, applications, students, testResults, updateApplicationStatus, addNotification, addPlacement, loading } = useApp();
  const [filterDrive, setFilterDrive] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ appId: string; action: 'SELECTED' | 'REJECTED' } | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Applications</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  const myDriveIds = jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id).map(d => d.id);
  const myApps = applications.filter(a => myDriveIds.includes(a.jobDriveId));

  const filtered = myApps.filter(a => {
    if (filterDrive && a.jobDriveId !== filterDrive) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const handleAction = async (appId: string, action: 'SELECTED' | 'REJECTED') => {
    await updateApplicationStatus(appId, action);
    const app = applications.find(a => a.id === appId);
    if (app) {
      const student = students.find(s => s.id === app.studentId);
      const jd = jobDrives.find(j => j.id === app.jobDriveId);
      if (student && jd) {
        addNotification(student.userId, action === 'SELECTED' ? 'Congratulations!' : 'Application Update', action === 'SELECTED' ? `You have been selected by ${jd.companyName} for ${jd.jobRole}!` : `Your application for ${jd.jobRole} at ${jd.companyName} was not selected.`, action === 'SELECTED' ? 'success' : 'info');
        if (action === 'SELECTED') {
          addPlacement({ studentId: student.id, jobDriveId: jd.id, companyName: jd.companyName, jobRole: jd.jobRole, package: jd.package, selectionDate: new Date().toISOString().split('T')[0], status: 'PLACED' });
        }
      }
    }
    showToast(action === 'SELECTED' ? 'Candidate selected!' : 'Candidate rejected', action === 'SELECTED' ? 'success' : 'info');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage candidate applications</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select value={filterDrive} onChange={e => setFilterDrive(e.target.value)} className="input-field sm:w-64">
          <option value="">All Job Drives</option>
          {jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id).map(jd => (
            <option key={jd.id} value={jd.id}>{jd.jobRole} - {jd.companyName}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field sm:w-48">
          <option value="">All Statuses</option>
          {['APPLIED', 'TEST_PENDING', 'PASSED', 'FAILED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Roll No.</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">CGPA</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Test Score</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => {
              const student = students.find(s => s.id === app.studentId);
              const jd = jobDrives.find(j => j.id === app.jobDriveId);
              const result = testResults.find(r => r.applicationId === app.id);
              return (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedApp(app.id)} className="font-medium text-sm text-indigo-600 hover:text-indigo-700">{student?.name || 'Unknown'}</button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student?.rollNumber || '-'}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student?.cgpa || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{result ? `${result.score}/${result.totalQuestions} (${result.percentage}%)` : '-'}</td>
                  <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                  <td className="py-3 px-4">
                    {(app.status === 'PASSED' || app.status === 'UNDER_REVIEW') && (
                      <div className="flex gap-1">
                        <button onClick={() => setConfirmAction({ appId: app.id, action: 'SELECTED' })} className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmAction({ appId: app.id, action: 'REJECTED' })} className="p-1.5 rounded hover:bg-red-50 text-red-600"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <EmptyState icon={<FileText className="w-12 h-12" />} title="No Applications" description="No applications match your filters." />}

      {/* Candidate Details Modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Candidate Details" size="lg">
        {selectedApp && (() => {
          const app = applications.find(a => a.id === selectedApp);
          if (!app) return null;
          const student = students.find(s => s.id === app.studentId);
          const jd = jobDrives.find(j => j.id === app.jobDriveId);
          const result = testResults.find(r => r.applicationId === app.id);
          if (!student) return null;
          return (
            <div>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold">{student.name.charAt(0)}</div>
                <div>
                  <h3 className="text-lg font-bold">{student.name}</h3>
                  <p className="text-gray-500">{student.rollNumber} • {student.branch} • CGPA: {student.cgpa}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Applied For</p><p className="font-semibold">{jd?.jobRole}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Test Score</p><p className="font-semibold">{result ? `${result.score}/${result.totalQuestions} (${result.percentage}%)` : 'Not taken'}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Applied On</p><p className="font-semibold">{app.appliedAt}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Status</p><StatusBadge status={app.status} /></div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">{student.skills.map(s => <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">{s}</span>)}</div>
              </div>
              {(app.status === 'PASSED' || app.status === 'UNDER_REVIEW') && (
                <div className="flex gap-3 pt-4 border-t">
                  <button onClick={() => { handleAction(app.id, 'SELECTED'); setSelectedApp(null); }} className="btn-success flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Accept</button>
                  <button onClick={() => { handleAction(app.id, 'REJECTED'); setSelectedApp(null); }} className="btn-danger flex items-center gap-2"><XCircle className="w-4 h-4" /> Reject</button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleAction(confirmAction.appId, confirmAction.action)}
        title={confirmAction?.action === 'SELECTED' ? 'Accept Candidate' : 'Reject Candidate'}
        message={confirmAction?.action === 'SELECTED' ? 'Are you sure you want to select this candidate?' : 'Are you sure you want to reject this candidate?'}
        confirmText={confirmAction?.action === 'SELECTED' ? 'Accept' : 'Reject'}
        variant={confirmAction?.action === 'SELECTED' ? 'primary' : 'danger'}
      />
    </div>
  );
}

function CandidatesPage() {
  const { currentRecruiter, jobDrives, applications, students, testResults, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Candidates</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  const myDriveIds = jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id).map(d => d.id);
  const passedApps = applications.filter(a => myDriveIds.includes(a.jobDriveId) && (a.status === 'PASSED' || a.status === 'UNDER_REVIEW' || a.status === 'SELECTED'));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-500 mt-1">View candidates who passed technical tests</p>
      </div>

      <div className="grid gap-4">
        {passedApps.map(app => {
          const student = students.find(s => s.id === app.studentId);
          const jd = jobDrives.find(j => j.id === app.jobDriveId);
          const result = testResults.find(r => r.applicationId === app.id);
          if (!student) return null;
          return (
            <div key={app.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">{student.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.branch} • CGPA: {student.cgpa} • {jd?.jobRole}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{result ? `${result.percentage}%` : '-'}</p>
                  <StatusBadge status={app.status} />
                </div>
              </div>
            </div>
          );
        })}
        {passedApps.length === 0 && <EmptyState icon={<Users className="w-12 h-12" />} title="No Candidates" description="No candidates have passed tests yet." />}
      </div>
    </div>
  );
}

function TestResultsPage() {
  const { currentRecruiter, jobDrives, testResults, students, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentRecruiter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Test Results</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  const myDriveIds = jobDrives.filter(jd => jd.recruiterId === currentRecruiter.id).map(d => d.id);
  const myResults = testResults.filter(r => myDriveIds.includes(r.jobDriveId));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
        <p className="text-gray-500 mt-1">View technical assessment results</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Job Drive</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Score</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Percentage</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Result</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {myResults.map(r => {
              const student = students.find(s => s.id === r.studentId);
              const jd = jobDrives.find(j => j.id === r.jobDriveId);
              return (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{jd?.jobRole}</td>
                  <td className="py-3 px-4 text-sm font-medium">{r.score}/{r.totalQuestions}</td>
                  <td className="py-3 px-4 text-sm">{r.percentage}%</td>
                  <td className="py-3 px-4"><span className={`badge ${r.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.passed ? 'PASSED' : 'FAILED'}</span></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{r.submittedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {myResults.length === 0 && <EmptyState icon={<BookOpen className="w-12 h-12" />} title="No Test Results" description="No candidates have taken tests yet." />}
    </div>
  );
}

function NotificationsPage() {
  const { currentUser, notifications, markNotificationRead, loading } = useApp();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Notifications</h2>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  const myNotifs = notifications.filter(n => n.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">Your notifications and updates</p>
      </div>

      <div className="space-y-3">
        {myNotifs.map(n => (
          <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`card cursor-pointer ${!n.read ? 'border-l-4 border-l-purple-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{n.createdAt}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />}
            </div>
          </div>
        ))}
        {myNotifs.length === 0 && <EmptyState icon={<Bell className="w-12 h-12" />} title="No Notifications" description="You're all caught up!" />}
      </div>
    </div>
  );
}
