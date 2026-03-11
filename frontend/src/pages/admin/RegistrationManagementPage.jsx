import { useState, useEffect } from 'react';
import { registrationAPI } from '../../api/registration.api';
import { useRealtime } from '../../contexts/RealtimeContext';
import toast from 'react-hot-toast';
import {
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Trash2,
  X,
  Calendar,
  Phone,
  Mail,
  Briefcase,
  Building2,
  User,
  FileText,
  Ban,
} from 'lucide-react';

const DEPARTMENT_NAMES = {
  GOK: 'กลุ่มงานอำนวยการ (กอก.)',
  GYS: 'กลุ่มงานยุทธศาสตร์ฯ (กยส.)',
  GTS: 'กลุ่มงานเทคโนโลยีสารสนเทศ (กทส.)',
  GTP: 'กลุ่มงานติดตามประเมินผลฯ (กตป.)',
  GSS: 'กลุ่มงานเทคโนโลยีการสื่อสาร (กสส.)',
  GKC: 'กลุ่มงานโครงสร้างพื้นฐานฯ (กคฐ.)',
  GPS: 'กลุ่มงานป้องกันและปราบปราม (กปส.)',
  GKM: 'กลุ่มงานกฎหมาย (กกม.)',
  SLK: 'สำนักงานเลขานุการกรม (สลก.)',
  TSN: 'ที่ปรึกษา (ทปษ.)',
  KPR: 'กลุ่มพัฒนาระบบบริหาร (กพร.)',
};

const TITLE_OPTIONS = ['นาย', 'นาง', 'นางสาว'];

const RegistrationManagementPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editData, setEditData] = useState({});
  const { notificationUpdate } = useRealtime();

  const initEditData = (request) => ({
    employee_code: request.employee_code || '',
    title: request.title || '',
    first_name: request.first_name || '',
    last_name: request.last_name || '',
    position: request.position || '',
    department_code: request.department_code || '',
    phone: request.phone || '',
    email: request.email || '',
    hire_date: request.hire_date || '',
  });

  useEffect(() => {
    loadRequests();
  }, [statusFilter, notificationUpdate]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await registrationAPI.getRequests(statusFilter);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const result = await registrationAPI.approve(request.id, { editedData: editData });
      if (result.success) {
        toast.success(result.message || 'อนุมัติเรียบร้อย');
        setShowDetailModal(false);
        setSelectedRequest(null);
        loadRequests();
      } else {
        toast.error(result.message || 'อนุมัติไม่สำเร็จ');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (actionLoading || !selectedRequest) return;
    setActionLoading(true);
    try {
      const result = await registrationAPI.reject(selectedRequest.id, { note: rejectNote });
      if (result.success) {
        toast.success(result.message || 'ปฏิเสธเรียบร้อย');
        setShowRejectModal(false);
        setShowDetailModal(false);
        setSelectedRequest(null);
        setRejectNote('');
        loadRequests();
      } else {
        toast.error(result.message || 'ปฏิเสธไม่สำเร็จ');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (request) => {
    if (!confirm('ต้องการลบคำขอนี้หรือไม่?')) return;
    try {
      await registrationAPI.delete(request.id);
      toast.success('ลบเรียบร้อย');
      loadRequests();
    } catch (error) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'รอพิจารณา', icon: Clock, className: 'bg-gray-100 text-gray-600 border-gray-200' },
      approved: { label: 'อนุมัติแล้ว', icon: CheckCircle, className: 'bg-gray-100 text-gray-700 border-gray-300' },
      rejected: { label: 'ไม่อนุมัติ', icon: XCircle, className: 'bg-gray-100 text-gray-500 border-gray-200' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {c.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRequests = requests.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employee_code?.toLowerCase().includes(q) ||
      r.first_name?.toLowerCase().includes(q) ||
      r.last_name?.toLowerCase().includes(q) ||
      r.position?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  // Stats
  const stats = [
    { label: 'ทั้งหมด', value: requests.length, icon: FileText, gradient: 'from-gray-500 to-gray-700' },
    { label: 'รอพิจารณา', value: pendingCount, icon: Clock, gradient: 'from-gray-400 to-gray-600' },
    { label: 'อนุมัติแล้ว', value: requests.filter(r => r.status === 'approved').length, icon: CheckCircle, gradient: 'from-gray-400 to-gray-600' },
    { label: 'ไม่อนุมัติ', value: requests.filter(r => r.status === 'rejected').length, icon: Ban, gradient: 'from-gray-400 to-gray-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">คำขอลงทะเบียนพนักงานใหม่</h2>
        <p className="text-gray-500 text-sm mt-0.5">ตรวจสอบและอนุมัติคำขอลงทะเบียนเข้าใช้งานระบบ</p>
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, ตำแหน่ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 min-w-[140px]"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอพิจารณา</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
          </select>
        </div>
      </div>

      {/* Request List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">รายการคำขอ ({filteredRequests.length})</h3>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">กำลังโหลด...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium mb-1">ไม่พบคำขอลงทะเบียน</p>
            <p className="text-gray-400 text-sm">ยังไม่มีพนักงานใหม่ลงทะเบียนเข้าใช้งาน</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRequests.map((request) => {
              const fullName = `${request.title || ''}${request.first_name} ${request.last_name}`;
              const deptName = DEPARTMENT_NAMES[request.department_code] || request.department_code || '-';

              return (
                <div
                  key={request.id}
                  className="group bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => { setSelectedRequest(request); setEditData(initEditData(request)); setShowDetailModal(true); }}
                >
                  <div className="flex items-center gap-3 p-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gray-700 flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{fullName}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {request.employee_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {request.position && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {request.position}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {deptName}
                        </span>
                        <span className="flex items-center gap-1 hidden sm:flex">
                          <Calendar className="w-3 h-3" />
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(request); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="อนุมัติ"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); setShowRejectModal(true); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="ปฏิเสธ"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {request.status !== 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(request); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
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
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">รายละเอียดคำขอ</h3>
                  <p className="text-xs text-gray-400">ลงทะเบียนเมื่อ {formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">สถานะ</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {selectedRequest.status === 'pending' ? (
                <>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">รหัสพนักงาน <span className="text-red-400">*</span></p>
                    <input
                      type="text"
                      value={editData.employee_code || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, employee_code: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-[100px_1fr_1fr] gap-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">คำนำหน้า</p>
                      <select
                        value={editData.title || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        <option value="">เลือก</option>
                        {TITLE_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">ชื่อ <span className="text-red-400">*</span></p>
                      <input
                        type="text"
                        value={editData.first_name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">นามสกุล <span className="text-red-400">*</span></p>
                      <input
                        type="text"
                        value={editData.last_name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">ตำแหน่ง</p>
                      <input
                        type="text"
                        value={editData.position || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="เช่น นักวิชาการ"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">กลุ่มงาน/สังกัด</p>
                      <select
                        value={editData.department_code || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, department_code: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        <option value="">เลือกกลุ่มงาน</option>
                        {Object.entries(DEPARTMENT_NAMES).map(([code, name]) => (
                          <option key={code} value={code}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">เบอร์โทรศัพท์</p>
                      <input
                        type="text"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="08X-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">อีเมล</p>
                      <input
                        type="text"
                        value={editData.email || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">วันเข้ารับราชการ <span className="text-red-400">*</span></p>
                    <input
                      type="date"
                      value={editData.hire_date || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, hire_date: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">รหัสพนักงาน</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedRequest.employee_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">ชื่อ-นามสกุล</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedRequest.title || ''}{selectedRequest.first_name} {selectedRequest.last_name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">ตำแหน่ง</p>
                      <p className="text-sm text-gray-700">{selectedRequest.position || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">กลุ่มงาน/สังกัด</p>
                      <p className="text-sm text-gray-700">
                        {DEPARTMENT_NAMES[selectedRequest.department_code] || selectedRequest.department_code || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">โทรศัพท์</p>
                        <p className="text-sm text-gray-700">{selectedRequest.phone || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">อีเมล</p>
                        <p className="text-sm text-gray-700">{selectedRequest.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {selectedRequest.review_note && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">หมายเหตุ</p>
                  <p className="text-sm text-gray-700">{selectedRequest.review_note}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button
                  onClick={() => { setShowRejectModal(true); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4" />
                  ปฏิเสธ
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  อนุมัติ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">ปฏิเสธคำขอ</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                ปฏิเสธ: {selectedRequest.title || ''}{selectedRequest.first_name} {selectedRequest.last_name} ({selectedRequest.employee_code})
              </p>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผล (ไม่บังคับ)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="ระบุเหตุผลในการปฏิเสธ..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                rows="3"
              />
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => { setShowRejectModal(false); setRejectNote(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                disabled={actionLoading}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                disabled={actionLoading}
              >
                {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationManagementPage;
