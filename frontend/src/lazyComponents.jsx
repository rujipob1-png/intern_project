/**
 * Lazy loaded components for code splitting
 * เพิ่มประสิทธิภาพโดยโหลด component เมื่อต้องการใช้งานเท่านั้น
 */

import { lazy, Suspense } from 'react';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600">กำลังโหลด...</p>
    </div>
  </div>
);

// Small loading component for inline elements
const InlineLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
  </div>
);

/**
 * HOC for lazy loading with suspense
 */
function lazyWithPreload(factory) {
  const Component = lazy(factory);
  Component.preload = factory;
  return Component;
}

// ==================== Auth Pages ====================
export const LoginPage = lazyWithPreload(() => 
  import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage }))
);

// ==================== User Pages ====================
export const DashboardPage = lazyWithPreload(() => 
  import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);

export const CreateLeavePage = lazyWithPreload(() => 
  import('./pages/user/CreateLeavePage').then(m => ({ default: m.CreateLeavePage }))
);

export const MyLeavesPage = lazyWithPreload(() => 
  import('./pages/user/MyLeavesPage').then(m => ({ default: m.MyLeavesPage }))
);

export const LeaveDetailPage = lazyWithPreload(() => 
  import('./pages/user/LeaveDetailPage').then(m => ({ default: m.LeaveDetailPage }))
);

export const LeaveHistoryPage = lazyWithPreload(() => 
  import('./pages/user/LeaveHistoryPage').then(m => ({ default: m.LeaveHistoryPage }))
);

export const ActingRequestsPage = lazyWithPreload(() => 
  import('./pages/user/ActingRequestsPage').then(m => ({ default: m.ActingRequestsPage }))
);

export const LeaveCalendarPage = lazyWithPreload(() => 
  import('./pages/user/LeaveCalendarPage')
);

// ==================== Director Pages ====================
export const DashboardDirector = lazyWithPreload(() => 
  import('./pages/director/DashboardDirector')
);

export const ApprovalHistoryPage = lazyWithPreload(() => 
  import('./pages/director/ApprovalHistoryPage')
);

export const DirectorCancelRequests = lazyWithPreload(() => 
  import('./pages/director/DirectorCancelRequests')
);

// ==================== Central Office Pages ====================
export const CentralOfficeStaffDashboard = lazyWithPreload(() => 
  import('./pages/centralOffice/CentralOfficeStaffDashboard')
);

export const CentralOfficeStaffCancelRequests = lazyWithPreload(() => 
  import('./pages/centralOffice/CentralOfficeStaffCancelRequests')
);

export const CentralOfficeHeadDashboard = lazyWithPreload(() => 
  import('./pages/centralOffice/CentralOfficeHeadDashboard')
);

export const CentralOfficeHeadCancelRequests = lazyWithPreload(() => 
  import('./pages/centralOffice/CentralOfficeHeadCancelRequests')
);

// ==================== Admin Pages ====================
export const AdminDashboard = lazyWithPreload(() => 
  import('./pages/admin/AdminDashboard')
);

export const AdminApprovalHistory = lazyWithPreload(() => 
  import('./pages/admin/AdminApprovalHistory')
);

export const AdminCancelRequests = lazyWithPreload(() => 
  import('./pages/admin/AdminCancelRequests')
);

export const AdminCancelHistory = lazyWithPreload(() => 
  import('./pages/admin/AdminCancelHistory')
);

export const UserManagementPage = lazyWithPreload(() => 
  import('./pages/admin/UserManagementPage')
);

export const LeaveReportsPage = lazyWithPreload(() => 
  import('./pages/admin/LeaveReportsPage')
);

// ==================== Components ====================
export const LeaveCalendar = lazyWithPreload(() => 
  import('./components/LeaveCalendar')
);

// ==================== Suspense Wrappers ====================

/**
 * Wrap component with Suspense for page-level loading
 */
export function withPageSuspense(Component) {
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Wrap component with Suspense for inline loading
 */
export function withInlineSuspense(Component) {
  return function WrappedComponent(props) {
    return (
      <Suspense fallback={<InlineLoader />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Export loaders
export { PageLoader, InlineLoader };

/**
 * Preload hint for route prefetching
 */
export function preloadPage(pageName) {
  const pages = {
    login: LoginPage,
    dashboard: DashboardPage,
    createLeave: CreateLeavePage,
    myLeaves: MyLeavesPage,
    leaveDetail: LeaveDetailPage,
    leaveHistory: LeaveHistoryPage,
    actingRequests: ActingRequestsPage,
    leaveCalendar: LeaveCalendarPage,
    directorDashboard: DashboardDirector,
    approvalHistory: ApprovalHistoryPage,
    directorCancelRequests: DirectorCancelRequests,
    centralOfficeStaff: CentralOfficeStaffDashboard,
    centralOfficeStaffCancelRequests: CentralOfficeStaffCancelRequests,
    centralOfficeHead: CentralOfficeHeadDashboard,
    centralOfficeHeadCancelRequests: CentralOfficeHeadCancelRequests,
    adminDashboard: AdminDashboard,
    adminApprovalHistory: AdminApprovalHistory,
    adminCancelRequests: AdminCancelRequests,
    adminCancelHistory: AdminCancelHistory,
    userManagement: UserManagementPage,
    leaveReports: LeaveReportsPage
  };

  const page = pages[pageName];
  if (page && page.preload) {
    page.preload();
  }
}
