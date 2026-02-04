import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { Card } from '../../components/common/Card';
import { useConfirm } from '../../components/common/ConfirmDialog';
import DateEditModal from '../../components/common/DateEditModal';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar, FileText, Crown, AlertTriangle, User, Filter, Users, Building2, Edit3 } from 'lucide-react';

// Helper function to parse reason from JSON
const parseReason = (reason) => {
  if (!reason) return 'ไม่ระบุเหตุผล';
  try {
    const parsed = JSON.parse(reason);
    return parsed.reason || reason;
  } catch (e) {
    return reason;
  }
};

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

export default function AdminDashboard() {
  const { confirm } = useConfirm();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);

  // Get unique departments from pending leaves and count
  const departmentStats = pendingLeaves.reduce((acc, leave) => {
    const dept = leave.employee?.department || 'unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Filter leaves by selected department
  const filteredLeaves = selectedDepartment === 'all' 
    ? pendingLeaves 
    : pendingLeaves.filter(leave => leave.employee?.department === selectedDepartment);

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getApprovedLevel3Leaves();
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
      title: '⚠️ อนุมัติขั้นสุดท้าย',
      message: 'คุณต้องการอนุมัติขั้นสุดท้ายและหักวันลาหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้',
      type: 'warning',
      confirmText: 'อนุมัติ & หักวันลา',
      cancelText: 'ยกเลิก',
      confirmColor: 'green',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await adminAPI.approveLeaveFinal(leaveId, remarks);
      toast.success('🎉 อนุมัติการลาเรียบร้อยแล้ว และได้หักวันลาแล้ว');
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
      await adminAPI.rejectLeaveFinal(leaveId, remarks);
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

  // Open modal for editing dates
  const handleOpenEditModal = (leave) => {
    setEditingLeave(leave);
    setEditModalOpen(true);
  };

  // Handle partial approval submission
  const handlePartialApprove = async ({ approvedDates, rejectedDates, rejectReason }) => {
    try {
      setActionLoading(true);
      await adminAPI.partialApproveLeaveFinal(
        editingLeave.id,
        approvedDates,
        rejectedDates,
        rejectReason,
        remarks
      );
      
      let message = `🎉 อนุมัติ ${approvedDates.length} วัน และหักวันลาแล้ว`;
      if (rejectedDates.length > 0) {
        message += ` (ไม่อนุมัติ ${rejectedDates.length} วัน)`;
      }
      toast.success(message);
      
      setEditModalOpen(false);
      setEditingLeave(null);
      setRemarks('');
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error('Error partial approving leave:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติบางส่วน');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <Crown className="w-7 h-7" />
              อนุมัติขั้นสุดท้าย
            </h1>
            <p className="text-slate-300 mt-1">ผู้บริหารสูงสุด (Level 4) - หักวันลาทันที</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 text-center border border-slate-400">
            <div className="text-3xl font-bold">{pendingLeaves.length}</div>
            <div className="text-sm text-slate-300">รออนุมัติ</div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-r-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-800">การอนุมัติขั้นสุดท้าย</p>
            <p className="text-sm text-yellow-700">การอนุมัติในขั้นนี้จะหักวันลาของพนักงานทันที กรุณาตรวจสอบข้อมูลให้ถูกต้อง</p>
          </div>
        </div>
      </div>

      {/* Department Filter Tabs */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-700">กรองตามกอง/ฝ่าย</h2>
          </div>
          <div className="flex flex-wrap gap-2">
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

      {pendingLeaves.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">ไม่มีรายการรออนุมัติ</h3>
            <p className="text-gray-500">ใบลาทั้งหมดได้รับการดำเนินการแล้ว</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-slate-500 border border-slate-200">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Employee Info */}
                <div className="lg:w-1/4 bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {(leave.employee?.name || leave.user_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        {leave.employee?.name || leave.user_name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-slate-500">รหัส: {leave.employee?.employeeCode}</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-slate-200 text-slate-700 text-xs font-semibold rounded-full">
                        {getDepartmentThaiCode(leave.employee?.department || leave.department_name) || 'ไม่ระบุแผนก'}
                      </span>
                    </div>
                  </div>
                  {/* Full Approval Trail */}
                  <div className="mt-4 space-y-1">
                    <div className="p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      <p className="text-xs text-blue-600 font-medium">ผอ.อนุมัติ</p>
                    </div>
                    <div className="p-2 bg-teal-50 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-teal-600" />
                      <p className="text-xs text-teal-600 font-medium">เจ้าหน้าที่ตรวจสอบ</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-purple-600" />
                      <p className="text-xs text-purple-600 font-medium">หัวหน้าสำนักงานกลาง</p>
                    </div>
                    <div className="p-2 bg-amber-100 rounded-lg flex items-center gap-2 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <p className="text-xs text-amber-700 font-bold">รอผู้บริหารอนุมัติ</p>
                    </div>
                  </div>
                </div>

                {/* Center: Leave Details */}
                <div className="lg:w-1/2 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">ประเภทการลา</span>
                      </div>
                      <p className="font-bold text-slate-900">{leave.leaveType || leave.leave_type_name || 'N/A'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">จำนวนวันที่จะหัก</span>
                      </div>
                      <p className="font-bold text-amber-700 text-xl">{leave.totalDays || leave.total_days} วัน</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-bold text-slate-900">{formatDate(leave.startDate || leave.start_date)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-bold text-slate-900">{formatDate(leave.endDate || leave.end_date)}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  {leave.reason && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-sm font-medium text-slate-600 mb-1">เหตุผล:</p>
                      <p className="text-slate-800">{parseReason(leave.reason)}</p>
                    </div>
                  )}

                  {/* Leave Balance Warning */}
                  {leave.current_balance !== undefined && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-orange-800">
                        วันลาคงเหลือ: <span className="text-lg">{leave.current_balance}</span> วัน
                      </p>
                      <p className="text-xs text-orange-600">
                        หลังอนุมัติจะเหลือ: {leave.current_balance - (leave.totalDays || leave.total_days)} วัน
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="lg:w-1/4 p-6 bg-slate-50 flex flex-col justify-center">
                  {selectedLeave === leave.id ? (
                    <div className="space-y-4">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="หมายเหตุ (ถ้ามี)..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                        rows="3"
                      />
                      <button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติทั้งหมด'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(leave)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <Edit3 className="w-5 h-5" />
                        แก้ไขวันลา
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        ไม่อนุมัติ
                      </button>
                      <button
                        onClick={() => { setSelectedLeave(null); setRemarks(''); }}
                        disabled={actionLoading}
                        className="w-full text-slate-600 font-medium py-2 hover:text-slate-800 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                        <CheckCircle className="w-4 h-4" />
                        ผ่านทุกขั้นตอนแล้ว
                      </div>
                      <button
                        onClick={() => setSelectedLeave(leave.id)}
                        className="w-full bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold py-3 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all shadow-md"
                      >
                        พิจารณาอนุมัติขั้นสุดท้าย
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Date Edit Modal */}
      <DateEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingLeave(null);
        }}
        leave={editingLeave}
        onSubmit={handlePartialApprove}
        loading={actionLoading}
      />
    </div>
  );
}
