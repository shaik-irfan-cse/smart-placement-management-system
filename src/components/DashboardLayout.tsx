import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Menu, X, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Modal } from './UI';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  navItems: NavItem[];
  role: 'student' | 'admin' | 'recruiter';
  userName: string;
  children?: React.ReactNode;
}

export default function DashboardLayout({ navItems, role, userName, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser, getUnreadCount, notifications: allNotifications } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifications = currentUser ? allNotifications.filter(n => n.userId === currentUser.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5) : [];
  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;

  const roleColors: Record<string, string> = {
    student: 'bg-indigo-600',
    admin: 'bg-blue-600',
    recruiter: 'bg-purple-600',
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
            <div className={`w-8 h-8 ${roleColors[role]} rounded-lg flex items-center justify-center`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">SPMS</span>
              <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 rounded hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${roleColors[role]} text-white shadow-sm`
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-4 sm:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-gray-50 ${!n.read ? 'bg-indigo-50/50' : ''}`}>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.createdAt}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`w-8 h-8 ${roleColors[role]} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                  {userName.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(notifOpen || profileOpen) && (
        <div className="fixed inset-0 z-10" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />
      )}
    </div>
  );
}
