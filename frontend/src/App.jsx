import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateLeavePage } from './pages/user/CreateLeavePage';
import { MyLeavesPage } from './pages/user/MyLeavesPage';
import { LeaveDetailPage } from './pages/user/LeaveDetailPage';
import { LeaveHistoryPage } from './pages/user/LeaveHistoryPage';
import DashboardDirector from './pages/director/DashboardDirector';
import CentralOfficeStaffDashboard from './pages/centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeHeadDashboard from './pages/centralOffice/CentralOfficeHeadDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
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
          
          {/* Director Routes */}
          <Route 
            path="/director/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardDirector />
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
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Inter, Noto Sans Thai, sans-serif',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
