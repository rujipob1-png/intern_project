import express from 'express';
import {
  createLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
  approveCancelLeave,
  getLeaveBalance,
  getLeaveTypes,
  getCalendarLeaves
} from '../controllers/leave.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireAuth, approverOnly } from '../middlewares/role.middleware.js';
import { 
  createLeaveValidation, 
  cancelLeaveValidation, 
  idParamValidation 
} from '../middlewares/validation.middleware.js';
import { sensitiveActionLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);

/**
 * @route   GET /api/leaves/types
 * @desc    ดูประเภทการลาทั้งหมด
 * @access  Private
 */
router.get('/types', getLeaveTypes);

/**
 * @route   GET /api/leaves/balance
 * @desc    ดูยอดวันลาคงเหลือ
 * @access  Private (User)
 */
router.get('/balance', requireAuth, getLeaveBalance);

/**
 * @route   GET /api/leaves/calendar
 * @desc    ดูข้อมูลการลาสำหรับปฏิทิน
 * @access  Private (All authenticated users)
 */
router.get('/calendar', getCalendarLeaves);

/**
 * @route   POST /api/leaves
 * @desc    สร้างคำขอลา (User only)
 * @access  Private (User)
 */
router.post('/', requireAuth, sensitiveActionLimiter, createLeaveValidation, createLeave);

/**
 * @route   GET /api/leaves
 * @desc    ดูรายการคำขอลาของตัวเอง
 * @access  Private (User)
 */
router.get('/', requireAuth, getMyLeaves);

/**
 * @route   GET /api/leaves/:id
 * @desc    ดูรายละเอียดคำขอลาหนึ่งรายการ
 * @access  Private (User)
 */
router.get('/:id', requireAuth, idParamValidation, getLeaveById);

/**
 * @route   PUT /api/leaves/:id/cancel
 * @desc    ขอยกเลิกคำขอลา (ส่งคำขอยกเลิก - ต้องรอการอนุมัติ)
 * @access  Private (User)
 */
router.put('/:id/cancel', requireAuth, sensitiveActionLimiter, cancelLeaveValidation, cancelLeave);

/**
 * @route   PUT /api/leaves/:id/approve-cancel
 * @desc    อนุมัติ/ปฏิเสธการยกเลิกคำขอลา
 * @access  Private (Approvers: director, central_office_staff, central_office_head, admin)
 */
router.put('/:id/approve-cancel', approverOnly, approveCancelLeave);

export default router;
