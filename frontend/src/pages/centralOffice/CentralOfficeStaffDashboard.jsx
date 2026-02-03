import { useState, useEffect } from 'react';
import { centralOfficeAPI } from '../../api/centralOffice.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { Card } from '../../components/common/Card';
import { useConfirm } from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Calendar, FileText, AlertCircle, ClipboardCheck, User, Eye, Download, X, Phone, MapPin, Filter, Building2, Users } from 'lucide-react';

// Helper function to parse reason from JSON
const parseReason = (reason) => {
  if (!reason) return 'ไม่ระบุเหตุผล';
  try {
    // Check if reason is a JSON string
    const parsed = JSON.parse(reason);
    return parsed.reason || reason;
  } catch (e) {
    // If not JSON, return as-is
    return reason;
  }
};

// Department display names mapping (ตัวย่อภาษาไทย)
const DEPARTMENT_NAMES = {
  'GOK': 'กอก.',
  'GYS': 'กยส.',
  'GTS': 'กทส.',
  'GTP': 'กตป.',
  'GSS': 'กสส.',
  'GKC': 'กคช.',
};

export default function CentralOfficeStaffDashboard() {
  const { confirm } = useConfirm();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [detailModalLeave, setDetailModalLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

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
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      const data = await centralOfficeAPI.getApprovedLevel1Leaves();
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
      message: 'คุณต้องการอนุมัติใบลานี้หรือไม่? (จะส่งต่อไปยังหัวหน้าสำนักงานกลาง)',
      type: 'question',
      confirmText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
      confirmColor: 'green',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await centralOfficeAPI.approveLeaveLevel2(leaveId, remarks);
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
      await centralOfficeAPI.rejectLeaveLevel2(leaveId, remarks);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              ตรวจสอบเอกสารการลา
            </h1>
            <p className="text-teal-100 mt-1">สำนักงานกลาง - เจ้าหน้าที่ (Level 2)</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-bold">{pendingLeaves.length}</div>
            <div className="text-sm text-teal-100">รอตรวจสอบ</div>
          </div>
        </div>
      </div>

      {/* Department Filter Tabs */}
      {pendingLeaves.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-700">กรองตามกอง/ฝ่าย</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* All departments button */}
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedDepartment === 'all'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ทั้งหมด</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedDepartment === 'all' ? 'bg-white/20' : 'bg-teal-100 text-teal-700'
              }`}>
                {pendingLeaves.length}
              </span>
            </button>

            {/* Department buttons */}
            {Object.entries(departmentStats)
              .sort((a, b) => b[1] - a[1]) // Sort by count descending
              .map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedDepartment === dept
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{DEPARTMENT_NAMES[dept] || dept}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedDepartment === dept ? 'bg-white/20' : 'bg-teal-100 text-teal-700'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
          </div>
          
          {/* Current filter info */}
          {selectedDepartment !== 'all' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-teal-600">
              <span>แสดงเฉพาะ:</span>
              <span className="font-semibold">{DEPARTMENT_NAMES[selectedDepartment] || selectedDepartment}</span>
              <span className="text-gray-500">({filteredLeaves.length} รายการ)</span>
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
            <h3 className="text-xl font-semibold text-gray-700">ไม่มีรายการรอตรวจสอบ</h3>
            <p className="text-gray-500">เอกสารทั้งหมดได้รับการตรวจสอบแล้ว</p>
          </div>
        </Card>
      ) : filteredLeaves.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600">ไม่มีรายการในกองนี้</h3>
            <p className="text-gray-500">ลองเลือกกองอื่นหรือดูทั้งหมด</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredLeaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="flex flex-col lg:flex-row">
                {/* Left: Employee Info */}
                <div className="lg:w-1/4 bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {leave.employee?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {leave.employee?.name || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-gray-500">รหัส: {leave.employee?.employeeCode}</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
                        {getDepartmentThaiCode(leave.employee?.department) || 'ไม่ระบุแผนก'}
                      </span>
                    </div>
                  </div>
                  {/* Director Approval Info */}
                  {leave.directorApproval?.approver && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">✓ อนุมัติโดย ผอ.</p>
                      <p className="text-sm text-blue-800 font-semibold">{leave.directorApproval.approver}</p>
                    </div>
                  )}
                </div>

                {/* Center: Leave Details */}
                <div className="lg:w-1/2 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">ประเภทการลา</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.leaveType || 'N/A'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">จำนวนวัน</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.totalDays} วัน</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.startDate)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.endDate)}</p>
                    </div>
                  </div>

                  {/* Reason */}
                  {leave.reason && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">เหตุผล:</p>
                      <p className="text-gray-800">{parseReason(leave.reason)}</p>
                    </div>
                  )}

                  {/* Director Remarks */}
                  {leave.directorApproval?.remarks && (
                    <div className="mt-3 bg-blue-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-blue-600 mb-1">หมายเหตุจาก ผอ.:</p>
                      <p className="text-blue-800 italic">{leave.directorApproval.remarks}</p>
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        rows="3"
                      />
                      <button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {actionLoading ? 'กำลังดำเนินการ...' : 'ผ่านการตรวจสอบ'}
                      </button>
                      <button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        ไม่ผ่าน
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
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        ผอ.อนุมัติแล้ว
                      </div>
                      <button
                        onClick={() => setDetailModalLeave(leave)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-3 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md"
                      >
                        <Eye className="w-5 h-5" />
                        ดูรายละเอียด
                      </button>
                      <button
                        onClick={() => setSelectedLeave(leave.id)}
                        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-teal-500 text-teal-600 font-semibold py-3 rounded-xl hover:bg-teal-50 transition-all"
                      >
                        <ClipboardCheck className="w-5 h-5" />
                        ตรวจสอบเอกสาร
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailModalLeave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">รายละเอียดคำขอลา</h2>
                  <p className="text-teal-100 text-sm mt-1">เลขที่: {detailModalLeave.leaveNumber || 'N/A'}</p>
                </div>
                <button
                  onClick={() => setDetailModalLeave(null)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-600" />
                  ข้อมูลผู้ยื่นคำขอ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                    <p className="font-semibold text-gray-900">{detailModalLeave.employee?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">รหัสพนักงาน</p>
                    <p className="font-semibold text-gray-900">{detailModalLeave.employee?.employeeCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ตำแหน่ง</p>
                    <p className="font-semibold text-gray-900">{detailModalLeave.employee?.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">แผนก</p>
                    <p className="font-semibold text-gray-900">{getDepartmentThaiCode(detailModalLeave.employee?.department) || 'N/A'}</p>
                  </div>
                  {detailModalLeave.employee?.phone && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-4 h-4" /> เบอร์โทรศัพท์
                      </p>
                      <p className="font-semibold text-gray-900">{detailModalLeave.employee.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Details */}
              <div className="bg-orange-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  ข้อมูลการลา
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ประเภทการลา</p>
                    <p className="font-bold text-orange-700">{detailModalLeave.leaveType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">จำนวนวัน</p>
                    <p className="font-bold text-orange-700">{detailModalLeave.totalDays} วัน</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">วันที่เริ่มต้น</p>
                    <p className="font-semibold text-gray-900">{formatDate(detailModalLeave.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">วันที่สิ้นสุด</p>
                    <p className="font-semibold text-gray-900">{formatDate(detailModalLeave.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-2">เหตุผลการลา</h3>
                <p className="text-gray-800">{parseReason(detailModalLeave.reason)}</p>
              </div>

              {/* Contact Info */}
              {(detailModalLeave.contactAddress || detailModalLeave.contactPhone) && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    ข้อมูลติดต่อระหว่างลา
                  </h3>
                  {detailModalLeave.contactAddress && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-500">ที่อยู่ติดต่อ</p>
                      <p className="text-gray-800">{detailModalLeave.contactAddress}</p>
                    </div>
                  )}
                  {detailModalLeave.contactPhone && (
                    <div>
                      <p className="text-sm text-gray-500">เบอร์โทรติดต่อ</p>
                      <p className="text-gray-800">{detailModalLeave.contactPhone}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Document Attachment */}
              {detailModalLeave.documentUrl && (
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    เอกสารแนบ
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-gray-600">ไฟล์เอกสารประกอบการลา</p>
                    </div>
                    <a
                      href={detailModalLeave.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      ดู
                    </a>
                    <a
                      href={detailModalLeave.documentUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </a>
                  </div>
                </div>
              )}

              {/* Director Approval Info */}
              {detailModalLeave.directorApproval?.approver && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    การอนุมัติจากผู้อำนวยการกอง
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">ผู้อนุมัติ</p>
                      <p className="font-semibold text-blue-900">{detailModalLeave.directorApproval.approver}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">วันที่อนุมัติ</p>
                      <p className="font-semibold text-blue-900">
                        {detailModalLeave.directorApproval.approvedAt 
                          ? formatDate(detailModalLeave.directorApproval.approvedAt)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {detailModalLeave.directorApproval.remarks && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-600">หมายเหตุ</p>
                      <p className="text-blue-800 italic">{detailModalLeave.directorApproval.remarks}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 rounded-b-2xl border-t flex justify-end gap-3">
              <button
                onClick={() => setDetailModalLeave(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setSelectedLeave(detailModalLeave.id);
                  setDetailModalLeave(null);
                }}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                ดำเนินการตรวจสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
