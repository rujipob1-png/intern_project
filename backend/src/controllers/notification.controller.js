import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS } from '../config/constants.js';

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
 * แจ้งเตือนซ้ำสำหรับใบลาที่ค้างอนุมัติ (เรียกจาก cron ทุกวัน)
 * ตรวจสอบใบลาที่ค้างในแต่ละ level แล้วส่ง notification ให้ผู้อนุมัติที่เกี่ยวข้อง
 */
export const sendPendingApprovalReminders = async () => {
  try {
    console.log('[Reminder] ตรวจสอบใบลาที่ค้างอนุมัติ...');

    // กำหนด mapping: สถานะใบลา → role ที่ต้องอนุมัติ
    const approvalMap = [
      { status: LEAVE_STATUS.PENDING, roleName: 'director', label: 'ผู้อำนวยการกอง' },
      { status: LEAVE_STATUS.APPROVED_LEVEL1, roleName: 'central_office_staff', label: 'หัวหน้าฝ่ายบริหารทั่วไป' },
      { status: LEAVE_STATUS.APPROVED_LEVEL2, roleName: 'central_office_head', label: 'ผอ.กลุ่มงานอำนวยการ' },
      { status: LEAVE_STATUS.APPROVED_LEVEL3, roleName: 'admin', label: 'ผู้ดูแลระบบ' },
    ];

    let totalReminders = 0;

    for (const { status, roleName, label } of approvalMap) {
      // นับจำนวนใบลาที่ค้างในสถานะนี้
      const { count, error: countError } = await supabaseAdmin
        .from('leaves')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      if (countError) {
        console.error(`[Reminder] Error counting ${status}:`, countError);
        continue;
      }

      if (!count || count === 0) continue;

      // หา role_id ของ role ที่ต้องอนุมัติ
      const { data: roleData } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('role_name', roleName)
        .single();

      if (!roleData) continue;

      // หา users ที่มี role นั้น
      const { data: approvers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role_id', roleData.id)
        .eq('is_active', true);

      if (!approvers || approvers.length === 0) continue;

      // ส่ง notification ให้แต่ละ approver
      for (const approver of approvers) {
        await createNotification(
          approver.id,
          'reminder',
          'แจ้งเตือน: มีใบลาค้างอนุมัติ',
          `มีใบลารออนุมัติจำนวน ${count} ใบ กรุณาตรวจสอบและดำเนินการ`,
          null,
          'leave'
        );
        totalReminders++;
      }

      console.log(`[Reminder] ${label}: ${count} ใบค้าง → แจ้ง ${approvers.length} คน`);
    }

    console.log(`[Reminder] ส่งแจ้งเตือนทั้งหมด ${totalReminders} รายการ`);
  } catch (error) {
    console.error('[Reminder] Error sending reminders:', error);
  }
};
