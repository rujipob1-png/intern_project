import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import DashboardDirector from './director/DashboardDirector';
import CentralOfficeStaffDashboard from './centralOffice/CentralOfficeStaffDashboard';
import CentralOfficeHeadDashboard from './centralOffice/CentralOfficeHeadDashboard';
import AdminDashboard from './admin/AdminDashboard';
import { ROLES, LEAVE_TYPE_CODES } from '../utils/constants';
import { leaveAPI } from '../api/leave.api';
import { formatDate } from '../utils/formatDate';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(null);

  // Get role_name from user object
  const userRole = user?.role_name;

  // Load recent leaves and balance for USER only
  useEffect(() => {
    if (userRole === ROLES.USER) {
      loadRecentLeaves();
      loadLeaveBalance();
    } else {
      setLoading(false);
    }
  }, [userRole]);

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
      title: 'ลาป่วย (ป)',
      value: leaveBalance?.sick || 0,
      total: null, // ไม่มีโควต้า แสดงแค่วันที่ลาไปแล้ว
      suffix: 'วัน',
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'ลาพักผ่อน (พ)',
      value: leaveBalance?.vacation || 0,
      total: 10,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'ลากิจ (ก)',
      value: leaveBalance?.personal || 0,
      total: 3,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'คำขอทั้งหมด',
      value: 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            สวัสดี, {user?.firstName} 👋
          </h2>
          <p className="text-gray-600">
            {user?.position} - {user?.department}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      {stat.suffix ? (
                        <p className="text-lg font-semibold text-gray-900">
                          ลามาแล้ว {stat.value} {stat.suffix}
                        </p>
                      ) : (
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                          {stat.total && (
                            <span className="text-lg text-gray-400"> / {stat.total}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>เมนูด่วน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/create-leave')}
                className="flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <div className="bg-primary-600 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">สร้างคำขอลา</p>
                  <p className="text-sm text-gray-600">ยื่นคำขอลาใหม่</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/my-leaves')}
                className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="bg-green-600 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">คำขอของฉัน</p>
                  <p className="text-sm text-gray-600">ดูรายการคำขอลา</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/leave-history')}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">ประวัติการลา</p>
                  <p className="text-sm text-gray-600">ประวัติการลา</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>คำขอลาล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : recentLeaves.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>ยังไม่มีคำขอลา</p>
                  <p className="text-sm mt-1">เริ่มต้นโดยการสร้างคำขอลาใหม่</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      onClick={() => navigate(`/leave-detail/${leave.id}`)}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {leave.LeaveNumber || leave.leaveNumber}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({LEAVE_TYPE_CODES[leave.leaveTypeCode]})
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.totalDays} วัน)
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                          leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          leave.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {leave.status === 'approved' ? 'อนุมัติ' :
                           leave.status === 'rejected' ? 'ไม่อนุมัติ' :
                           leave.status === 'cancelled' ? 'ยกเลิก' : 'รอพิจารณา'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentLeaves.length >= 5 && (
                    <button
                      onClick={() => navigate('/my-leaves')}
                      className="w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      ดูทั้งหมด →
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>การแจ้งเตือน</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeaves
                    .filter(leave => ['approved', 'rejected'].includes(leave.status))
                    .slice(0, 5)
                    .map((leave) => (
                      <div
                        key={leave.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            leave.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {leave.status === 'approved' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              คำขอลา {leave.LeaveNumber || leave.leaveNumber}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {leave.status === 'approved' ? 'ได้รับการอนุมัติแล้ว' : 'ไม่ได้รับการอนุมัติ'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(leave.updatedAt || leave.updated_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {recentLeaves.filter(leave => ['approved', 'rejected'].includes(leave.status)).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>ไม่มีการแจ้งเตือน</p>
                      <p className="text-sm mt-1">คุณไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
