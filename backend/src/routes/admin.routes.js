import express from 'express';
import {
  getPendingLeaves,
  approveLeaveFinal,
  rejectLeaveFinal
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route   GET /api/admin/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.get('/pending', getPendingLeaves);

/**
 * @route   POST /api/admin/:id/approve
 * @desc    อนุมัติคำขอลาขั้นสุดท้ายและหักวันลา (Level 4)
 * @access  Private (Admin)
 */
router.post('/:id/approve', approveLeaveFinal);

/**
 * @route   POST /api/admin/:id/reject
 * @desc    ปฏิเสธคำขอลาขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.post('/:id/reject', rejectLeaveFinal);

export default router;
