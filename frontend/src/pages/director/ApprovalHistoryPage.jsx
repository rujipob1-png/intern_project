import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Clock, CheckCircle, XCircle, User, Calendar,
  FileText, Eye, Filter, X, Phone, Download, ClipboardCheck,
  MapPin, Hash, MessageSquare, AlertCircle, Briefcase, Building2, ArrowRight
} from 'lucide-react';
import { directorAPI } from '../../api/director.api';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import { getInitial } from '../../utils/nameUtils';

const ApprovalHistoryPage = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
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
      pending: { label: 'รอพิจารณา', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved_level1: { label: 'ผอ.อนุมัติแล้ว', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      approved_level2: { label: 'ระดับ 2 ผ่าน', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
      approved_level3: { label: 'ระดับ 3 ผ่าน', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      approved_final: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'ไม่อนุมัติ', color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'ยกเลิกแล้ว', color: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancel_level1: { label: 'รอพิจารณายกเลิก', color: 'bg-orange-100 text-orange-800', icon: Clock },
      cancel_level2: { label: 'รอพิจารณายกเลิก', color: 'bg-orange-100 text-orange-800', icon: Clock },
      cancel_level3: { label: 'รอพิจารณายกเลิก', color: 'bg-orange-100 text-orange-800', icon: Clock },
      pending_cancel: { label: 'รอพิจารณายกเลิก', color: 'bg-orange-100 text-orange-800', icon: Clock },
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

  const getMyActionBadge = (action) => {
    if (!action) return null;
    const isApproved = action.includes('approved');
    const isRejected = action.includes('rejected');
    const isCancelAction = action.includes('cancel');

    let label = 'ดำเนินการแล้ว';
    let color = 'bg-gray-100 text-gray-700';

    if (isApproved && isCancelAction) {
      label = 'อนุมัติยกเลิก';
      color = 'bg-orange-100 text-orange-700';
    } else if (isRejected && isCancelAction) {
      label = 'ปฏิเสธยกเลิก';
      color = 'bg-red-100 text-red-700';
    } else if (isApproved) {
      label = 'อนุมัติแล้ว';
      color = 'bg-green-100 text-green-700';
    } else if (isRejected) {
      label = 'ปฏิเสธ';
      color = 'bg-red-100 text-red-700';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {isApproved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {label}
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
    const matchesAction = actionFilter === 'all' ||
      (actionFilter === 'approved' && leave.myAction?.includes('approved')) ||
      (actionFilter === 'rejected' && leave.myAction?.includes('rejected'));
    return matchesSearch && matchesStatus && matchesAction;
  });

  const approvedCount = leaves.filter(l => l.myAction?.includes('approved')).length;
  const rejectedCount = leaves.filter(l => l.myAction?.includes('rejected')).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a2744] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                  <ClipboardCheck className="w-7 h-7" />
                  <span>ประวัติการอนุมัติ</span>
                </h1>
                <p className="text-gray-400 mt-1">ผอ.กอง (Level 1)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center md:justify-end">
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center grow md:grow-0">
                <div className="text-2xl font-bold">{leaves.length}</div>
                <div className="text-xs text-gray-400">ทั้งหมด</div>
              </div>
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center grow md:grow-0">
                <div className="text-2xl font-bold text-emerald-300">{approvedCount}</div>
                <div className="text-xs text-gray-400">อนุมัติ</div>
              </div>
              <div className="bg-white/10 rounded-xl px-5 py-3 text-center grow md:grow-0">
                <div className="text-2xl font-bold text-rose-300">{rejectedCount}</div>
                <div className="text-xs text-gray-400">ปฏิเสธ</div>
              </div>
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
                placeholder="ค้นหาด้วยชื่อ รหัสพนักงาน หรือเลขที่ใบลา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 appearance-none bg-white"
              >
                <option value="all">การดำเนินการทั้งหมด</option>
                <option value="approved">อนุมัติ</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 appearance-none bg-white"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="approved_level1">อนุมัติระดับ 1</option>
                <option value="approved_level2">อนุมัติระดับ 2</option>
                <option value="approved_level3">อนุมัติระดับ 3</option>
                <option value="approved_final">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="cancelled">ยกเลิก</option>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการ</h3>
            <p className="text-gray-500">ยังไม่มีประวัติการอนุมัติ</p>
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
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left - Employee Info */}
                    <div className="flex items-start gap-4 lg:w-[280px] lg:flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {getInitial(leave.employee?.name)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{leave.employee?.name}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          รหัส: {leave.employee?.employeeCode} | {leave.employee?.position}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          สังกัด: {getDepartmentThaiCode(leave.employee?.department)}
                        </p>
                      </div>
                    </div>

                    {/* Center - Leave Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">เลขที่</p>
                        <p className="font-medium text-gray-900 truncate">{leave.leaveNumber}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">ประเภท</p>
                        <p className="font-medium text-gray-900 truncate">{leave.leaveType}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">วันที่ลา</p>
                        <p className="font-medium text-gray-900">
                          {leave.selectedDates?.length > 0
                            ? leave.selectedDates.map(d => formatDate(d)).join(', ')
                            : `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`
                          }
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">จำนวน</p>
                        <p className="font-medium text-gray-900">{leave.totalDays} วัน</p>
                      </div>
                    </div>

                    {/* Right - Status & Action */}
                    <div className="flex items-center gap-3 lg:flex-shrink-0">
                      <div className="flex flex-col gap-1.5">
                        {getStatusBadge(leave.status)}
                        {getMyActionBadge(leave.myAction)}
                      </div>
                      <button
                        onClick={() => { setSelectedLeave(leave); setShowModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>ดู</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-5 py-3 flex items-center justify-between text-sm text-gray-500">
                  <span>ดำเนินการเมื่อ: {formatDate(leave.myActionDate)}</span>
                  <span>{leave.myComment && `หมายเหตุ: ${leave.myComment}`}</span>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-auto border border-gray-200">

              {/* Modal Header */}
              <div className="bg-gray-50 border-b border-gray-200 rounded-t-2xl px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">รายละเอียดคำขอลา</h3>
                      <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" />
                        {selectedLeave.leaveNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1.5 items-end">
                      {getStatusBadge(selectedLeave.status)}
                      {getMyActionBadge(selectedLeave.myAction)}
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">

                {/* Employee Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {getInitial(selectedLeave.employee?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-gray-900 whitespace-nowrap">{selectedLeave.employee?.name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {selectedLeave.employee?.employeeCode}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          {selectedLeave.employee?.position}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {getDepartmentThaiCode(selectedLeave.employee?.department)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Leave Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">ประเภทการลา</p>
                    <p className="font-semibold text-gray-900">{selectedLeave.leaveType}</p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">จำนวนวัน</p>
                    <p className="font-semibold text-gray-900">{selectedLeave.totalDays} <span className="text-sm text-gray-400 font-normal">วัน</span></p>
                  </div>
                </div>

                {/* Date Range + Selected Dates */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-2">วันที่ลา</p>
                  <p className="font-medium text-gray-900 mb-2">
                    {formatDate(selectedLeave.startDate)} <ArrowRight className="w-4 h-4 inline text-gray-300 mx-1" /> {formatDate(selectedLeave.endDate)}
                  </p>
                  {selectedLeave.selectedDates?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedLeave.selectedDates.map((date, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm border border-gray-200">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(date)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> เหตุผลการลา
                  </p>
                  <p className="text-gray-700 leading-relaxed">{selectedLeave.reason || '-'}</p>
                </div>

                {/* Contact Info */}
                {(selectedLeave.contactPhone || selectedLeave.contactAddress || selectedLeave.employee?.phone) && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> ข้อมูลติดต่อระหว่างลา
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-400">เบอร์โทรศัพท์</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLeave.contactPhone || selectedLeave.employee?.phone || '-'}</p>
                      </div>
                      {selectedLeave.contactAddress && (
                        <div>
                          <p className="text-xs text-gray-400">ที่อยู่ที่ติดต่อได้</p>
                          <p className="text-sm font-medium text-gray-900">{selectedLeave.contactAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Approval Timeline */}
                {selectedLeave.approvalTimeline?.length > 0 && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5" /> ขั้นตอนการอนุมัติ
                    </p>
                    <div className="space-y-0 pl-2">
                      {selectedLeave.approvalTimeline.map((step, i) => {
                        const isApproved = step.action?.includes('approved');
                        const isRejected = step.action?.includes('rejected');
                        const isPartial = step.action === 'partial_approved';
                        const levelNames = { 1: 'ผอ.กอง (Level 1)', 2: 'เจ้าหน้าที่กองกลาง (Level 2)', 3: 'หัวหน้ากองกลาง (Level 3)', 4: 'ผู้ดูแลระบบ (Level 4)' };

                        const dotColor = isRejected ? 'bg-gray-800' : isPartial ? 'bg-gray-500' : isApproved ? 'bg-gray-600' : 'bg-gray-300';

                        return (
                          <div key={i} className="relative flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white z-10 flex-shrink-0 mt-1.5`} />
                              {i < selectedLeave.approvalTimeline.length - 1 && (
                                <div className="w-px flex-1 min-h-[36px] bg-gray-200" />
                              )}
                            </div>
                            <div className="pb-4 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-800">{levelNames[step.level] || `Level ${step.level}`}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isRejected ? 'bg-gray-200 text-gray-700' : isPartial ? 'bg-gray-100 text-gray-600' : isApproved ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                  {isRejected ? 'ปฏิเสธ' : isPartial ? 'อนุมัติบางส่วน' : isApproved ? 'อนุมัติ' : step.action}
                                </span>
                              </div>
                              {step.approverName && (
                                <p className="text-xs text-gray-400 mt-0.5">{step.approverName} {step.approverPosition ? `· ${step.approverPosition}` : ''}</p>
                              )}
                              {step.comment && (
                                <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1 inline-block">{step.comment}</p>
                              )}
                              {step.actionDate && (
                                <p className="text-xs text-gray-300 mt-0.5">{formatDate(step.actionDate)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancel Info */}
                {selectedLeave.cancelledReason && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> เหตุผลการยกเลิก
                    </p>
                    <p className="text-gray-700">{selectedLeave.cancelledReason}</p>
                    {selectedLeave.cancelledAt && (
                      <p className="text-xs text-gray-400 mt-1">ยกเลิกเมื่อ: {formatDate(selectedLeave.cancelledAt)}</p>
                    )}
                  </div>
                )}

                {/* Document */}
                {selectedLeave.documentUrl && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">เอกสารแนบ</p>
                          <p className="text-xs text-gray-400">ไฟล์ประกอบใบลา</p>
                        </div>
                      </div>
                      <a href={selectedLeave.documentUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                        <Download className="w-4 h-4" /> ดาวน์โหลด
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>ยื่นคำขอ: {formatDate(selectedLeave.createdAt)}</span>
                  <span>อัปเดต: {formatDate(selectedLeave.updatedAt)}</span>
                </div>
                <button onClick={() => setShowModal(false)} className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-sm">
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
