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
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, AlertCircle, ArrowLeft, Building2, Stamp, Bell, Trash2, Filter, Users, Search } from 'lucide-react';

// Department names mapping (รองรับทั้งรหัสภาษาอังกฤษและชื่อเต็มภาษาไทย)
const DEPARTMENT_NAMES = {
  // รหัสภาษาอังกฤษ
  'GYS': 'กยส.',
  'GOK': 'กอก.',
  'GTS': 'กทส.',
  'GTP': 'กตป.',
  'GSS': 'กสส.',
  'GKC': 'กคช.',
  'GPS': 'กปส.',
  'GKM': 'กกม.',
  'SLK': 'สลก.',
  'TSN': 'ตสน.',
  'KPR': 'กพร.',
  // ชื่อเต็มภาษาไทย
  'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร': 'กยส.',
  'กลุ่มงานอำนวยการ': 'กอก.',
  'กลุ่มงานเทคโนโลยีสารสนเทศ': 'กทส.',
  'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร': 'กตป.',
  'กลุ่มงานเทคโนโลยีการสื่อสาร': 'กสส.',
  'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร': 'กคช.',
  'กองหลักประกันสุขภาพ': 'กปส.',
  'กองกฎหมาย': 'กกม.',
  'สำนักงานเลขานุการกรม': 'สลก.',
  'กลุ่มตรวจสอบภายใน': 'ตสน.',
  'กลุ่มพัฒนาระบบบริหาร': 'กพร.', 
};

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
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique departments from pending leaves and count
  const departmentStats = pendingLeaves.reduce((acc, leave) => {
    const dept = leave.employee?.department || 'unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Filter leaves by selected department and search term
  const filteredLeaves = pendingLeaves.filter(leave => {
    const matchDept = selectedDepartment === 'all' || leave.employee?.department === selectedDepartment;
    const matchSearch = !searchTerm || 
      leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee?.employeeCode?.includes(searchTerm) ||
      leave.leaveNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchSearch;
  });

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
      <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-xl shadow-lg overflow-hidden border border-slate-400">
        {/* Top Stripe */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
        
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Official Seal */}
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-md border-2 border-slate-300">
                <Stamp className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-300" />
                  ระบบอนุมัติการลา
                </h1>
                <p className="text-slate-300 mt-1">ผู้อำนวยการกลุ่ม • ลำดับที่ 1</p>
                <p className="text-slate-400 text-sm mt-1">ตรวจสอบและอนุมัติใบลาของบุคลากรในสังกัด</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur border border-slate-400 rounded-lg px-6 py-3 text-center">
              <div className="text-3xl font-bold text-blue-300">{pendingLeaves.length}</div>
              <div className="text-sm text-slate-300">รายการรออนุมัติ</div>
            </div>
          </div>
        </div>

        {/* Bottom Stripe */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-700">
              <Bell className="w-5 h-5" />
              <span className="font-semibold">แจ้งเตือนใหม่</span>
              <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              อ่านทั้งหมด
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  {notif.type === 'leave_pending' ? (
                    <Clock className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Bell className="w-5 h-5 text-blue-500" />
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

      {/* Department Filter Tabs */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-700">กรองตามกอง/ฝ่าย</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* All departments button */}
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedDepartment === 'all'
                  ? 'bg-slate-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ทั้งหมด</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedDepartment === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
              }`}>
                {pendingLeaves.length}
              </span>
            </button>

            {/* Department buttons */}
            {Object.entries(departmentStats)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedDepartment === dept
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{DEPARTMENT_NAMES[dept] || dept}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedDepartment === dept ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
          </div>
          
          {selectedDepartment !== 'all' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <span>แสดงเฉพาะ:</span>
              <span className="font-semibold">{DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment}</span>
              <span className="text-slate-400">({filteredLeaves.length} รายการ)</span>
            </div>
          )}
        </div>
      )}

      {/* Search Box */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อพนักงาน, รหัสพนักงาน หรือเลขที่ใบลา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-slate-600">
              พบ {filteredLeaves.length} รายการ
            </div>
          )}
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
          {filteredLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-200 bg-white">
              {/* Official Document Header */}
              <div className="bg-slate-600 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-200" />
                  <span className="text-white font-semibold">เอกสารใบลาราชการ</span>
                </div>
                <span className="text-slate-300 font-mono text-sm">เลขที่: {leave.id?.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Left: Employee Info */}
                <div className="lg:w-1/4 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {leave.employee?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {leave.employee?.name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-slate-500">รหัสบุคลากร: <span className="font-mono font-semibold">{leave.employee?.employeeCode}</span></p>
                      <span className="inline-block mt-2 px-3 py-1 bg-slate-600 text-white text-xs font-medium rounded-full">
                        {getDepartmentThaiCode(leave.employee?.department) || 'ไม่ระบุสังกัด'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Leave Details */}
                <div className="lg:w-1/2 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">ประเภทการลา</span>
                      </div>
                      <p className="font-semibold text-slate-800">{leave.leaveType || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">จำนวนวัน</span>
                      </div>
                      <p className="font-semibold text-slate-800">{leave.totalDays} วัน</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-semibold text-slate-800">{formatDate(leave.startDate)}</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                      <div className="flex items-center gap-2 text-rose-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-semibold text-slate-800">{formatDate(leave.endDate)}</p>
                    </div>
                  </div>

                  {/* Selected Dates */}
                  {leave.selectedDates && leave.selectedDates.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-600 mb-2">วันที่ลาเลือก:</p>
                      <div className="flex flex-wrap gap-2">
                        {leave.selectedDates.map((date, index) => (
                          <span key={index} className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {formatDate(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  {leave.reason && (
                    <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-1">เหตุผลการลา:</p>
                      <p className="text-slate-700">{leave.reason}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="lg:w-1/4 p-6 bg-slate-50 flex flex-col justify-center border-l border-slate-200">
                  {selectedLeave === leave.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="บันทึกข้อความ / หมายเหตุ..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none bg-white text-sm"
                        rows="3"
                      />
                      <button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => { setSelectedLeave(null); setRemarks(''); }}
                        disabled={actionLoading}
                        className="w-full text-slate-500 font-medium py-2 hover:text-slate-700 transition-colors border border-slate-300 rounded-lg hover:border-slate-400 bg-white text-sm"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium mb-4 border border-amber-200">
                        <AlertCircle className="w-4 h-4" />
                        รอการพิจารณา
                      </div>
                      <button
                        onClick={() => setSelectedLeave(leave.id)}
                        className="w-full bg-slate-600 text-white font-medium py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Stamp className="w-4 h-4" />
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
