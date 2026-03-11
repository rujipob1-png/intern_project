import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notificationAPI } from '../api/notification.api';
import { ROLES, LEAVE_TYPE_CODES } from '../utils/constants';
import { getDepartmentThaiCode } from '../utils/departmentMapping';
import { leaveAPI } from '../api/leave.api';
import { registrationAPI } from '../api/registration.api';
import { formatDate } from '../utils/formatDate';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import DashboardCalendar from '../components/dashboard/DashboardCalendar';
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
  User,
  BarChart3,
  UserPlus
} from 'lucide-react';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leaveUpdate, approvalUpdate, notificationUpdate } = useRealtime();
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notiLoading, setNotiLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allLeaves, setAllLeaves] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState(0);

  // Get role_name from user object
  const userRole = user?.role_name;
  const isAdmin = userRole === ROLES.ADMIN || userRole === ROLES.CENTRAL_OFFICE_HEAD || userRole === ROLES.CENTRAL_OFFICE_STAFF;

  useEffect(() => {
    loadRecentLeaves();
    loadAllLeaves();
    loadLeaveBalance();
    loadNotifications();
    fetchUnreadCount();
    if (isAdmin) loadPendingRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, leaveUpdate, approvalUpdate, notificationUpdate]);

  const loadNotifications = async () => {
    setNotiLoading(true);
    try {
      const result = await notificationAPI.getNotifications();
      if (result.success) {
        setNotifications(result.data || []);
      }
    } catch (error) {
      setNotifications([]);
    } finally {
      setNotiLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const result = await notificationAPI.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data?.unreadCount || 0);
      }
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      const result = await registrationAPI.getRequests('pending');
      if (result.success) {
        const requests = result.data || [];
        setPendingRegistrations(requests.length);
      }
    } catch (error) {
      console.error('Load pending registrations error:', error);
    }
  };

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

  const loadAllLeaves = async () => {
    try {
      const response = await leaveAPI.getMyLeaves({ limit: 100 });
      if (response.success) {
        const leaves = response.data?.leaves || response.data || [];
        setAllLeaves(leaves);
      }
    } catch (error) {
      console.error('Load all leaves error:', error);
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

  const stats = [
    {
      title: 'ลาป่วย',
      code: 'ป',
      value: leaveBalance?.sick || 0,
      total: null,
      suffix: 'วัน',
      icon: HeartPulse,
      description: 'ลาป่วยมาแล้ว',
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
    <>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome + Calendar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
          {/* Welcome + Leave Balance */}
          <div className="lg:col-span-8">
            {/* Welcome */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-800">สวัสดี, {user?.firstName}</h1>
                  <p className="text-sm text-slate-500">{user?.position} • {getDepartmentThaiCode(user?.department)}</p>
                </div>
              </div>
            </div>

            {/* Leave Balance */}
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">วันลาคงเหลือ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">{stat.code}</span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {stat.value}
                        {stat.total && (<span className="text-lg font-normal text-slate-400">/{stat.total}</span>)}
                        {stat.suffix && (<span className="text-sm font-normal text-slate-400 ml-1">{stat.suffix}</span>)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-4">
            <DashboardCalendar leaves={allLeaves} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">ดำเนินการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => navigate('/create-leave')} className="group bg-slate-800 hover:bg-slate-900 text-white rounded-xl p-5 text-left transition-all">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors"><Plus className="w-5 h-5" /></div>
              <p className="font-medium mb-1">สร้างคำขอลา</p>
              <p className="text-sm text-slate-400">ยื่นคำขอลาใหม่</p>
            </button>

            <button onClick={() => navigate('/my-leaves')} className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 text-left transition-all">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors"><FileText className="w-5 h-5 text-slate-600" /></div>
              <p className="font-medium text-slate-800 mb-1">คำขอของฉัน</p>
              <p className="text-sm text-slate-500">ดูรายการคำขอลาทั้งหมด</p>
            </button>

            <button onClick={() => navigate('/leave-history')} className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 text-left transition-all">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors"><History className="w-5 h-5 text-slate-600" /></div>
              <p className="font-medium text-slate-800 mb-1">ประวัติการลา</p>
              <p className="text-sm text-slate-500">ดูประวัติการลาย้อนหลัง</p>
            </button>

            {isAdmin && (
              <button onClick={() => navigate('/admin/registrations')} className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-5 text-left transition-all relative">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-slate-200 transition-colors"><UserPlus className="w-5 h-5 text-slate-600" /></div>
                <p className="font-medium text-slate-800 mb-1">คำขอลงทะเบียนใหม่</p>
                <p className="text-sm text-slate-500">ตรวจสอบคำขอพนักงานใหม่</p>
                {pendingRegistrations > 0 && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                    {pendingRegistrations} รอพิจารณา
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Recent Leaves + Summary & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Leaves */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">คำขอลาล่าสุด</h3>
                {recentLeaves.length > 0 && (
                  <button onClick={() => navigate('/my-leaves')} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">ดูทั้งหมด <ChevronRight className="w-3 h-3" /></button>
                )}
              </div>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="text-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600 mx-auto"></div></div>
              ) : recentLeaves.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><FileText className="w-6 h-6 text-slate-400" /></div>
                  <p className="text-sm text-slate-500">ยังไม่มีคำขอลา</p>
                  <button onClick={() => navigate('/create-leave')} className="text-sm text-slate-700 hover:text-slate-900 font-medium mt-2">สร้างคำขอลาใหม่ →</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentLeaves.slice(0, 5).map((leave) => (
                    <div key={leave.id} onClick={() => navigate(`/leave-detail/${leave.id}`)} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">{leave.LeaveNumber || leave.leaveNumber}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{LEAVE_TYPE_CODES[leave.leaveTypeCode]}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{formatDate(leave.startDate)} - {formatDate(leave.endDate)} • {leave.totalDays} วัน</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${leave.status === 'approved' || leave.status === 'approved_final' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'rejected' ? 'bg-red-50 text-red-700' : leave.status === 'cancelled' ? 'bg-slate-100 text-slate-600' : leave.status?.includes('cancel') ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700' }`}>{leave.status === 'approved' || leave.status === 'approved_final' ? 'อนุมัติ' : leave.status === 'rejected' ? 'ไม่อนุมัติ' : leave.status === 'cancelled' ? 'ยกเลิก' : leave.status?.includes('cancel') ? 'รอพิจารณายกเลิก' : 'รอพิจารณา'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Leave Summary + Notifications */}
          <div className="space-y-6">
            {/* Leave Usage Summary */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <h3 className="font-medium text-slate-800">สรุปการลาประจำปี {new Date().getFullYear() + 543}</h3>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {(() => {
                  // คำนวณวันลาที่ใช้จริงจาก allLeaves (เฉพาะปีปัจจุบัน + สถานะอนุมัติ)
                  const currentYear = new Date().getFullYear();
                  const approvedStatuses = ['approved_final', 'approved'];
                  const usedByType = allLeaves
                    .filter(l => approvedStatuses.includes(l.status) && new Date(l.startDate).getFullYear() === currentYear)
                    .reduce((acc, l) => {
                      const code = l.leaveTypeCode;
                      acc[code] = (acc[code] || 0) + (l.totalDays || 0);
                      return acc;
                    }, {});

                  // sick จาก API = วันที่ใช้ไปแล้ว (นับจาก approved_final)
                  const sickUsed = leaveBalance?.sick || usedByType['SICK'] || 0;
                  const vacationRemaining = leaveBalance?.vacation ?? 0;
                  const personalRemaining = leaveBalance?.personal ?? 0;

                  // คำนวณ used จาก allLeaves
                  const vacationUsed = usedByType['VACATION'] || 0;
                  const personalUsed = usedByType['PERSONAL'] || 0;

                  // คำนวณ total = used + remaining
                  const vacationTotal = Math.max(10, vacationUsed + vacationRemaining);
                  const personalTotal = Math.max(3, personalUsed + personalRemaining);

                  const leaveStats = [
                    {
                      label: 'ลาป่วย',
                      used: sickUsed,
                      total: 60,
                      remaining: Math.max(0, 60 - sickUsed),
                      color: 'bg-rose-500',
                      bgColor: 'bg-rose-100',
                      textColor: 'text-rose-600',
                      unlimited: true,
                    },
                    {
                      label: 'ลาพักผ่อน',
                      used: vacationUsed,
                      total: vacationTotal,
                      remaining: vacationRemaining,
                      color: 'bg-sky-500',
                      bgColor: 'bg-sky-100',
                      textColor: 'text-sky-600',
                    },
                    {
                      label: 'ลากิจ',
                      used: personalUsed,
                      total: personalTotal,
                      remaining: personalRemaining,
                      color: 'bg-amber-500',
                      bgColor: 'bg-amber-100',
                      textColor: 'text-amber-600',
                    },
                  ];

                  const totalUsed = leaveStats.reduce((sum, s) => sum + s.used, 0);

                  return (
                    <>
                      {/* Total used summary */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-slate-500">ลาไปทั้งหมด</p>
                          <p className="text-2xl font-bold text-slate-800">{totalUsed} <span className="text-sm font-normal text-slate-400">วัน</span></p>
                        </div>
                        <div className="flex -space-x-1">
                          {leaveStats.filter(s => s.used > 0).map((s, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full ${s.bgColor} flex items-center justify-center border-2 border-white`}>
                              <span className={`text-[10px] font-bold ${s.textColor}`}>{s.used}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Per-type progress bars */}
                      {leaveStats.map((stat, i) => {
                        const percentage = stat.unlimited
                          ? (stat.used > 0 ? Math.min(100, (stat.used / 60) * 100) : 0)
                          : Math.min(100, (stat.used / stat.total) * 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-slate-600">{stat.label}</span>
                              <span className="text-xs text-slate-500">
                                ใช้ {stat.used} วัน {!stat.unlimited && `/ ${stat.total} วัน`}
                              </span>
                            </div>
                            <div className={`h-2 rounded-full ${stat.bgColor} overflow-hidden`}>
                              <div
                                className={`h-full rounded-full ${stat.color} transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              คงเหลือ {stat.remaining} วัน
                            </p>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <h3 className="font-medium text-slate-800">การแจ้งเตือน</h3>
                  {unreadCount > 0 && (<span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">{unreadCount} ใหม่</span>)}
                </div>
              </div>
              <div className="p-2">
                {notiLoading ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-slate-600 mx-auto"></div></div>
                ) : notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 4).map((noti) => (
                      <div key={noti.id} className={`flex items-start gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors ${!noti.is_read ? 'bg-blue-50' : ''}`}>
                        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-slate-100"><Bell className="w-3.5 h-3.5 text-slate-400" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-600">{noti.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{noti.created_at ? new Date(noti.created_at).toLocaleString('th-TH') : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2"><Bell className="w-5 h-5 text-slate-400" /></div>
                    <p className="text-xs text-slate-500">ไม่มีการแจ้งเตือน</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
