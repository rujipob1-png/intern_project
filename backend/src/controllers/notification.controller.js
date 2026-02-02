import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

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
