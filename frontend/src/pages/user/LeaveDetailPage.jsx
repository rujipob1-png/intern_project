import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Timeline } from '../../components/leave/Timeline';
import { CancelLeaveFormPDF } from '../../components/leave/CancelLeaveFormPDF';
import { leaveAPI } from '../../api/leave.api';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { LEAVE_TYPE_NAMES, LEAVE_STATUS_TEXT } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  Phone,
  Clock,
  XCircle,
  Download,
  Eye,
  UserCheck,
  CheckCircle,
  X,
} from 'lucide-react';

export const LeaveDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pdfFormRef = useRef();
  const [loading, setLoading] = useState(true);
  const [leave, setLeave] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // ฟังก์ชันดาวน์โหลด PDF
  const handleDownloadPDF = async () => {
    if (pdfFormRef.current) {
      await pdfFormRef.current.downloadPDF();
    }
  };

  useEffect(() => {
    loadLeaveDetail();
  }, [id]);

  const loadLeaveDetail = async () => {
    setLoading(true);
    try {
      console.log('Loading leave detail for ID:', id);
      const response = await leaveAPI.getLeaveById(id);
      console.log('Leave detail response:', response);
      if (response.success) {
        setLeave(response.data);
      } else {
        toast.error('ไม่พบข้อมูลคำขอลา');
        navigate('/my-leaves');
      }
    } catch (error) {
      console.error('Load leave detail error:', error);
      toast.error('เกิดข้อผิดพลาด');
      navigate('/my-leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('กรุณากรอกเหตุผลการยกเลิก');
      return;
    }

    setShowCancelModal(false);
    
    try {
      const response = await leaveAPI.cancelLeave(id, cancelReason);
      if (response.success) {
        toast.success('ยกเลิกคำขอลาสำเร็จ');
        setCancelReason('');
        loadLeaveDetail();
      } else {
        toast.error(response.message || 'ยกเลิกคำขอลาไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Cancel leave error:', error);
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'รอพิจารณา', className: 'bg-yellow-100 text-yellow-800' },
      level_1_approved: { label: 'ผ่านหัวหน้า', className: 'bg-blue-100 text-blue-800' },
      level_2_approved: { label: 'ผ่านกองกลาง', className: 'bg-indigo-100 text-indigo-800' },
      approved: { label: 'อนุมัติ', className: 'bg-green-100 text-green-800' },
      approved_final: { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'ไม่อนุมัติ', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'ยกเลิกแล้ว', className: 'bg-gray-100 text-gray-800' },
      // สถานะการยกเลิก
      pending_cancel: { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-800' },
      cancel_level1: { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-800' },
      cancel_level2: { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-800' },
      cancel_level3: { label: 'รอพิจารณายกเลิก', className: 'bg-orange-100 text-orange-800' },
    };

    const { label, className } = config[status] || config.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!leave) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">ไม่พบข้อมูลคำขอลา</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/my-leaves')}
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับ
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                รายละเอียดคำขอลา
              </h2>
              <p className="text-gray-600">
                เลขที่ {leave.leaveNumber || leave.leave_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(leave.status)}
            {leave.status === 'pending' && (
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5" />
                ยกเลิกคำขอ
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Leave Info */}
            <Card>
              <CardHeader>
                <CardTitle>ข้อมูลการลา</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      ประเภทการลา
                    </label>
                    <p className="text-gray-900 font-medium">
                      {typeof leave.leaveType === 'string' ? leave.leaveType :
                       leave.leaveType?.name ||
                       LEAVE_TYPE_NAMES[leave.leaveTypeCode] ||
                       LEAVE_TYPE_NAMES[leave.leaveTypes?.typeCode || leave.leave_types?.type_code] ||
                       leave.leaveTypes?.typeName || 
                       leave.leave_types?.type_name ||
                       'ไม่ระบุ'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      จำนวนวัน
                    </label>
                    <p className="text-gray-900 font-medium">
                      {leave.totalDays || leave.total_days} วัน
                    </p>
                  </div>
                </div>

                {/* Selected Dates */}
                {leave.selectedDates || leave.selected_dates ? (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      วันที่เลือก ({(leave.selectedDates || leave.selected_dates)?.length || 0} วัน)
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {(leave.selectedDates || leave.selected_dates)?.map((date, index) => (
                        <div
                          key={index}
                          className="p-2 bg-blue-50 border border-blue-200 rounded text-center"
                        >
                          <span className="text-sm text-blue-900">
                            {formatDate(date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        วันที่เริ่มต้น
                      </label>
                      <p className="text-gray-900">{formatDate(leave.startDate || leave.start_date)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        วันที่สิ้นสุด
                      </label>
                      <p className="text-gray-900">{formatDate(leave.endDate || leave.end_date)}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    <FileText className="w-4 h-4 inline mr-1" />
                    เหตุผลการลา
                  </label>
                  <p className="text-gray-900 whitespace-pre-line">{leave.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      ที่อยู่ติดต่อ
                    </label>
                    <p className="text-gray-900">{leave.contactAddress || leave.contact_address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      <Phone className="w-4 h-4 inline mr-1" />
                      เบอร์โทรศัพท์
                    </label>
                    <p className="text-gray-900">{leave.contactPhone || leave.contact_phone || '-'}</p>
                  </div>
                </div>

                {/* Cancelled Reason - show if status is cancelled or pending cancellation */}
                {(leave.status === 'cancelled' || 
                  leave.status === 'pending_cancel' || 
                  leave.status?.startsWith('cancel_level')) && 
                  (leave.cancelledReason || leave.cancelled_reason) && (
                  <div className={`mt-4 p-4 border rounded-lg ${
                    leave.status === 'cancelled' 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <label className={`text-sm font-medium block mb-2 ${
                      leave.status === 'cancelled' 
                        ? 'text-gray-700' 
                        : 'text-orange-700'
                    }`}>
                      <FileText className="w-4 h-4 inline mr-1" />
                      {leave.status === 'cancelled' ? 'เหตุผลที่ยกเลิก' : 'เหตุผลที่ขอยกเลิก'}
                    </label>
                    <p className={`whitespace-pre-line ${
                      leave.status === 'cancelled' 
                        ? 'text-gray-900' 
                        : 'text-orange-900'
                    }`}>{leave.cancelledReason || leave.cancelled_reason}</p>
                    {leave.status !== 'cancelled' && (
                      <p className="mt-2 text-xs text-orange-600">
                        ⏳ กำลังรอการพิจารณายกเลิกจากผู้บังคับบัญชา
                      </p>
                    )}
                    {/* ปุ่มดาวน์โหลด PDF แบบฟอร์มยกเลิก */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setShowPDFPreview(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        ดูตัวอย่าง
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        ดาวน์โหลด PDF
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t text-xs text-gray-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  ยื่นคำขอเมื่อ {formatDateTime(leave.createdAt || leave.created_at)}
                </div>
              </CardContent>
            </Card>

            {/* Acting Person */}
            {(leave.actingPerson || leave.acting_person) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    ผู้ปฏิบัติหน้าที่แทน
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {(leave.actingPerson?.name || leave.acting_person?.first_name)?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {leave.actingPerson?.name || 
                           `${leave.acting_person?.title || ''}${leave.acting_person?.first_name || ''} ${leave.acting_person?.last_name || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {leave.actingPerson?.position || leave.acting_person?.position || 'ไม่ระบุตำแหน่ง'}
                        </p>
                        <p className="text-xs text-gray-500">
                          รหัสพนักงาน: {leave.actingPerson?.employeeCode || leave.acting_person?.employee_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {(leave.actingApproved || leave.acting_approved) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          <CheckCircle className="w-4 h-4" />
                          ยอมรับแล้ว
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          <Clock className="w-4 h-4" />
                          รอการยืนยัน
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {(leave.documentUrl || leave.document_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>เอกสารแนบ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            เอกสารประกอบการลา
                          </p>
                          <p className="text-xs text-gray-500">
                            คลิกเพื่อดูหรือดาวน์โหลด
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(leave.documentUrl || leave.document_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            try {
                              const url = leave.documentUrl || leave.document_url;
                              const response = await fetch(url);
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = blobUrl;
                              link.download = `leave_document_${leave.leaveNumber || leave.leave_number}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(blobUrl);
                            } catch (error) {
                              console.error('Download error:', error);
                              toast.error('ไม่สามารถดาวน์โหลดไฟล์ได้');
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>สถานะการอนุมัติ</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline approvals={leave.approvals} status={leave.status} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-lg relative">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">แบบใบขอยกเลิกคำขอลา</h3>
                  <p className="text-sm opacity-90">Leave Cancellation Request Form</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Leave Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="w-5 h-5" />
                    ข้อมูลคำขอเดิม
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">เลขที่คำขอ</label>
                      <p className="font-semibold text-gray-900">{leave.leaveNumber || leave.leave_number}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ประเภทการลา</label>
                      <p className="font-semibold text-gray-900">
                        {leave.leaveType?.name || 'ไม่ระบุ'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">ช่วงวันที่ลา</label>
                    <p className="font-semibold text-gray-900">
                      {formatDate(leave.startDate || leave.start_date)} → {formatDate(leave.endDate || leave.end_date)}
                      <span className="ml-2 text-blue-600">({leave.totalDays || leave.total_days} วัน)</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">เหตุผลการลาเดิม</label>
                    <p className="text-gray-900">{leave.reason}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">สถานะปัจจุบัน</label>
                    <div className="mt-1">
                      {getStatusBadge(leave.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-600">* </span>
                  เหตุผลการยกเลิก
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลการยกเลิกคำขอลา (ขั้นต่ำ 10 ตัวอักษร)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="4"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  เช่น ต้องการเปลี่ยนวันลา, เปลี่ยนแผนการเดินทาง, ไม่สามารถไปราชการได้ เป็นต้น
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-6 bg-gray-50 rounded-b-lg border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleCancel}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!cancelReason.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                ยืนยันยกเลิกคำขอลา
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">ตัวอย่างแบบฟอร์มยกเลิกวันลา</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลด PDF
                </button>
                <button
                  onClick={() => setShowPDFPreview(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="overflow-auto max-h-[calc(90vh-80px)] bg-gray-200 p-4">
              <div className="shadow-lg mx-auto" style={{ width: 'fit-content' }}>
                <CancelLeaveFormPDF ref={pdfFormRef} leave={leave} user={user} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Form for download */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <CancelLeaveFormPDF ref={pdfFormRef} leave={leave} user={user} />
      </div>
    </MainLayout>
  );
};
