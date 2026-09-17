import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { ToastContainer, LoadingSpinner } from './components/UI';
import LandingPage from './pages/LandingPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';

function AuthGuard({ children, role }: { children: React.ReactNode; role: string }) {
  const { currentUser, authLoading } = useApp();
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useApp();
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (currentUser) return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<GuestGuard><LandingPage /></GuestGuard>} />
      <Route path="/login" element={<GuestGuard><Navigate to="/login/student" replace /></GuestGuard>} />
      <Route path="/login/:role" element={<GuestGuard><LoginPage /></GuestGuard>} />
      <Route path="/signup/:role" element={<GuestGuard><SignupPage /></GuestGuard>} />

      {/* Student Routes */}
      <Route path="/student/*" element={<AuthGuard role="student"><StudentDashboard /></AuthGuard>} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

      {/* Recruiter Routes */}
      <Route path="/recruiter/*" element={<AuthGuard role="recruiter"><RecruiterDashboard /></AuthGuard>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <ToastContainer />
      </AppProvider>
    </BrowserRouter>
  );
}
