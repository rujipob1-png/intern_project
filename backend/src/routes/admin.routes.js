import express from 'express';
import {
  getPendingLeaves,
  approveLeaveFinal,
  rejectLeaveFinal,
  partialApproveLeaveFinal,
  getApprovalHistory,
  getPendingCancelRequests,
  approveCancelFinal,
  rejectCancelFinal,
  getCancelHistory,
  getAllUsers,
  updateUser,
  createUser,
  deleteUser,
  activateUser,
  resetUserPassword,
  updateLeaveBalance,
  getAllRoles,
  getLeaveReports,
  getDepartments,
  getAuditLogsController
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { 
  approvalValidation, 
  partialApprovalValidation, 
  updateUserValidation,
  createUserValidation,
  idParamValidation
} from '../middlewares/validation.middleware.js';

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
router.put('/leaves/:id/approve', approvalValidation, approveLeaveFinal);

/**
 * @route   PUT /api/admin/leaves/:id/reject
 * @desc    ปฏิเสธคำขอลาขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.put('/leaves/:id/reject', approvalValidation, rejectLeaveFinal);

/**
 * @route   PUT /api/admin/leaves/:id/partial-approve
 * @desc    อนุมัติบางวัน (Partial Approval) ขั้นสุดท้าย (Level 4)
 * @access  Private (Admin)
 */
router.put('/leaves/:id/partial-approve', partialApprovalValidation, partialApproveLeaveFinal);

/**
 * @route   GET /api/admin/leaves/history
 * @desc    ดูประวัติการอนุมัติทั้งหมด (Level 4)
 * @access  Private (Admin)
 */
router.get('/leaves/history', getApprovalHistory);

/**
 * ==================== Cancel Request Routes (Final) ====================
 */
router.get('/cancel-requests/pending', getPendingCancelRequests);
router.get('/cancel-requests/history', getCancelHistory);
router.put('/cancel-requests/:id/approve', approvalValidation, approveCancelFinal);
router.put('/cancel-requests/:id/reject', approvalValidation, rejectCancelFinal);

/**
 * ==================== User Management Routes ====================
 */
router.get('/roles', getAllRoles);
router.get('/users', getAllUsers);
router.post('/users', createUserValidation, createUser);
router.put('/users/:id', updateUserValidation, updateUser);
router.delete('/users/:id', idParamValidation, deleteUser);
router.put('/users/:id/activate', idParamValidation, activateUser);
router.put('/users/:id/reset-password', idParamValidation, resetUserPassword);
router.put('/users/:id/leave-balance', idParamValidation, updateLeaveBalance);

/**
 * ==================== Reports Routes ====================
 */
router.get('/reports/leaves', getLeaveReports);
router.get('/departments', getDepartments);

/**
 * ==================== Audit Log Routes ====================
 */
router.get('/audit-logs', getAuditLogsController);

export default router;
