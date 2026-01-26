/**
 * Acting Person Routes
 * เส้นทางสำหรับจัดการผู้ปฏิบัติหน้าที่แทนและการแจ้งเตือน
 */

import express from 'express';
import * as actingController from '../controllers/acting.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ทุก route ต้อง authenticate ก่อน
router.use(authenticate);

/**
 * @route   GET /api/acting/same-level-employees
 * @desc    ดึงรายชื่อพนักงานในชั้นเดียวกัน สำหรับเลือกเป็นผู้ปฏิบัติหน้าที่แทน
 * @access  Private (ทุก role)
 */
router.get('/same-level-employees', actingController.getSameLevelEmployees);

/**
 * @route   GET /api/acting/requests
 * @desc    ดึงคำขอที่ต้องอนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 * @access  Private (ผู้ที่ถูกเลือกให้เป็นผู้แทน)
 */
router.get('/requests', actingController.getActingRequests);

/**
 * @route   POST /api/acting/requests/:leaveId/approve
 * @desc    อนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 * @access  Private (ผู้ที่ถูกเลือกให้เป็นผู้แทน)
 */
router.post('/requests/:leaveId/approve', actingController.approveActingRequest);

/**
 * @route   GET /api/acting/notifications
 * @desc    ดึงการแจ้งเตือนทั้งหมด
 * @access  Private (ทุก role)
 */
router.get('/notifications', actingController.getNotifications);

/**
 * @route   PUT /api/acting/notifications/:notificationId/read
 * @desc    ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
 * @access  Private (ทุก role)
 */
router.put('/notifications/:notificationId/read', actingController.markAsRead);

/**
 * @route   PUT /api/acting/notifications/read-all
 * @desc    ทำเครื่องหมายว่าอ่านการแจ้งเตือนทั้งหมด
 * @access  Private (ทุก role)
 */
router.put('/notifications/read-all', actingController.markAllAsRead);

export default router;
