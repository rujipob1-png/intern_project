import express from 'express';
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getApprovalHistory
} from '../controllers/director.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);
router.use(requireRole(['director']));

/**
 * @route   GET /api/director/leaves/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติ (Level 1)
 * @access  Private (Director)
 */
router.get('/leaves/pending', getPendingLeaves);

/**
 * @route   GET /api/director/leaves/history
 * @desc    ดูประวัติการอนุมัติ/ปฏิเสธ
 * @access  Private (Director)
 */
router.get('/leaves/history', getApprovalHistory);

/**
 * @route   POST /api/director/leaves/:id/approve
 * @desc    อนุมัติคำขอลา (Level 1)
 * @access  Private (Director)
 */
router.post('/leaves/:id/approve', approveLeave);

/**
 * @route   POST /api/director/leaves/:id/reject
 * @desc    ปฏิเสธคำขอลา (Level 1)
 * @access  Private (Director)
 */
router.post('/leaves/:id/reject', rejectLeave);

export default router;
