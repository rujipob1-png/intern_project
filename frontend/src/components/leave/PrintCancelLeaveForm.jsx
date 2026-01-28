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
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return {
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear() + 543
    };
  };

  const startDate = formatThaiDate(
    leave?.startDate || leave?.start_date || leave?.selectedDates?.[0]
  );
  const endDate = formatThaiDate(
    leave?.endDate || leave?.end_date || leave?.selectedDates?.slice(-1)[0]
  );

  const getLeaveTypeName = () => {
    const lt = leave?.leaveType;
    if (typeof lt === 'object' && lt !== null)
      return lt.name || lt.type_name || lt.type_name_th || '';
    if (typeof lt === 'string') return lt;
    return (
      leave?.leaveTypes?.typeName ||
      leave?.leave_types?.type_name_th ||
      leave?.leave_types?.type_name ||
      ''
    );
  };

  const leaveTypeName = getLeaveTypeName();
  const totalDays = leave?.totalDays || leave?.total_days || '';
  const cancelReason = leave?.cancelledReason || leave?.cancelled_reason || '';

  const fullName =
    user?.fullName ||
    (user?.firstName
      ? `${user?.title || ''}${user?.firstName} ${user?.lastName || ''}`.trim()
      : '') ||
    (leave?.users?.first_name
      ? `${leave.users.first_name} ${leave.users.last_name}`
      : '');

  const position = user?.position || leave?.users?.position || '';
  const department = user?.department || leave?.users?.department || '';

  // Download PDF
  const downloadPDF = async () => {
    const element = formRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    pdf.save(`ใบยกเลิกวันลา_${leave?.leaveNumber || 'form'}.pdf`);
  };

  useImperativeHandle(ref, () => ({ downloadPDF }));

  const Line = ({ width = 80, children }) => (
    <span
      style={{
        borderBottom: '1px solid #000',
        display: 'inline-block',
        minWidth: `${width}px`,
        textAlign: 'center'
      }}
    >
      {children || '\u00A0'}
    </span>
  );

  if (!leave) return null;

  return (
    <div
      ref={formRef}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '15mm 20mm',
        fontFamily: 'TH Sarabun New, Sarabun, serif',
        fontSize: '12pt',
        lineHeight: 1.6,
        color: '#000'
      }}
    >
      <div style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold' }}>
        แบบใบขอยกเลิกวันลา
      </div>

      {/* เนื้อหา (ตัดให้สั้นเพื่อโฟกัสลายเซ็น) */}

      {/* ===== ลายเซ็น (แบบราชการจริง) ===== */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <div>ขอแสดงความนับถือ</div>

        <div style={{ marginTop: 20, display: 'inline-block', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 6 }}>(ลงชื่อ)</span>
            <span
              style={{
                display: 'inline-block',
                width: 240,
                borderBottom: '1px solid #000',
                height: '1.2em'
              }}
            />
          </div>

          <div style={{ marginLeft: 46, marginTop: 4 }}>
            <span
              style={{
                display: 'inline-block',
                minWidth: 240,
                textAlign: 'center',
                textDecoration: 'underline',
                textUnderlineOffset: '2px'
              }}
            >
              ( {fullName} )
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

CancelLeaveFormPDF.displayName = 'CancelLeaveFormPDF';
export default CancelLeaveFormPDF;
