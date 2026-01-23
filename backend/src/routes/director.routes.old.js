import express from 'express';
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getEmployees,
  getEmployeeById,
  getEmployeeLeaveHistory
} from '../controllers/director.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { directorAndAbove } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate และ directorAndAbove กับทุก route
router.use(authenticate);
router.use(directorAndAbove);

/**
 * @route   GET /api/director/leaves/pending
 * @desc    ดูรายการคำขอลาที่รออนุมัติ
 * @access  Private (Director and above)
 */
router.get('/leaves/pending', getPendingLeaves);

/**
 * @route   PUT /api/director/leaves/:id/approve
 * @desc    อนุมัติคำขอลา
 * @access  Private (Director and above)
 */
router.put('/leaves/:id/approve', approveLeave);

/**
 * @route   PUT /api/director/leaves/:id/reject
 * @desc    ไม่อนุมัติคำขอลา
 * @access  Private (Director and above)
 */
router.put('/leaves/:id/reject', rejectLeave);

/**
 * @route   GET /api/director/employees
 * @desc    ดูรายการพนักงาน
 * @access  Private (Director and above)
 */
router.get('/employees', getEmployees);

/**
 * @route   GET /api/director/employees/:id
 * @desc    ดูข้อมูลพนักงาน 1 คน
 * @access  Private (Director and above)
 */
router.get('/employees/:id', getEmployeeById);

/**
 * @route   GET /api/director/employees/:id/leaves
 * @desc    ดูประวัติการลาของพนักงาน
 * @access  Private (Director and above)
 */
router.get('/employees/:id/leaves', getEmployeeLeaveHistory);

export default router;
