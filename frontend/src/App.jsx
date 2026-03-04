import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ConfirmProvider } from './components/common/ConfirmDialog';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateLeavePage } from './pages/user/CreateLeavePage';
import { MyLeavesPage } from './pages/user/MyLeavesPage';
import { LeaveDetailPage } from './pages/user/LeaveDetailPage';
import { LeaveHistoryPage } from './pages/user/LeaveHistoryPage';
import { ActingRequestsPage } from './pages/user/ActingRequestsPage';
import { SettingsPage } from './pages/user/SettingsPage';
import DashboardDirector from './pages/director/DashboardDirector';
import ApprovalHistoryPage from './pages/director/ApprovalHistoryPage';
import DirectorCancelRequests from './pages/director/DirectorCancelRequests';
import CentralOfficeStaffDashboard from './pages/centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeStaffCancelRequests from './pages/centralOffice/CentralOfficeStaffCancelRequests';
import CentralOfficeHeadDashboard from './pages/centralOffice/CentralOfficeHeadDashboard';
import CentralOfficeHeadCancelRequests from './pages/centralOffice/CentralOfficeHeadCancelRequests';
import CentralOfficeStaffHistory from './pages/centralOffice/CentralOfficeStaffHistory';
import CentralOfficeHeadHistory from './pages/centralOffice/CentralOfficeHeadHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovalHistory from './pages/admin/AdminApprovalHistory';
import AdminCancelRequests from './pages/admin/AdminCancelRequests';
import AdminCancelHistory from './pages/admin/AdminCancelHistory';
import UserManagementPage from './pages/admin/UserManagementPage';
import RegistrationManagementPage from './pages/admin/RegistrationManagementPage';
import { RegisterPage } from './pages/auth/RegisterPage';

import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Main Layout Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/create-leave" element={<CreateLeavePage />} />
                <Route path="/my-leaves" element={<MyLeavesPage />} />
                <Route path="/leave-detail/:id" element={<LeaveDetailPage />} />
                <Route path="/leave-history" element={<LeaveHistoryPage />} />
                <Route path="/acting-requests" element={<ActingRequestsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Director Routes */}
                <Route path="/director/dashboard" element={<DashboardDirector />} />
                <Route path="/director/history" element={<ApprovalHistoryPage />} />
                <Route path="/director/cancel-requests" element={<DirectorCancelRequests />} />

                {/* Central Office Staff Routes */}
                <Route path="/central-office/staff" element={<CentralOfficeStaffDashboard />} />
                <Route path="/central-office/staff/cancel-requests" element={<CentralOfficeStaffCancelRequests />} />
                <Route path="/central-office/staff/history" element={<CentralOfficeStaffHistory />} />

                {/* Central Office Head Routes */}
                <Route path="/central-office/head" element={<CentralOfficeHeadDashboard />} />
                <Route path="/central-office/head/cancel-requests" element={<CentralOfficeHeadCancelRequests />} />
                <Route path="/central-office/head/history" element={<CentralOfficeHeadHistory />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/approval-history" element={<AdminApprovalHistory />} />
                <Route path="/admin/cancel-requests" element={<AdminCancelRequests />} />
                <Route path="/admin/cancel-history" element={<AdminCancelHistory />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/registrations" element={<RegistrationManagementPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'Inter, Noto Sans Thai, sans-serif',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#EF4444',
                },
              },
            }}
          />
        </ConfirmProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
