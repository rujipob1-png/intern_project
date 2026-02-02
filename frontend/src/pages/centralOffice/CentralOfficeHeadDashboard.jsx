import { useState, useEffect } from 'react';
import { centralOfficeAPI } from '../../api/centralOffice.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { Card } from '../../components/common/Card';
import { useConfirm } from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar, FileText, Shield, User } from 'lucide-react';

export default function CentralOfficeHeadDashboard() {
  const { confirm } = useConfirm();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      const data = await centralOfficeAPI.getApprovedLevel2Leaves();
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
      message: 'คุณต้องการอนุมัติใบลานี้หรือไม่? (จะส่งต่อไปยังผู้บริหารสูงสุด)',
      type: 'question',
      confirmText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
      confirmColor: 'green',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await centralOfficeAPI.approveLeaveLevel3(leaveId, remarks);
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
      await centralOfficeAPI.rejectLeaveLevel3(leaveId, remarks);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8" />
              อนุมัติการลา
            </h1>
            <p className="text-purple-100 mt-1">หัวหน้าสำนักงานกลาง (Level 3)</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-bold">{pendingLeaves.length}</div>
            <div className="text-sm text-purple-100">รออนุมัติ</div>
          </div>
        </div>
      </div>

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
          {pendingLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Employee Info */}
                <div className="lg:w-1/4 bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {(leave.employee?.name || leave.user_name || 'U').charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {leave.employee?.name || leave.user_name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-gray-500">รหัส: {leave.employee?.employeeCode}</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                        {getDepartmentThaiCode(leave.employee?.department || leave.department_name) || 'ไม่ระบุแผนก'}
                      </span>
                    </div>
                  </div>
                  {/* Approval Trail */}
                  <div className="mt-4 space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">✓ ผอ.อนุมัติ</p>
                    </div>
                    <div className="p-2 bg-teal-50 rounded-lg">
                      <p className="text-xs text-teal-600 font-medium">✓ เจ้าหน้าที่ตรวจสอบแล้ว</p>
                    </div>
                  </div>
                </div>

                {/* Center: Leave Details */}
                <div className="lg:w-1/2 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">ประเภทการลา</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.leaveType || leave.leave_type_name || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">จำนวนวัน</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.totalDays || leave.total_days} วัน</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.startDate || leave.start_date)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.endDate || leave.end_date)}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  {leave.reason && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">เหตุผล:</p>
                      <p className="text-gray-800">{leave.reason}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="lg:w-1/4 p-6 bg-gray-50 flex flex-col justify-center">
                  {selectedLeave === leave.id ? (
                    <div className="space-y-4">
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="หมายเหตุ (ถ้ามี)..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        rows="3"
                      />
                      <button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
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
                        className="w-full text-gray-600 font-medium py-2 hover:text-gray-800 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
                        <CheckCircle className="w-4 h-4" />
                        เจ้าหน้าที่ตรวจสอบแล้ว
                      </div>
                      <button
                        onClick={() => setSelectedLeave(leave.id)}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                      >
                        พิจารณาการลา
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
