import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  Eye,
  Filter,
  X,
  Phone,
  MapPin,
  Download
} from 'lucide-react';
import { directorAPI } from '../../api/director.api';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApprovalHistory();
  }, []);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);
      const result = await directorAPI.getApprovalHistory();
      if (result.success) {
        setLeaves(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved_level1: { label: 'อนุมัติระดับ 1', color: 'bg-blue-100 text-blue-800', icon: Clock },
      approved_level2: { label: 'อนุมัติระดับ 2', color: 'bg-indigo-100 text-indigo-800', icon: Clock },
      approved_level3: { label: 'อนุมัติระดับ 3', color: 'bg-purple-100 text-purple-800', icon: Clock },
      approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'ปฏิเสธ', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = 
      leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.leaveNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.employee?.employeeCode?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>ย้อนกลับ</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-7 h-7" />
                ประวัติการอนุมัติ
              </h1>
              <p className="text-blue-100 mt-1">รายการคำขอลาที่ดำเนินการแล้ว</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อ รหัสพนักงาน หรือเลขที่คำขอ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="approved_level1">อนุมัติระดับ 1</option>
                <option value="approved_level2">อนุมัติระดับ 2</option>
                <option value="approved_level3">อนุมัติระดับ 3</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          แสดง {filteredLeaves.length} รายการ จากทั้งหมด {leaves.length} รายการ
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการ</h3>
            <p className="text-gray-500">ยังไม่มีประวัติการอนุมัติคำขอลา</p>
          </div>
        ) : (
          /* Leave List */
          <div className="space-y-4">
            {filteredLeaves.map((leave) => (
              <div 
                key={leave.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left - Employee Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {leave.employee?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{leave.employee?.name}</h3>
                        <p className="text-sm text-gray-500">
                          รหัส: {leave.employee?.employeeCode} | {leave.employee?.position}
                        </p>
                        <p className="text-sm text-gray-500">
                          กอง: {getDepartmentThaiCode(leave.employee?.department)}
                        </p>
                      </div>
                    </div>

                    {/* Center - Leave Info */}
                    <div className="flex flex-wrap gap-4 lg:gap-8">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">เลขที่</p>
                          <p className="font-medium text-gray-900">{leave.leaveNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">ประเภทการลา</p>
                          <p className="font-medium text-gray-900">{leave.leaveType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">วันที่ลา</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">จำนวนวัน</p>
                        <p className="font-medium text-gray-900">{leave.totalDays} วัน</p>
                      </div>
                    </div>

                    {/* Right - Status & Action */}
                    <div className="flex items-center gap-4">
                      {getStatusBadge(leave.status)}
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>ดูรายละเอียด</span>
                      </button>
                    </div>
                  </div>

                  {/* Reason Preview */}
                  {leave.reason && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">เหตุผล:</span> {leave.reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer - Dates */}
                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between text-sm text-gray-500">
                  <span>ยื่นคำขอเมื่อ: {formatDate(leave.createdAt)}</span>
                  <span>อัปเดตล่าสุด: {formatDate(leave.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto transform transition-all animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <h3 className="text-lg font-bold">รายละเอียดคำขอลา</h3>
                    <p className="text-blue-100 text-sm">{selectedLeave.leaveNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                {/* Employee Info */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-200">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedLeave.employee?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedLeave.employee?.name}</h4>
                    <p className="text-gray-500">รหัส: {selectedLeave.employee?.employeeCode}</p>
                    <p className="text-gray-500">{selectedLeave.employee?.position} | {getDepartmentThaiCode(selectedLeave.employee?.department)}</p>
                  </div>
                  {getStatusBadge(selectedLeave.status)}
                </div>

                {/* Leave Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">ประเภทการลา</span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedLeave.leaveType}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">จำนวนวัน</span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedLeave.totalDays} วัน</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 col-span-2">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">วันที่ลา</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)}
                    </p>
                    {/* Selected Dates */}
                    {selectedLeave.selectedDates && selectedLeave.selectedDates.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedLeave.selectedDates.map((date, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {formatDate(date)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">เหตุผลการลา</span>
                  </div>
                  <p className="text-gray-700">{selectedLeave.reason || '-'}</p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เบอร์ติดต่อ</p>
                      <p className="font-medium text-gray-900">{selectedLeave.employee?.phone || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Document */}
                {selectedLeave.documentUrl && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">เอกสารแนบ</p>
                          <p className="text-sm text-gray-500">คลิกเพื่อดาวน์โหลด</p>
                        </div>
                      </div>
                      <a
                        href={selectedLeave.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                  <span>ยื่นคำขอเมื่อ: {formatDate(selectedLeave.createdAt)}</span>
                  <span>อัปเดตล่าสุด: {formatDate(selectedLeave.updatedAt)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistoryPage;
