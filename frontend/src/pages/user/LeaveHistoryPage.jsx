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
  });  const [cancelModalOpen, setCancelModalOpen] = useState(false);
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

    if (statusFilter === 'history') {
      filtered = filtered.filter(leave => 
        ['approved', 'rejected', 'cancelled'].includes((leave.status || '').toLowerCase())
      );
    }

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
      approved: { 
        label: 'อนุมัติแล้ว', 
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle 
      },
      rejected: { 
        label: 'ไม่อนุมัติ', 
        className: 'bg-red-100 text-red-800',
        icon: XCircle 
      },
      cancelled: { 
        label: 'ยกเลิกแล้ว', 
        className: 'bg-gray-100 text-gray-800',
        icon: Ban 
      },
      pending: { 
        label: 'รออนุมัติ', 
        className: 'bg-yellow-100 text-yellow-800',
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
    return leave.leaveTypeCode || 
           leave.leaveTypes?.typeCode || 
           leave.leave_types?.type_code ||
           '';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-primary-600 transition-colors" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
              <History className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ประวัติการลา</h1>
              <p className="text-gray-600 text-sm mt-0.5">คำขอลาทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/create-leave')}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
        >
          + สร้างคำขอลา
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 mb-1 font-medium">อนุมัติแล้ว</p>
              <p className="text-4xl font-bold text-green-700">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 mb-1 font-medium">ไม่อนุมัติ</p>
              <p className="text-4xl font-bold text-red-700">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-200 rounded-xl">
              <XCircle className="w-8 h-8 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 mb-1 font-medium">รออนุมัติ</p>
              <p className="text-4xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-200 rounded-xl">
              <Clock className="w-8 h-8 text-yellow-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1 font-medium">ยกเลิกแล้ว</p>
              <p className="text-4xl font-bold text-gray-700">{stats.cancelled}</p>
            </div>
            <div className="p-3 bg-gray-200 rounded-xl">
              <Ban className="w-8 h-8 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาด้วยเลขที่คำขอ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white transition-all cursor-pointer"
              >
                <option value="all">📋 ทั้งหมด</option>
                <option value="history">✅ เฉพาะที่จบแล้ว</option>
              </select>
            </div>
          </div>
        </div>
      </div>
{/* Leave History List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {filteredLeaves.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-900 text-xl font-semibold mb-2">ไม่พบประวัติการลา</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm 
                ? 'ไม่พบคำขอที่ตรงกับคำค้นหา'
                : statusFilter === 'history' 
                  ? 'คุณยังไม่มีประวัติที่เสร็จสิ้น ลองเปลี่ยนเป็น "ทั้งหมด"'
                  : 'คุณยังไม่มีคำขอลา'}
            </p>
            <button
              onClick={() => navigate('/create-leave')}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg"
            >
              สร้างคำขอลาใหม่
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">เลขที่</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">ประเภท</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">วันที่ลา</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">จำนวนวัน</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">วันที่อัปเดต</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase" colSpan="2">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-blue-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          <span className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                            {leave.LeaveNumber || leave.leaveNumber || leave.leave_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-xl font-bold text-sm shadow-sm">
                            {LEAVE_TYPE_CODES[getLeaveTypeCode(leave)] || getLeaveTypeCode(leave)}
                          </span>
                          <span className="text-sm text-gray-700 font-medium">{getLeaveTypeName(leave)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDate(leave.startDate || leave.start_date)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{formatDate(leave.endDate || leave.end_date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-sm">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-bold text-gray-900">{leave.totalDays || leave.total_days}</span>
                          <span className="text-sm text-gray-600 font-medium">วัน</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {formatDate(leave.updatedAt || leave.updated_at)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => viewDetail(leave.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-white hover:bg-primary-600 border-2 border-primary-600 rounded-lg transition-all hover:shadow-md"
                        >
                          <Eye className="w-4 h-4" />
                          ดูรายละเอียด
                        </button>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center">
                        {leave.status?.toLowerCase() === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(leave)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border-2 border-red-600 rounded-lg transition-all hover:shadow-md"
                          >
                            <XCircle className="w-4 h-4" />
                            ยกเลิกคำขอ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    แสดง <span className="font-bold text-gray-900 text-lg">{filteredLeaves.length}</span> รายการ
                    {statusFilter === 'history' && <span className="text-gray-500"> (เฉพาะที่จบแล้ว)</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                    อนุมัติ {stats.approved}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold shadow-sm">
                    <XCircle className="w-4 h-4" />
                    ไม่อนุมัติ {stats.rejected}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold shadow-sm">
                    <Clock className="w-4 h-4" />
                    รออนุมัติ {stats.pending}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold shadow-sm">
                    <Ban className="w-4 h-4" />
                    ยกเลิก {stats.cancelled}
                  </span>
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
