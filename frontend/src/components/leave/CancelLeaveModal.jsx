import { useState } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Upload, 
  Trash2,
  Clock,
  User,
  Building,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { LEAVE_TYPE_NAMES, LEAVE_TYPE_CODES } from '../../utils/constants';

export function CancelLeaveModal({ leave, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    cancellationReason: '',
    documents: []
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get leave type display
  const getLeaveTypeName = () => {
    return leave.leaveType || 
           leave.leaveTypes?.typeName || 
           leave.leave_types?.type_name ||
           LEAVE_TYPE_NAMES[leave.leaveTypeCode] ||
           'ไม่ระบุ';
  };

  const getLeaveTypeCode = () => {
    const code = leave.leaveTypeCode || 
                 leave.leaveTypes?.typeCode || 
                 leave.leave_types?.type_code || '';
    return LEAVE_TYPE_CODES[code] || code || '-';
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        alert(`ไฟล์ ${file.name} ไม่รองรับ (รองรับเฉพาะ PDF, JPG, PNG)`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`ไฟล์ ${file.name} ขนาดใหญ่เกินไป (ไม่เกิน 5MB)`);
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...validFiles].slice(0, 5) // Max 5 files
    }));
  };

  // Remove file
  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.cancellationReason.trim()) {
      newErrors.cancellationReason = 'กรุณาระบุเหตุผลการยกเลิก';
    } else if (formData.cancellationReason.trim().length < 10) {
      newErrors.cancellationReason = 'เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        leaveId: leave.id,
        ...formData
      });
      onClose();
    } catch (error) {
      console.error('Error submitting cancellation:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'ไม่สามารถส่งคำขอยกเลิกได้'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">แบบใบขอยกเลิกคำขอลา</h2>
              <p className="text-red-100 text-sm mt-0.5">Leave Cancellation Request Form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ข้อมูลคำขอเดิม */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-blue-900">📄 ข้อมูลคำขอเดิม</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* เลขที่คำขอ */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">เลขที่คำขอ</p>
                <p className="font-bold text-gray-900">
                  {leave.LeaveNumber || leave.leaveNumber || leave.leave_number}
                </p>
              </div>

              {/* ประเภทการลา */}
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">ประเภทการลา</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg font-bold text-sm">
                    {getLeaveTypeCode()}
                  </span>
                  <span className="font-bold text-gray-900">{getLeaveTypeName()}</span>
                </div>
              </div>

              {/* วันที่ลา */}
              <div className="bg-white rounded-lg p-3 md:col-span-2">
                <p className="text-xs text-gray-600 mb-1">ช่วงวันที่ลา</p>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">{formatDate(leave.startDate || leave.start_date)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold">{formatDate(leave.endDate || leave.end_date)}</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {leave.totalDays || leave.total_days} วัน
                  </span>
                </div>
              </div>

              {/* เหตุผลการลาเดิม */}
              <div className="bg-white rounded-lg p-3 md:col-span-2">
                <p className="text-xs text-gray-600 mb-1">เหตุผลการลาเดิม</p>
                <p className="text-gray-900">{leave.reason || 'ไม่ระบุ'}</p>
              </div>

              {/* สถานะปัจจุบัน */}
              <div className="bg-white rounded-lg p-3 md:col-span-2">
                <p className="text-xs text-gray-600 mb-1">สถานะปัจจุบัน</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-bold">
                  <Clock className="w-4 h-4" />
                  รออนุมัติ
                </span>
              </div>
            </div>
          </div>

          {/* เหตุผลการยกเลิก */}
          <div>
            <label className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              เหตุผลการยกเลิก <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.cancellationReason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, cancellationReason: e.target.value }));
                if (errors.cancellationReason) {
                  setErrors(prev => ({ ...prev, cancellationReason: '' }));
                }
              }}
              placeholder="กรุณาระบุเหตุผลการยกเลิกคำขอลา (ขั้นต่ำ 10 ตัวอักษร)&#10;เช่น: ติดภารกิจเร่งด่วนจากทางราชการ ไม่สามารถลาได้ตามแผนที่วางไว้"
              rows="5"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none ${
                errors.cancellationReason 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
              }`}
            />
            {errors.cancellationReason && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.cancellationReason}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {formData.cancellationReason.length}/10 ตัวอักษร
            </p>
          </div>

          {/* Upload เอกสารประกอบ */}
          <div>
            <label className="flex items-center gap-2 text-gray-900 font-bold mb-2">
              <Upload className="w-5 h-5 text-gray-600" />
              เอกสารประกอบ (ถ้ามี)
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-red-400 hover:bg-red-50 transition-all cursor-pointer">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={formData.documents.length >= 5}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">คลิกเพื่ออัปโหลดไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                <p className="text-gray-500 text-sm mt-1">
                  รองรับ PDF, JPG, PNG (ไฟล์ละไม่เกิน 5MB, สูงสุด 5 ไฟล์)
                </p>
              </label>
            </div>

            {/* แสดงรายการไฟล์ที่แนบ */}
            {formData.documents.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-bold text-gray-700">📋 รายการไฟล์ที่แนบ:</p>
                {formData.documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* หมายเหตุ */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 mb-2">ℹ️ หมายเหตุสำคัญ</h4>
                <ul className="text-sm text-amber-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>คำขอยกเลิกจะ<strong>ไม่ยกเลิกทันที</strong> แต่จะเปลี่ยนสถานะเป็น "รอพิจารณายกเลิก"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>ต้อง<strong>ผ่านการอนุมัติ 4 ระดับ</strong> เหมือนการยื่นคำขอลา (ผอ.กลุ่มงาน → หัวหน้าฝ่ายบริหาร → ผอ.กลุ่มงานอำนวยการ → ผอ.ศูนย์)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>เมื่อได้รับอนุมัติครบทุกระดับ <strong>วันลาจะถูกคืนให้ทันที</strong> โดยไม่หักสิทธิ์</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>สามารถยกเลิกได้ทั้งคำขอที่ <strong>รออนุมัติ และ อนุมัติแล้ว</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⬅️ ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังส่งคำขอ...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  ✅ ยืนยันคำขอยกเลิก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
