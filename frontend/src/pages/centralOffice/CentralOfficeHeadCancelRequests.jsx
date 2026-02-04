import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { centralOfficeAPI } from '../../api/centralOffice.api';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { Card } from '../../components/common/Card';
import { useConfirm } from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { XCircle, CheckCircle, Clock, Calendar, FileText, AlertCircle, AlertTriangle, Filter, Building2, Users, ArrowLeft } from 'lucide-react';

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

// Department display names mapping
const DEPARTMENT_NAMES = {
  'GYS': 'กยส.', 'GOK': 'กอก.', 'GTS': 'กทส.', 'GPS': 'กปส.', 'GSS': 'กศส.',
  'GKM': 'กกม.', 'SLK': 'สลก.', 'TSN': 'ตสน.', 'KPR': 'กพร.',
  'กองยุทธศาสตร์และแผนงาน': 'กยส.', 'กองอำนวยการ': 'กอก.',
  'กองทะเบียนและสารสนเทศ': 'กทส.', 'กองหลักประกันสุขภาพ': 'กปส.',
  'กองเศรษฐกิจสุขภาพและหลักประกันสุขภาพ': 'กศส.', 'กองกฎหมาย': 'กกม.',
  'สำนักงานเลขานุการกรม': 'สลก.', 'กลุ่มตรวจสอบภายใน': 'ตสน.', 'กลุ่มพัฒนาระบบบริหาร': 'กพร.',
};

export default function CentralOfficeHeadCancelRequests() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [pendingCancels, setPendingCancels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCancel, setSelectedCancel] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Get unique departments
  const departmentStats = pendingCancels.reduce((acc, leave) => {
    const dept = leave.employee?.department || 'unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Filter by department
  const filteredCancels = selectedDepartment === 'all' 
    ? pendingCancels 
    : pendingCancels.filter(leave => leave.employee?.department === selectedDepartment);

  useEffect(() => {
    loadPendingCancels();
  }, []);

  const loadPendingCancels = async () => {
    try {
      setLoading(true);
      const data = await centralOfficeAPI.getPendingCancelRequestsHead();
      setPendingCancels(data.data || []);
    } catch (error) {
      console.error('Error loading pending cancel requests:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCancel = async (leaveId) => {
    const confirmed = await confirm({
      title: 'ยืนยันการยกเลิกใบลา',
      message: 'เมื่อกดยืนยัน ใบลานี้จะถูกยกเลิก (จะส่งต่อไปยังผู้บริหาร)',
      type: 'warning',
      confirmText: 'ยืนยัน (ยกเลิกใบลา)',
      cancelText: 'ปิด',
      confirmColor: 'orange',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await centralOfficeAPI.approveCancelLevel3(leaveId, remarks);
      toast.success('อนุมัติยกเลิกการลาเรียบร้อยแล้ว');
      setRemarks('');
      setSelectedCancel(null);
      loadPendingCancels();
    } catch (error) {
      console.error('Error approving cancel:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติยกเลิก');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCancel = async (leaveId) => {
    if (!remarks.trim()) {
      toast.error('กรุณาระบุเหตุผลในการไม่อนุมัติยกเลิก');
      return;
    }

    const confirmed = await confirm({
      title: 'ไม่อนุมัติการยกเลิก',
      message: 'เมื่อกดยืนยัน ใบลาจะยังคงมีผลอยู่ (ไม่ถูกยกเลิก)',
      type: 'danger',
      confirmText: 'ยืนยัน (ใบลายังมีผล)',
      cancelText: 'ปิด',
      confirmColor: 'red',
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      await centralOfficeAPI.rejectCancelLevel3(leaveId, remarks);
      toast.success('ปฏิเสธการยกเลิกเรียบร้อยแล้ว');
      setRemarks('');
      setSelectedCancel(null);
      loadPendingCancels();
    } catch (error) {
      console.error('Error rejecting cancel:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการปฏิเสธ');
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
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">กลับหน้าหลัก</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <XCircle className="w-7 h-7" />
              คำขอยกเลิกการลา
            </h1>
            <p className="text-slate-300 mt-1">หัวหน้าสำนักงานกลาง (Level 3)</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 text-center border border-slate-400">
            <div className="text-3xl font-bold">{pendingCancels.length}</div>
            <div className="text-sm text-slate-300">รออนุมัติ</div>
          </div>
        </div>
      </div>

      {/* Department Filter */}
      {pendingCancels.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Filter className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-700">กรองตามกอง/ฝ่าย</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedDepartment('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedDepartment === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ทั้งหมด</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedDepartment === 'all' ? 'bg-white/20' : 'bg-slate-200'}`}>
                {pendingCancels.length}
              </span>
            </button>

            {Object.entries(departmentStats)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedDepartment === dept
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{DEPARTMENT_NAMES[dept] || dept}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedDepartment === dept ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {pendingCancels.length === 0 ? (
        <Card className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">ไม่มีคำขอยกเลิกรอพิจารณา</h3>
            <p className="text-gray-500">ไม่มีคำขอยกเลิกการลาที่รออนุมัติ</p>
          </div>
        </Card>
      ) : filteredCancels.length === 0 ? (
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
          {filteredCancels.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-l-4 border-orange-500">
              <div className="flex flex-col lg:flex-row">
                {/* Left Section - Employee Info */}
                <div className="p-6 lg:w-1/4 bg-gradient-to-br from-orange-50 to-orange-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {leave.employee?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{leave.employee?.name || 'ไม่ระบุ'}</h3>
                      <p className="text-sm text-gray-500">รหัส: {leave.employee?.employeeCode}</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                        {getDepartmentThaiCode(leave.employee?.department)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Section - Leave Info */}
                <div className="p-6 lg:flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium">ประเภทการลา</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.leaveType}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">จำนวนวัน</span>
                      </div>
                      <p className="font-bold text-gray-900">{leave.totalDays} วัน</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่เริ่มต้น</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.startDate)}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-yellow-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">วันที่สิ้นสุด</span>
                      </div>
                      <p className="font-bold text-gray-900">{formatDate(leave.endDate)}</p>
                    </div>
                  </div>

                  {/* Cancel Reason */}
                  <div className="bg-red-100 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <p className="text-sm font-semibold text-red-700">เหตุผลที่ขอยกเลิก:</p>
                    </div>
                    <p className="text-red-800 font-medium">{leave.cancelledReason || 'ไม่ระบุเหตุผล'}</p>
                  </div>
                </div>

                {/* Right Section - Actions */}
                <div className="p-6 lg:w-72 bg-gray-50 flex flex-col justify-center gap-3">
                  {selectedCancel === leave.id ? (
                    <>
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                        rows="3"
                        placeholder="หมายเหตุ (จำเป็นสำหรับการไม่อนุมัติ)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 text-center mb-2">เลือกการดำเนินการ:</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApproveCancel(leave.id)}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-md"
                        >
                          <CheckCircle className="w-5 h-5" />
                          อนุมัติ (ยกเลิกใบลา)
                        </button>
                        <button
                          onClick={() => handleRejectCancel(leave.id)}
                          disabled={actionLoading}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 shadow-md"
                        >
                          <XCircle className="w-5 h-5" />
                          ไม่อนุมัติ (ใบลายังมีผล)
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCancel(null);
                          setRemarks('');
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedCancel(leave.id)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                    >
                      <AlertCircle className="w-5 h-5" />
                      พิจารณาคำขอยกเลิก
                    </button>
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
