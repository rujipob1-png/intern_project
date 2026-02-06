import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { leaveAPI } from '../../api/leave.api';
import { formatDate } from '../../utils/formatDate';
import { LEAVE_STATUS, LEAVE_STATUS_COLORS, LEAVE_TYPE_CODES } from '../../utils/constants';
import { useRealtime } from '../../contexts/RealtimeContext';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Eye, 
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

export const MyLeavesPage = () => {
  const navigate = useNavigate();
  const { leaveUpdate, approvalUpdate } = useRealtime();
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });

  // Load leaves on mount and when realtime updates occur
  useEffect(() => {
    loadLeaves();
  }, [leaveUpdate, approvalUpdate]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [filters, leaves]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const response = await leaveAPI.getMyLeaves();
      
      console.log('My Leaves Response:', response);
      
      if (response.success) {
        // Backend ส่งมาเป็น {leaves: [], pagination: {}}
        const leavesData = response.data?.leaves || response.data || [];
        console.log('Leaves Data:', leavesData);
        console.log('First Leave:', leavesData[0]);
        setLeaves(leavesData);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
        setLeaves([]);
      }
    } catch (error) {
      console.error('Load leaves error:', error);
      toast.error('เกิดข้อผิดพลาด');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // เช็คว่า leaves เป็น array ก่อน
    if (!Array.isArray(leaves)) {
      setFilteredLeaves([]);
      return;
    }

    let filtered = [...leaves];

    // Filter by search (leave number)
    if (filters.search) {
      filtered = filtered.filter(leave =>
        leave.leave_number?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(leave => leave.status === filters.status);
    }

    setFilteredLeaves(filtered);
  };

  const handleCancel = async (leave) => {
    setSelectedLeave(leave);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('กรุณากรอกเหตุผลการยกเลิก');
      return;
    }

    setShowCancelModal(false);

    try {
      const response = await leaveAPI.cancelLeave(selectedLeave.id, cancelReason);
      if (response.success) {
        toast.success('ยกเลิกคำขอลาสำเร็จ');
        setCancelReason('');
        setSelectedLeave(null);
        loadLeaves();
      } else {
        toast.error(response.message || 'ยกเลิกคำขอลาไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Cancel leave error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: 'รอพิจารณา',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      },
      approved: {
        label: 'อนุมัติ',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      approved_final: {
        label: 'อนุมัติแล้ว',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
      },
      rejected: {
        label: 'ไม่อนุมัติ',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-200',
      },
      cancelled: {
        label: 'ยกเลิกแล้ว',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
      },
      pending_cancel: {
        label: 'รอพิจารณายกเลิก',
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
      },
      cancel_level1: {
        label: 'รอพิจารณายกเลิก',
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
      },
      cancel_level2: {
        label: 'รอพิจารณายกเลิก',
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
      },
      cancel_level3: {
        label: 'รอพิจารณายกเลิก',
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const stats = [
    {
      label: 'ทั้งหมด',
      value: Array.isArray(leaves) ? leaves.length : 0,
      color: 'text-blue-600',
    },
    {
      label: 'รอพิจารณา',
      value: Array.isArray(leaves) ? leaves.filter(l => l.status === 'pending').length : 0,
      color: 'text-yellow-600',
    },
    {
      label: 'อนุมัติ',
      value: Array.isArray(leaves) ? leaves.filter(l => l.status === 'approved').length : 0,
      color: 'text-green-600',
    },
    {
      label: 'ไม่อนุมัติ',
      value: Array.isArray(leaves) ? leaves.filter(l => l.status === 'rejected').length : 0,
      color: 'text-red-600',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              คำขอลาของฉัน
            </h2>
            <p className="text-gray-600 mt-1">
              รายการคำขอลาทั้งหมด
            </p>
          </div>
          <Button onClick={() => navigate('/create-leave')}>
            <FileText className="w-5 h-5" />
            สร้างคำขอลาใหม่
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่คำขอ..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอพิจารณา</option>
                <option value="pending_cancel">รอพิจารณายกเลิก</option>
                <option value="approved">อนุมัติ</option>
                <option value="rejected">ไม่อนุมัติ</option>
                <option value="cancelled">ยกเลิกแล้ว</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการคำขอลา ({filteredLeaves.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">กำลังโหลด...</p>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ไม่พบข้อมูลคำขอลา</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เลขที่คำขอ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ประเภท
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่ลา
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนวัน
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        การดำเนินการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.LeaveNumber || leave.leaveNumber || leave.leave_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(leave.createdAt || leave.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {leave.leaveType || 
                             leave.leaveTypes?.typeName || 
                             leave.leave_types?.type_name_th ||
                             leave.leave_types?.type_name || 
                             'ไม่ระบุ'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(leave.leaveTypeCode || leave.leaveTypes?.typeCode || leave.leave_types?.type_code) && 
                              `(${LEAVE_TYPE_CODES[(leave.leaveTypeCode || leave.leaveTypes?.typeCode || leave.leave_types?.type_code).toLowerCase()] || ''})`
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(leave.startDate || leave.start_date)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ถึง {formatDate(leave.endDate || leave.end_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {leave.totalDays || leave.total_days} วัน
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(leave.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/leave-detail/${leave.id}`)}
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {leave.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(leave)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                ยกเลิกการลา
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-lg relative">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedLeave(null);
                }}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">แบบใบขอยกเลิกคำขอลา</h3>
                  <p className="text-sm opacity-90">Leave Cancellation Request Form</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="w-5 h-5" />
                    ข้อมูลคำขอเดิม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">เลขที่คำขอ</label>
                      <p className="font-semibold text-gray-900">{selectedLeave.leaveNumber || selectedLeave.leave_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ประเภทการลา</label>
                      <p className="font-semibold text-gray-900">{selectedLeave.leaveType || selectedLeave.leave_type}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">ช่วงวันที่ลา</label>
                    <p className="font-semibold text-gray-900">
                      {formatDate(selectedLeave.startDate || selectedLeave.start_date)} → {formatDate(selectedLeave.endDate || selectedLeave.end_date)}
                      <span className="ml-2 text-blue-600">({selectedLeave.totalDays || selectedLeave.total_days} วัน)</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">เหตุผลการลาเดิม</label>
                    <p className="text-gray-900">{selectedLeave.reason}</p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-600">* </span>
                  เหตุผลการยกเลิก
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลการยกเลิกคำขอลา (ขั้นต่ำ 10 ตัวอักษร)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  เช่น ต้องการเปลี่ยนวันลา, เปลี่ยนแผนการเดินทาง, ไม่สามารถไปราชการได้ เป็นต้น
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 bg-gray-50 rounded-b-lg border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedLeave(null);
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!cancelReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                ยืนยันยกเลิกคำขอลา
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
