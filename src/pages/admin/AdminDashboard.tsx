import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Briefcase, FileText, Award, BarChart3, Bell, User, CheckCircle, XCircle, Eye, Search, Shield } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useApp } from '../../contexts/AppContext';
import { StatsCard, StatusBadge, Modal, ConfirmDialog, showToast, EmptyState, SearchInput } from '../../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { currentAdmin, isHeadAdmin } = useApp();
  const location = useLocation();
  const path = location.pathname;

  // Build nav items dynamically based on head admin status
  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Students', path: '/admin/students', icon: <Users className="w-4 h-4" /> },
    { label: 'Companies', path: '/admin/companies', icon: <Building2 className="w-4 h-4" /> },
    { label: 'Job Drives', path: '/admin/drives', icon: <Briefcase className="w-4 h-4" /> },
    { label: 'Applications', path: '/admin/applications', icon: <FileText className="w-4 h-4" /> },
    { label: 'Placements', path: '/admin/placements', icon: <Award className="w-4 h-4" /> },
    { label: 'Reports', path: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Notifications', path: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
    ...(isHeadAdmin() ? [{ label: 'Admin Requests', path: '/admin/requests', icon: <Shield className="w-4 h-4" /> }] : []),
  ];

  const renderPage = () => {
    if (path.startsWith('/admin/students')) return <StudentsPage />;
    if (path.startsWith('/admin/companies')) return <CompaniesPage />;
    if (path.startsWith('/admin/drives')) return <DrivesPage />;
    if (path.startsWith('/admin/applications')) return <ApplicationsPage />;
    if (path.startsWith('/admin/placements')) return <PlacementsPage />;
    if (path.startsWith('/admin/reports')) return <ReportsPage />;
    if (path.startsWith('/admin/notifications')) return <NotificationsPage />;
    if (path.startsWith('/admin/requests')) return <AdminRequestsPage />;
    return <DashboardHome />;
  };

  return (
    <DashboardLayout navItems={navItems} role="admin" userName={currentAdmin?.name || 'Admin'}>
      {renderPage()}
    </DashboardLayout>
  );
}

function DashboardHome() {
  const { students, recruiters, jobDrives, applications, placements } = useApp();
  const pendingCompanies = recruiters.filter(r => r.approvalStatus === 'PENDING');
  const placedStudents = placements.filter(p => p.status === 'PLACED').length;
  const placementPercentage = students.length > 0 ? Math.round((placedStudents / students.length) * 100) : 0;

  const companyChartData = recruiters.filter(r => r.approvalStatus === 'APPROVED').slice(0, 5).map(r => {
    const drives = jobDrives.filter(jd => jd.recruiterId === r.id);
    const apps = applications.filter(a => drives.some(d => d.id === a.jobDriveId));
    return { name: r.companyName, applications: apps.length };
  });

  const branchData = ['CSE', 'IT', 'ECE', 'ME'].map(branch => ({
    name: branch,
    placed: students.filter(s => s.branch === branch && s.placementStatus === 'PLACED').length,
  }));

  const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#f59e0b'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your placement system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Students" value={students.length} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatsCard title="Companies" value={recruiters.filter(r => r.approvalStatus === 'APPROVED').length} icon={<Building2 className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Pending Approvals" value={pendingCompanies.length} icon={<Bell className="w-5 h-5" />} color="orange" />
        <StatsCard title="Active Drives" value={jobDrives.filter(jd => jd.status === 'ACTIVE').length} icon={<Briefcase className="w-5 h-5" />} color="green" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Applications" value={applications.length} icon={<FileText className="w-5 h-5" />} color="purple" />
        <StatsCard title="Students Placed" value={placedStudents} icon={<Award className="w-5 h-5" />} color="green" />
        <StatsCard title="Placement %" value={`${placementPercentage}%`} icon={<BarChart3 className="w-5 h-5" />} color="indigo" />
        <StatsCard title="Job Drives" value={jobDrives.length} icon={<Briefcase className="w-5 h-5" />} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications by Company</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={companyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="applications" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Students Placed by Branch</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={branchData} dataKey="placed" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {branchData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingCompanies.length > 0 && (
        <div className="mt-6 card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Company Approvals</h2>
          <div className="space-y-3">
            {pendingCompanies.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <div>
                  <p className="font-medium text-gray-900">{r.companyName}</p>
                  <p className="text-sm text-gray-500">{r.recruiterName} • {r.userId}</p>
                </div>
                <StatusBadge status="PENDING" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsPage() {
  const { students, applications, jobDrives } = useApp();
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const filtered = students.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.rollNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBranch && s.branch !== filterBranch) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-500 mt-1">Manage student records and placements</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search by name or roll number..." /></div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="input-field sm:w-48">
          <option value="">All Branches</option>
          {['CSE', 'IT', 'ECE', 'ME', 'EEE', 'CE'].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Roll No.</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Branch</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">CGPA</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-medium">{s.name.charAt(0)}</div>
                    <span className="font-medium text-sm text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{s.rollNumber}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{s.branch}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{s.cgpa}</td>
                <td className="py-3 px-4"><StatusBadge status={s.placementStatus} /></td>
                <td className="py-3 px-4">
                  <button onClick={() => setSelectedStudent(s)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1">
                    <Eye className="w-4 h-4" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" size="lg">
        {selectedStudent && (
          <div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xl font-bold">{selectedStudent.name.charAt(0)}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                <p className="text-gray-500">{selectedStudent.rollNumber} • {selectedStudent.branch} • Year {selectedStudent.year}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Phone</p><p className="font-semibold">{selectedStudent.phone || 'N/A'}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">CGPA</p><p className="font-semibold">{selectedStudent.cgpa}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">DOB</p><p className="font-semibold">{selectedStudent.dob || 'N/A'}</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Status</p><StatusBadge status={selectedStudent.placementStatus} /></div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">{selectedStudent.skills.map((s: string) => <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">{s}</span>)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Applications</p>
              <div className="space-y-2">
                {applications.filter(a => a.studentId === selectedStudent.id).map(a => {
                  const jd = jobDrives.find(j => j.id === a.jobDriveId);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span>{jd?.jobRole} at {jd?.companyName}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CompaniesPage() {
  const { recruiters, updateRecruiterApproval, jobDrives } = useApp();
  const [filter, setFilter] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'APPROVED' | 'REJECTED' } | null>(null);

  const filtered = recruiters.filter(r => {
    if (filter && r.approvalStatus !== filter) return false;
    return true;
  });

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await updateRecruiterApproval(id, status);
    showToast(`Company ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`, status === 'APPROVED' ? 'success' : 'info');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="text-gray-500 mt-1">Manage company registrations and approvals</p>
      </div>

      <div className="flex gap-3 mb-6">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(r => {
          const drives = jobDrives.filter(jd => jd.recruiterId === r.id);
          return (
            <div key={r.id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{r.companyName}</h3>
                    <StatusBadge status={r.approvalStatus} />
                  </div>
                  <p className="text-sm text-gray-500">Recruiter: {r.recruiterName} • {drives.length} job drives</p>
                  <p className="text-xs text-gray-400 mt-1">{r.website}</p>
                </div>
                {r.approvalStatus === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction({ id: r.id, action: 'APPROVED' })} className="btn-success text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => setConfirmAction({ id: r.id, action: 'REJECTED' })} className="btn-danger text-sm flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleApprove(confirmAction.id, confirmAction.action)}
        title={confirmAction?.action === 'APPROVED' ? 'Approve Company' : 'Reject Company'}
        message={`Are you sure you want to ${confirmAction?.action === 'APPROVED' ? 'approve' : 'reject'} this company?`}
        confirmText={confirmAction?.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={confirmAction?.action === 'APPROVED' ? 'primary' : 'danger'}
      />
    </div>
  );
}

function DrivesPage() {
  const { jobDrives, updateJobDrive } = useApp();
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  const handleClose = async (id: string) => {
    await updateJobDrive(id, { status: 'CLOSED' });
    showToast('Job drive closed successfully', 'info');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Drives</h1>
        <p className="text-gray-500 mt-1">Monitor and manage all job drives</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Company</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Package</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Deadline</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobDrives.map(jd => (
              <tr key={jd.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{jd.companyName}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{jd.jobRole}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{jd.package}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{jd.deadline}</td>
                <td className="py-3 px-4"><StatusBadge status={jd.status} /></td>
                <td className="py-3 px-4">
                  {jd.status === 'ACTIVE' && (
                    <button onClick={() => setConfirmClose(jd.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Close Drive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => confirmClose && handleClose(confirmClose)}
        title="Close Job Drive"
        message="Are you sure you want to close this job drive? Students will no longer be able to apply."
        confirmText="Close Drive"
        variant="danger"
      />
    </div>
  );
}

function ApplicationsPage() {
  const { applications, students, jobDrives, testResults } = useApp();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Applications</h1>
        <p className="text-gray-500 mt-1">Monitor all student applications</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Company</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Test Score</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => {
              const student = students.find(s => s.id === app.studentId);
              const jd = jobDrives.find(j => j.id === app.jobDriveId);
              const result = testResults.find(r => r.applicationId === app.id);
              return (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{jd?.companyName || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{jd?.jobRole || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{result ? `${result.score}/${result.totalQuestions}` : '-'}</td>
                  <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                  <td className="py-3 px-4 text-sm text-gray-500">{app.appliedAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlacementsPage() {
  const { placements, students, applications, jobDrives, addPlacement } = useApp();
  const [isBackfilling, setIsBackfilling] = useState(false);

  // Backfill missing placements for SELECTED applications
  useEffect(() => {
    const backfillMissingPlacements = async () => {
      if (isBackfilling) return;
      setIsBackfilling(true);

      try {
        // Find all SELECTED applications
        const selectedApplications = applications.filter(app => app.status === 'SELECTED');

        for (const app of selectedApplications) {
          // Check if placement already exists for this student + job drive
          const existingPlacement = placements.find(
            p => p.studentId === app.studentId && p.jobDriveId === app.jobDriveId
          );

          if (!existingPlacement) {
            // Get job drive details
            const jobDrive = jobDrives.find(jd => jd.id === app.jobDriveId);
            
            if (jobDrive) {
              // Create placement record
              await addPlacement({
                studentId: app.studentId,
                jobDriveId: app.jobDriveId,
                companyName: jobDrive.companyName,
                jobRole: jobDrive.jobRole,
                package: jobDrive.package,
                selectionDate: app.updatedAt || new Date().toISOString(),
                status: 'PLACED'
              });
              console.log(`✅ Created placement for student ${app.studentId} at ${jobDrive.companyName}`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error backfilling placements:', error);
      } finally {
        setIsBackfilling(false);
      }
    };

    backfillMissingPlacements();
  }, [applications, placements, jobDrives, addPlacement, isBackfilling]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Placements</h1>
        <p className="text-gray-500 mt-1">Track placement records</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Company</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Package</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {placements.map(p => {
              const student = students.find(s => s.id === p.studentId);
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.companyName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{p.jobRole}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{p.package}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{p.selectionDate}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {placements.length === 0 && (
        <EmptyState icon={<Award className="w-12 h-12" />} title="No Placements Yet" description="Placements will appear here once students are selected." />
      )}
    </div>
  );
}

function ReportsPage() {
  const { students, jobDrives, applications, placements, recruiters } = useApp();

  const statusCounts = ['APPLIED', 'TEST_PENDING', 'PASSED', 'FAILED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED'].map(status => ({
    name: status.replace('_', ' '),
    value: applications.filter(a => a.status === status).length,
  })).filter(s => s.value > 0);

  const COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 mt-1">Comprehensive placement statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{placements.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Placements</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{applications.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total Applications</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{recruiters.filter(r => r.approvalStatus === 'APPROVED').length}</p>
          <p className="text-sm text-gray-500 mt-1">Active Companies</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statusCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
        <p className="text-gray-500 mt-1">System notifications and alerts</p>
      </div>

      <div className="space-y-3">
        {myNotifs.map(n => (
          <div key={n.id} onClick={() => markNotificationRead(n.id)} className={`card cursor-pointer ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{n.createdAt}</p>
              </div>
              {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
            </div>
          </div>
        ))}
        {myNotifs.length === 0 && <EmptyState icon={<Bell className="w-12 h-12" />} title="No Notifications" description="You're all caught up!" />}
      </div>
    </div>
  );
}

function AdminRequestsPage() {
  const { admins, updateAdminApproval, isHeadAdmin } = useApp();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'APPROVED' | 'REJECTED'; name: string } | null>(null);

  // Only head admins can access this page
  if (!isHeadAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only head admins can manage admin approval requests.</p>
        </div>
      </div>
    );
  }

  const pendingAdmins = admins.filter(a => a.approvalStatus === 'PENDING');
  const approvedAdmins = admins.filter(a => a.approvalStatus === 'APPROVED');
  const rejectedAdmins = admins.filter(a => a.approvalStatus === 'REJECTED');

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await updateAdminApproval(id, status);
      showToast(`Admin ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`, status === 'APPROVED' ? 'success' : 'info');
    } catch (error: any) {
      console.error('Failed to update admin approval:', error);
      showToast(`Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} admin: ${error.message}`, 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Requests</h1>
        <p className="text-gray-500 mt-1">Manage admin registration requests</p>
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Requests ({pendingAdmins.length})
        </h2>
        {pendingAdmins.length === 0 ? (
          <EmptyState 
            icon={<Shield className="w-12 h-12" />} 
            title="No Pending Requests" 
            description="There are no pending admin registration requests at the moment." 
          />
        ) : (
          <div className="space-y-4">
            {pendingAdmins.map(admin => (
              <div key={admin.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                      <StatusBadge status="PENDING" />
                    </div>
                    <p className="text-sm text-gray-500">Employee ID: {admin.employeeId}</p>
                    <p className="text-sm text-gray-500">Department: {admin.department}</p>
                    <p className="text-sm text-gray-500">Phone: {admin.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setConfirmAction({ id: admin.id, action: 'APPROVED', name: admin.name })}
                      className="btn-success text-sm flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ id: admin.id, action: 'REJECTED', name: admin.name })}
                      className="btn-danger text-sm flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Admins */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Approved Admins ({approvedAdmins.length})
        </h2>
        {approvedAdmins.length === 0 ? (
          <p className="text-sm text-gray-500">No approved admins yet.</p>
        ) : (
          <div className="space-y-3">
            {approvedAdmins.map(admin => (
              <div key={admin.id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                      <StatusBadge status="APPROVED" />
                      {admin.isHeadAdmin && (
                        <span className="badge bg-purple-100 text-purple-700">Head Admin</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{admin.employeeId} • {admin.department}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Admins */}
      {rejectedAdmins.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rejected Requests ({rejectedAdmins.length})
          </h2>
          <div className="space-y-3">
            {rejectedAdmins.map(admin => (
              <div key={admin.id} className="card opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                      <StatusBadge status="REJECTED" />
                    </div>
                    <p className="text-sm text-gray-500">{admin.employeeId} • {admin.department}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && handleApprove(confirmAction.id, confirmAction.action)}
        title={confirmAction?.action === 'APPROVED' ? 'Approve Admin' : 'Reject Admin'}
        message={`Are you sure you want to ${confirmAction?.action === 'APPROVED' ? 'approve' : 'reject'} ${confirmAction?.name}'s admin registration request?`}
        confirmText={confirmAction?.action === 'APPROVED' ? 'Approve' : 'Reject'}
        variant={confirmAction?.action === 'APPROVED' ? 'primary' : 'danger'}
      />
    </div>
  );
}
