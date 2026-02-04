import { useState, useEffect } from 'react';
import { X, Calendar, Check, AlertCircle } from 'lucide-react';

// Format date to Thai locale
const formatDateThai = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function DateEditModal({
  isOpen,
  onClose,
  leave,
  onSubmit,
  loading
}) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [rejectedDates, setRejectedDates] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [allDates, setAllDates] = useState([]);

  useEffect(() => {
    if (leave && isOpen) {
      // Generate ALL dates from start_date to end_date (ใช้ช่วงวันที่เต็มที่ user ยื่นมา)
      let allDateRange = [];
      const startDate = new Date(leave.startDate || leave.start_date);
      const endDate = new Date(leave.endDate || leave.end_date);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDateRange.push(d.toISOString().split('T')[0]);
      }
      
      // ถ้ามี selected_dates ให้ใช้เป็น default selected
      let initialSelectedDates = allDateRange;
      
      // ถ้า user เคยเลือกวันมาแล้ว ให้ใช้วันเหล่านั้นเป็น default
      if (leave.selectedDates && Array.isArray(leave.selectedDates) && leave.selectedDates.length > 0) {
        initialSelectedDates = leave.selectedDates.filter(d => allDateRange.includes(d));
      } else if (leave.selected_dates && Array.isArray(leave.selected_dates) && leave.selected_dates.length > 0) {
        initialSelectedDates = leave.selected_dates.filter(d => allDateRange.includes(d));
      }
      
      setAllDates(allDateRange);
      setSelectedDates(initialSelectedDates.length > 0 ? initialSelectedDates : allDateRange);
      setRejectedDates(allDateRange.filter(d => !initialSelectedDates.includes(d)));
      setRejectReason('');
    }
  }, [leave, isOpen]);

  const toggleDate = (date) => {
    if (selectedDates.includes(date)) {
      // Move to rejected
      setSelectedDates(prev => prev.filter(d => d !== date));
      setRejectedDates(prev => [...prev, date]);
    } else {
      // Move to selected
      setRejectedDates(prev => prev.filter(d => d !== date));
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const handleSubmit = () => {
    if (selectedDates.length === 0) {
      return; // Can't approve with no dates
    }
    
    onSubmit({
      approvedDates: selectedDates,
      rejectedDates: rejectedDates,
      rejectReason: rejectReason
    });
  };

  if (!isOpen || !leave) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">แก้ไขวันลา</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Employee Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <p className="text-sm text-slate-600">ผู้ขอลา:</p>
            <p className="font-bold text-slate-900">{leave.employee?.full_name || leave.employee?.name || leave.employeeName}</p>
            <p className="text-sm text-slate-500 mt-1">
              ประเภทการลา: {leave.leaveType || leave.leave_type_name}
            </p>
            <p className="text-sm text-slate-500">
              ช่วงวันที่ยื่น: {formatDateThai(leave.startDate || leave.start_date)} - {formatDateThai(leave.endDate || leave.end_date)} ({allDates.length} วัน)
            </p>
          </div>

          {/* Warning if only 1 day */}
          {allDates.length === 1 && (
            <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">ผู้ขอลายื่นลาเพียง 1 วัน</p>
                  <p>ไม่สามารถแก้ไขวันลาได้ กรุณาใช้ปุ่ม "อนุมัติทั้งหมด" หรือ "ไม่อนุมัติ" แทน</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">วิธีใช้งาน:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="text-green-600 font-semibold">✓ สีเขียว</span> = วันที่อนุมัติ (คลิกเพื่อไม่อนุมัติ)</li>
                  <li><span className="text-red-600 font-semibold">✗ สีแดง</span> = วันที่ไม่อนุมัติ (คลิกเพื่ออนุมัติ)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Date Selection Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">เลือกวันที่จะอนุมัติ/ไม่อนุมัติ:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allDates.map((date) => (
                <button
                  key={date}
                  onClick={() => toggleDate(date)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedDates.includes(date)
                      ? 'bg-green-50 border-green-500 hover:bg-green-100'
                      : 'bg-red-50 border-red-500 hover:bg-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-slate-600">{date}</p>
                      <p className={`font-semibold ${
                        selectedDates.includes(date) ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatDateThai(date)}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedDates.includes(date) ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {selectedDates.includes(date) ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <X className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reject Reason (if any dates are rejected) */}
          {rejectedDates.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                เหตุผลที่ไม่อนุมัติ ({rejectedDates.length} วัน):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="กรุณาระบุเหตุผลที่ไม่อนุมัติบางวัน..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                rows="3"
              />
            </div>
          )}

          {/* Summary */}
          <div className="bg-slate-100 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">สรุป:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-xs text-green-600 font-medium">อนุมัติ</p>
                <p className="text-2xl font-bold text-green-700">{selectedDates.length} วัน</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-xs text-red-600 font-medium">ไม่อนุมัติ</p>
                <p className="text-2xl font-bold text-red-700">{rejectedDates.length} วัน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedDates.length === 0 || (rejectedDates.length > 0 && !rejectReason.trim())}
            className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
              selectedDates.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
            } disabled:opacity-50`}
          >
            {loading ? 'กำลังดำเนินการ...' : 'ยืนยันการอนุมัติ'}
          </button>
        </div>
      </div>
    </div>
  );
}
