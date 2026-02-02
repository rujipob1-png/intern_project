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
import CentralOfficeStaffDashboard from './pages/centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeHeadDashboard from './pages/centralOffice/CentralOfficeHeadDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

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
          
          {/* Central Office Staff Routes */}
          <Route 
            path="/central-office/staff" 
            element={
              <ProtectedRoute>
                <CentralOfficeStaffDashboard />
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
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
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
