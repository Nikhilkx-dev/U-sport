
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Chatbot from './components/Chatbot';

// ✅ ADD THIS
import VerifyOtp from './pages/VerifyOtp';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import SportsPage from './pages/SportsPage';
import EquipmentPage from './pages/EquipmentPage';
import MyRequests from './pages/MyRequests';

// Faculty pages
import FacultyDashboard from './pages/FacultyDashboard';
import FacilityRequestsPage from './pages/FacilityRequestsPage';
import EquipmentRequestsPage from './pages/EquipmentRequestsPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';

function RootRedirect() {
  const { user, initialized, loading } = useAuth();
  if (!initialized || loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={user.role === 'faculty' ? '/faculty' : '/dashboard'} replace />;
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

            {/* ✅ ADD THIS (OTP step) */}
            <Route path="/verify-otp" element={<VerifyOtp />} />

            {/* Student dashboard routes */}
            <Route element={<ProtectedRoute role="student"><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/sports" element={<SportsPage />} />
              <Route path="/equipment" element={<EquipmentPage />} />
              <Route path="/my-requests" element={<MyRequests />} />
            </Route>

            {/* Faculty dashboard routes */}
            <Route element={<ProtectedRoute role="faculty"><DashboardLayout /></ProtectedRoute>}>
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/facility-requests" element={<FacilityRequestsPage />} />
              <Route path="/faculty/equipment-requests" element={<EquipmentRequestsPage />} />
              <Route path="/faculty/inventory" element={<InventoryPage />} />
              <Route path="/faculty/analytics" element={<AnalyticsPage />} />
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

