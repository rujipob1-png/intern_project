import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS } from '../config/constants.js';
import { getTransporter } from '../config/email.js';

/**
 * ดึงรายการแจ้งเตือนของผู้ใช้
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Notifications retrieved successfully',
      notifications
    );
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve notifications'
    );
  }
};

/**
 * ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Unread count retrieved successfully',
      { unreadCount: count || 0 }
    );
  } catch (error) {
    console.error('Get unread count error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve unread count'
    );
  }
};

/**
 * ทำเครื่องหมายว่าอ่านแล้ว
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Notification marked as read'
    );
  } catch (error) {
    console.error('Mark as read error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to mark notification as read'
    );
  }
};

/**
 * ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'All notifications marked as read'
    );
  } catch (error) {
    console.error('Mark all as read error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to mark all notifications as read'
    );
  }
};

/**
 * สร้างแจ้งเตือนใหม่ (ใช้ภายใน)
 */
export const createNotification = async (userId, type, title, message, referenceId = null, referenceType = null) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        reference_id: referenceId,
        reference_type: referenceType
      });

    if (error) {
      console.error('Create notification error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    return false;
  }
};

/**
 * ลบแจ้งเตือน
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Notification deleted successfully'
    );
  } catch (error) {
    console.error('Delete notification error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete notification'
    );
  }
};

/**
 * ลบแจ้งเตือนที่อ่านแล้วทั้งหมด (สำหรับผู้ใช้)
 */
export const deleteAllReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .select('id');

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      `ลบแจ้งเตือนที่อ่านแล้ว ${data?.length || 0} รายการ`,
      { deletedCount: data?.length || 0 }
    );
  } catch (error) {
    console.error('Delete all read notifications error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete read notifications'
    );
  }
};

/**
 * ลบแจ้งเตือนเก่าที่อ่านแล้ว (สำหรับผู้ใช้)
 * ลบแจ้งเตือนที่อ่านแล้วและเก่ากว่า 30 วัน
 */
export const cleanupOldNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const daysOld = parseInt(req.query.days) || 30;

    // คำนวณวันที่ตัด
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // ลบ notifications ที่อ่านแล้วและเก่ากว่า cutoff
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      `ลบแจ้งเตือนเก่าแล้ว ${data?.length || 0} รายการ`,
      { deletedCount: data?.length || 0 }
    );
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to cleanup notifications'
    );
  }
};

/**
 * ลบแจ้งเตือนเก่าทั้งระบบ (Admin only)
 * ลบแจ้งเตือนที่อ่านแล้วและเก่ากว่า N วัน
 */
export const adminCleanupNotifications = async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // ลบ notifications ที่อ่านแล้วและเก่ากว่า cutoff ทั้งระบบ
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      `ลบแจ้งเตือนเก่าทั้งระบบแล้ว ${data?.length || 0} รายการ (เก่ากว่า ${daysOld} วัน)`,
      { deletedCount: data?.length || 0, cutoffDate: cutoffDate.toISOString() }
    );
  } catch (error) {
    console.error('Admin cleanup notifications error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to cleanup notifications'
    );
  }
};

/**
 * Auto-cleanup: ลบแจ้งเตือนอ่านแล้วเก่ากว่า 90 วัน (เรียกจาก cron หรือ startup)
 */
export const autoCleanupNotifications = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Auto cleanup notifications error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log(`[Notification Cleanup] ลบแจ้งเตือนเก่า ${data.length} รายการ`);
    }
  } catch (error) {
    console.error('Auto cleanup notifications error:', error);
  }
};

/**
 * ส่ง email แจ้งเตือนใบลาค้างอนุมัติ (internal helper)
 */
async function sendReminderEmail(to, approverName, leaveNumber, requesterName, dateStr) {
  const transporter = getTransporter();
  if (!transporter || !to) return;

  await transporter.sendMail({
    from: `"ระบบการลาอิเล็กทรอนิกส์" <${process.env.SMTP_USER}>`,
    to,
    subject: `[แจ้งเตือน] ใบลา ${leaveNumber} จะเริ่มพรุ่งนี้แต่ยังไม่ได้อนุมัติ`,
    html: `
      <div style="font-family: 'Sarabun', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #334155; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">⏰ แจ้งเตือน: ใบลาค้างอนุมัติ</h1>
        </div>
        <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB;">
          <p>เรียน คุณ${approverName},</p>
          <p>ใบลาหมายเลข <strong>${leaveNumber}</strong> ของ <strong>${requesterName}</strong> จะเริ่มในวันพรุ่งนี้ (${dateStr}) แต่ยังไม่ได้รับการอนุมัติ</p>
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 15px 0;">
            กรุณาเข้าสู่ระบบเพื่อตรวจสอบและดำเนินการอนุมัติ
          </div>
          <p style="color: #6B7280; font-size: 14px;">📌 อีเมลนี้ส่งโดยอัตโนมัติเพื่อป้องกันการลืมอนุมัติใบลา</p>
        </div>
        <div style="background: #6B7280; color: white; padding: 10px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
          ระบบการลาอิเล็กทรอนิกส์ - กรุณาอย่าตอบกลับอีเมลนี้
        </div>
      </div>
    `
  });
}

/**
 * แจ้งเตือนล่วงหน้า 1 วัน สำหรับใบลาที่จะเริ่มพรุ่งนี้แต่ยังไม่ได้อนุมัติ
 * เรียกจาก cron ทุกวัน 08:00 น. — จะแจ้งเฉพาะใบลาที่ start_date = พรุ่งนี้
 */
export const sendPendingApprovalReminders = async () => {
  try {
    // คำนวณวันพรุ่งนี้ (เวลาไทย)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[Reminder] ตรวจสอบใบลาที่เริ่มวันพรุ่งนี้ (${tomorrowStr}) แต่ยังไม่อนุมัติ...`);

    // สถานะที่ยังไม่อนุมัติสมบูรณ์ทั้งหมด
    const pendingStatuses = [
      LEAVE_STATUS.PENDING,
      LEAVE_STATUS.APPROVED_LEVEL1,
      LEAVE_STATUS.APPROVED_LEVEL2,
      LEAVE_STATUS.APPROVED_LEVEL3,
    ];

    // ดึงใบลาที่เริ่มพรุ่งนี้แต่ยังค้างอนุมัติ
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from('leaves')
      .select(`
        id, leave_number, start_date, status,
        users!leaves_user_id_fkey ( title, first_name, last_name )
      `)
      .eq('start_date', tomorrowStr)
      .in('status', pendingStatuses);

    if (leavesError) {
      console.error('[Reminder] Error fetching leaves:', leavesError);
      return;
    }

    if (!leaves || leaves.length === 0) {
      console.log('[Reminder] ไม่มีใบลาค้างที่เริ่มพรุ่งนี้');
      return;
    }

    console.log(`[Reminder] พบ ${leaves.length} ใบลาที่เริ่มพรุ่งนี้แต่ยังค้าง`);

    // mapping: สถานะ → role ที่ต้องอนุมัติ
    const statusToRole = {
      [LEAVE_STATUS.PENDING]: 'director',
      [LEAVE_STATUS.APPROVED_LEVEL1]: 'central_office_staff',
      [LEAVE_STATUS.APPROVED_LEVEL2]: 'central_office_head',
      [LEAVE_STATUS.APPROVED_LEVEL3]: 'admin',
    };

    let totalReminders = 0;

    for (const leave of leaves) {
      const roleName = statusToRole[leave.status];
      if (!roleName) continue;

      // หา role_id
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .single();

      if (!roleData) continue;

      // หาผู้อนุมัติที่มี role นั้น
      const { data: approvers } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name')
        .eq('role_id', roleData.id)
        .eq('is_active', true);

      if (!approvers || approvers.length === 0) continue;

      const userName = `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`.trim();

      for (const approver of approvers) {
        await createNotification(
          approver.id,
          'reminder',
          'แจ้งเตือน: ใบลาจะเริ่มพรุ่งนี้',
          `ใบลา ${leave.leave_number} ของ${userName} จะเริ่มวันพรุ่งนี้ (${tomorrowStr}) แต่ยังไม่ได้อนุมัติ กรุณาตรวจสอบ`,
          leave.id,
          'leave'
        );

        // ส่ง email ด้วย (ถ้ามี email)
        if (approver.email) {
          sendReminderEmail(
            approver.email,
            approver.first_name,
            leave.leave_number,
            userName,
            tomorrowStr
          ).catch(err => console.error('[Reminder] Email error:', err.message));
        }

        totalReminders++;
      }
    }

    console.log(`[Reminder] ส่งแจ้งเตือนทั้งหมด ${totalReminders} รายการ`);
  } catch (error) {
    console.error('[Reminder] Error sending reminders:', error);
  }
};
