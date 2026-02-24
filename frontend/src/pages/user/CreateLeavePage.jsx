import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ActingPersonSelect } from '../../components/leave/ActingPersonSelect';
import { CalendarPicker } from '../../components/leave/CalendarPicker';
import { leaveAPI } from '../../api/leave.api';
import { calculateDays } from '../../utils/formatDate';
import { LEAVE_TYPE_NAMES, STORAGE_KEYS } from '../../utils/constants';
import { sanitizeString, leaveRequestSchema, validateData } from '../../utils/validation';
import toast from 'react-hot-toast';
import { FileText, Calendar, AlertCircle, Upload, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';

// ระเบียบการลาตามประเภท 
// อ้างอิง: ระเบียบสำนักนายกรัฐมนตรีว่าด้วยการลาของข้าราชการ พ.ศ. 2555
const LEAVE_RULES = {
  SICK: {
    title: 'ระเบียบการลาป่วย',
    reference: 'ข้อ 18',
    maxDays: 60,
    maxDaysExtended: 120,
    rules: [
      'ลาได้ไม่เกิน 60 วันทำการ/ปี (ขยายได้อีก 60 วัน รวม 120 วัน)',
      'ลาเกิน 120 วัน จะไม่ได้รับเงินเดือน',
      'ลาตั้งแต่ 30 วันขึ้นไป ต้องมีใบรับรองแพทย์',
      'ลาป่วยไม่สามารถลงชื่อในใบลาได้ ให้ผู้อื่นลาแทนก็ได้',
    ],
    warnings: [
      { condition: 30, message: 'ลาตั้งแต่ 30 วันขึ้นไป ต้องแนบใบรับรองแพทย์', type: 'warning', requireDocument: true },
      { condition: 60, message: 'ลาเกิน 60 วัน อาจไม่ได้รับการพิจารณาเลื่อนเงินเดือน', type: 'danger' },
    ],
    salaryNote: '⚠️ เกณฑ์เลื่อนเงินเดือน: ลากิจ + ลาป่วย รวมกัน ≤ 23 วัน หรือ ≤ 10 ครั้ง/รอบประเมิน',
    submitRule: 'เสนอใบลาต่อผู้บังคับบัญชาตามลำดับ กรณีป่วยไม่สามารถลงชื่อได้ ให้ผู้อื่นลาแทนได้',
  },
  PERSONAL: {
    title: 'ระเบียบการลากิจส่วนตัว',
    reference: 'ข้อ 22',
    maxDaysFirstYear: 15,
    maxDaysAfter: 45,
    rules: [
      'ปีแรก: ลาได้ไม่เกิน 15 วันทำการ (ได้รับเงินเดือน)',
      'ปีต่อไป: ลาได้ไม่เกิน 45 วันทำการ (ได้รับเงินเดือน)',
      'ต้องได้รับอนุญาตก่อนจึงจะหยุดราชการได้',
      'ลากิจเพื่อเลี้ยงดูบุตร (ต่อจากลาคลอด) ลาได้ไม่เกิน 150 วันทำการ',
    ],
    warnings: [
      { condition: 15, message: 'ลาเกิน 15 วัน (สำหรับปีแรก) อาจไม่ได้รับการพิจารณา', type: 'warning' },
      { condition: 45, message: 'ลาเกิน 45 วัน จะไม่ได้รับเงินเดือน', type: 'danger' },
    ],
    salaryNote: '⚠️ เกณฑ์เลื่อนเงินเดือน: ลากิจ + ลาป่วย รวมกัน ≤ 23 วัน หรือ ≤ 10 ครั้ง/รอบประเมิน',
    submitRule: 'ต้องเสนอใบลาและได้รับอนุญาตก่อนจึงจะหยุดราชการได้ เว้นแต่มีเหตุจำเป็น',
  },
  VACATION: {
    title: 'ระเบียบการลาพักผ่อน',
    reference: 'ข้อ 23 - 27',
    maxDays: 10,
    rules: [
      'ลาพักผ่อนประจำปีได้ 10 วันทำการ',
      'ผู้ที่รับราชการยังไม่ถึง 6 เดือน ไม่มีสิทธิ์ลาพักผ่อน',
      'รับราชการไม่ถึง 10 ปี สะสมวันลาได้ไม่เกิน 20 วันทำการ',
      'รับราชการตั้งแต่ 10 ปีขึ้นไป สะสมวันลาได้ไม่เกิน 30 วันทำการ',
      'ต้องได้รับอนุญาตก่อนจึงจะหยุดราชการได้',
    ],
    warnings: [
      { condition: 10, message: 'ลาเกิน 10 วัน ต้องใช้วันลาสะสม', type: 'info' },
    ],
    submitRule: 'ต้องเสนอใบลาต่อผู้บังคับบัญชาและได้รับอนุญาตก่อน',
    requireActingPerson: true,
  },
  MATERNITY: {
    title: 'ระเบียบการลาคลอดบุตร',
    reference: 'ข้อ 19',
    maxDays: 90,
    rules: [
      'ลาได้ครรภ์หนึ่งไม่เกิน 90 วัน (ก่อน+หลังคลอด รวมกัน)',
      'ไม่ต้องมีใบรับรองแพทย์แนบท้ายการยื่นใบลา',
      'นับรวมวันหยุดราชการด้วย',
      'หากเด็กที่คลอดออกมาแล้วเสียชีวิต ไม่กระทบสิทธิ์การลาคลอดบุตร',
      'หากประสงค์จะยกเลิกลาคลอดบุตรที่หยุดไป ให้ผู้มีอำนาจพิจารณาอนุญาตให้ยกเลิกได้',
    ],
    warnings: [],
    submitRule: 'เสนอใบลาต่อผู้บังคับบัญชาตามลำดับจนถึงผู้มีอำนาจอนุญาต',
  },
  PATERNITY: {
    title: 'ระเบียบการลาไปช่วยเหลือภริยาที่คลอดบุตร',
    reference: 'ข้อ 20',
    maxDays: 15,
    rules: [
      'ต้องเป็นภริยาที่ชอบด้วยกฎหมาย',
      'ลาได้ครั้งหนึ่งติดต่อกันไม่เกิน 15 วันทำการ',
      'ได้รับเงินเดือนระหว่างลาไม่เกิน 15 วันทำการ',
      'ต้องเสนอใบลาภายใน 90 วัน นับแต่วันที่ภริยาคลอดบุตร',
    ],
    warnings: [],
    submitRule: 'ต้องแนบสำเนาทะเบียนสมรส และสำเนาสูติบัตรเพื่อประกอบการพิจารณา',
    requireDocument: true,
    requiredDocuments: ['สำเนาทะเบียนสมรส', 'สำเนาสูติบัตร'],
  },
  ORDINATION: {
    title: 'ระเบียบการลาอุปสมบท',
    reference: 'ข้อ 28 - 30',
    maxDays: 120,
    rules: [
      'ต้องอุปสมบทหรือออกเดินทางภายใน 10 วัน นับแต่วันเริ่มลา',
      'เมื่อลาสิกขาแล้ว ต้องกลับมารายงานตัวภายใน 5 วัน',
      'ต้องเสนอใบลาก่อนวันอุปสมบทไม่น้อยกว่า 60 วัน',
      'กรณีได้รับพระราชทานพระบรมราชานุญาตให้ลาอุปสมบท และได้หยุดราชการไปแล้ว แต่มีปัญหาทำให้ไม่สามารถอุปสมบทได้ ให้มารายงานตัวกลับเข้าปฏิบัติราชการปกติ',
    ],
    warnings: [
      { condition: 0, message: 'ต้องเสนอใบลาก่อนวันอุปสมบทไม่น้อยกว่า 60 วัน', type: 'warning', checkAdvanceSubmit: 60 },
    ],
    submitRule: 'ต้องเสนอใบลาก่อนวันอุปสมบทไม่น้อยกว่า 60 วัน',
  },
  HAJJ: {
    title: 'ระเบียบการลาไปประกอบพิธีฮัจย์',
    reference: 'ข้อ 28 - 30',
    maxDays: 120,
    rules: [
      'ต้องออกเดินทางไปประกอบพิธีฮัจย์ภายใน 10 วัน นับแต่วันเริ่มลา',
      'เมื่อเดินทางกลับแล้ว ต้องกลับมารายงานตัวภายใน 5 วัน',
      'ต้องเสนอใบลาก่อนวันประกอบพิธีฮัจย์ไม่น้อยกว่า 60 วัน',
    ],
    warnings: [
      { condition: 0, message: 'ต้องเสนอใบลาก่อนวันประกอบพิธีฮัจย์ไม่น้อยกว่า 60 วัน', type: 'warning', checkAdvanceSubmit: 60 },
    ],
    submitRule: 'ต้องเสนอใบลาก่อนวันประกอบพิธีฮัจย์ไม่น้อยกว่า 60 วัน',
  },
  MILITARY: {
    title: 'ระเบียบการลาเข้ารับการตรวจเลือก/เตรียมพล',
    reference: 'ข้อ 31 - 32',
    maxDays: null,
    rules: [
      'ต้องเป็นผู้ได้รับหมายเรียกเข้ารับการตรวจเลือก',
      'กรณีตรวจเลือก: รายงานลาต่อผู้บังคับบัญชาก่อนไม่น้อยกว่า 48 ชั่วโมง',
      'กรณีเตรียมพล: รายงานลาภายใน 48 ชั่วโมง นับแต่เวลารับหมายเรียก',
      'เมื่อพ้นจากการตรวจเลือก ให้มารายงานตัวภายใน 7 วัน (ขยายได้ไม่เกิน 15 วัน)',
    ],
    warnings: [],
    submitRule: 'รายงานลาต่อผู้บังคับบัญชาก่อนวันเข้ารับการตรวจเลือกไม่น้อยกว่า 48 ชั่วโมง',
    requireDocument: true,
    requiredDocuments: ['หมายเรียกเข้ารับการตรวจเลือก/เตรียมพล'],
  },
  LATE: {
    title: 'การมาสาย',
    reference: '-',
    rules: [
      'บันทึกการมาสายเพื่อใช้ประกอบการพิจารณาประเมินผลงาน',
    ],
    warnings: [],
    submitRule: 'บันทึกเพื่อรายงานการมาสาย',
  },
  ABSENT: {
    title: 'การขาดราชการ',
    reference: '-',
    rules: [
      'ขาดราชการติดต่อกันเกิน 15 วัน โดยไม่มีเหตุผลอันสมควร จะถูกพิจารณาให้ออกจากราชการ',
    ],
    warnings: [
      { condition: 10, message: 'ใกล้ครบ 15 วัน อาจถูกพิจารณาให้ออกจากราชการ', type: 'warning' },
      { condition: 15, message: 'ขาดราชการเกิน 15 วันติดต่อกัน จะถูกพิจารณาให้ออกจากราชการ', type: 'danger' },
    ],
    submitRule: 'บันทึกเพื่อรายงานการขาดราชการ',
  },
};

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
    actingPersonId: null,
  });

  const [files, setFiles] = useState([]);

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

      console.log('Leave Types:', typesRes);

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
    // Sanitize text input to prevent XSS
    const sanitizedValue = sanitizeString(value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  // Handle calendar date selection
  const handleCalendarChange = (newDates) => {
    // สำหรับลาช่วยภรรยาคลอดบุตร - เลือก 1 วัน แล้วคำนวณ 15 วันทำการอัตโนมัติ
    if (selectedLeaveType?.type_code === 'PATERNITY') {
      // หาวันที่ถูกเพิ่มใหม่ (ถ้ามี)
      const addedDate = newDates.find(d => !formData.selectedDates.includes(d));
      if (addedDate) {
        // คำนวณ 15 วันทำการจากวันที่เลือก
        const calculatedDates = calculate15WorkingDays(addedDate);
        setFormData(prev => ({
          ...prev,
          selectedDates: calculatedDates,
          totalDays: 15
        }));
        return;
      }
      // ถ้าคลิกเพื่อยกเลิก ให้ล้างทั้งหมด
      if (newDates.length < formData.selectedDates.length) {
        setFormData(prev => ({
          ...prev,
          selectedDates: [],
          totalDays: 0
        }));
        return;
      }
    }

    // สำหรับประเภทอื่นๆ - เลือกได้หลายวันอิสระ
    setFormData(prev => ({
      ...prev,
      selectedDates: newDates,
      totalDays: newDates.length
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

    // ดึงกฎของประเภทที่เลือก
    const leaveRules = selectedLeaveType?.type_code ? LEAVE_RULES[selectedLeaveType.type_code] : null;

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

    // ⚠️ เฉพาะลาพักผ่อน (VACATION) ต้องใส่ผู้ปฏิบัติหน้าที่แทน
    if (selectedLeaveType?.type_code === 'VACATION' && !formData.actingPersonId) {
      toast.error('กรุณาเลือกผู้ปฏิบัติหน้าที่แทน (สำหรับลาพักผ่อนต้องระบุ)');
      return;
    }

    // ✅ ตรวจสอบเอกสารที่ต้องแนบตามระเบียบ
    // ลาป่วยตั้งแต่ 30 วันขึ้นไป ต้องแนบใบรับรองแพทย์
    if (selectedLeaveType?.type_code === 'SICK' && formData.totalDays >= 30 && files.length === 0) {
      toast.error('ลาป่วยตั้งแต่ 30 วันขึ้นไป ต้องแนบใบรับรองแพทย์');
      return;
    }

    // ลาช่วยภริยาคลอดบุตร ต้องแนบสำเนาทะเบียนสมรส+สูติบัตร
    if (selectedLeaveType?.type_code === 'PATERNITY' && files.length === 0) {
      toast.error('กรุณาแนบสำเนาทะเบียนสมรส และสำเนาสูติบัตร');
      return;
    }

    // ลาตรวจเลือก/เตรียมพล ต้องแนบหมายเรียก
    if (selectedLeaveType?.type_code === 'MILITARY' && files.length === 0) {
      toast.error('กรุณาแนบหมายเรียกเข้ารับการตรวจเลือก/เตรียมพล');
      return;
    }

    // ✅ ตรวจสอบวันที่เสนอใบลาล่วงหน้า (สำหรับลาอุปสมบท/ฮัจย์)
    if (['ORDINATION', 'HAJJ'].includes(selectedLeaveType?.type_code) && formData.selectedDates.length > 0) {
      const firstDate = new Date(formData.selectedDates[0] + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysInAdvance = Math.ceil((firstDate - today) / (1000 * 60 * 60 * 24));

      if (daysInAdvance < 60) {
        const confirmSubmit = window.confirm(
          `⚠️ คำเตือน: ตามระเบียบต้องเสนอใบลาก่อนวัน${selectedLeaveType.type_code === 'ORDINATION' ? 'อุปสมบท' : 'ประกอบพิธีฮัจย์'}ไม่น้อยกว่า 60 วัน\n\nท่านเสนอใบลาล่วงหน้าเพียง ${daysInAdvance} วัน\n\nต้องการดำเนินการต่อหรือไม่?`
        );
        if (!confirmSubmit) return;
      }
    }

    // ✅ แจ้งเตือนกรณีลาป่วยเกินเกณฑ์เลื่อนเงินเดือน
    if (selectedLeaveType?.type_code === 'SICK' && formData.totalDays > 23) {
      const confirmSubmit = window.confirm(
        `⚠️ คำเตือน: ท่านลาป่วย ${formData.totalDays} วัน\n\nตามเกณฑ์การเลื่อนเงินเดือน ลากิจ+ลาป่วย รวมกันต้องไม่เกิน 23 วัน/รอบประเมิน\n\nหากลาเกินเกณฑ์อาจกระทบต่อการเลื่อนเงินเดือน\n\nต้องการดำเนินการต่อหรือไม่?`
      );
      if (!confirmSubmit) return;
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

  // ฟังก์ชันคำนวณ 15 วันทำการ (ไม่นับเสาร์อาทิตย์)
  const calculate15WorkingDays = (startDateStr) => {
    const dates = [];
    let currentDate = new Date(startDateStr + 'T00:00:00');
    let workingDays = 0;

    while (workingDays < 15) {
      const dayOfWeek = currentDate.getDay();
      // 0 = อาทิตย์, 6 = เสาร์
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dates.push(dateStr);
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // ตรวจสอบว่าวันที่เลือกเป็นวันติดต่อกันหรือไม่ (สำหรับ ABSENT)
  const checkConsecutiveDays = (dates) => {
    if (dates.length < 2) return dates.length;
    const sorted = [...dates].sort();
    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1] + 'T00:00:00');
      const currDate = new Date(sorted[i] + 'T00:00:00');
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    return maxConsecutive;
  };

  // เมื่อเลือกประเภทลาช่วยภรรยาคลอดบุตร ให้ reset วันที่
  const handleLeaveTypeChange = (e) => {
    const { value } = e.target;
    const selectedType = leaveTypes.find(t => t.id === value);

    setFormData(prev => ({
      ...prev,
      leaveTypeId: value,
      // Reset วันที่ถ้าเปลี่ยนประเภท
      selectedDates: [],
      totalDays: 0
    }));
  };

  // สำหรับ PATERNITY: เลือกวันเริ่มต้นแล้วคำนวณอัตโนมัติ
  const handlePaternityStartDate = (e) => {
    const startDate = e.target.value;
    if (!startDate) return;

    const dates = calculate15WorkingDays(startDate);
    setFormData(prev => ({
      ...prev,
      selectedDates: dates,
      totalDays: 15
    }));
    setTempDate('');
  };

  // ตรวจสอบว่าเป็นประเภท PATERNITY หรือไม่
  const isPaternityLeave = selectedLeaveType?.type_code === 'PATERNITY';
  const isAbsentLeave = selectedLeaveType?.type_code === 'ABSENT';
  const consecutiveDays = checkConsecutiveDays(formData.selectedDates);

  // ดึงระเบียบการลาของประเภทที่เลือก
  const currentLeaveRules = selectedLeaveType?.type_code ? LEAVE_RULES[selectedLeaveType.type_code] : null;

  // ฟังก์ชันตรวจสอบคำเตือนตามจำนวนวันลา
  const getActiveWarnings = () => {
    if (!currentLeaveRules?.warnings || formData.totalDays === 0) return [];

    return currentLeaveRules.warnings.filter(warning => {
      if (warning.checkAdvanceSubmit) {
        // ตรวจสอบว่าเสนอใบลาล่วงหน้าเพียงพอหรือไม่
        if (formData.selectedDates.length > 0) {
          const firstDate = new Date(formData.selectedDates[0] + 'T00:00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysInAdvance = Math.ceil((firstDate - today) / (1000 * 60 * 60 * 24));
          return daysInAdvance < warning.checkAdvanceSubmit;
        }
        return false;
      }
      return formData.totalDays >= warning.condition;
    });
  };

  const activeWarnings = getActiveWarnings();

  // ตรวจสอบว่าต้องแนบเอกสารหรือไม่
  const checkDocumentRequired = () => {
    if (!currentLeaveRules) return { required: false, message: '' };

    // ลาป่วยเกิน 30 วัน ต้องมีใบรับรองแพทย์
    if (selectedLeaveType?.type_code === 'SICK' && formData.totalDays >= 30) {
      return { required: true, message: 'ต้องแนบใบรับรองแพทย์ (ลาป่วยตั้งแต่ 30 วันขึ้นไป)' };
    }

    // ประเภทที่ต้องแนบเอกสาร
    if (currentLeaveRules.requireDocument) {
      return {
        required: true,
        message: `ต้องแนบเอกสาร: ${currentLeaveRules.requiredDocuments?.join(', ') || 'เอกสารประกอบ'}`
      };
    }

    return { required: false, message: '' };
  };

  const documentRequirement = checkDocumentRequired();

  return (
    <>
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
          <Card className="mb-6 bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">วันลาคงเหลือของคุณ</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-gray-100 shdaow-sm sm:shadow-none">
                  <p className="text-sm text-gray-600">ลาป่วย (ป)</p>
                  <p className="text-base font-semibold text-gray-900">
                    ลามาแล้ว {leaveBalance.sick || 0} วัน
                  </p>
                </div>
                <div className="text-center p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-gray-100 shdaow-sm sm:shadow-none">
                  <p className="text-sm text-gray-600">ลาพักผ่อน (พ)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaveBalance.vacation || 0} วัน
                  </p>
                </div>
                <div className="text-center p-3 sm:p-0 bg-white sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-gray-100 shdaow-sm sm:shadow-none">
                  <p className="text-sm text-gray-600">ลากิจ (ก)</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  onChange={handleLeaveTypeChange}
                  className={`input-field ${!formData.leaveTypeId ? 'text-black' : 'text-black'
                    }`}
                  required
                >
                  <option value="" disabled>
                    -- เลือกประเภทการลา --
                  </option>

                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {LEAVE_TYPE_NAMES[type.type_name_th] || type.type_name_th}
                    </option>
                  ))}
                </select>
                {selectedLeaveType?.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedLeaveType.description}
                  </p>
                )}

                {/* 📋 กล่องแสดงระเบียบการลา */}
                {currentLeaveRules && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-800">{currentLeaveRules.title}</h4>
                      {currentLeaveRules.maxDays && (
                        <span className="ml-auto px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                          สิทธิ์: {currentLeaveRules.maxDays} วัน
                        </span>
                      )}
                    </div>

                    {/* รายการกฎ */}
                    <ul className="space-y-1.5 mb-3">
                      {currentLeaveRules.rules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>

                    {/* การเสนอใบลา */}
                    {currentLeaveRules.submitRule && (
                      <div className="p-2 bg-gray-100 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">📝 การเสนอใบลา:</span> {currentLeaveRules.submitRule}
                        </p>
                      </div>
                    )}

                    {/* หมายเหตุเกณฑ์เลื่อนเงินเดือน */}
                    {currentLeaveRules.salaryNote && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 font-medium">{currentLeaveRules.salaryNote}</p>
                      </div>
                    )}

                    {/* เอกสารที่ต้องแนบ */}
                    {currentLeaveRules.requiredDocuments && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <span className="font-semibold">📎 เอกสารที่ต้องแนบ:</span> {currentLeaveRules.requiredDocuments.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isPaternityLeave ? 'เลือกวันเริ่มต้นลา' : 'เลือกวันที่ลา'} <span className="text-red-500">*</span>
                </label>

                <div>
                  <p className="mb-3 text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {isPaternityLeave ? (
                      <span>คลิกเลือกวันเริ่มต้น ระบบจะคำนวณ 15 วันทำการติดต่อกันให้อัตโนมัติ (ไม่นับเสาร์-อาทิตย์)</span>
                    ) : (
                      <>
                        คลิกที่วันในปฏิทินเพื่อเลือกหรือยกเลิก (เลือกได้หลายวัน)
                        {selectedLeaveType?.type_code === 'SICK' && (
                          <span className="text-gray-600">(ลาป่วยสามารถเลือกวันย้อนหลังได้ไม่เกิน 30 วัน)</span>
                        )}
                      </>
                    )}
                  </p>
                  <CalendarPicker
                    selectedDates={formData.selectedDates}
                    onChange={handleCalendarChange}
                    showWeekends={true}
                    allowPastDates={selectedLeaveType?.type_code === 'SICK'}
                    maxPastDays={30}
                  />
                </div>

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

                {/* 🔔 คำเตือนตามระเบียบการลา */}
                {activeWarnings.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {activeWarnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${warning.type === 'danger'
                          ? 'bg-red-50 border-red-400'
                          : warning.type === 'warning'
                            ? 'bg-amber-50 border-amber-400'
                            : 'bg-blue-50 border-blue-300'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.type === 'danger' ? 'text-red-600' : warning.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                          <div>
                            <p className={`text-sm font-semibold ${warning.type === 'danger' ? 'text-red-900' : warning.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                              }`}>
                              {warning.type === 'danger' ? '🚨 คำเตือนสำคัญ' : warning.type === 'warning' ? '⚠️ คำเตือน' : 'ℹ️ ข้อมูล'}
                            </p>
                            <p className={`text-sm ${warning.type === 'danger' ? 'text-red-800' : warning.type === 'warning' ? 'text-amber-800' : 'text-blue-800'
                              }`}>
                              {warning.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 📎 แจ้งเตือนเอกสารที่ต้องแนบ */}
                {documentRequirement.required && (
                  <div className="mt-4 p-4 bg-orange-50 border-2 border-orange-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900">📎 ต้องแนบเอกสารประกอบ</p>
                        <p className="text-sm text-orange-800">{documentRequirement.message}</p>
                        {files.length === 0 && (
                          <p className="text-sm text-red-600 font-semibold mt-1">
                            ⚠️ ยังไม่ได้แนบเอกสาร กรุณาแนบเอกสารด้านล่าง
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning for sick leave > 15 days */}
                {selectedLeaveType?.type_code === 'SICK' && formData.totalDays > 15 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 mb-1">
                          ⚠️ คำเตือน: ลาป่วยเกิน 15 วัน
                        </p>
                        <p className="text-sm text-yellow-800">
                          ท่านลาป่วย <span className="font-bold">{formData.totalDays} วัน</span> ซึ่งเกิน 15 วัน
                          <br />
                          <span className="font-semibold">วันที่ {formData.totalDays - 15} วัน ที่เกินจะไม่ได้รับการพิจารณาเงินเดือน</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ⚠️ คำเตือน: ขาดราชการเกิน 15 วันติดต่อกัน */}
                {isAbsentLeave && consecutiveDays >= 15 && (
                  <div className="mt-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <p className="text-base font-bold text-red-900 mb-2">
                          🚨 คำเตือนร้ายแรง: ขาดราชการเกิน 15 วันติดต่อกัน
                        </p>
                        <p className="text-sm text-red-800 mb-2">
                          ท่านขาดราชการ <span className="font-bold text-red-900">{consecutiveDays} วันติดต่อกัน</span>
                        </p>
                        <div className="p-3 bg-red-100 rounded-md">
                          <p className="text-sm font-bold text-red-900">
                            ⚖️ ตามระเบียบราชการ: หากขาดราชการติดต่อกันเกิน 15 วันโดยไม่มีเหตุผลอันสมควร
                            <br />
                            <span className="text-red-700">จะถูกพิจารณาให้ออกจากราชการทันที</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* แสดงคำเตือนเบื้องต้นสำหรับขาดราชการ */}
                {isAbsentLeave && consecutiveDays >= 10 && consecutiveDays < 15 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-300 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900 mb-1">
                          ⚠️ คำเตือน: ขาดราชการใกล้ครบ 15 วัน
                        </p>
                        <p className="text-sm text-orange-800">
                          ท่านขาดราชการ <span className="font-bold">{consecutiveDays} วันติดต่อกัน</span> แล้ว
                          <br />
                          เหลืออีก <span className="font-bold text-orange-900">{15 - consecutiveDays} วัน</span> จะถูกพิจารณาให้ออกจากราชการ
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Acting Person - บังคับเฉพาะลาพักผ่อน */}
              {selectedLeaveType?.type_code === 'VACATION' ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <ActingPersonSelect
                    value={formData.actingPersonId}
                    onChange={(value) => setFormData(prev => ({ ...prev, actingPersonId: value }))}
                    required={true}
                  />
                  <p className="mt-2 text-sm text-gray-700">
                    ⚠️ <span className="font-semibold">การลาพักผ่อนต้องระบุผู้ปฏิบัติหน้าที่แทน</span>
                  </p>
                </div>
              ) : (
                <ActingPersonSelect
                  value={formData.actingPersonId}
                  onChange={(value) => setFormData(prev => ({ ...prev, actingPersonId: value }))}
                  required={false}
                />
              )}

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
    </>
  );
};
