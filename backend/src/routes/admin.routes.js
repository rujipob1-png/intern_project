import express from 'express';
import {
  getPendingLeaves,
  approveLeaveFinal,
  rejectLeaveFinal,
  partialApproveLeaveFinal,
  getPendingCancelRequests,
  approveCancelFinal,
  rejectCancelFinal,
  getAllUsers,
  updateUser
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);
router.use(requireRole(['admin']));

/**
 * @route   GET /api/admin/leaves/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.get('/leaves/pending', getPendingLeaves);

/**
 * @route   PUT /api/admin/leaves/:id/approve
 * @desc    อนุมัติคำขอลาขั้นสุดท้ายและหักวันลา (Level 4)
 * @access  Private (Admin)
 */
router.put('/leaves/:id/approve', approveLeaveFinal);

/**
 * @route   PUT /api/admin/leaves/:id/reject
 * @desc    ปฏิเสธคำขอลาขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.put('/leaves/:id/reject', rejectLeaveFinal);

/**
 * @route   PUT /api/admin/leaves/:id/partial-approve
 * @desc    อนุมัติบางวัน (Partial Approval) ขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.put('/leaves/:id/partial-approve', partialApproveLeaveFinal);

/**
 * ==================== Cancel Request Routes (Final) ====================
 */
router.get('/cancel-requests/pending', getPendingCancelRequests);
router.put('/cancel-requests/:id/approve', approveCancelFinal);
router.put('/cancel-requests/:id/reject', rejectCancelFinal);

/**
 * ==================== User Management Routes ====================
 */
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);

export default router;
