import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const LeaveFormPDF = forwardRef(({ leave, user }, ref) => {
  const formRef = useRef(null);

  // แปลงวันที่เป็นภาษาไทย (แบบแยก วัน/เดือน/ปี)
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
    (leave?.users?.first_name ? `${leave.users.title || ''}${leave.users.first_name} ${leave.users.last_name}` : '');
  const position = user?.position || leave?.users?.position || '';
  // Mapping ตัวย่อสังกัดเป็นตัวย่อภาษาไทย
  const departmentMap = {
    'GOK': 'กอก.',
    'GYS': 'กยส.',
    'GTS': 'กทส.',
    'GTP': 'กตป.',
    'GSS': 'กสส.',
    'GKC': 'กคฐ.',
    // เพิ่ม mapping ตามต้องการ
  };
  const rawDepartment = user?.department_th || user?.department || leave?.users?.department_th || leave?.users?.department || '';
  const department = departmentMap[rawDepartment] || rawDepartment;

  // Checkbox helper
  const chk = (condition) => condition ? '✓' : '';

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

  // Underline style — dotted border for จุดไข่ปลา
  const U = "display:inline-block; border-bottom:1px dotted #000";
  // Table cell style
  const tc = "border:1px solid #000; padding:3px 5px";

  const formHTML = `
    <div style="font-family:'TH Sarabun New','Sarabun',serif; font-size:16px; line-height:2; padding:35px 45px; background:white; color:#000;">

      <!-- HEADER -->
      <div style="text-align:center; margin-bottom:6px;">
        <div style="font-size:22px; font-weight:bold;">แบบใบลาป่วย  ลาคลอดบุตร  ลากิจส่วนตัว</div>
      </div>

      <div style="text-align:right;">เขียนที่<span style="${U}; width:200px;">&nbsp;</span></div>
      <div style="text-align:right;">วันที่<span style="${U}; width:35px; text-align:center;">${today.day}</span>เดือน<span style="${U}; width:110px; text-align:center;">${today.month}</span>พ.ศ.<span style="${U}; width:55px; text-align:center;">${today.year}</span></div>

      <!-- BODY -->
      <div>เรื่อง<span style="${U}; width:220px;">&nbsp;</span></div>
      <div>เรียน<span style="${U}; width:220px;">&nbsp;</span></div>
      <div><span style="margin-left:45px;">ข้าพเจ้า</span><span style="${U}; width:270px; text-align:center;">${fullName}</span>ตำแหน่ง<span style="${U}; width:280px; text-align:center;">${position}</span></div>
      <div>สังกัด<span style="${U}; width:400px; text-align:center; padding-left:6px; padding-right:6px;">${department}</span>ขอลา ( ${chk(leaveTypeId === 1)} ) ป่วย ( ${chk(leaveTypeId === 3)} ) กิจส่วนตัว ( ${chk(leaveTypeId === 2)} ) คลอดบุตร</div>
      <div>เนื่องจาก<span style="${U}; width:200px; text-align:center;">${reason}</span>ตั้งแต่วันที่<span style="${U}; width:180px; text-align:center;">${startDate.day ? startDate.day+' '+startDate.month+' '+startDate.year : ''}</span>ถึงวันที่<span style="${U}; width:150px; text-align:center;">${endDate.day ? endDate.day+' '+endDate.month+' '+endDate.year : ''}</span></div>
      <div>มีกำหนดการ<span style="${U}; width:135px; text-align:center;">${totalDays}</span>วัน ข้าพเจ้าได้ลา ( ) ป่วย ( ) กิจส่วนตัว ( ) คลอดบุตร ครั้งสุดท้ายตั้งแต่</div>
      <div>
        วันที่<span style="${U}; width:190px;">&nbsp;</span>
        ถึงวันที่<span style="${U}; width:190px;">&nbsp;</span>
        มีกำหนด<span style="${U}; width:70px;">&nbsp;</span>วัน ในระหว่างลา</span>
      </div>
      <div style="margin-bottom:12px;">จะติดต่อข้าพเจ้าได้ที่<span style="${U}; width:560px;"><span style="margin-left:24px;">${contactAddress} ${contactPhone}</span></span></div>

      <!-- ===== TWO COLUMNS ===== -->
      <div style="display:flex; gap:18px;">

        <!-- LEFT COLUMN -->
        <div style="width:48%;">

          <div style="font-weight:bold; text-decoration:underline; font-size:15px; margin-bottom:3px;">สถิติการลาในปีงบประมาณนี้</div>
          <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px;">
            <tr>
              <th style="${tc}; text-align:center; font-weight:bold;" rowspan="2">ประเภทลา</th>
              <th style="${tc}; text-align:center; font-weight:bold;">ลามาแล้ว</th>
              <th style="${tc}; text-align:center; font-weight:bold;">ลาครั้งนี้</th>
              <th style="${tc}; text-align:center; font-weight:bold;" rowspan="2">รวมเป็น</th>
            </tr>
            <tr>
              <th style="${tc}; text-align:center; font-size:11px;">(วันทำการ)</th>
              <th style="${tc}; text-align:center; font-size:11px;">(วันทำการ)</th>
            </tr>
            <tr><td style="${tc};">ป่วย</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td></tr>
            <tr><td style="${tc};">กิจส่วนตัว</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td></tr>
            <tr><td style="${tc};">คลอดบุตร</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td><td style="${tc};">&nbsp;</td></tr>
          </table>

          <div>(ลงชื่อ)<span style="${U}; width:130px;">&nbsp;</span>ผู้ตรวจสอบ</div>
          <div style="margin-left:14px;">ตำแหน่ง<span style="${U}; width:140px;">&nbsp;</span></div>
          <div style="margin-left:14px; margin-bottom:6px;">วันที่<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:38px;">&nbsp;</span></div>

          <div style="font-weight:bold; text-decoration:underline; font-size:15px; margin-bottom:2px;">บันทึกกลุ่มงานอำนวยการ</div>
          <div style="font-size:14px; margin-left:18px;">ตั้งแต่ปีงบประมาณ<span style="${U}; width:50px;">&nbsp;</span>ผู้ลาได้ลาป่วยมาแล้ว</div>
          <div style="font-size:14px;"><span style="${U}; width:30px;">&nbsp;</span>ครั้ง รวม<span style="${U}; width:30px;">&nbsp;</span>วัน รวมครั้งนี้เป็นเวลา<span style="${U}; width:30px;">&nbsp;</span>วัน</div>
          <div style="font-size:14px;">ลากิจมาแล้ว<span style="${U}; width:30px;">&nbsp;</span>ครั้ง รวม<span style="${U}; width:30px;">&nbsp;</span>วัน รวมครั้งนี้เป็น</div>
          <div style="font-size:14px;">วันลา<span style="${U}; width:30px;">&nbsp;</span>วัน ลาคลอดบุตร<span style="${U}; width:30px;">&nbsp;</span>วัน</div>

          <div style="margin-top:6px;">(ลงชื่อ)<span style="${U}; width:130px;">&nbsp;</span>หัวหน้าฝ่ายบริหารทั่วไป</div>
          <div style="margin-left:14px; margin-bottom:6px;">วันที่<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:38px;">&nbsp;</span></div>

          <div style="font-weight:bold; text-decoration:underline; font-size:15px; margin-bottom:2px;">ความเห็นผู้นำเสนอ</div>
          <div style="font-size:14px; margin-left:18px;">เห็นควรอนุญาตให้ลาได้<span style="${U}; width:30px;">&nbsp;</span>วัน</div>
          <div style="white-space:nowrap;">(ลงชื่อ)<span style="${U}; width:100px;">&nbsp;</span>ผู้อำนวยการกลุ่มงานอำนวยการ</div>
          <div style="margin-left:14px;">วันที่<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:28px;">&nbsp;</span>/<span style="${U}; width:38px;">&nbsp;</span></div>

        </div>

        <!-- RIGHT COLUMN -->
        <div style="width:52%;">

          <div style="text-align:center; margin-bottom:10px;">
            <div style="font-weight:bold;">ขอแสดงความนับถือ</div>
            <div style="height:15px;"></div>
            <div>(ลงชื่อ)<span style="${U}; width:170px;">&nbsp;</span></div>
            <div><span style="display:inline-block; margin-left:32px;">(</span> <span style="${U}; width:170px; text-align:center;">${fullName}</span> )</div>
            <div>ตำแหน่ง<span style="${U}; width:170px;">&nbsp;</span></div>
          </div>

          <div style="font-weight:bold; text-decoration:underline; font-size:15px; margin-bottom:2px;">ความเห็นผู้บังคับบัญชา (ผอ.กลุ่มงาน/ผอ.สสจ.)</div>
          <div style="margin: 12px 0 0 0; display:block; border-bottom:1px dotted #000; width:100%; height:18px;"></div>
          <div style="display:block; border-bottom:1px dotted #000; width:100%; height:18px;"></div>
          <div style="height:15px;"></div>
          <div>(ลงชื่อ)<span style="display:inline-block; border-bottom:1px dotted #000; width:296px;">&nbsp;</span></div>
          <div>ตำแหน่ง<span style="display:inline-block; border-bottom:1px dotted #000; width:290px;">&nbsp;</span></div>
          <div>วันที่<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span>/<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span>/<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span></div>

          <div style="font-weight:bold; text-decoration:underline; font-size:15px; margin-top:10px; margin-bottom:2px;">คำสั่ง</div>
          <div style="margin-left:18px;">( &nbsp; ) อนุญาต &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp; ) ไม่อนุญาต</div>
          <div style="margin: 12px 0 0 0; display:block; border-bottom:1px dotted #000; width:100%; height:18px;"></div>
          <div style="display:block; border-bottom:1px dotted #000; width:100%; height:18px;"></div>
          <div style="height:10px;"></div>
          <div>(ลงชื่อ)<span style="display:inline-block; border-bottom:1px dotted #000; width:296px;">&nbsp;</span></div>
          <div>ตำแหน่ง<span style="display:inline-block; border-bottom:1px dotted #000; width:290px;">&nbsp;</span></div>
          <div>วันที่<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span>/<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span>/<span style="display:inline-block; border-bottom:1px dotted #000; width:50px;">&nbsp;</span></div>

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
