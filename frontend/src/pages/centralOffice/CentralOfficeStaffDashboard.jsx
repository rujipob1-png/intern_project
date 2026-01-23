import { useState, useEffect } from 'react';
import { centralOfficeAPI } from '../../api/centralOffice.api';
import { LEAVE_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export default function CentralOfficeStaffDashboard() {
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
      const data = await centralOfficeAPI.getApprovedLevel1Leaves();
      setPendingLeaves(data.data || []);
    } catch (error) {
      console.error('Error loading pending leaves:', error);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (!confirm('ต้องการอนุมัติการลานี้หรือไม่?')) return;

    try {
      setActionLoading(true);
      await centralOfficeAPI.approveLeaveLevel2(leaveId, remarks);
      alert('อนุมัติการลาสำเร็จ (ส่งต่อไปยังหัวหน้าสำนักงานกลาง)');
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
      await centralOfficeAPI.rejectLeaveLevel2(leaveId, remarks);
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
      [LEAVE_STATUS.APPROVED_LEVEL1]: { label: 'ผอ.อนุมัติแล้ว', class: 'bg-blue-100 text-blue-800' },
      [LEAVE_STATUS.APPROVED_LEVEL2]: { label: 'เจ้าหน้าที่ตรวจแล้ว', class: 'bg-green-100 text-green-800' },
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
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบเอกสารการลา</h1>
          <p className="text-sm text-gray-500 mt-1">สำนักงานกลาง - เจ้าหน้าที่ (Level 2)</p>
        </div>
        <div className="text-sm text-gray-500">
          รอตรวจสอบ: <span className="font-semibold text-blue-600">{pendingLeaves.length}</span> รายการ
        </div>
      </div>

      {pendingLeaves.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            ไม่มีการลารอตรวจสอบในขณะนี้
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
                      <p className="text-sm text-blue-600">อนุมัติโดย: {leave.director_name}</p>
                    )}
                  </div>
                  {getStatusBadge(leave.status)}
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-sm text-gray-600">ประเภทการลา</p>
                    <p className="font-semibold">{leave.leave_type_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">จำนวนวัน</p>
                    <p className="font-semibold">{leave.total_days} วัน</p>
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
                </div>

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
                        {actionLoading ? 'กำลังดำเนินการ...' : 'ผ่านการตรวจสอบ'}
                      </Button>
                      <Button
                        onClick={() => handleReject(leave.id)}
                        disabled={actionLoading}
                        variant="danger"
                      >
                        ไม่ผ่าน
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
                      ตรวจสอบเอกสาร
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
