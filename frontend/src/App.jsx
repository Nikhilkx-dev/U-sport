
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Admin pages (consolidated)
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import FacilityRequestsPage from './pages/FacilityRequestsPage';
import EquipmentRequestsPage from './pages/EquipmentRequestsPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReturnsManagementPage from './pages/ReturnsManagementPage';
import FacilityReleasesPage from './pages/FacilityReleasesPage';
import IssuedItemsPage from './pages/IssuedItemsPage';
import AuditLogsPage from './pages/AuditLogsPage';





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

            {/* Admin dashboard routes (consolidated all management here) */}
            <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
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
