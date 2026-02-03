import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './components/common/ConfirmDialog';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateLeavePage } from './pages/user/CreateLeavePage';
import { MyLeavesPage } from './pages/user/MyLeavesPage';
import { LeaveDetailPage } from './pages/user/LeaveDetailPage';
import { LeaveHistoryPage } from './pages/user/LeaveHistoryPage';
import { ActingRequestsPage } from './pages/user/ActingRequestsPage';
import DashboardDirector from './pages/director/DashboardDirector';
import ApprovalHistoryPage from './pages/director/ApprovalHistoryPage';
import DirectorCancelRequests from './pages/director/DirectorCancelRequests';
import CentralOfficeStaffDashboard from './pages/centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeStaffCancelRequests from './pages/centralOffice/CentralOfficeStaffCancelRequests';
import CentralOfficeHeadDashboard from './pages/centralOffice/CentralOfficeHeadDashboard';
import CentralOfficeHeadCancelRequests from './pages/centralOffice/CentralOfficeHeadCancelRequests';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCancelRequests from './pages/admin/AdminCancelRequests';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-leave" 
            element={
              <ProtectedRoute>
                <CreateLeavePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-leaves" 
            element={
              <ProtectedRoute>
                <MyLeavesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave-detail/:id" 
            element={
              <ProtectedRoute>
                <LeaveDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leave-history" 
            element={
              <ProtectedRoute>
                <LeaveHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/acting-requests" 
            element={
              <ProtectedRoute>
                <ActingRequestsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Director Routes */}
          <Route 
            path="/director/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardDirector />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/director/history" 
            element={
              <ProtectedRoute>
                <ApprovalHistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/director/cancel-requests" 
            element={
              <ProtectedRoute>
                <DirectorCancelRequests />
              </ProtectedRoute>
            } 
          />
          
          {/* Central Office Staff Routes */}
          <Route 
            path="/central-office/staff" 
            element={
              <ProtectedRoute>
                <CentralOfficeStaffDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/central-office/staff/cancel-requests" 
            element={
              <ProtectedRoute>
                <CentralOfficeStaffCancelRequests />
              </ProtectedRoute>
            } 
          />
          
          {/* Central Office Head Routes */}
          <Route 
            path="/central-office/head" 
            element={
              <ProtectedRoute>
                <CentralOfficeHeadDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/central-office/head/cancel-requests" 
            element={
              <ProtectedRoute>
                <CentralOfficeHeadCancelRequests />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cancel-requests" 
            element={
              <ProtectedRoute>
                <AdminCancelRequests />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
    </AuthProvider>
  );
}

export default App;
