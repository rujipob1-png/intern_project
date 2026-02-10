/**
 * Email Service
 * บริการส่ง email notifications
 */

import { getTransporter, EmailTemplates } from '../config/email.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Format date to Thai locale
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * แปลงรหัสกองเป็นชื่อย่อภาษาไทย
 */
function getDepartmentThaiName(code) {
  const deptMap = {
    'GOK': 'กอก.',
    'GTS': 'กทส.',
    'GTP': 'กทป.',
    'GSS': 'กสส.',
    'GYS': 'กยส.',
    'GKC': 'กคฐ.',
    'GKS': 'กคส.'
  };
  return deptMap[code] || code || 'ไม่ระบุ';
}

/**
 * Parse reason จาก JSON string
 */
function parseReason(reasonStr) {
  if (!reasonStr) return '-';
  try {
    const parsed = JSON.parse(reasonStr);
    return parsed.reason || reasonStr;
  } catch {
    return reasonStr;
  }
}

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
 * Get users by role (for notifying approvers)
 * @param {string} roleName - Role name (director, central_office_staff, central_office_head, admin)
 * @param {string} department - Optional: filter by department (for directors)
 */
async function getUsersByRole(roleName, department = null) {
  let query = supabaseAdmin
    .from('users')
    .select(`
      id, 
      employee_code, 
      first_name, 
      last_name, 
      email, 
      department,
      roles!users_role_id_fkey (
        role_name
      )
    `)
    .eq('is_active', true);

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }

  // Filter by role name
  let filtered = data.filter(user => user.roles?.role_name === roleName);
  
  // If looking for director, also filter by department
  if (roleName === 'director' && department) {
    filtered = filtered.filter(user => user.department === department);
  }

  console.log(`📧 Found ${filtered.length} ${roleName}(s)${department ? ` in ${department}` : ''}, with email: ${filtered.filter(u => u.email).length}`);

  return filtered.filter(user => user.email); // Only return users with email
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
   * @param {string} rejecterName - Name of the person who rejected
   */
  async notifyLeaveRejected(leaveId, rejectReason, rejecterName) {
    try {
      const leave = await getLeaveWithRequester(leaveId);
      
      if (!leave || !leave.requester || !leave.requester.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }
      
      const template = EmailTemplates.leaveRejected(
        leave,
        leave.requester,
        rejectReason,
        rejecterName
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
   * ส่ง email แจ้งเตือนผู้อนุมัติว่ามีใบลารอพิจารณา
   * @param {string} leaveId - Leave request ID
   * @param {string} level - Approval level ('director', 'central_office_staff', 'central_office_head', 'admin')
   * @param {string} requesterDepartment - Department of the requester (for filtering directors)
   */
  async notifyApprovers(leaveId, level, requesterDepartment = null) {
    try {
      const leave = await getLeaveWithRequester(leaveId);
      
      if (!leave || !leave.requester) {
        console.log('📧 Skip approver notification: missing leave data');
        return false;
      }

      // Map level to role name
      const roleMap = {
        'director': 'director',
        'central_office_staff': 'central_office_staff',
        'central_office_head': 'central_office_head',
        'admin': 'admin'
      };

      const roleName = roleMap[level];
      if (!roleName) {
        console.log('📧 Skip approver notification: unknown level', level);
        return false;
      }

      // Get all approvers with this role
      const approvers = await getUsersByRole(roleName, level === 'director' ? requesterDepartment : null);
      
      if (approvers.length === 0) {
        console.log(`📧 No approvers found for role: ${roleName}`);
        return false;
      }

      console.log(`📧 Notifying ${approvers.length} ${roleName}(s) about leave ${leave.leave_number}`);

      // Level info for email
      const levelInfo = {
        'director': { levelName: 'ผอ.กลุ่มงาน', nextAction: 'พิจารณาอนุมัติระดับ 1' },
        'central_office_staff': { levelName: 'หน.ฝ่ายบริหารทั่วไป', nextAction: 'ตรวจสอบและพิจารณา' },
        'central_office_head': { levelName: 'เลขานุการกรม/ผอ.สำนัก', nextAction: 'พิจารณาอนุมัติระดับ 3' },
        'admin': { levelName: 'ผู้บริหารระดับสูง', nextAction: 'พิจารณาอนุมัติขั้นสุดท้าย' }
      };

      const info = levelInfo[level] || { levelName: level, nextAction: 'พิจารณา' };

      // Send email to each approver
      const results = await Promise.all(
        approvers.map(approver => {
          const template = {
            subject: `[ระบบลา] 📋 ใบลารอพิจารณา - ${leave.requester.first_name} ${leave.requester.last_name}`,
            html: `
              <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 20px;">📋 ใบลารอพิจารณา</h1>
                </div>
                <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
                  <p>เรียน คุณ${approver.first_name},</p>
                  <p>มีใบลารอการ${info.nextAction}จากท่าน</p>
                  
                  <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 15px 0;">
                    <strong>👤 ผู้ขอลา:</strong> ${leave.requester.first_name} ${leave.requester.last_name}<br>
                    <strong>🏢 สังกัด:</strong> ${getDepartmentThaiName(leave.requester.department)}
                  </div>
                  
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
                      <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;"><strong>เหตุผล</strong></td>
                      <td style="padding: 8px; border: 1px solid #E5E7EB; background: white;">${parseReason(leave.reason)}</td>
                    </tr>
                  </table>
                  
                  <p style="color: #6B7280; font-size: 14px;">
                    📌 กรุณาเข้าสู่ระบบเพื่อพิจารณาใบลา
                  </p>
                </div>
                <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
                  ระบบลาออนไลน์ - อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
                </div>
              </div>
            `
          };
          
          return sendEmail(approver.email, template);
        })
      );

      const successCount = results.filter(r => r).length;
      console.log(`📧 Sent ${successCount}/${approvers.length} emails to ${roleName}(s)`);
      
      return successCount > 0;
    } catch (error) {
      console.error('Notify approvers error:', error.message);
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
  },

  /**
   * ส่ง email เมื่อสถานะใบลาเปลี่ยนแปลง
   * @param {string} leaveId - Leave request ID  
   * @param {string} status - New status
   * @param {object} options - { approverName, comment }
   */
  async notifyStatusUpdate(leaveId, status, options = {}) {
    try {
      const leave = await getLeaveWithRequester(leaveId);
      
      if (!leave || !leave.requester || !leave.requester.email) {
        console.log('📧 Skip notification: missing data');
        return false;
      }

      // กำหนด status info ตามสถานะ
      const statusMap = {
        'pending': {
          statusText: 'รอพิจารณา',
          message: 'ใบลาของคุณถูกส่งเรียบร้อยแล้ว และอยู่ระหว่างรอการพิจารณา',
          icon: '📋',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          textColor: '#92400E',
          nextStep: 'รอ ผอ.กลุ่มงาน พิจารณา'
        },
        'approved_level1': {
          statusText: 'อนุมัติระดับ 1 (ผอ.กลุ่มงาน)',
          message: 'ใบลาของคุณได้รับการอนุมัติจาก ผอ.กลุ่มงาน แล้ว',
          icon: '✅',
          color: '#10B981',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          nextStep: 'รอ หน.ฝ่ายบริหารทั่วไป พิจารณา'
        },
        'approved_level2': {
          statusText: 'อนุมัติระดับ 2 (หน.ฝ่ายบริหารทั่วไป)',
          message: 'ใบลาของคุณได้รับการอนุมัติจาก หน.ฝ่ายบริหารทั่วไป แล้ว',
          icon: '✅',
          color: '#10B981',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          nextStep: 'รอ เลขานุการกรม/ผอ.สำนัก พิจารณา'
        },
        'approved_level3': {
          statusText: 'อนุมัติระดับ 3 (เลขานุการกรม/ผอ.สำนัก)',
          message: 'ใบลาของคุณได้รับการอนุมัติจาก เลขานุการกรม/ผอ.สำนัก แล้ว',
          icon: '✅',
          color: '#10B981',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          nextStep: 'รอ ผู้บริหารระดับสูง พิจารณาขั้นสุดท้าย'
        },
        'approved': {
          statusText: 'อนุมัติแล้ว ✅',
          message: 'ใบลาของคุณได้รับการอนุมัติครบทุกระดับเรียบร้อยแล้ว',
          icon: '🎉',
          color: '#10B981',
          bgColor: '#D1FAE5',
          textColor: '#065F46',
          nextStep: null
        },
        'rejected': {
          statusText: 'ไม่อนุมัติ ❌',
          message: 'ใบลาของคุณไม่ได้รับการอนุมัติ',
          icon: '❌',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          textColor: '#DC2626',
          nextStep: null
        },
        'cancelled': {
          statusText: 'ยกเลิกแล้ว',
          message: 'ใบลาของคุณถูกยกเลิกเรียบร้อยแล้ว',
          icon: '🚫',
          color: '#6B7280',
          bgColor: '#F3F4F6',
          textColor: '#374151',
          nextStep: null
        }
      };

      const statusInfo = statusMap[status] || {
        statusText: status,
        message: `สถานะใบลาของคุณเปลี่ยนเป็น: ${status}`,
        icon: '🔔',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        textColor: '#1D4ED8'
      };

      // เพิ่มข้อมูลจาก options
      if (options.approverName) {
        statusInfo.approverName = options.approverName;
      }
      if (options.comment) {
        statusInfo.comment = options.comment;
      }

      const template = EmailTemplates.leaveStatusUpdate(leave, leave.requester, statusInfo);
      
      return await sendEmail(leave.requester.email, template);
    } catch (error) {
      console.error('Email notification error:', error.message);
      return false;
    }
  }
};

export default EmailService;
