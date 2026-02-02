import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { directorAPI } from '../../api/director.api';
import { notificationAPI } from '../../api/notification.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useConfirm } from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, AlertCircle, ArrowLeft, Building2, Stamp, Bell, Trash2 } from 'lucide-react';

export default function DashboardDirector() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    loadPendingLeaves();
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const result = await notificationAPI.getNotifications();
      if (result.success) {
        // แสดงเฉพาะ 5 รายการล่าสุดที่ยังไม่อ่าน
        const unread = (result.data || []).filter(n => !n.is_read).slice(0, 5);
        setNotifications(unread);
      }
    } catch (error) {
      console.log('Error loading notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.log('Error marking as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications([]);
      toast.success('อ่านแจ้งเตือนทั้งหมดแล้ว');
    } catch (error) {
      console.log('Error marking all as read');
    }
  };

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      const data = await directorAPI.getPendingLeaves();
      setPendingLeaves(data.data || []);
    } catch (error) {
      console.error('Error loading pending leaves:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    const confirmed = await confirm({
      title: 'ยืนยันการอนุมัติ',
      message: 'คุณต้องการอนุมัติใบลานี้หรือไม่?',
      type: 'question',
      confirmText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
      confirmColor: 'green',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await directorAPI.approveLeave(leaveId, remarks);
      toast.success('🎉 อนุมัติการลาเรียบร้อยแล้ว');
      setRemarks('');
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (leaveId) => {
    if (!remarks.trim()) {
      toast.error('กรุณาระบุเหตุผลในการไม่อนุมัติ');
      return;
    }

    const confirmed = await confirm({
      title: 'ยืนยันการไม่อนุมัติ',
      message: 'คุณต้องการไม่อนุมัติใบลานี้หรือไม่?',
      type: 'danger',
      confirmText: 'ไม่อนุมัติ',
      cancelText: 'ยกเลิก',
      confirmColor: 'red',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await directorAPI.rejectLeave(leaveId, remarks);
      toast.success('ไม่อนุมัติการลาเรียบร้อยแล้ว');
      setRemarks('');
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติ');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [LEAVE_STATUS.PENDING]: { label: 'รอดำเนินการ', class: 'bg-yellow-100 text-yellow-800' },
      [LEAVE_STATUS.APPROVED_LEVEL1]: { label: 'ผอ.อนุมัติแล้ว', class: 'bg-blue-100 text-blue-800' },
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-600 hover:text-blue-900 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">กลับหน้าหลัก</span>
      </button>

      {/* Official Government Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-xl shadow-2xl overflow-hidden border-4 border-yellow-500">
        {/* Gold Stripe Top */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Official Seal */}
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-300">
                <Stamp className="w-10 h-10 text-blue-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Building2 className="w-7 h-7 text-yellow-400" />
                  ระบบอนุมัติการลา
                </h1>
                <p className="text-yellow-200 mt-1 text-lg">ผู้อำนวยการกลุ่ม • ลำดับที่ 1</p>
                <p className="text-blue-200 text-sm mt-1">ตรวจสอบและอนุมัติใบลาของบุคลากรในสังกัด</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur border-2 border-yellow-400 rounded-xl px-8 py-4 text-center">
              <div className="text-4xl font-bold text-yellow-400">{pendingLeaves.length}</div>
              <div className="text-sm text-yellow-200 font-medium">รายการรออนุมัติ</div>
            </div>
          </div>
        </div>

        {/* Gold Stripe Bottom */}
        <div className="h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400"></div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-amber-300 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5" />
              <span className="font-semibold">แจ้งเตือนใหม่</span>
              <span className="bg-white text-amber-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              อ่านทั้งหมด
            </button>
          </div>
          <div className="divide-y divide-amber-200">
            {notifications.map((notif) => (
              <div key={notif.id} className="px-5 py-4 flex items-start gap-4 hover:bg-amber-100/50 transition-colors">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {notif.type === 'leave_pending' ? (
                    <Clock className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      // แปลงเวลาจาก UTC ให้ถูกต้อง
                      let dateStr = notif.created_at;
                      if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
                        dateStr = dateStr + 'Z';
                      }
                      return new Date(dateStr).toLocaleDateString('th-TH', { 
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      });
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="ทำเครื่องหมายว่าอ่านแล้ว"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingLeaves.length === 0 ? (
        <Card className="text-center py-16 border-2 border-blue-200 bg-white shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center border-4 border-green-300 shadow-md">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-blue-900">ไม่มีรายการรออนุมัติ</h3>
            <p className="text-gray-600">ใบลาทั้งหมดได้รับการดำเนินการเรียบร้อยแล้ว</p>
            <div className="mt-4 px-6 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium border border-blue-200">
              ระบบพร้อมใช้งาน
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 bg-white">
              {/* Official Document Header */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-3 flex items-center justify-between border-b-4 border-yellow-400">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold">เอกสารใบลาราชการ</span>
                </div>
                <span className="text-yellow-400 font-mono text-sm">เลขที่: {leave.id?.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Left: Employee Info */}
                <div className="lg:w-1/4 bg-gradient-to-br from-blue-50 to-slate-50 p-6 border-b lg:border-b-0 lg:border-r-2 border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-yellow-400">
                      {leave.employee?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-lg">
                        {leave.employee?.name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-gray-600">รหัสบุคลากร: <span className="font-mono font-semibold">{leave.employee?.employeeCode}</span></p>
                      <span className="inline-block mt-2 px-4 py-1 bg-blue-900 text-yellow-400 text-xs font-bold rounded-full border border-yellow-400">
                        {getDepartmentThaiCode(leave.employee?.department) || 'ไม่ระบุสังกัด'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Leave Details */}
                <div className="lg:w-1/2 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">ประเภทการลา</span>
                      </div>
                      <p className="font-bold text-blue-900 text-lg">{leave.leaveType || 'N/A'}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">จำนวนวัน</span>
                      </div>
                      <p className="font-bold text-blue-900 text-lg">{leave.totalDays} วัน</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 text-green-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-bold text-blue-900">{formatDate(leave.startDate)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
                      <div className="flex items-center gap-2 text-red-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-bold text-blue-900">{formatDate(leave.endDate)}</p>
                    </div>
                  </div>

                  {/* Selected Dates */}
                  {leave.selectedDates && leave.selectedDates.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-bold text-blue-800 mb-2 uppercase">วันที่ลาเลือก:</p>
                      <div className="flex flex-wrap gap-2">
                        {leave.selectedDates.map((date, index) => (
                          <span key={index} className="bg-blue-900 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold border border-yellow-400">
                            {formatDate(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  {leave.reason && (
                    <div className="mt-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border-2 border-slate-200">
                      <p className="text-sm font-bold text-blue-800 mb-1 uppercase">เหตุผลการลา:</p>
                      <p className="text-gray-800">{leave.reason}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="lg:w-1/4 p-6 bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col justify-center border-l-2 border-blue-100">
                  {selectedLeave === leave.id ? (
                    <div className="space-y-4">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="บันทึกข้อความ / หมายเหตุ..."
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 resize-none bg-white"
                        rows="3"
                      />
                      <button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50 border-2 border-green-400"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 border-2 border-red-400"
                      >
                        <XCircle className="w-5 h-5" />
                        ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => { setSelectedLeave(null); setRemarks(''); }}
                        disabled={actionLoading}
                        className="w-full text-gray-600 font-semibold py-2 hover:text-blue-900 transition-colors border-2 border-gray-300 rounded-xl hover:border-blue-400 bg-white"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold mb-4 border-2 border-amber-300">
                        <AlertCircle className="w-4 h-4" />
                        รอการพิจารณา
                      </div>
                      <button
                        onClick={() => setSelectedLeave(leave.id)}
                        className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white font-bold py-3 rounded-xl hover:from-blue-900 hover:to-blue-950 transition-all shadow-lg border-2 border-yellow-400"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Stamp className="w-5 h-5 text-yellow-400" />
                          พิจารณาการลา
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
