
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Chatbot from './components/Chatbot';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';

// Shared pages
import ProfilePage from './pages/ProfilePage';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import SportsPage from './pages/SportsPage';
import EquipmentPage from './pages/EquipmentPage';
import MyRequests from './pages/MyRequests';

// Admin pages (lazy-loaded for optimization)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const FacilityRequestsPage = lazy(() => import('./pages/FacilityRequestsPage'));
const EquipmentRequestsPage = lazy(() => import('./pages/EquipmentRequestsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ReturnsManagementPage = lazy(() => import('./pages/ReturnsManagementPage'));
const FacilityReleasesPage = lazy(() => import('./pages/FacilityReleasesPage'));
const IssuedItemsPage = lazy(() => import('./pages/IssuedItemsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));





const ROLE_DASHBOARDS = {
  student: '/dashboard',
  admin: '/admin',
};

function RootRedirect() {
  const { user, initialized, loading } = useAuth();
  if (!initialized || loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={ROLE_DASHBOARDS[user.role] || '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>

            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Student dashboard routes */}
            <Route element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/sports" element={<SportsPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/my-requests" element={<MyRequests />} />
            </Route>

            {/* Admin dashboard routes (consolidated all management here with Suspense boundary) */}
            <Route element={
              <ProtectedRoute roles={['admin']}>
                <Suspense fallback={
                  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-r-2 border-transparent"></div>
                    <span className="text-slate-400 text-sm font-medium">Loading workspace...</span>
                  </div>
                }>
                  <DashboardLayout />
                </Suspense>
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/sports" element={<SportsPage />} />
              <Route path="/admin/facility-requests" element={<FacilityRequestsPage />} />
              <Route path="/admin/equipment-requests" element={<EquipmentRequestsPage />} />
              <Route path="/admin/returns" element={<ReturnsManagementPage />} />
              <Route path="/admin/facility-releases" element={<FacilityReleasesPage />} />
              <Route path="/admin/issued-items" element={<IssuedItemsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Profile — accessible by all authenticated users */}
            <Route element={<ProtectedRoute roles={['student', 'faculty', 'admin', 'vendor']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

          {/* Floating chatbot */}
          <ChatbotWrapper />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function ChatbotWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return <Chatbot />;
}
