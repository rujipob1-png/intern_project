import { useState, useEffect } from 'react';
import { delegationAPI } from '../../api/delegation.api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowRightLeft, Plus, X, User, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle, Search, Trash2, Shield, History,
} from 'lucide-react';

const DEPT_NAMES = {
  GOK: 'กอก.', GYS: 'กยส.', GTS: 'กทส.', GTP: 'กตป.',
  GSS: 'กสส.', GKC: 'กคฐ.', GPS: 'กปส.', GKM: 'กกม.',
  SLK: 'สลก.', TSN: 'ตสน.', KPR: 'กพร.',
};

const ROLE_LABELS = {
  user: 'บุคลากร',
  director: 'ผู้อำนวยการกลุ่มงาน',
  central_office_staff: 'เจ้าหน้าที่สำนักงานกลาง',
  central_office_head: 'หัวหน้าสำนักงานกลาง',
  admin: 'ผู้ดูแลระบบ',
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const isActive = (d) => {
  const today = new Date().toISOString().split('T')[0];
  return d.is_active && d.start_date <= today && d.end_date >= today;
};

export default function DelegationPage() {
  const { user, refreshUser } = useAuth();
  const roleName = user?.role_name;
  const canDelegate = ['director', 'central_office_staff', 'central_office_head', 'admin'].includes(roleName);

  const [myDelegations, setMyDelegations] = useState([]);
  const [received, setReceived] = useState([]);
  const [eligibles, setEligibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'history'

  // Form state
  const [form, setForm] = useState({ delegateId: '', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [myRes, recRes] = await Promise.all([
        delegationAPI.getMyDelegations(),
        delegationAPI.getReceivedDelegations(),
      ]);
      setMyDelegations(myRes.data || []);
      setReceived(recRes.data || []);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const loadEligibles = async () => {
    try {
      const res = await delegationAPI.getEligibleDelegates();
      setEligibles(res.data || []);
    } catch {
      toast.error('ไม่สามารถโหลดรายชื่อพนักงานได้');
    }
  };

  const openModal = () => {
    setForm({ delegateId: '', startDate: today, endDate: '', reason: '' });
    setSearch('');
    loadEligibles();
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.delegateId) return toast.error('กรุณาเลือกผู้รับมอบสิทธิ์');
    if (!form.startDate || !form.endDate) return toast.error('กรุณาระบุช่วงเวลา');
    if (form.endDate < form.startDate) return toast.error('วันสิ้นสุดต้องมาหลังวันเริ่มต้น');

    setSubmitting(true);
    try {
      const res = await delegationAPI.createDelegation({
        delegateId: form.delegateId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      if (res.success) {
        toast.success(`โอนสิทธิ์ให้ ${res.data.delegateName} เรียบร้อยแล้ว`);
        setShowModal(false);
        load();
        refreshUser(); // sync role ให้ Sidebar
      } else {
        toast.error(res.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelLoading(id);
    try {
      const res = await delegationAPI.cancelDelegation(id);
      if (res.success) {
        toast.success('ยกเลิกการโอนสิทธิ์แล้ว');
        load();
        refreshUser(); // sync role กลับให้ Sidebar
      } else {
        toast.error(res.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      toast.error(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setCancelLoading(null);
    }
  };

  const filteredEligibles = eligibles.filter(e =>
    !search ||
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeCode.includes(search) ||
    e.position?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter delegations by tab
  const isCurrentOrFuture = (d) => d.is_active && d.end_date >= today;
  const isHistory = (d) => !d.is_active || d.end_date < today;

  const filteredMy = myDelegations.filter(tab === 'active' ? isCurrentOrFuture : isHistory);
  const filteredReceived = received.filter(tab === 'active' ? isCurrentOrFuture : isHistory);

  const activeMyCount = myDelegations.filter(isCurrentOrFuture).length;
  const activeReceivedCount = received.filter(isCurrentOrFuture).length;
  const historyMyCount = myDelegations.filter(isHistory).length;
  const historyReceivedCount = received.filter(isHistory).length;

  const StatusBadge = ({ d }) => {
    if (!d.is_active) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 border border-gray-200">
        <XCircle className="w-3 h-3" /> ยกเลิกแล้ว
      </span>
    );
    if (isActive(d)) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3" /> กำลังใช้งาน
      </span>
    );
    if (d.end_date < today) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">
        <Clock className="w-3 h-3" /> หมดอายุ
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
        <Calendar className="w-3 h-3" /> รอเริ่ม
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-slate-600" />
            โอนสิทธิ์การอนุมัติ
          </h1>
          <p className="text-sm text-gray-500 mt-1">มอบอำนาจอนุมัติใบลาให้ผู้ปฏิบัติหน้าที่แทนในช่วงที่ไม่อยู่</p>
        </div>
        {canDelegate && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            โอนสิทธิ์ใหม่
          </button>
        )}
      </div>

      {/* Active delegation received banner */}
      {received.filter(r => isActive(r)).map(r => (
        <div key={r.id} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">คุณกำลังปฏิบัติหน้าที่แทน</p>
            <p className="text-sm text-amber-700">
              {r.delegator?.title || ''}{r.delegator?.first_name} {r.delegator?.last_name} ({r.delegator?.employee_code})
              {' '}— ในฐานะ <span className="font-medium">{ROLE_LABELS[r.delegated_role] || r.delegated_role}</span>
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {formatDate(r.start_date)} — {formatDate(r.end_date)}
              {r.reason && ` · ${r.reason}`}
            </p>
          </div>
        </div>
      ))}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          กำลังใช้งาน
          {(activeMyCount + activeReceivedCount) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
              {activeMyCount + activeReceivedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          ประวัติ
          {(historyMyCount + historyReceivedCount) > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600">
              {historyMyCount + historyReceivedCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Delegations I created */}
          {canDelegate && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">
                  {tab === 'active' ? 'การโอนสิทธิ์ที่ฉันสร้าง' : 'ประวัติการโอนสิทธิ์ของฉัน'}
                </h2>
              </div>
              {filteredMy.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  {tab === 'active' ? 'ยังไม่มีการโอนสิทธิ์ที่ใช้งานอยู่' : 'ยังไม่มีประวัติ'}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredMy.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {d.delegate?.title || ''}{d.delegate?.first_name} {d.delegate?.last_name}
                            <span className="text-gray-400 font-normal ml-1">({d.delegate?.employee_code})</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {DEPT_NAMES[d.delegate?.department] || d.delegate?.department}
                            {' · '}{formatDate(d.start_date)} – {formatDate(d.end_date)}
                            {d.reason && ` · ${d.reason}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge d={d} />
                        {d.is_active && (
                          <button
                            onClick={() => handleCancel(d.id)}
                            disabled={cancelLoading === d.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="ยกเลิก"
                          >
                            {cancelLoading === d.id
                              ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delegations I received */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                {tab === 'active' ? 'สิทธิ์ที่ฉันได้รับ' : 'ประวัติสิทธิ์ที่ได้รับ'}
              </h2>
            </div>
            {filteredReceived.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                {tab === 'active' ? 'ยังไม่มีสิทธิ์ที่ได้รับ' : 'ยังไม่มีประวัติ'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredReceived.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          มอบสิทธิ์โดย: {d.delegator?.title || ''}{d.delegator?.first_name} {d.delegator?.last_name}
                          <span className="text-gray-400 font-normal ml-1">({d.delegator?.employee_code})</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          ในฐานะ <span className="font-medium text-gray-700">{ROLE_LABELS[d.delegated_role] || d.delegated_role}</span>
                          {' · '}{formatDate(d.start_date)} – {formatDate(d.end_date)}
                          {d.reason && ` · ${d.reason}`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge d={d} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">โอนสิทธิ์การอนุมัติ</h3>
                <p className="text-xs text-gray-400 mt-0.5">เลือกผู้รับมอบสิทธิ์และกำหนดช่วงเวลา</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Search employee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกผู้รับมอบสิทธิ์ <span className="text-red-400">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {filteredEligibles.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">ไม่พบพนักงาน</p>
                  ) : (
                    filteredEligibles.map(e => (
                      <label
                        key={e.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          form.delegateId === e.id ? 'bg-slate-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delegate"
                          value={e.id}
                          checked={form.delegateId === e.id}
                          onChange={() => setForm(prev => ({ ...prev, delegateId: e.id }))}
                          className="accent-gray-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{e.fullName}
                            <span className="text-gray-400 font-normal ml-1 text-xs">({e.employeeCode})</span>
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {e.position} · {DEPT_NAMES[e.department] || e.department}
                            {' · '}{ROLE_LABELS[e.roleName] || e.roleName}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันเริ่มต้น <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={today}
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันสิ้นสุด <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate || today}
                    onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผล</label>
                <input
                  type="text"
                  value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="เช่น ลาพักผ่อน, ลาป่วย, เดินทางราชการ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">
                  ผู้รับมอบจะสามารถอนุมัติ/ปฏิเสธใบลาในฐานะคุณได้ทันที ตลอดช่วงเวลาที่กำหนด
                  สามารถยกเลิกได้ตลอดเวลา
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
              >
                {submitting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <ArrowRightLeft className="w-4 h-4" />}
                ยืนยันโอนสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
