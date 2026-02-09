/**
 * Email Service
 * บริการส่ง email notifications
 */

import { getTransporter, EmailTemplates } from '../config/email.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Send email helper
 * @param {string} to - Recipient email
 * @param {object} template - { subject, html }
 * @returns {Promise<boolean>} - Success status
 */
async function sendEmail(to, template) {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.log('📧 Email skipped (transporter not configured):', template.subject);
    return false;
  }
  
  if (!to || !to.includes('@')) {
    console.log('📧 Email skipped (invalid email):', to);
    return false;
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"ระบบลาออนไลน์" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      html: template.html
    });
    
    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
}

/**
 * Get user by id
 */
async function getUserById(userId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, employee_code, first_name, last_name, email, department')
    .eq('id', userId)
    .single();
  
  return error ? null : data;
}

/**
 * Get leave with requester info
 */
async function getLeaveWithRequester(leaveId) {
  const { data, error } = await supabaseAdmin
    .from('leaves')
    .select(`
      *,
      leave_types (
        type_name,
        type_code
      ),
      users!leaves_user_id_fkey (
        id,
        employee_code,
        first_name,
        last_name,
        email,
        department
      )
    `)
    .eq('id', leaveId)
    .single();
  
  if (error) return null;
  
  // Transform to match expected format
  return {
    ...data,
    requester: data.users,
    leave_type: data.leave_types?.type_name
  };
}

/**
 * Email Service Class
 */
export const EmailService = {
  /**
   * ส่ง email เมื่อมีใบลาใหม่รอพิจารณา
   * @param {string} leaveId - Leave request ID
   * @param {string} approverId - Approver's employee_id
   */
  async notifyNewLeaveRequest(leaveId, approverId) {
    try {
      const [leave, approver] = await Promise.all([
        getLeaveWithRequester(leaveId),
        getUserById(approverId)
      ]);
      
      if (!leave || !approver || !approver.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }
      
      const template = EmailTemplates.leaveRequestPending(
        leave,
        leave.requester,
        approver.first_name
      );
      
      return await sendEmail(approver.email, template);
    } catch (error) {
      console.error('Email notification error:', error.message);
      return false;
    }
  },

  /**
   * ส่ง email เมื่อใบลาได้รับการอนุมัติ
   * @param {string} leaveId - Leave request ID
   */
  async notifyLeaveApproved(leaveId) {
    try {
      const leave = await getLeaveWithRequester(leaveId);
      
      if (!leave || !leave.requester || !leave.requester.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }
      
      const template = EmailTemplates.leaveApproved(leave, leave.requester);
      
      return await sendEmail(leave.requester.email, template);
    } catch (error) {
      console.error('Email notification error:', error.message);
      return false;
    }
  },

  /**
   * ส่ง email เมื่อใบลาถูกปฏิเสธ
   * @param {string} leaveId - Leave request ID
   * @param {string} rejectReason - Rejection reason
   */
  async notifyLeaveRejected(leaveId, rejectReason) {
    try {
      const leave = await getLeaveWithRequester(leaveId);
      
      if (!leave || !leave.requester || !leave.requester.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }
      
      const template = EmailTemplates.leaveRejected(
        leave,
        leave.requester,
        rejectReason
      );
      
      return await sendEmail(leave.requester.email, template);
    } catch (error) {
      console.error('Email notification error:', error.message);
      return false;
    }
  },

  /**
   * ส่ง email ถึงผู้ปฏิบัติหน้าที่แทน
   * @param {string} leaveId - Leave request ID
   * @param {string} actingPersonId - Acting person's employee_id
   */
  async notifyActingPerson(leaveId, actingPersonId) {
    try {
      const [leave, actingPerson] = await Promise.all([
        getLeaveWithRequester(leaveId),
        getUserById(actingPersonId)
      ]);
      
      if (!leave || !actingPerson || !actingPerson.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }
      
      const template = EmailTemplates.actingPersonAssigned(
        leave,
        leave.requester,
        actingPerson
      );
      
      return await sendEmail(actingPerson.email, template);
    } catch (error) {
      console.error('Email notification error:', error.message);
      return false;
    }
  },

  /**
   * ส่ง email แบบกำหนดเอง
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   */
  async sendCustomEmail(to, subject, html) {
    return await sendEmail(to, { subject, html });
  }
};

export default EmailService;
