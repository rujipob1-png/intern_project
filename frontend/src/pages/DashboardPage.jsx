import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import DashboardDirector from './director/DashboardDirector';
import CentralOfficeStaffDashboard from './centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeHeadDashboard from './centralOffice/CentralOfficeHeadDashboard';
import AdminDashboard from './admin/AdminDashboard';
import { ROLES, LEAVE_TYPE_CODES } from '../utils/constants';
import { getDepartmentThaiCode } from '../utils/departmentMapping';
import { leaveAPI } from '../api/leave.api';
import { formatDate } from '../utils/formatDate';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  History,
  Bell,
  ChevronRight,
  Briefcase,
  HeartPulse,
  Palmtree,
  User
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaveUpdate, approvalUpdate } = useRealtime();
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(null);

  // Get role_name from user object
  const userRole = user?.role_name;

  // Load recent leaves and balance for USER only
  // Also reload when realtime updates occur
  useEffect(() => {
    if (userRole === ROLES.USER) {
      loadRecentLeaves();
      loadLeaveBalance();
    } else {
      setLoading(false);
    }
  }, [userRole, leaveUpdate, approvalUpdate]);

  const loadRecentLeaves = async () => {
    try {
      const response = await leaveAPI.getMyLeaves({ limit: 5 });
      if (response.success) {
        const leaves = response.data?.leaves || response.data || [];
        setRecentLeaves(leaves);
      }
    } catch (error) {
      console.error('Load recent leaves error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const response = await leaveAPI.getLeaveBalance();
      if (response.success) {
        setLeaveBalance(response.data);
      }
    } catch (error) {
      console.error('Load leave balance error:', error);
    }
  };

  // แยก Dashboard ตาม Role
  if (userRole === ROLES.DIRECTOR) {
    return (
      <MainLayout>
        <DashboardDirector />
      </MainLayout>
    );
  }

  if (userRole === ROLES.CENTRAL_OFFICE_STAFF) {
    return (
      <MainLayout>
        <CentralOfficeStaffDashboard />
      </MainLayout>
    );
  }

  if (userRole === ROLES.CENTRAL_OFFICE_HEAD) {
    return (
      <MainLayout>
        <CentralOfficeHeadDashboard />
      </MainLayout>
    );
  }

  if (userRole === ROLES.ADMIN) {
    return (
      <MainLayout>
        <AdminDashboard />
      </MainLayout>
    );
  }

  // Default: USER Dashboard

  const stats = [
    {
      title: 'ลาป่วย',
      code: 'ป',
      value: leaveBalance?.sick || 0,
      total: null,
      suffix: 'วัน',
      icon: HeartPulse,
      description: 'ใช้ได้ตามจริง',
    },
    {
      title: 'ลาพักผ่อน',
      code: 'พ',
      value: leaveBalance?.vacation || 0,
      total: 10,
      icon: Palmtree,
      description: 'จากโควต้า 10 วัน',
    },
    {
      title: 'ลากิจ',
      code: 'ก',
      value: leaveBalance?.personal || 0,
      total: 3,
      icon: Briefcase,
      description: 'จากโควต้า 3 วัน',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                สวัสดี, {user?.firstName}
              </h1>
              <p className="text-sm text-slate-500">
                {user?.position} • {getDepartmentThaiCode(user?.department)}
              </p>
            </div>
          </div>
        </div>

        {/* Leave Balance Section */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">วันลาคงเหลือ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {stat.code}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-slate-800">
                      {stat.value}
                      {stat.total && (
                        <span className="text-lg font-normal text-slate-400">/{stat.total}</span>
                      )}
                      {stat.suffix && (
                        <span className="text-sm font-normal text-slate-400 ml-1">{stat.suffix}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">ดำเนินการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/create-leave')}
              className="group bg-slate-800 hover:bg-slate-900 text-white rounded-xl p-5 text-left transition-all"
            >
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <p className="font-medium mb-1">สร้างคำขอลา</p>
              <p className="text-sm text-slate-400">ยื่นคำขอลาใหม่</p>
            </button>

            <button 
              onClick={() => navigate('/my-leaves')}
              className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 text-left transition-all"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <p className="font-medium text-slate-800 mb-1">คำขอของฉัน</p>
              <p className="text-sm text-slate-500">ดูรายการคำขอลาทั้งหมด</p>
            </button>

            <button 
              onClick={() => navigate('/leave-history')}
              className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 text-left transition-all"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors">
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <p className="font-medium text-slate-800 mb-1">ประวัติการลา</p>
              <p className="text-sm text-slate-500">ดูประวัติการลาย้อนหลัง</p>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leaves */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">คำขอลาล่าสุด</h3>
                {recentLeaves.length > 0 && (
                  <button 
                    onClick={() => navigate('/my-leaves')}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                  >
                    ดูทั้งหมด <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600 mx-auto"></div>
                </div>
              ) : recentLeaves.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">ยังไม่มีคำขอลา</p>
                  <button 
                    onClick={() => navigate('/create-leave')}
                    className="text-sm text-slate-700 hover:text-slate-900 font-medium mt-2"
                  >
                    สร้างคำขอลาใหม่ →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeaves.slice(0, 5).map((leave) => (
                    <div
                      key={leave.id}
                      onClick={() => navigate(`/leave-detail/${leave.id}`)}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">
                            {leave.LeaveNumber || leave.leaveNumber}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {LEAVE_TYPE_CODES[leave.leaveTypeCode]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)} • {leave.totalDays} วัน
                        </p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'approved' || leave.status === 'approved_final' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : leave.status === 'rejected' 
                          ? 'bg-red-50 text-red-700' 
                          : leave.status === 'cancelled' 
                          ? 'bg-slate-100 text-slate-600' 
                          : leave.status?.includes('cancel') 
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {leave.status === 'approved' || leave.status === 'approved_final' ? 'อนุมัติ' :
                         leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                         leave.status === 'cancelled' ? 'ยกเลิก' : 
                         leave.status?.includes('cancel') ? 'รอพิจารณายกเลิก' : 'รอพิจารณา'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <h3 className="font-medium text-slate-800">การแจ้งเตือน</h3>
              </div>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600 mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeaves
                    .filter(leave => ['approved', 'approved_final', 'rejected'].includes(leave.status))
                    .slice(0, 5)
                    .map((leave) => (
                      <div
                        key={leave.id}
                        className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          leave.status === 'approved' || leave.status === 'approved_final' 
                            ? 'bg-emerald-100' 
                            : 'bg-red-100'
                        }`}>
                          {leave.status === 'approved' || leave.status === 'approved_final' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">
                            คำขอลา <span className="font-medium">{leave.LeaveNumber || leave.leaveNumber}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {leave.status === 'approved' || leave.status === 'approved_final' 
                              ? 'ได้รับการอนุมัติแล้ว' 
                              : 'ไม่ได้รับการอนุมัติ'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(leave.updatedAt || leave.updated_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  {recentLeaves.filter(leave => ['approved', 'approved_final', 'rejected'].includes(leave.status)).length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">ไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
