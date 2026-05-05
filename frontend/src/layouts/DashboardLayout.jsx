
import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/sports', label: 'Sports', icon: '🏟️' },
  { to: '/equipment', label: 'Equipment', icon: '🎯' },
  { to: '/my-requests', label: 'My Requests', icon: '📋' },
];

const facultyNav = [
  { to: '/faculty', label: 'Overview', icon: '🏠', end: true },
  { to: '/faculty/facility-requests', label: 'Facility Requests', icon: '📋' },
  { to: '/faculty/equipment-requests', label: 'Equipment Requests', icon: '🎯' },
  { to: '/faculty/inventory', label: 'Inventory', icon: '📦' },
  { to: '/faculty/analytics', label: 'Analytics', icon: '📊' },
];

export default function DashboardLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔒 Prevent crash before user loads
  if (loading || !user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl animate-pulse">⚡</div>
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = user.role === 'faculty' ? facultyNav : studentNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true }); // ✅ better UX
  };

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-slate-900/95 backdrop-blur-xl border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-500/30">
              ⚡
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">
                U-SPORT
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Chitkara University
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center text-sm font-bold text-indigo-300">
              {user.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200 truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {user.role} • {user.department}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end || false}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              user.role === 'faculty'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {user.role === 'faculty' ? '👨‍🏫 Faculty' : '🎓 Student'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

