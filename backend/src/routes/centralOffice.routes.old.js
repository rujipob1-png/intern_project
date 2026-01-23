import express from 'express';
import {
  getApprovedLevel1Leaves,
  getApprovedLevel2Leaves,
  approveLeaveLevel2,
  approveLeaveLevel3,
  rejectLeaveLevel2,
  getLeaveStatistics,
  getLeavesByDepartment,
  getAllApprovals
} from '../controllers/centralOffice.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { centralOfficeAndAbove, requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// ใช้ authenticate กับทุก route
router.use(authenticate);

// ==================== Central Office Staff Routes (Level 2) ====================
/**
 * @route   GET /api/central-office/staff/leaves/pending
 * @desc    ดูคำขอลาที่ผ่าน Director แล้ว (approved_level1)
 * @access  Private (Central Office Staff)
 */
router.get('/staff/leaves/pending', requireRole([ROLES.CENTRAL_OFFICE_STAFF, ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN]), getApprovedLevel1Leaves);

/**
 * @route   PUT /api/central-office/staff/leaves/:id/approve
 * @desc    อนุมัติคำขอลาระดับ 2 (ส่งต่อไป Central Head)
 * @access  Private (Central Office Staff)
 */
router.put('/staff/leaves/:id/approve', requireRole([ROLES.CENTRAL_OFFICE_STAFF]), approveLeaveLevel2);

/**
 * @route   PUT /api/central-office/staff/leaves/:id/reject
 * @desc    ไม่อนุมัติคำขอลาระดับ 2
 * @access  Private (Central Office Staff)
 */
router.put('/staff/leaves/:id/reject', requireRole([ROLES.CENTRAL_OFFICE_STAFF]), rejectLeaveLevel2);

// ==================== Central Office Head Routes (Level 3) ====================
/**
 * @route   GET /api/central-office/head/leaves/pending
 * @desc    ดูคำขอลาที่ผ่าน Central Staff แล้ว (approved_level2)
 * @access  Private (Central Office Head)
 */
router.get('/head/leaves/pending', requireRole([ROLES.CENTRAL_OFFICE_HEAD, ROLES.ADMIN]), getApprovedLevel2Leaves);

/**
 * @route   PUT /api/central-office/head/leaves/:id/approve
 * @desc    อนุมัติคำขอลาระดับ 3 (ส่งต่อไป Admin)
 * @access  Private (Central Office Head)
 */
router.put('/head/leaves/:id/approve', requireRole([ROLES.CENTRAL_OFFICE_HEAD]), approveLeaveLevel3);

// ==================== Common Routes ====================
/**
 * @route   GET /api/central-office/statistics
 * @desc    ดูสถิติการลาทั้งหมด
 * @access  Private (Central Office and above)
 */
router.get('/statistics', centralOfficeAndAbove, getLeaveStatistics);

/**
 * @route   GET /api/central-office/reports/departments
 * @desc    ดูรายงานการลาแยกตามแผนก
 * @access  Private (Central Office and above)
 */
router.get('/reports/departments', getLeavesByDepartment);

/**
 * @route   GET /api/central-office/approvals
 * @desc    ดูประวัติการอนุมัติทั้งหมด
 * @access  Private (Central Office and above)
 */
router.get('/approvals', getAllApprovals);

export default router;
