import express from 'express';
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave
} from '../controllers/director.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);
router.use(requireRole(['director']));

/**
 * @route   GET /api/director/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติ (Level 1)
 * @access  Private (Director)
 */
router.get('/pending', getPendingLeaves);

/**
 * @route   POST /api/director/:id/approve
 * @desc    อนุมัติคำขอลา (Level 1)
 * @access  Private (Director)
 */
router.post('/:id/approve', approveLeave);

/**
 * @route   POST /api/director/:id/reject
 * @desc    ปฏิเสธคำขอลา (Level 1)
 * @access  Private (Director)
 */
router.post('/:id/reject', rejectLeave);

export default router;
