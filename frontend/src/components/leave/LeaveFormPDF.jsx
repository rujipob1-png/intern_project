import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const LeaveFormPDF = forwardRef(({ leave, user }, ref) => {
  const formRef = useRef(null);

  // แปลงวันที่เป็นภาษาไทย
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return { day, month: months[date.getMonth()], year: date.getFullYear() + 543 };
  };

  // วันที่ปัจจุบัน
  const today = formatThaiDate(new Date().toISOString());
  
  // วันที่เริ่มและสิ้นสุด
  const startDate = formatThaiDate(leave?.startDate || leave?.start_date || leave?.selectedDates?.[0] || leave?.selected_dates?.[0]);
  const endDate = formatThaiDate(leave?.endDate || leave?.end_date || leave?.selectedDates?.slice(-1)[0] || leave?.selected_dates?.slice(-1)[0]);

  // ข้อมูลการลา
  const getLeaveTypeName = () => {
    const lt = leave?.leaveType;
    if (typeof lt === 'object' && lt !== null) return lt.name || lt.type_name || lt.type_name_th || '';
    if (typeof lt === 'string') return lt;
    return leave?.leaveTypes?.typeName || leave?.leave_types?.type_name_th || leave?.leave_types?.type_name || '';
  };

  const leaveTypeName = getLeaveTypeName();
  const leaveTypeId = leave?.leaveTypeId || leave?.leave_type_id || leave?.leaveType?.id || 0;
  const totalDays = leave?.totalDays || leave?.total_days || '';
  const reason = leave?.reason || '';
  const contactAddress = leave?.contactAddress || leave?.contact_address || '';
  const contactPhone = leave?.contactPhone || leave?.contact_phone || '';
  
  const fullName = user?.fullName || (user?.firstName ? `${user?.title || ''}${user?.firstName} ${user?.lastName || ''}`.trim() : '') ||
    (leave?.users?.first_name ? `${leave.users.first_name} ${leave.users.last_name}` : '');
  const position = user?.position || leave?.users?.position || '';
  const department = user?.department || leave?.users?.department || '';

  const downloadPDF = async () => {
    if (!formRef.current) return;

    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ใบลา_${leave?.id || 'form'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    downloadPDF,
  }));

  // ใช้เส้น solid แทน dotted เพราะ html2canvas รองรับดีกว่า
  const line = "border-bottom: 1px solid #000";
  
  const formHTML = `
    <div style="font-family: 'TH Sarabun New', 'Sarabun', sans-serif; font-size: 14px; line-height: 1.5; padding: 20px 30px; background: white;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 15px;">
        <div style="font-size: 18px; font-weight: bold;">แบบใบลาป่วย ลาคลอดบุตร ลากิจส่วนตัว</div>
      </div>

      <!-- เขียนที่ -->
      <div style="text-align: right; margin-bottom: 5px;">
        เขียนที่ <span style="display: inline-block; width: 200px; ${line};"></span>
      </div>
      
      <!-- วันที่ เดือน พ.ศ. -->
      <div style="text-align: right; margin-bottom: 10px;">
        วันที่ <span style="display: inline-block; width: 30px; ${line}; text-align: center;">${today.day}</span>
        เดือน <span style="display: inline-block; width: 80px; ${line}; text-align: center;">${today.month}</span>
        พ.ศ. <span style="display: inline-block; width: 50px; ${line}; text-align: center;">${today.year}</span>
      </div>

      <!-- เรื่อง -->
      <div style="margin-bottom: 5px;">
        เรื่อง <span style="display: inline-block; width: 500px; ${line};"></span>
      </div>

      <!-- เรียน -->
      <div style="margin-bottom: 5px;">
        เรียน <span style="display: inline-block; width: 500px; ${line};"></span>
      </div>

      <!-- ข้าพเจ้า -->
      <div style="margin-bottom: 5px;">
        <span style="margin-left: 40px;">ข้าพเจ้า</span>
        <span style="display: inline-block; width: 200px; ${line}; text-align: center;">${fullName}</span>
        ตำแหน่ง <span style="display: inline-block; width: 200px; ${line}; text-align: center;">${position}</span>
      </div>

      <!-- สังกัด -->
      <div style="margin-bottom: 5px;">
        สังกัด <span style="display: inline-block; width: 250px; ${line}; text-align: center;">${department}</span>
        ขอลา ( ${leaveTypeId === 1 ? '/' : ' '} ) ป่วย ( ${leaveTypeId === 3 ? '/' : ' '} ) กิจส่วนตัว ( ${leaveTypeId === 2 ? '/' : ' '} ) คลอดบุตร
      </div>

      <!-- เนื่องจาก -->
      <div style="margin-bottom: 5px;">
        เนื่องจาก <span style="display: inline-block; width: 280px; ${line};">${reason}</span>
        ตั้งแต่วันที่ <span style="display: inline-block; width: 30px; ${line}; text-align: center;">${startDate.day}</span>
        เดือน <span style="display: inline-block; width: 80px; ${line}; text-align: center;">${startDate.month}</span>
        พ.ศ. <span style="display: inline-block; width: 50px; ${line}; text-align: center;">${startDate.year}</span>
      </div>

      <!-- ถึงวันที่ -->
      <div style="margin-bottom: 5px;">
        ถึงวันที่ <span style="display: inline-block; width: 30px; ${line}; text-align: center;">${endDate.day}</span>
        เดือน <span style="display: inline-block; width: 80px; ${line}; text-align: center;">${endDate.month}</span>
        พ.ศ. <span style="display: inline-block; width: 50px; ${line}; text-align: center;">${endDate.year}</span>
      </div>

      <!-- มีกำหนดการ -->
      <div style="margin-bottom: 5px;">
        มีกำหนดการ <span style="display: inline-block; width: 40px; ${line}; text-align: center;">${totalDays}</span> วัน
        ข้าพเจ้าได้ลา ( ) ป่วย ( ) กิจส่วนตัว ( ) คลอดบุตร ครั้งสุดท้ายตั้งแต่
      </div>

      <!-- วันที่ลาครั้งก่อน -->
      <div style="margin-bottom: 5px;">
        วันที่ <span style="display: inline-block; width: 30px; ${line};"></span>
        เดือน <span style="display: inline-block; width: 80px; ${line};"></span>
        พ.ศ. <span style="display: inline-block; width: 50px; ${line};"></span>
        ถึงวันที่ <span style="display: inline-block; width: 30px; ${line};"></span>
        เดือน <span style="display: inline-block; width: 80px; ${line};"></span>
        พ.ศ. <span style="display: inline-block; width: 50px; ${line};"></span>
      </div>

      <!-- มีกำหนด วัน ใน -->
      <div style="margin-bottom: 5px;">
        <span style="margin-left: 250px;"></span>
        มีกำหนด <span style="display: inline-block; width: 40px; ${line};"></span> วัน ในระหว่างลา
      </div>

      <!-- จะติดต่อ -->
      <div style="margin-bottom: 15px;">
        จะติดต่อข้าพเจ้าได้ที่ <span style="display: inline-block; width: 450px; ${line};">${contactAddress} ${contactPhone}</span>
      </div>

      <!-- Two Column Section -->
      <div style="display: flex; gap: 20px;">
        <!-- Left Column -->
        <div style="width: 48%;">
          <!-- Statistics Table -->
          <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">สถิติการลาในปีงบประมาณนี้</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px;">
            <tr>
              <th style="border: 1px solid #000; padding: 4px; text-align: center;">ประเภทลา</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center;">ลามาแล้ว<br/>(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center;">ลาครั้งนี้<br/>(วันทำการ)</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center;">รวมเป็น</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 4px;">ป่วย</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 4px;">กิจส่วนตัว</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 4px;">คลอดบุตร</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;"></td>
            </tr>
          </table>

          <!-- ผู้ตรวจสอบ -->
          <div style="margin-bottom: 15px;">
            <div>(ลงชื่อ) <span style="display: inline-block; width: 130px; ${line};"></span> ผู้ตรวจสอบ</div>
            <div style="margin-left: 30px;">ตำแหน่ง <span style="display: inline-block; width: 130px; ${line};"></span></div>
            <div style="margin-left: 30px;">วันที่ <span style="display: inline-block; width: 140px; ${line};"></span></div>
          </div>

          <!-- บันทึกกลุ่มงานอำนวยการ -->
          <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">บันทึกกลุ่มงานอำนวยการ</div>
          <div style="margin-bottom: 3px; font-size: 13px;">
            ตั้งแต่ปีงบประมาณ <span style="display: inline-block; width: 60px; ${line};"></span> ผู้ลาได้ลาป่วยมาแล้ว
          </div>
          <div style="margin-bottom: 3px; font-size: 13px;">
            <span style="display: inline-block; width: 40px; ${line};"></span> ครั้ง รวม <span style="display: inline-block; width: 40px; ${line};"></span> วัน รวมครั้งนี้เป็นเวลา <span style="display: inline-block; width: 40px; ${line};"></span> วัน
          </div>
          <div style="margin-bottom: 3px; font-size: 13px;">
            ลากิจมาแล้ว <span style="display: inline-block; width: 40px; ${line};"></span> ครั้ง รวม <span style="display: inline-block; width: 40px; ${line};"></span> วัน รวมครั้งนี้เป็น
          </div>
          <div style="margin-bottom: 3px; font-size: 13px;">
            วันลา <span style="display: inline-block; width: 40px; ${line};"></span> วัน ลาคลอดบุตร <span style="display: inline-block; width: 40px; ${line};"></span> วัน
          </div>
          <div style="margin-bottom: 10px;"></div>
          <div style="margin-bottom: 3px;">(ลงชื่อ) <span style="display: inline-block; width: 130px; ${line};"></span> หัวหน้าฝ่ายบริหารทั่วไป</div>

          <!-- ความเห็นผู้บังเสนอ -->
          <div style="font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-decoration: underline;">ความเห็นผู้บังเสนอ</div>
          <div style="margin-bottom: 3px; font-size: 13px;">
            เห็นควรอนุญาตให้ลาได้ <span style="display: inline-block; width: 40px; ${line};"></span> วัน
          </div>
          <div style="margin-bottom: 3px;">(ลงชื่อ) <span style="display: inline-block; width: 130px; ${line};"></span></div>
          <div style="margin-left: 30px; font-size: 13px;">ผู้อำนวยการกลุ่มงานอำนวยการ วันที่ <span style="display: inline-block; width: 80px; ${line};"></span></div>
        </div>

        <!-- Right Column -->
        <div style="width: 52%;">
          <!-- ขอแสดงความนับถือ -->
          <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-weight: bold;">ขอแสดงความนับถือ</div>
            <div style="height: 40px;"></div>
            <div>(ลงชื่อ) <span style="display: inline-block; width: 150px; ${line};"></span></div>
            <div style="margin-top: 3px;">( <span style="display: inline-block; width: 150px; ${line}; text-align: center;">${fullName}</span> )</div>
            <div style="margin-top: 3px;">ตำแหน่ง <span style="display: inline-block; width: 150px; ${line};"></span></div>
          </div>

          <!-- ความเห็นผู้บังคับบัญชา -->
          <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">ความเห็นผู้บังคับบัญชา (ผอ.กลุ่มงาน/ผอ.สสจ.)</div>
          <div style="border: 1px solid #000; padding: 10px; min-height: 60px; margin-bottom: 10px;">
            <div style="${line}; height: 20px; margin-bottom: 5px;"></div>
            <div style="${line}; height: 20px; margin-bottom: 5px;"></div>
            <div style="text-align: right; margin-top: 10px;">
              <div>(ลงชื่อ) <span style="display: inline-block; width: 120px; ${line};"></span></div>
              <div style="margin-top: 3px;">ตำแหน่ง <span style="display: inline-block; width: 120px; ${line};"></span></div>
            </div>
          </div>

          <!-- คำสั่ง -->
          <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">คำสั่ง</div>
          <div style="margin-left: 20px; margin-bottom: 5px;">
            <div>( ) อนุญาต &nbsp;&nbsp;&nbsp;&nbsp; ( ) ไม่อนุญาต</div>
          </div>
          <div style="text-align: right; margin-top: 10px;">
            <div>(ลงชื่อ) <span style="display: inline-block; width: 120px; ${line};"></span></div>
            <div style="margin-top: 3px;">ตำแหน่ง <span style="display: inline-block; width: 120px; ${line};"></span></div>
            <div style="margin-top: 3px;">วันที่ <span style="display: inline-block; width: 30px; ${line};"></span> / <span style="display: inline-block; width: 30px; ${line};"></span> / <span style="display: inline-block; width: 40px; ${line};"></span></div>
          </div>
        </div>
      </div>
    </div>
  `;

  return (
    <div
      ref={formRef}
      style={{
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: 'white',
        color: 'black',
      }}
      dangerouslySetInnerHTML={{ __html: formHTML }}
    />
  );
});

LeaveFormPDF.displayName = 'LeaveFormPDF';

export { LeaveFormPDF };
export default LeaveFormPDF;
