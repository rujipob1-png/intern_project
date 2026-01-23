import { useState, useEffect } from 'react';
import { adminAPI } from '../../api/admin.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export default function AdminDashboard() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getApprovedLevel3Leaves();
      setPendingLeaves(data.data || []);
    } catch (error) {
      console.error('Error loading pending leaves:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (!confirm('ต้องการอนุมัติขั้นสุดท้ายและหักวันลาหรือไม่?')) return;

    try {
      setActionLoading(true);
      await adminAPI.approveLeaveFinal(leaveId, remarks);
      alert('อนุมัติการลาสำเร็จ และได้หักวันลาแล้ว');
      setRemarks('');
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (leaveId) => {
    if (!remarks.trim()) {
      alert('กรุณาระบุเหตุผลในการไม่อนุมัติ');
      return;
    }

    if (!confirm('ต้องการไม่อนุมัติการลานี้หรือไม่?')) return;

    try {
      setActionLoading(true);
      await adminAPI.rejectLeaveFinal(leaveId, remarks);
      alert('ไม่อนุมัติการลาสำเร็จ');
      setRemarks('');
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการไม่อนุมัติ');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [LEAVE_STATUS.APPROVED_LEVEL3]: { label: 'หัวหน้าอนุมัติแล้ว', class: 'bg-purple-100 text-purple-800' },
      [LEAVE_STATUS.APPROVED]: { label: 'อนุมัติสมบูรณ์', class: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">อนุมัติขั้นสุดท้าย</h1>
          <p className="text-sm text-gray-500 mt-1">ผู้บริหารสูงสุด (Level 4)</p>
        </div>
        <div className="text-sm text-gray-500">
          รออนุมัติ: <span className="font-semibold text-blue-600">{pendingLeaves.length}</span> รายการ
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>การอนุมัติในขั้นนี้จะหักวันลาของพนักงานทันที</strong> กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนอนุมัติ
            </p>
          </div>
        </div>
      </div>

      {pendingLeaves.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            ไม่มีการลารออนุมัติในขณะนี้
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingLeaves.map((leave) => (
            <Card key={leave.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {leave.user_name || 'ไม่ระบุชื่อ'}
                    </h3>
                    <p className="text-sm text-gray-500">{leave.user_email}</p>
                    <p className="text-sm text-gray-500">แผนก: {leave.department_name || 'ไม่ระบุ'}</p>
                    {leave.director_name && (
                      <p className="text-sm text-blue-600">ผู้อำนวยการ: {leave.director_name}</p>
                    )}
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                {/* Approval Timeline */}
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">ขั้นตอนการอนุมัติ:</p>
                  <div className="flex items-center text-xs text-gray-700 space-x-2">
                    <span className="text-green-600">✓ ผู้อำนวยการ</span>
                    <span>→</span>
                    <span className="text-green-600">✓ เจ้าหน้าที่</span>
                    <span>→</span>
                    <span className="text-green-600">✓ หัวหน้าสำนักงานกลาง</span>
                    <span>→</span>
                    <span className="text-orange-600 font-semibold">⏳ รอผู้บริหารอนุมัติ</span>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-sm text-gray-600">ประเภทการลา</p>
                    <p className="font-semibold">{leave.leave_type_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">จำนวนวัน</p>
                    <p className="font-semibold text-red-600">{leave.total_days} วัน</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่เริ่มต้น</p>
                    <p className="font-semibold">{formatDate(leave.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่สิ้นสุด</p>
                    <p className="font-semibold">{formatDate(leave.end_date)}</p>
                  </div>
                  {leave.selected_dates && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-2">วันที่เลือก</p>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(leave.selected_dates).map((date, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {formatDate(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {leave.reason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">เหตุผล</p>
                      <p className="text-gray-900">{leave.reason}</p>
                    </div>
                  )}
                  {leave.director_remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">หมายเหตุจากผู้อำนวยการ</p>
                      <p className="text-gray-900 italic">{leave.director_remarks}</p>
                    </div>
                  )}
                  {leave.central_staff_remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">หมายเหตุจากเจ้าหน้าที่</p>
                      <p className="text-gray-900 italic">{leave.central_staff_remarks}</p>
                    </div>
                  )}
                  {leave.central_head_remarks && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">หมายเหตุจากหัวหน้าสำนักงานกลาง</p>
                      <p className="text-gray-900 italic">{leave.central_head_remarks}</p>
                    </div>
                  )}
                </div>

                {/* Current Leave Balance Warning */}
                {leave.current_balance !== undefined && (
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <p className="text-sm text-orange-800">
                      <strong>วันลาคงเหลือปัจจุบัน:</strong> {leave.current_balance} วัน
                      <br />
                      <span className="text-xs">หลังอนุมัติจะเหลือ: {leave.current_balance - leave.total_days} วัน</span>
                    </p>
                  </div>
                )}

                {/* Action Section */}
                {selectedLeave === leave.id ? (
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หมายเหตุ (ถ้ามี)
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="ระบุหมายเหตุหรือเหตุผล..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(leave.id)}
                        disabled={actionLoading}
                        variant="primary"
                      >
                        {actionLoading ? 'กำลังดำเนินการ...' : 'อนุมัติและหักวันลา'}
                      </Button>
                      <Button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        variant="danger"
                      >
                        ไม่อนุมัติ
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedLeave(null);
                          setRemarks('');
                        }}
                        disabled={actionLoading}
                        variant="secondary"
                      >
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <Button
                      onClick={() => setSelectedLeave(leave.id)}
                      variant="primary"
                      className="w-full md:w-auto"
                    >
                      พิจารณาการลา
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
