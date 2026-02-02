import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

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

export default router;
