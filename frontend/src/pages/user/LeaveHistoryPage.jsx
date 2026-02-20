import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI } from '../../api/leave.api';
import { formatDate } from '../../utils/formatDate';
import { LEAVE_TYPE_CODES, LEAVE_TYPE_NAMES } from '../../utils/constants';
import {
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Ban,
  Calendar,
  Clock,
  FileText,
  History,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CancelLeaveModal } from '../../components/leave/CancelLeaveModal';

export const LeaveHistoryPage = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pending: 0,
  }); const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, searchTerm, statusFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getMyLeaves();
      const allLeaves = response.data?.leaves || response.data || [];

      setLeaves(allLeaves);

      const newStats = {
        approved: allLeaves.filter(l => (l.status || '').toLowerCase() === 'approved').length,
        rejected: allLeaves.filter(l => (l.status || '').toLowerCase() === 'rejected').length,
        cancelled: allLeaves.filter(l => (l.status || '').toLowerCase() === 'cancelled').length,
        pending: allLeaves.filter(l => (l.status || '').toLowerCase() === 'pending').length,
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('ไม่สามารถโหลดประวัติการลาได้');
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    // กรองตามสถานะ
    if (statusFilter !== 'all') {
      filtered = filtered.filter(leave =>
        (leave.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // ค้นหาด้วยเลขที่
    if (searchTerm) {
      filtered = filtered.filter(leave => {
        const leaveNumber = leave.LeaveNumber || leave.leaveNumber || leave.leave_number || '';
        return leaveNumber.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    setFilteredLeaves(filtered);
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    const statusConfig = {
      pending: {
        label: 'รอพิจารณา',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      approved_level1: {
        label: 'รอพิจารณา',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      approved_level2: {
        label: 'รอพิจารณา',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      approved_level3: {
        label: 'รอพิจารณา',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      },
      approved: {
        label: 'อนุมัติ',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      approved_final: {
        label: 'อนุมัติ',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle
      },
      rejected: {
        label: 'ไม่อนุมัติ',
        className: 'bg-red-100 text-red-800',
        icon: XCircle
      },
      cancelled: {
        label: 'ยกเลิก',
        className: 'bg-gray-100 text-gray-800',
        icon: Ban
      },
      // สถานะการยกเลิก
      pending_cancel: {
        label: 'รอพิจารณายกเลิก',
        className: 'bg-orange-100 text-orange-800',
        icon: Clock
      },
      cancel_level1: {
        label: 'รอพิจารณายกเลิก',
        className: 'bg-orange-100 text-orange-800',
        icon: Clock
      },
      cancel_level2: {
        label: 'รอพิจารณายกเลิก',
        className: 'bg-orange-100 text-orange-800',
        icon: Clock
      },
      cancel_level3: {
        label: 'รอพิจารณายกเลิก',
        className: 'bg-orange-100 text-orange-800',
        icon: Clock
      },
    };

    const config = statusConfig[statusLower] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
      icon: FileText
    };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getLeaveTypeName = (leave) => {
    return leave.leaveType ||
      leave.leaveTypes?.typeName ||
      leave.leave_types?.type_name ||
      LEAVE_TYPE_NAMES[leave.leaveTypeCode] ||
      'ไม่ระบุ';
  };

  const getLeaveTypeCode = (leave) => {
    const code = leave.leaveTypeCode ||
      leave.leaveTypes?.typeCode ||
      leave.leave_types?.type_code ||
      '';
    // แปลงเป็นตัวย่อภาษาไทย
    return LEAVE_TYPE_CODES[code.toLowerCase()] || code;
  };

  const viewDetail = (id) => {
    navigate(`/leave-detail/${id}`);
  };

  const handleCancelRequest = (leave) => {
    setSelectedLeave(leave);
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (cancellationData) => {
    try {
      // TODO: Call API to submit cancellation request
      console.log('Cancellation data:', cancellationData);

      toast.success('ส่งคำขอยกเลิกเรียบร้อยแล้ว กำลังรอการอนุมัติ');

      // Reload data
      await loadHistory();
      setCancelModalOpen(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถส่งคำขอได้'));
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white rounded-xl p-6 shadow-md border border-gray-200 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors group border border-gray-200 self-start sm:self-auto"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
          </button>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-4 bg-gray-800 rounded-xl shadow-md shrink-0">
              <History className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ประวัติการลา</h1>
              <p className="text-gray-500 text-sm mt-1">คำขอลาทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/create-leave')}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <FileText className="w-4 h-4" />
          สร้างคำขอลา
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">อนุมัติแล้ว</p>
              <p className="text-4xl font-bold text-gray-800">{stats.approved}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <CheckCircle className="w-7 h-7 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">ไม่อนุมัติ</p>
              <p className="text-4xl font-bold text-gray-800">{stats.rejected}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <XCircle className="w-7 h-7 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">รออนุมัติ</p>
              <p className="text-4xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <Clock className="w-7 h-7 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">ยกเลิกแล้ว</p>
              <p className="text-4xl font-bold text-gray-800">{stats.cancelled}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <Ban className="w-7 h-7 text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
          <Filter className="w-4 h-4" />
          ค้นหาและกรอง
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยเลขที่คำขอ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="w-full md:w-72">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 appearance-none bg-white transition-all cursor-pointer text-gray-800 font-semibold"
              >
                <option value="all">📋 ทั้งหมด</option>
                <option value="approved">✅ อนุมัติแล้ว</option>
                <option value="rejected">❌ ไม่อนุมัติ</option>
                <option value="pending">⏳ รอพิจารณา</option>
                <option value="pending_cancel">⏳ รอพิจารณายกเลิก</option>
                <option value="cancelled">🚫 ยกเลิกแล้ว</option>
              </select>
              <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      {/* Leave History List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-visible shadow-lg">
        <div className="bg-gray-800 px-6 py-4 border-b-2 border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            รายการคำขอลา
          </h2>
        </div>
        {filteredLeaves.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="p-5 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-800 text-xl font-bold mb-2">ไม่พบประวัติการลา</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm
                ? 'ไม่พบคำขอที่ตรงกับคำค้นหา'
                : statusFilter !== 'all'
                  ? `ไม่พบคำขอลาที่มีสถานะ "${statusFilter}"`
                  : 'คุณยังไม่มีคำขอลา'}
            </p>
            <button
              onClick={() => navigate('/create-leave')}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
            >
              สร้างคำขอลาใหม่
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">เลขที่</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">ประเภท</th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">วันที่ลา</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">จำนวนวัน</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">สถานะ</th>
                    <th className="px-8 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                            {leave.LeaveNumber || leave.leaveNumber || leave.leave_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-9 h-9 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-bold text-sm">
                            {getLeaveTypeCode(leave)}
                          </span>
                          <span className="text-sm text-gray-700 font-medium">{getLeaveTypeName(leave)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {leave.selectedDates && leave.selectedDates.length > 0 ? (
                            <span className="font-medium">
                              {leave.selectedDates.slice(0, 3).map(d => formatDate(d)).join(', ')}
                              {leave.selectedDates.length > 3 && ` (+${leave.selectedDates.length - 3})`}
                            </span>
                          ) : (
                            <>
                              <span className="font-medium">{formatDate(leave.startDate || leave.start_date)}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium">{formatDate(leave.endDate || leave.end_date)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg">
                          <span className="text-xl font-bold text-gray-800">{leave.totalDays || leave.total_days}</span>
                          <span className="text-sm text-gray-500 font-medium">วัน</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-center">
                        <button
                          onClick={() => viewDetail(leave.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-white hover:bg-gray-800 bg-gray-50 border-2 border-gray-300 rounded-lg transition-all hover:shadow-md"
                        >
                          <Eye className="w-4 h-4" />
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="border-t-2 border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    แสดง <span className="font-bold text-gray-800 text-lg">{filteredLeaves.length}</span> รายการ
                    {statusFilter !== 'all' && <span className="text-gray-500"> (กรอง: {statusFilter})</span>}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Cancel Leave Modal */}
      {cancelModalOpen && selectedLeave && (
        <CancelLeaveModal
          leave={selectedLeave}
          onClose={() => {
            setCancelModalOpen(false);
            setSelectedLeave(null);
          }}
          onSubmit={handleCancelSubmit}
        />
      )}
    </div>
  );
};
