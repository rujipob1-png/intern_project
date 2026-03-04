import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaveAPI } from '../../api/leave.api';
import { formatDate } from '../../utils/formatDate';
import { LEAVE_TYPE_CODES, LEAVE_TYPE_NAMES } from '../../utils/constants';
import { useRealtime } from '../../contexts/RealtimeContext';
import {
  Eye,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Calendar,
  Clock,
  FileText,
  X,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CancelLeaveModal } from '../../components/leave/CancelLeaveModal';

export const MyLeavesPage = () => {
  const navigate = useNavigate();
  const { leaveUpdate, approvalUpdate } = useRealtime();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    leaveType: 'all',
    dateFrom: '',
    dateTo: '',
    year: 'all',
  });

  // ดึงปีทั้งหมดจากข้อมูล
  const availableYears = useMemo(() => {
    const years = new Set();
    leaves.forEach(l => {
      const y = new Date(l.startDate || l.start_date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return [...years].sort((a, b) => b - a);
  }, [leaves]);

  // ดึงประเภทการลาทั้งหมดจากข้อมูล
  const availableLeaveTypes = useMemo(() => {
    const types = new Map();
    leaves.forEach(l => {
      const code = l.leaveTypeCode || l.leave_types?.type_code;
      const name = l.leaveType || l.leave_types?.type_name;
      if (code && name && !types.has(code)) {
        types.set(code, name);
      }
    });
    return [...types.entries()];
  }, [leaves]);

  // นับจำนวน active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.leaveType !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.year !== 'all') count++;
    return count;
  }, [filters]);

  const defaultColor = { bg: 'bg-gray-700', light: 'bg-gray-100', text: 'text-gray-600' };
  const getLeaveColor = () => defaultColor;

  useEffect(() => {
    loadLeaves();
  }, [leaveUpdate, approvalUpdate]);

  useEffect(() => {
    applyFilters();
  }, [leaves, filters]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const response = await leaveAPI.getMyLeaves({ limit: 9999 });
      const allLeaves = response.data?.leaves || response.data || [];
      setLeaves(allLeaves);
    } catch (error) {
      console.error('Error loading leaves:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leaves];

    // ค้นหาข้อความ
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(leave => {
        const num = (leave.LeaveNumber || leave.leaveNumber || leave.leave_number || '').toLowerCase();
        const reason = (leave.reason || '').toLowerCase();
        const type = (leave.leaveType || leave.leave_types?.type_name || '').toLowerCase();
        const code = (leave.leaveTypeCode || leave.leave_types?.type_code || '').toLowerCase();
        const start = formatDate(leave.startDate || leave.start_date) || '';
        const end = formatDate(leave.endDate || leave.end_date) || '';
        return num.includes(q) || reason.includes(q) || type.includes(q) || code.includes(q) || start.includes(q) || end.includes(q);
      });
    }

    // สถานะ
    if (filters.status !== 'all') {
      if (filters.status === 'pending_all') {
        filtered = filtered.filter(l => ['pending', 'approved_level1', 'approved_level2', 'approved_level3'].includes(l.status));
      } else if (filters.status === 'cancel_all') {
        filtered = filtered.filter(l => ['pending_cancel', 'cancel_level1', 'cancel_level2', 'cancel_level3'].includes(l.status));
      } else {
        filtered = filtered.filter(l => l.status === filters.status);
      }
    }

    // ประเภท
    if (filters.leaveType !== 'all') {
      filtered = filtered.filter(l => {
        const c = (l.leaveTypeCode || l.leave_types?.type_code || '').toUpperCase();
        return c === filters.leaveType.toUpperCase();
      });
    }

    // ปี
    if (filters.year !== 'all') {
      const y = parseInt(filters.year);
      filtered = filtered.filter(l => new Date(l.startDate || l.start_date).getFullYear() === y);
    }

    // วันที่
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom + 'T00:00:00');
      filtered = filtered.filter(l => new Date(l.startDate || l.start_date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo + 'T23:59:59');
      filtered = filtered.filter(l => new Date(l.endDate || l.end_date) <= to);
    }

    setFilteredLeaves(filtered);
  };

  const resetFilters = () => {
    setFilters({ search: '', status: 'all', leaveType: 'all', dateFrom: '', dateTo: '', year: 'all' });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'รอพิจารณา', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      approved_level1: { label: 'รอพิจารณา', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      approved_level2: { label: 'รอพิจารณา', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      approved_level3: { label: 'รอพิจารณา', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      approved: { label: 'อนุมัติ', className: 'bg-gray-100 text-gray-700 border-gray-300', icon: CheckCircle },
      approved_final: { label: 'อนุมัติ', className: 'bg-gray-100 text-gray-700 border-gray-300', icon: CheckCircle },
      rejected: { label: 'ไม่อนุมัติ', className: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
      cancelled: { label: 'ยกเลิก', className: 'bg-gray-50 text-gray-400 border-gray-200', icon: Ban },
      pending_cancel: { label: 'รอพิจารณายกเลิก', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      cancel_level1: { label: 'รอพิจารณายกเลิก', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      cancel_level2: { label: 'รอพิจารณายกเลิก', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
      cancel_level3: { label: 'รอพิจารณายกเลิก', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock },
    };
    const config = statusConfig[(status || '').toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const handleCancelRequest = (leave) => {
    setSelectedLeave(leave);
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = async (cancellationData) => {
    try {
      console.log('Cancellation data:', cancellationData);
      toast.success('ส่งคำขอยกเลิกเรียบร้อยแล้ว กำลังรอการอนุมัติ');
      await loadLeaves();
      setCancelModalOpen(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถส่งคำขอได้'));
      throw error;
    }
  };

  // Stats
  const stats = [
    {
      label: 'ทั้งหมด',
      value: leaves.length,
      icon: FileText,
      gradient: 'from-gray-500 to-gray-700',
    },
    {
      label: 'รอพิจารณา',
      value: leaves.filter(l => ['pending', 'approved_level1', 'approved_level2', 'approved_level3'].includes(l.status)).length,
      icon: Clock,
      gradient: 'from-gray-400 to-gray-600',
    },
    {
      label: 'อนุมัติ',
      value: leaves.filter(l => l.status === 'approved' || l.status === 'approved_final').length,
      icon: CheckCircle,
      gradient: 'from-gray-400 to-gray-600',
    },
    {
      label: 'ไม่อนุมัติ',
      value: leaves.filter(l => l.status === 'rejected').length,
      icon: XCircle,
      gradient: 'from-gray-400 to-gray-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-600 mb-4"></div>
        <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">คำขอลาของฉัน</h2>
          <p className="text-gray-500 text-sm mt-0.5">ติดตามและจัดการคำขอลาทั้งหมดของคุณ</p>
        </div>
        <button
          onClick={() => navigate('/create-leave')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all font-medium text-sm shadow-sm hover:shadow-md w-full sm:w-auto"
        >
          <FileText className="w-4 h-4" />
          สร้างคำขอลาใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="relative overflow-hidden bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.gradient} opacity-[0.04] rounded-bl-[60px]`} />
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่คำขอ, เหตุผล, ประเภท, วันที่..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[130px]"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending_all">รอพิจารณา</option>
              <option value="approved_final">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
              <option value="cancel_all">รอยกเลิก</option>
              <option value="cancelled">ยกเลิกแล้ว</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                showAdvancedFilter || activeFilterCount > 0
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">ตัวกรอง</span>
              {activeFilterCount > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${showAdvancedFilter ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilter && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">ประเภทการลา</label>
                <select
                  value={filters.leaveType}
                  onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="all">ทุกประเภท</option>
                  {availableLeaveTypes.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">ปี</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  <option value="all">ทุกปี</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y + 543} ({y})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {filters.leaveType !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                      {availableLeaveTypes.find(([c]) => c === filters.leaveType)?.[1] || filters.leaveType}
                      <button onClick={() => setFilters(prev => ({ ...prev, leaveType: 'all' }))}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.year !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                      ปี {parseInt(filters.year) + 543}
                      <button onClick={() => setFilters(prev => ({ ...prev, year: 'all' }))}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.dateFrom && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                      ตั้งแต่ {filters.dateFrom}
                      <button onClick={() => setFilters(prev => ({ ...prev, dateFrom: '' }))}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filters.dateTo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                      ถึง {filters.dateTo}
                      <button onClick={() => setFilters(prev => ({ ...prev, dateTo: '' }))}><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
                <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                  <RotateCcw className="w-3 h-3" />
                  ล้างทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Result Summary */}
        {(filters.search || filters.status !== 'all' || activeFilterCount > 0) && (
          <div className="text-xs text-gray-400">
            พบ <span className="font-semibold text-gray-700">{filteredLeaves.length}</span> รายการ
            {filters.search && <> จากคำค้น "<span className="text-gray-600">{filters.search}</span>"</>}
          </div>
        )}
      </div>

      {/* Leave List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">รายการคำขอลา ({filteredLeaves.length})</h3>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">ไม่พบข้อมูลคำขอลา</p>
            <p className="text-gray-400 text-sm mb-5">
              {filters.search ? 'ลองเปลี่ยนคำค้นหาใหม่' : 'คุณยังไม่มีประวัติการลา'}
            </p>
            <button
              onClick={() => navigate('/create-leave')}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              สร้างคำขอลาใหม่
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeaves.map((leave) => {
              const code = (leave.leaveTypeCode || leave.leaveTypes?.typeCode || leave.leave_types?.type_code || '').toLowerCase();
              const thaiCode = LEAVE_TYPE_CODES[code] || '';
              const typeName = leave.leaveType || leave.leaveTypes?.typeName || leave.leave_types?.type_name_th || leave.leave_types?.type_name || LEAVE_TYPE_NAMES[code] || 'ไม่ระบุ';
              const colors = getLeaveColor(code);
              const leaveNumber = leave.LeaveNumber || leave.leaveNumber || leave.leave_number;
              const selectedDates = leave.selectedDates || leave.selected_dates;
              const canCancel = ['pending', 'approved_level1', 'approved_level2', 'approved_level3', 'approved_final'].includes((leave.status || '').toLowerCase());

              return (
                <div
                  key={leave.id}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => navigate(`/leave-detail/${leave.id}`)}
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Leave Type Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center shadow-sm`}>
                        <span className="text-white font-bold text-sm">{thaiCode || '?'}</span>
                      </div>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{leaveNumber}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.light} ${colors.text} font-medium`}>
                          {typeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {(() => {
                            if (Array.isArray(selectedDates) && selectedDates.length > 0) {
                              const displayDates = selectedDates.slice(0, 2).map(d => formatDate(d));
                              const remaining = selectedDates.length - 2;
                              return <>{displayDates.join(', ')}{remaining > 0 && ` (+${remaining})`}</>;
                            }
                            const start = formatDate(leave.startDate || leave.start_date);
                            const end = formatDate(leave.endDate || leave.end_date);
                            return start === end ? start : `${start} — ${end}`;
                          })()}
                        </span>
                        {leave.reason && (
                          <span className="truncate max-w-[200px] hidden sm:inline" title={leave.reason}>
                            | {leave.reason}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Days */}
                    <div className="flex-shrink-0 text-center mx-2 hidden sm:block">
                      <span className="text-lg font-bold text-gray-800">{leave.totalDays || leave.total_days}</span>
                      <span className="text-xs text-gray-400 ml-0.5">วัน</span>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(leave.status)}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canCancel && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelRequest(leave); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="ยกเลิกการลา"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <div className="p-1.5 rounded-lg text-gray-300 group-hover:text-gray-400">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="text-center pt-2 pb-1">
              <p className="text-xs text-gray-400">แสดงทั้งหมด {filteredLeaves.length} รายการ</p>
            </div>
          </div>
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
