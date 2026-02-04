import { useState } from 'react';
import { X, Check, Calendar, Info } from 'lucide-react';

// Format date to Thai locale
const formatDateThai = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Parse partial approval comment to extract data
const parsePartialApprovalComment = (comment) => {
  if (!comment) return null;
  
  // รูปแบบใหม่: ✓ อนุมัติ: dates | ✗ ไม่อนุมัติ: dates (เหตุผล: reason)
  const approvedMatch = comment.match(/✓ อนุมัติ: ([^|]+)/);
  const rejectedMatch = comment.match(/✗ ไม่อนุมัติ: ([^(]+)\(เหตุผล: ([^)]+)\)/);
  
  if (approvedMatch || rejectedMatch) {
    const approvedDates = approvedMatch ? approvedMatch[1].trim().split(', ').filter(d => d && d.match(/^\d{4}-\d{2}-\d{2}$/)) : [];
    const rejectedDates = rejectedMatch ? rejectedMatch[1].trim().split(', ').filter(d => d && d.match(/^\d{4}-\d{2}-\d{2}$/)) : [];
    const rejectReason = rejectedMatch ? rejectedMatch[2].trim() : '';
    
    // หา remarks ถ้ามี
    const remarksMatch = comment.match(/\| หมายเหตุ: (.+)$/);
    const remarks = remarksMatch ? remarksMatch[1].trim() : '';
    
    return {
      approvedDates,
      rejectedDates,
      rejectReason,
      remarks,
      isPartialApproval: true
    };
  }
  
  // รูปแบบเก่า: อนุมัติบางส่วน (ไม่อนุมัติวันที่: dates เหตุผล: reason)
  const oldFormatMatch = comment.match(/อนุมัติบางส่วน \(ไม่อนุมัติวันที่: ([^เ]+)เหตุผล: ([^)]+)\)/);
  if (oldFormatMatch) {
    return {
      approvedDates: [], // รูปแบบเก่าไม่มีวันที่อนุมัติ
      rejectedDates: oldFormatMatch[1].trim().split(', ').filter(d => d && d.match(/^\d{4}-\d{2}-\d{2}$/)),
      rejectReason: oldFormatMatch[2].trim(),
      remarks: '',
      isPartialApproval: true,
      isOldFormat: true // flag บอกว่าเป็นรูปแบบเก่า
    };
  }
  
  return null;
};

export default function PartialApprovalDetailModal({
  isOpen,
  onClose,
  comment,
  approverName,
  approvalDate,
  leaveApprovedDates = [] // วันที่อนุมัติจาก leave data (สำหรับรูปแบบเก่า)
}) {
  const parsed = parsePartialApprovalComment(comment);
  
  // ใช้ leaveApprovedDates ถ้าเป็นรูปแบบเก่าที่ไม่มีวันที่อนุมัติ
  const approvedDates = parsed?.approvedDates?.length > 0 
    ? parsed.approvedDates 
    : leaveApprovedDates;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">รายละเอียดการอนุมัติบางส่วน</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Approver Info */}
          {approverName && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600">ผู้อนุมัติ:</p>
              <p className="font-bold text-slate-900">{approverName}</p>
              {approvalDate && (
                <p className="text-xs text-slate-500 mt-1">{formatDateThai(approvalDate)}</p>
              )}
            </div>
          )}

          {parsed ? (
            <>
              {/* Approved Dates */}
              {approvedDates.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">วันที่อนุมัติ ({approvedDates.length} วัน)</h3>
                  </div>
                  <div className="space-y-1">
                    {approvedDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-green-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDateThai(date)}</span>
                        <span className="text-xs text-green-500">({date})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Dates */}
              {parsed.rejectedDates.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <X className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">วันที่ไม่อนุมัติ ({parsed.rejectedDates.length} วัน)</h3>
                  </div>
                  <div className="space-y-1 mb-3">
                    {parsed.rejectedDates.map((date, index) => (
                      <div key={index} className="flex items-center gap-2 text-red-700">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDateThai(date)}</span>
                        <span className="text-xs text-red-500">({date})</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Reject Reason */}
                  {parsed.rejectReason && (
                    <div className="bg-red-100 rounded-lg p-3 border-l-4 border-red-400">
                      <p className="text-xs font-semibold text-red-600 mb-1">เหตุผลที่ไม่อนุมัติ:</p>
                      <p className="text-sm text-red-800">{parsed.rejectReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Remarks */}
              {parsed.remarks && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-1">หมายเหตุเพิ่มเติม:</p>
                  <p className="text-sm text-blue-800">{parsed.remarks}</p>
                </div>
              )}
            </>
          ) : (
            /* Fallback - show raw comment */
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-800">{comment}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to check if comment is partial approval
export const isPartialApprovalComment = (comment) => {
  if (!comment) return false;
  return comment.includes('✓ อนุมัติ:') || comment.includes('อนุมัติบางส่วน');
};
