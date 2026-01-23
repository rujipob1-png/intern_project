import express from 'express';
import {
  getPendingLeavesStaff,
  approveLeavLevel2,
  rejectLeaveLevel2,
  getPendingLeavesHead,
  approveLeaveLevel3,
  rejectLeaveLevel3
} from '../controllers/centralOffice.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);

/**
 * ==================== Central Office Staff Routes (Level 2) ====================
 */

/**
 * @route   GET /api/central-office/staff/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติระดับ 2
 * @access  Private (Central Office Staff)
 */
router.get('/staff/pending', requireRole(['central_office_staff']), getPendingLeavesStaff);

/**
 * @route   POST /api/central-office/staff/:id/approve
 * @desc    อนุมัติคำขอลาระดับ 2
 * @access  Private (Central Office Staff)
 */
router.post('/staff/:id/approve', requireRole(['central_office_staff']), approveLeavLevel2);

/**
 * @route   POST /api/central-office/staff/:id/reject
 * @desc    ปฏิเสธคำขอลาระดับ 2
 * @access  Private (Central Office Staff)
 */
router.post('/staff/:id/reject', requireRole(['central_office_staff']), rejectLeaveLevel2);

/**
 * ==================== Central Office Head Routes (Level 3) ====================
 */

/**
 * @route   GET /api/central-office/head/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติระดับ 3
 * @access  Private (Central Office Head)
 */
router.get('/head/pending', requireRole(['central_office_head']), getPendingLeavesHead);

/**
 * @route   POST /api/central-office/head/:id/approve
 * @desc    อนุมัติคำขอลาระดับ 3
 * @access  Private (Central Office Head)
 */
router.post('/head/:id/approve', requireRole(['central_office_head']), approveLeaveLevel3);

/**
 * @route   POST /api/central-office/head/:id/reject
 * @desc    ปฏิเสธคำขอลาระดับ 3
 * @access  Private (Central Office Head)
 */
router.post('/head/:id/reject', requireRole(['central_office_head']), rejectLeaveLevel3);

export default router;
