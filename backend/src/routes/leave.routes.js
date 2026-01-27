import express from 'express';
import {
  createLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
  approveCancelLeave,
  getLeaveBalance,
  getLeaveTypes
} from '../controllers/leave.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { userOnly, approverOnly } from '../middlewares/role.middleware.js';

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
 * @route   POST /api/leaves
 * @desc    สร้างคำขอลา (User only)
 * @access  Private (User)
 */
router.post('/', userOnly, createLeave);

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
router.get('/:id', userOnly, getLeaveById);

/**
 * @route   PUT /api/leaves/:id/cancel
 * @desc    ขอยกเลิกคำขอลา (ส่งคำขอยกเลิก - ต้องรอการอนุมัติ)
 * @access  Private (User)
 */
router.put('/:id/cancel', userOnly, cancelLeave);

/**
 * @route   PUT /api/leaves/:id/approve-cancel
 * @desc    อนุมัติ/ปฏิเสธการยกเลิกคำขอลา
 * @access  Private (Approvers: director, central_office_staff, central_office_head, admin)
 */
router.put('/:id/approve-cancel', approverOnly, approveCancelLeave);

export default router;
