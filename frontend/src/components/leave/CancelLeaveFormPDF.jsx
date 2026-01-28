import { useRef, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * ฟอร์มใบขอยกเลิกวันลา สำหรับ Download PDF
 * ยึดตามแบบฟอร์มราชการ
 */
export const CancelLeaveFormPDF = forwardRef(({ leave, user }, ref) => {
  const formRef = useRef();

  // แปลงวันที่เป็นภาษาไทย
  const formatThaiDate = (dateStr) => {
    if (!dateStr) return { day: '', month: '', year: '' };
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return { day, month: months[date.getMonth()], year: date.getFullYear() + 543 };
  };

  const startDate = formatThaiDate(leave?.startDate || leave?.start_date || leave?.selectedDates?.[0] || leave?.selected_dates?.[0]);
  const endDate = formatThaiDate(leave?.endDate || leave?.end_date || leave?.selectedDates?.slice(-1)[0] || leave?.selected_dates?.slice(-1)[0]);

  const getLeaveTypeName = () => {
    const lt = leave?.leaveType;
    if (typeof lt === 'object' && lt !== null) return lt.name || lt.type_name || lt.type_name_th || '';
    if (typeof lt === 'string') return lt;
    return leave?.leaveTypes?.typeName || leave?.leave_types?.type_name_th || leave?.leave_types?.type_name || '';
  };

  const leaveTypeName = getLeaveTypeName();
  const totalDays = leave?.totalDays || leave?.total_days || '';
  const cancelReason = leave?.cancelledReason || leave?.cancelled_reason || '';
  const fullName = user?.fullName || (user?.firstName ? `${user?.title || ''}${user?.firstName} ${user?.lastName || ''}`.trim() : '') ||
    (leave?.users?.first_name ? `${leave.users.first_name} ${leave.users.last_name}` : '');
  const position = user?.position || leave?.users?.position || '';
  const department = user?.department || leave?.users?.department || '';

  // ฟังก์ชันดาวน์โหลด PDF
  const downloadPDF = async () => {
    const element = formRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // เพิ่มความคมชัด
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      pdf.save(`ใบยกเลิกวันลา_${leave?.leaveNumber || leave?.leave_number || 'form'}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  // Expose downloadPDF to parent
  useImperativeHandle(ref, () => ({
    downloadPDF
  }));

  const Line = ({ width = 80, children }) => (
    <span style={{ 
      borderBottom: '1px solid #000', 
      display: 'inline-block', 
      minWidth: `${width}px`,
      textAlign: 'center',
      paddingBottom: '2px',
      marginLeft: '3px',
      marginRight: '3px'
    }}>{children || '\u00A0'}</span>
  );

  const FullLine = ({ children }) => (
    <div style={{ 
      borderBottom: '1px solid #000', 
      width: '100%',
      minHeight: '22px',
      marginBottom: '5px'
    }}>{children || '\u00A0'}</div>
  );

  const SignatureLine = ({ width = 140, children }) => (
    <span style={{ 
      borderBottom: '1px solid #000', 
      display: 'inline-block', 
      width: `${width}px`,
      textAlign: 'center',
      paddingBottom: '2px'
    }}>{children || '\u00A0'}</span>
  );

  if (!leave) return null;

  return (
    <div 
      ref={formRef}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 20mm',
        backgroundColor: '#fff',
        fontFamily: 'TH Sarabun New, Sarabun, serif',
        fontSize: '12pt',
        lineHeight: '1.6',
        color: '#000',
        boxSizing: 'border-box'
      }}
    >
      {/* หัวเรื่อง */}
      <div style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', marginBottom: '15px' }}>
        แบบใบขอยกเลิกวันลา
      </div>

      {/* เขียนที่ / วันที่ */}
      <div style={{ textAlign: 'right', marginBottom: '15px' }}>
        <div>เขียนที่ <Line width={200}></Line></div>
        <div>วันที่ <Line width={40}></Line> เดือน <Line width={120}></Line> พ.ศ. <Line width={60}></Line></div>
      </div>

      {/* เรื่อง */}
      <div style={{ marginBottom: '5px' }}>
        <strong>เรื่อง</strong> <Line width={300}></Line>
      </div>

      {/* เรียน */}
      <div style={{ marginBottom: '15px' }}>
        <strong>เรียน</strong> <Line width={300}></Line>
      </div>

      {/* เนื้อหา */}
      <div style={{ textIndent: '50px', marginBottom: '5px' }}>
        ตามที่ข้าพเจ้า <Line width={200}>{fullName}</Line> ตำแหน่ง <Line width={220}>{position}</Line>
      </div>
      <div style={{ marginBottom: '5px' }}>
        สังกัด <Line width={590}>{department}</Line>
      </div>
      <div style={{ marginBottom: '5px' }}>
        ได้รับอนุญาตให้ลา <Line width={150}>{leaveTypeName}</Line> ตั้งแต่วันที่ <Line width={277}>{startDate.day}</Line>
      </div>
      <div style={{ marginBottom: '5px' }}>
        ถึงวันที่ <Line width={400}>{`${endDate.day} เดือน ${endDate.month} พ.ศ. ${endDate.year}`}</Line> รวม <Line width={95}>{totalDays}</Line> วัน นั้น
      </div>
      <div style={{ textIndent: '50px', marginBottom: '15px' }}>
        เนื่องจาก <Line width={522}>{cancelReason}</Line>
      </div>

      {/* ขอยกเลิก */}
      <div style={{ marginBottom: '5px' }}>
        จึงขอยกเลิกวันลา <Line width={360}>{leaveTypeName}</Line> จำนวน <Line width={70}>{totalDays}</Line> วัน
      </div>
      <div style={{ marginBottom: '20px' }}>
        ตั้งแต่วันที่ <Line width={250}>{`${startDate.day} ${startDate.month} ${startDate.year}`}</Line> ถึงวันที่ <Line width={250}>{`${endDate.day} ${endDate.month} ${endDate.year}`}</Line>
      </div>

      {/* ลงชื่อ */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        <div>ขอแสดงความนับถือ</div>
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 260 }}>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>(ลงชื่อ)</span>
            <SignatureLine width={140}></SignatureLine>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, marginBottom: 0 }}>
            <span style={{ minWidth: 60 }}></span>
            <span style={{ minWidth: 140, textAlign: 'center', marginBottom: 0 }}>( {fullName} )</span>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 0 }}>
            <span style={{ minWidth: 60 }}></span>
            <SignatureLine width={140}></SignatureLine>
          </div>
        </div>
      </div>

      

      {/* ความเห็นผู้บังคับบัญชา */}
      <div style={{ marginBottom: '10px' }}>
        <strong>ความเห็นผู้บังคับบัญชา</strong> (หัวหน้างานหรือหัวหน้าฝ่าย)
      </div>
      <FullLine />
      <FullLine />
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 260 }}>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>(ลงชื่อ)</span>
            <SignatureLine width={140}></SignatureLine>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>ตำแหน่ง</span>
            <Line width={140}></Line>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>วันที่</span>
            <Line width={30}></Line>/<Line width={30}></Line>/<Line width={50}></Line>
          </div>
        </div>
      </div>

     

      {/* คำสั่ง */}
      <div style={{ marginBottom: '10px' }}>
        <strong>คำสั่ง</strong>
      </div>
      <div style={{ marginLeft: '30px', marginBottom: '10px' }}>
        ( &nbsp;&nbsp; ) อนุญาต &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp;&nbsp; ) ไม่อนุญาต
      </div>
      <FullLine />
      <FullLine />
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 260 }}>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>(ลงชื่อ)</span>
            <SignatureLine width={140}></SignatureLine>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>ตำแหน่ง</span>
            <Line width={140}></Line>
          </div>
          <div style={{ minWidth: 220, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <span style={{ minWidth: 60, textAlign: 'right' }}>วันที่</span>
            <Line width={30}></Line>/<Line width={30}></Line>/<Line width={50}></Line>
          </div>
        </div>
      </div>
    </div>
  );
});

CancelLeaveFormPDF.displayName = 'CancelLeaveFormPDF';

export default CancelLeaveFormPDF;
