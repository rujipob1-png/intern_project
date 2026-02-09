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
import { userOnly, approverOnly } from '../middlewares/role.middleware.js';
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
router.get('/balance', userOnly, getLeaveBalance);

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
router.post('/', userOnly, sensitiveActionLimiter, createLeaveValidation, createLeave);

/**
 * @route   GET /api/leaves
 * @desc    ดูรายการคำขอลาของตัวเอง
 * @access  Private (User)
 */
router.get('/', userOnly, getMyLeaves);

/**
 * @route   GET /api/leaves/:id
 * @desc    ดูรายละเอียดคำขอลาหนึ่งรายการ
 * @access  Private (User)
 */
router.get('/:id', userOnly, idParamValidation, getLeaveById);

/**
 * @route   PUT /api/leaves/:id/cancel
 * @desc    ขอยกเลิกคำขอลา (ส่งคำขอยกเลิก - ต้องรอการอนุมัติ)
 * @access  Private (User)
 */
router.put('/:id/cancel', userOnly, sensitiveActionLimiter, cancelLeaveValidation, cancelLeave);

/**
 * @route   PUT /api/leaves/:id/approve-cancel
 * @desc    อนุมัติ/ปฏิเสธการยกเลิกคำขอลา
 * @access  Private (Approvers: director, central_office_staff, central_office_head, admin)
 */
router.put('/:id/approve-cancel', approverOnly, approveCancelLeave);

export default router;
