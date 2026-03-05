/**
 * ActingRequestsPage
 * หน้าสำหรับดูและอนุมัติคำขอให้ปฏิบัติหน้าที่แทน
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Calendar, FileText, Check, Clock, Users, Info, ChevronRight } from 'lucide-react';
import { getActingRequests, approveActingRequest } from '../../api/acting.api';
import { Button } from '../../components/common/Button';
import { getDepartmentThaiCode } from '../../utils/departmentMapping';
import toast from 'react-hot-toast';

export const ActingRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const result = await getActingRequests();
      if (result.success) {
        setRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (approvingId) return;

    setApprovingId(leaveId);
    try {
      const result = await approveActingRequest(leaveId, 'ยอมรับการปฏิบัติหน้าที่แทน');
      if (result.success) {
        toast.success('ยอมรับการปฏิบัติหน้าที่แทนแล้ว');
        fetchRequests();
      } else {
        toast.error(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('ไม่สามารถบันทึกได้');
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    return start === end ? start : `${start} - ${end}`;
  };

  const formatSelectedDates = (request) => {
    if (request.selected_dates && Array.isArray(request.selected_dates) && request.selected_dates.length > 0) {
      const dates = request.selected_dates.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      });
      return dates.join(', ');
    }
    return formatDateRange(request.start_date, request.end_date);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">คำขอให้ปฏิบัติหน้าที่แทน</h1>
            <p className="text-sm text-gray-500">
              รายการคำขอจากเพื่อนร่วมงานที่ขอให้คุณปฏิบัติหน้าที่แทนระหว่างลา
            </p>
          </div>
        </div>
      </div>

      {/* Counter Badge */}
      {!loading && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-sm font-medium text-gray-700">
            {requests.length > 0
              ? `${requests.length} คำขอรอดำเนินการ`
              : 'ไม่มีคำขอ'
            }
          </span>
          {requests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400 mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Card Top — Requester Info */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-gray-500">
                        {request.users?.first_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-[15px]">
                        {request.users?.title}{request.users?.first_name} {request.users?.last_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {request.users?.position} • {getDepartmentThaiCode(request.users?.department)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    รอการยอมรับ
                  </span>
                </div>
              </div>

              {/* Card Body — Leave Details */}
              <div className="px-5 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">วันที่ลา</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatSelectedDates(request)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">รวม {request.total_days} วัน</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">ประเภทการลา</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{request.leave_types?.type_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">เลขที่ {request.leave_number}</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">เหตุผลการลา</span>
                  <p className="text-sm text-gray-700 mt-1">{
                    (() => {
                      if (typeof request.reason === 'string' && request.reason.trim().startsWith('{')) {
                        try {
                          const parsed = JSON.parse(request.reason);
                          if (parsed && typeof parsed.reason === 'string') return parsed.reason;
                        } catch (e) {}
                      }
                      return request.reason;
                    })()
                  }</p>
                </div>
              </div>

              {/* Card Footer — Action */}
              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400">
                  เมื่อยอมรับแล้วจะไม่สามารถยกเลิกได้
                </p>
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={approvingId !== null}
                  className={`
                    inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                    transition-colors flex-shrink-0
                    ${approvingId === request.id
                      ? 'bg-gray-200 text-gray-500 cursor-wait'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                    }
                  `}
                >
                  {approvingId === request.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      ยอมรับ
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-200 py-20 px-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UserCheck className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">ไม่มีคำขอในขณะนี้</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            เมื่อเพื่อนร่วมงานขอลาและเลือกคุณเป็นผู้ปฏิบัติหน้าที่แทน คำขอจะแสดงที่นี่
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">เกี่ยวกับการปฏิบัติหน้าที่แทน</h4>
            <ul className="text-sm text-gray-500 space-y-1.5">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                เมื่อยอมรับแล้ว คุณจะต้องปฏิบัติหน้าที่แทนเพื่อนร่วมงานระหว่างที่ท่านลา
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                ระบบจะแจ้งเตือนให้คุณทราบเมื่อมีคำขอใหม่
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                สามารถดูรายละเอียดการลาได้จากหน้าประวัติการลา
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                หากมีปัญหาติดต่อผู้ดูแลระบบหรือหัวหน้างาน
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActingRequestsPage;
