
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  student: '/dashboard',
  faculty: '/faculty',
  admin: '/admin',
  vendor: '/vendor',
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading, initialized } = useAuth();

  // 🔄 show loader while checking auth
  if (!initialized || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl animate-pulse">⚡</div>
          <p className="text-slate-400 text-sm">Loading U-SPORT...</p>
        </div>
      </div>
    );
  }

  // ❌ not logged in → login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ❌ wrong role → redirect to correct dashboard
  if (roles && !roles.includes(user.role)) {
    const target = ROLE_DASHBOARDS[user.role] || '/dashboard';
    return <Navigate to={target} replace />;
  }

  // ✅ allowed
  return children;
}
