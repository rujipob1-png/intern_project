import { forwardRef } from 'react';

/**
 * ฟอร์มใบขอยกเลิกวันลา สำหรับปริ้น - รูปแบบทางการราชการ A4 หน้าเดียว
 */
export const PrintCancelLeaveForm = forwardRef(({ leave, user }, ref) => {
  if (!leave) {
    return null;
  }

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

  return (
    <div ref={ref} className="print-form hidden print:block">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 0; }
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              height: auto !important;
              overflow: visible !important;
            }
            body * { visibility: hidden !important; }
            .print-form, .print-form * { visibility: visible !important; }
            .print-form {
              display: block !important;
              position: fixed !important;
              left: 0 !important; 
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              padding: 15mm 20mm !important;
              margin: 0 !important;
              background: white !important;
              color: #000 !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
          }
          .print-form {
            font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
            font-size: 16pt;
            line-height: 1.6;
            color: #000;
          }
          .title { text-align: center; font-size: 20pt; font-weight: bold; margin-bottom: 15px; }
          .right { text-align: right; margin-bottom: 10px; }
          .row { margin-bottom: 5px; }
          .u { border-bottom: 1px solid #000; display: inline-block; min-width: 80px; text-align: center; }
          .u-lg { min-width: 150px; }
          .u-xl { min-width: 220px; }
          .u-full { border-bottom: 1px solid #000; display: block; width: 100%; min-height: 20px; }
          .sig { border-bottom: 1px solid #000; display: inline-block; width: 150px; }
          .sig-box { text-align: center; }
          .sig-right { display: flex; justify-content: flex-end; }
          .hr { border-bottom: 1px solid #000; margin: 12px 0; }
          .indent { text-indent: 40px; }
          .cb { margin-left: 20px; }
          .mt10 { margin-top: 20px; }
        `}
      </style>

      <div className="title">แบบใบขอยกเลิกวันลา</div>

      <div className="right">
        <div>เขียนที่ <span className="u u-xl"></span></div>
        <div>วันที่ <span className="u"></span> เดือน <span className="u u-lg"></span> พ.ศ. <span className="u"></span></div>
      </div>

      <div className="row"><strong>เรื่อง</strong> ขอยกเลิกวันลา</div>
      <div className="row"><strong>เรียน</strong> <span className="u u-xl"></span></div>

      <div className="row indent">ตามที่ข้าพเจ้า <span className="u u-xl">{fullName}</span> ตำแหน่ง <span className="u u-lg">{position}</span></div>
      <div className="row">สังกัด <span className="u u-xl">{department}</span></div>
      <div className="row">ได้รับอนุญาตให้ลา <span className="u u-lg">{leaveTypeName}</span> ตั้งแต่วันที่ <span className="u">{startDate.day}</span> เดือน <span className="u u-lg">{startDate.month}</span> พ.ศ. <span className="u">{startDate.year}</span></div>
      <div className="row">ถึงวันที่ <span className="u">{endDate.day}</span> เดือน <span className="u u-lg">{endDate.month}</span> พ.ศ. <span className="u">{endDate.year}</span> รวม <span className="u">{totalDays}</span> วัน นั้น</div>
      <div className="row indent">เนื่องจาก <span className="u u-xl">{cancelReason}</span></div>

      <div className="row">จึงขอยกเลิกวันลา <span className="u u-lg">{leaveTypeName}</span> จำนวน <span className="u">{totalDays}</span> วัน</div>
      <div className="row">ตั้งแต่วันที่ <span className="u">{startDate.day}</span> เดือน <span className="u u-lg">{startDate.month}</span> พ.ศ. <span className="u">{startDate.year}</span> ถึงวันที่ <span className="u">{endDate.day}</span> เดือน <span className="u u-lg">{endDate.month}</span> พ.ศ. <span className="u">{endDate.year}</span></div>

      <div className="sig-box mt10">
        <div>ขอแสดงความนับถือ</div>
        <div style={{ marginTop: '25px' }}>
          <div>(ลงชื่อ) <span className="sig"></span></div>
          <div>( <span className="sig">{fullName}</span> )</div>
        </div>
      </div>

      <div className="hr"></div>

      <div className="row"><strong>ความเห็นผู้บังคับบัญชา</strong> (หัวหน้างานหรือหัวหน้าฝ่าย)</div>
      <div className="u-full"></div>
      <div className="sig-right">
        <div className="sig-box">
          <div>(ลงชื่อ) <span className="sig"></span></div>
          <div>( <span className="sig"></span> )</div>
          <div>ตำแหน่ง <span className="u u-lg"></span></div>
          <div>วันที่ <span className="u"></span>/<span className="u"></span>/<span className="u"></span></div>
        </div>
      </div>

      <div className="hr"></div>

      <div className="row"><strong>คำสั่ง</strong></div>
      <div className="cb">( &nbsp; ) อนุญาต &nbsp;&nbsp;&nbsp; ( &nbsp; ) ไม่อนุญาต</div>
      <div className="u-full"></div>
      <div className="sig-right">
        <div className="sig-box">
          <div>(ลงชื่อ) <span className="sig"></span></div>
          <div>( <span className="sig"></span> )</div>
          <div>ตำแหน่ง <span className="u u-lg"></span></div>
          <div>วันที่ <span className="u"></span>/<span className="u"></span>/<span className="u"></span></div>
        </div>
      </div>
    </div>
  );
});

PrintCancelLeaveForm.displayName = 'PrintCancelLeaveForm';

export default PrintCancelLeaveForm;
