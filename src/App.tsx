import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { ToastContainer } from './components/UI';
import LandingPage from './pages/LandingPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: string }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (currentUser) return <Navigate to={`/${currentUser.role}/dashboard`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Navigate to="/login/student" replace /></PublicRoute>} />
      <Route path="/login/:role" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup/:role" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Student Routes */}
      <Route path="/student/*" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Recruiter Routes */}
      <Route path="/recruiter/*" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />

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
