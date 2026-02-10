import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/admin.api';
import { formatDate } from '../../utils/formatDate';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import toast from 'react-hot-toast';
import { XCircle, Clock, Calendar, FileText, History, Filter, Building2, Users, Search, ArrowLeft } from 'lucide-react';

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

// Department names mapping
const DEPARTMENT_NAMES = {
  'GYS': 'กยส.',
  'GOK': 'กอก.',
  'GTS': 'กทส.',
  'GTP': 'กตป.',
  'GSS': 'กสส.',
  'GKC': 'กคฐ.',
  'GPS': 'กปส.',
  'GKM': 'กกม.',
  'SLK': 'สลก.',
  'TSN': 'ตสน.',
  'KPR': 'กพร.',
  'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร': 'กยส.',
  'กลุ่มงานอำนวยการ': 'กอก.',
  'กลุ่มงานเทคโนโลยีสารสนเทศ': 'กทส.',
  'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร': 'กตป.',
  'กลุ่มงานเทคโนโลยีการสื่อสาร': 'กสส.',
  'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร': 'กคฐ.',
  'กองหลักประกันสุขภาพ': 'กปส.',
  'กองกฎหมาย': 'กกม.',
  'สำนักงานเลขานุการกรม': 'สลก.',
  'กลุ่มตรวจสอบภายใน': 'ตสน.',
  'กลุ่มพัฒนาระบบบริหาร': 'กพร.',
};

const getStatusBadge = (status) => {
  const statusConfig = {
    'cancelled': { label: 'ยกเลิกแล้ว', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    'approved_final': { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-700 border-green-200' },
    'approved': { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-700 border-green-200' },
    'rejected': { label: 'ไม่อนุมัติ', className: 'bg-red-100 text-red-700 border-red-200' },
    'cancel_level1': { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    'cancel_level2': { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    'cancel_level3': { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    'pending_cancel': { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

export default function AdminCancelHistory() {
  const navigate = useNavigate();
  const [cancelHistory, setCancelHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadCancelHistory();
  }, []);

  const loadCancelHistory = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getCancelHistory();
      setCancelHistory(data.data || []);
    } catch (error) {
      console.error('Error loading cancel history:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments
  const departmentStats = cancelHistory.reduce((acc, leave) => {
    const dept = leave.employee?.department || 'unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Filter leaves
  const filteredHistory = cancelHistory.filter(leave => {
    const matchDept = selectedDepartment === 'all' || leave.employee?.department === selectedDepartment;
    const matchStatus = selectedStatus === 'all' || leave.status === selectedStatus;
    const matchSearch = !searchTerm || 
      leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee?.employeeCode?.includes(searchTerm) ||
      leave.leaveNumber?.includes(searchTerm);
    return matchDept && matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>กลับหน้าหลัก</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <History className="w-7 h-7" />
              ประวัติการยกเลิกการลา
            </h1>
            <p className="text-red-100 mt-1">ผู้บริหารสูงสุด (Level 4) - ประวัติการดำเนินการยกเลิก</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3 text-center border border-red-300">
            <div className="text-3xl font-bold">{cancelHistory.length}</div>
            <div className="text-sm text-red-100">รายการทั้งหมด</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, เลขที่ใบลา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">สถานะ:</span>
          {[
            { value: 'all', label: 'ทั้งหมด' },
            { value: 'cancelled', label: 'ยกเลิกแล้ว' },
            { value: 'approved_final', label: 'ปฏิเสธการยกเลิก' },
          ].map(status => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === status.value
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Department Filter */}
        {Object.keys(departmentStats).length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium">กรองตามกอง/ฝ่าย</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDepartment('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedDepartment === 'all'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                ทั้งหมด
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {cancelHistory.length}
                </span>
              </button>
              {Object.entries(departmentStats).map(([dept, count]) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDepartment === dept
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {DEPARTMENT_NAMES[dept] || getDepartmentThaiCode(dept) || dept}
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">ไม่พบประวัติการยกเลิก</h3>
          <p className="text-slate-400 mt-2">ยังไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((leave) => (
            <div 
              key={leave.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-wrap gap-6">
                  {/* Employee Info */}
                  <div className="flex items-center gap-4 min-w-[250px]">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-semibold text-lg">
                        {leave.employee?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{leave.employee?.name}</h3>
                      <p className="text-sm text-slate-500">รหัส: {leave.employee?.employeeCode}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                        {DEPARTMENT_NAMES[leave.employee?.department] || getDepartmentThaiCode(leave.employee?.department) || leave.employee?.department}
                      </span>
                    </div>
                  </div>

                  {/* Leave Info */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <FileText className="w-4 h-4" />
                        ประเภทการลา
                      </div>
                      <div className="font-medium text-slate-800">{leave.leaveType}</div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        จำนวนวัน
                      </div>
                      <div className="font-medium text-slate-800">{leave.totalDays} วัน</div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        วันที่ลา
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        วันที่ดำเนินการ
                      </div>
                      <div className="font-medium text-slate-800">
                        {formatDate(leave.cancelledAt || leave.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    {getStatusBadge(leave.status)}
                  </div>
                </div>

                {/* Cancel Reason */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">เหตุผลการยกเลิก: </span>
                  <span className="text-slate-700">{leave.cancelledReason || 'ไม่ระบุ'}</span>
                </div>

                {/* Original Reason */}
                <div className="mt-2">
                  <span className="text-sm text-slate-500">เหตุผลการลาเดิม: </span>
                  <span className="text-slate-700">{parseReason(leave.reason)}</span>
                </div>

                {/* Remarks */}
                {leave.remarks && (
                  <div className="mt-2">
                    <span className="text-sm text-slate-500">หมายเหตุผู้อนุมัติ: </span>
                    <span className="text-slate-700">{leave.remarks}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
