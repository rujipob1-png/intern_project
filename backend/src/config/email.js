/**
 * Email Configuration
 * ตั้งค่า SMTP สำหรับส่ง email notifications
 */

import nodemailer from 'nodemailer';

// Email configuration defaults
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
export function initializeEmailTransporter() {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
    console.warn('⚠️ Email credentials not configured. Email notifications disabled.');
    return null;
  }
  
  transporter = nodemailer.createTransport(EMAIL_CONFIG);
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter error:', error.message);
    } else {
      console.log('✅ Email transporter ready');
    }
  });
  
  return transporter;
}

/**
 * Get email transporter
 */
export function getTransporter() {
  if (!transporter) {
    initializeEmailTransporter();
  }
  return transporter;
}

/**
 * Email templates
 */
export const EmailTemplates = {
  /**
   * ใบลารอพิจารณา (สำหรับ Approver)
   */
  leaveRequestPending: (leave, requester, approverName) => ({
    subject: `[ระบบลา] ใบลาใหม่รอพิจารณา - ${requester.first_name} ${requester.last_name}`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">📋 ใบลาใหม่รอพิจารณา</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${approverName},</p>
          <p>มีใบลาใหม่รอการพิจารณาจาก <strong>${requester.first_name} ${requester.last_name}</strong></p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white; width: 30%;"><strong>ประเภทการลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>วันที่ลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>จำนวนวัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.total_days} วัน</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>เหตุผล</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.reason || '-'}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ดูรายละเอียด
            </a>
          </div>
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    `
  }),

  /**
   * ใบลาได้รับการอนุมัติ (สำหรับ Requester)
   */
  leaveApproved: (leave, requester) => ({
    subject: `[ระบบลา] ✅ ใบลาของคุณได้รับการอนุมัติแล้ว`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">✅ ใบลาได้รับการอนุมัติแล้ว</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${requester.first_name},</p>
          <p>ใบลาของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white; width: 30%;"><strong>ประเภทการลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>วันที่ลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>จำนวนวัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.total_days} วัน</td>
            </tr>
          </table>
          
          <p style="color: #059669;">🎉 ขอให้มีความสุขในช่วงวันลาของคุณ!</p>
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    `
  }),

  /**
   * ใบลาถูกปฏิเสธ (สำหรับ Requester)
   */
  leaveRejected: (leave, requester, rejectReason, rejecterName) => ({
    subject: `[ระบบลา] ❌ ใบลาของคุณไม่ได้รับการอนุมัติ`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #EF4444; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">❌ ใบลาไม่ได้รับการอนุมัติ</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${requester.first_name},</p>
          <p>ใบลาของคุณไม่ได้รับการอนุมัติ</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white; width: 30%;"><strong>เลขที่ใบลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>ประเภทการลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>วันที่ลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>จำนวนวัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.total_days} วัน</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>ผู้พิจารณา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${rejecterName || 'ไม่ระบุ'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>เหตุผลที่ไม่อนุมัติ</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: #FEE2E2; color: #DC2626;">${rejectReason || 'ไม่ระบุ'}</td>
            </tr>
          </table>
          
          <p>หากมีข้อสงสัย กรุณาติดต่อ ผอ. กลุ่มงานของท่าน</p>
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    `
  }),

  /**
   * แจ้งเตือนผู้ปฏิบัติหน้าที่แทน
   */
  actingPersonAssigned: (leave, requester, actingPerson) => ({
    subject: `[ระบบลา] 📋 คุณถูกมอบหมายให้ปฏิบัติหน้าที่แทน`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">📋 มอบหมายปฏิบัติหน้าที่แทน</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${actingPerson.first_name},</p>
          <p>คุณถูกมอบหมายให้ปฏิบัติหน้าที่แทน <strong>${requester.first_name} ${requester.last_name}</strong></p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white; width: 30%;"><strong>ช่วงเวลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>จำนวนวัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.total_days} วัน</td>
            </tr>
          </table>
          
          <p>กรุณาเข้าสู่ระบบเพื่อยอมรับหรือปฏิเสธการมอบหมาย</p>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ตอบรับการมอบหมาย
            </a>
          </div>
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    `
  }),

  /**
   * แจ้งอัพเดทสถานะใบลา (สำหรับทุกระดับ)
   */
  leaveStatusUpdate: (leave, requester, statusInfo) => ({
    subject: `[ระบบลา] 🔔 อัพเดทสถานะใบลา: ${statusInfo.statusText}`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${statusInfo.color || '#3B82F6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">${statusInfo.icon || '🔔'} ${statusInfo.statusText}</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${requester.first_name},</p>
          <p>${statusInfo.message}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white; width: 30%;"><strong>เลขที่ใบลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_number || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>ประเภทการลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.leave_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>วันที่ลา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>จำนวนวัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${leave.total_days} วัน</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>สถานะปัจจุบัน</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: ${statusInfo.bgColor || '#DBEAFE'}; color: ${statusInfo.textColor || '#1D4ED8'}; font-weight: bold;">${statusInfo.statusText}</td>
            </tr>
            ${(statusInfo.approverName && statusInfo.approverName !== 'undefined undefined' && !statusInfo.approverName.includes('undefined')) ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>ผู้พิจารณา</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${statusInfo.approverName}</td>
            </tr>
            ` : ''}
            ${statusInfo.comment ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>หมายเหตุ</strong></td>
              <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${statusInfo.comment}</td>
            </tr>
            ` : ''}
          </table>
          
          ${statusInfo.nextStep ? `<p style="color: #6B7280;">📌 ขั้นตอนถัดไป: ${statusInfo.nextStep}</p>` : ''}
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
        </div>
      </div>
    `
  })
};

/**
 * Format date to Thai locale
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default {
  initializeEmailTransporter,
  getTransporter,
  EmailTemplates
};
