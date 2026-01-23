import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { leaveAPI } from '../../api/leave.api';
import { calculateDays } from '../../utils/formatDate';
import { LEAVE_TYPE_NAMES, STORAGE_KEYS } from '../../utils/constants';
import toast from 'react-hot-toast';
import { FileText, Calendar, AlertCircle, Upload, X } from 'lucide-react';

export const CreateLeavePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    selectedDates: [],
    totalDays: 0,
    reason: '',
    contactAddress: '',
    contactPhone: '',
  });

  const [files, setFiles] = useState([]);
  const [tempDate, setTempDate] = useState('');

  // Load leave types and balance
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [typesRes, balanceRes] = await Promise.all([
        leaveAPI.getLeaveTypes(),
        leaveAPI.getLeaveBalance(),
      ]);

      if (typesRes.success) {
        setLeaveTypes(typesRes.data);
      }
      if (balanceRes.success) {
        setLeaveBalance(balanceRes.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    }
  };

  // Calculate days when dates change
  useEffect(() => {
    setFormData(prev => ({ ...prev, totalDays: prev.selectedDates.length }));
  }, [formData.selectedDates]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDate = () => {
    if (!tempDate) {
      toast.error('กรุณาเลือกวันที่');
      return;
    }

    if (formData.selectedDates.includes(tempDate)) {
      toast.error('วันที่นี้ถูกเลือกไปแล้ว');
      return;
    }

    setFormData(prev => ({
      ...prev,
      selectedDates: [...prev.selectedDates, tempDate].sort()
    }));
    setTempDate('');
  };

  const handleRemoveDate = (dateToRemove) => {
    setFormData(prev => ({
      ...prev,
      selectedDates: prev.selectedDates.filter(date => date !== dateToRemove)
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error('สามารถอัพโหลดได้สูงสุด 5 ไฟล์');
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.leaveTypeId) {
      toast.error('กรุณาเลือกประเภทการลา');
      return;
    }
    if (formData.selectedDates.length === 0) {
      toast.error('กรุณาเลือกวันที่ลาอย่างน้อย 1 วัน');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('กรุณากรอกเหตุผลการลา');
      return;
    }

    setLoading(true);

    try {
      // Create leave first
      const response = await leaveAPI.createLeave(formData);

      if (response.success) {
        const leaveId = response.data.id;
        
        // Upload file if any
        if (files.length > 0) {
          const uploadToast = toast.loading('กำลังอัพโหลดเอกสาร...');
          
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('document', files[0]); // Upload first file only
            
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/uploads/leaves/${leaveId}/document`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formDataUpload
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
              toast.dismiss(uploadToast);
              toast.success('อัพโหลดเอกสารสำเร็จ');
            } else {
              toast.dismiss(uploadToast);
              toast.error('อัพโหลดเอกสารไม่สำเร็จ: ' + (uploadResult.message || 'Unknown error'));
            }
          } catch (uploadError) {
            toast.dismiss(uploadToast);
            console.error('Upload error:', uploadError);
            toast.error('เกิดข้อผิดพลาดในการอัพโหลด');
          }
        }
        
        toast.success('สร้างคำขอลาสำเร็จ');
        navigate('/my-leaves');
      } else {
        toast.error(response.message || 'สร้างคำขอลาไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Create leave error:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const selectedLeaveType = leaveTypes.find(type => type.id === formData.leaveTypeId);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            สร้างคำขอลา
          </h2>
          <p className="text-gray-600">
            กรอกข้อมูลเพื่อยื่นคำขอลา
          </p>
        </div>

        {/* Leave Balance Summary */}
        {leaveBalance && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">วันลาคงเหลือของคุณ</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-blue-700">ลาป่วย (ป)</p>
                  <p className="text-base font-semibold text-blue-900">
                    ลามาแล้ว {leaveBalance.sick || 0} วัน
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-700">ลาพักผ่อน (พ)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {leaveBalance.vacation || 0} วัน
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-blue-700">ลากิจ (ก)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {leaveBalance.personal || 0} วัน
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลคำขอลา</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทการลา <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">-- เลือกประเภทการลา --</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {LEAVE_TYPE_NAMES[type.type_code] || type.type_name}
                    </option>
                  ))}
                </select>
                {selectedLeaveType?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedLeaveType.description}
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกวันที่ลา <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="input-field flex-1"
                    placeholder="เลือกวันที่"
                  />
                  <Button
                    type="button"
                    onClick={handleAddDate}
                    variant="outline"
                  >
                    เพิ่มวันที่
                  </Button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  เลือกวันที่ที่ต้องการลา สามารถเลือกหลายวันที่ได้ (ไม่จำเป็นต้องต่อเนื่อง)
                </p>

                {/* Selected Dates List */}
                {formData.selectedDates.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      วันที่เลือก ({formData.selectedDates.length} วัน):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {formData.selectedDates.map((date, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <span className="text-sm text-blue-900">
                            {new Date(date + 'T00:00:00').toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDate(date)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Days Display */}
                <div className="mt-4">
                  <Input
                    label="จำนวนวันรวม"
                    type="number"
                    value={formData.totalDays}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เหตุผลการลา <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="กรุณาระบุเหตุผลการลา..."
                  required
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ที่อยู่ที่สามารถติดต่อได้"
                  name="contactAddress"
                  value={formData.contactAddress}
                  onChange={handleInputChange}
                  placeholder="เช่น 123 ถ.สุขุมวิท กรุงเทพฯ"
                  required
                />
                <Input
                  label="เบอร์โทรศัพท์"
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="เช่น 081-234-5678"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  แนบเอกสารประกอบ (ถ้ามี)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    คลิกเพื่ออัพโหลดไฟล์ หรือลากไฟล์มาวาง
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    รองรับไฟล์ PDF, JPG, PNG (สูงสุด 5 ไฟล์, ไฟล์ละไม่เกิน 5MB)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" size="sm" as="span">
                      เลือกไฟล์
                    </Button>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  className="flex-1"
                >
                  <FileText className="w-5 h-5" />
                  ส่งคำขอลา
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
