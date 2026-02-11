/**
 * ActingRequestsPage
 * หน้าสำหรับดูและอนุมัติคำขอให้ปฏิบัติหน้าที่แทน
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Calendar, FileText, Check } from 'lucide-react';
import { getActingRequests, approveActingRequest } from '../../api/acting.api';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
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
        fetchRequests(); // Refresh list
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

  // แสดงวันที่จาก selected_dates (วันที่เลือกจริงๆ)
  const formatSelectedDates = (request) => {
    // ถ้ามี selected_dates ให้แสดงวันที่เลือกจริงๆ
    if (request.selected_dates && Array.isArray(request.selected_dates) && request.selected_dates.length > 0) {
      const dates = request.selected_dates.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      });
      return dates.join(', ');
    }
    // ถ้าไม่มี selected_dates ใช้ start-end แบบเดิม
    return formatDateRange(request.start_date, request.end_date);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Header */}
      <Card className="mb-6 shadow-sm border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">คำขอให้ปฏิบัติหน้าที่แทน</h1>
            <p className="text-sm text-slate-600 mt-1">
              รายการคำขอจากเพื่อนร่วมงานที่ขอให้คุณปฏิบัติหน้าที่แทนระหว่างลา
            </p>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow border-slate-200">
              <div className="flex gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <UserCheck className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {request.users?.title}{request.users?.first_name} {request.users?.last_name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {request.users?.position} • {getDepartmentThaiCode(request.users?.department)}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      รอการยอมรับ
                    </span>
                  </div>

                  {/* Leave Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">วันที่ลา</p>
                        <p className="text-sm text-slate-900">
                          {formatSelectedDates(request)}
                        </p>
                        <p className="text-xs text-slate-600">({request.total_days} วัน)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-medium">ประเภทการลา</p>
                        <p className="text-sm text-slate-900">{request.leave_types?.type_name}</p>
                        <p className="text-xs text-slate-600">เลขที่ {request.leave_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 font-medium mb-1">เหตุผลการลา:</p>
                    <p className="text-sm text-slate-700">{
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

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      loading={approvingId === request.id}
                      disabled={approvingId !== null}
                      className="flex-1 md:flex-none"
                    >
                      <Check className="w-5 h-5" />
                      ยอมรับการปฏิบัติหน้าที่แทน
                    </Button>
                    <p className="text-xs text-slate-500 flex-1">
                      * เมื่อยอมรับแล้วจะไม่สามารถยกเลิกได้
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 border-slate-200">
          <UserCheck className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">ไม่มีคำขอ</h3>
          <p className="text-slate-500">
            ขณะนี้ไม่มีคำขอให้คุณปฏิบัติหน้าที่แทน
          </p>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-slate-50 border-slate-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">ℹ️</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-2">เกี่ยวกับการปฏิบัติหน้าที่แทน</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• เมื่อยอมรับแล้ว คุณจะต้องปฏิบัติหน้าที่แทนเพื่อนร่วมงานระหว่างที่ท่านลา</li>
              <li>• ระบบจะแจ้งเตือนให้คุณทราบเมื่อมีคำขอใหม่</li>
              <li>• สามารถดูรายละเอียดการลาได้จากหน้าประวัติการลา</li>
              <li>• หากมีปัญหาติดต่อผู้ดูแลระบบหรือหัวหน้างาน</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActingRequestsPage;
