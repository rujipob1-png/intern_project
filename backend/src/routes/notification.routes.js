import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
  adminCleanupNotifications
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);

/**
 * @route   GET /api/notifications
 * @desc    ดึงรายการแจ้งเตือนทั้งหมด
 * @access  Private
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    ทำเครื่องหมายว่าอ่านแล้ว
 * @access  Private
 */
router.put('/:id/read', markAsRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
 * @access  Private
 */
router.put('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    ลบแจ้งเตือน
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   DELETE /api/notifications/cleanup/old
 * @desc    ลบแจ้งเตือนเก่าที่อ่านแล้ว (?days=30)
 * @access  Private
 */
router.delete('/cleanup/old', cleanupOldNotifications);

/**
 * @route   DELETE /api/notifications/cleanup/system
 * @desc    Admin: ลบแจ้งเตือนเก่าทั้งระบบ (?days=90)
 * @access  Admin only
 */
router.delete('/cleanup/system', adminOnly, adminCleanupNotifications);

export default router;
