import express from 'express';
import {
  getLeavesSummaryReport,
  getDepartmentReport,
  getEmployeeReport,
  getLeaveBalanceReport
} from '../controllers/reports.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { directorAndAbove } from '../middlewares/role.middleware.js';

const router = express.Router();

// ต้อง authenticate และมีสิทธิ์ Director ขึ้นไป
router.use(authenticate);
router.use(directorAndAbove);

/**
 * @route   GET /api/reports/summary
 * @desc    รายงานสรุปการลาทั้งหมด
 * @access  Private (Director and above)
 * @query   startDate, endDate, department, leaveType, status
 */
router.get('/summary', getLeavesSummaryReport);

/**
 * @route   GET /api/reports/departments
 * @desc    รายงานการลาแยกตามแผนก
 * @access  Private (Director and above)
 * @query   year
 */
router.get('/departments', getDepartmentReport);

/**
 * @route   GET /api/reports/employees/:employeeId
 * @desc    รายงานการลาของพนักงานรายบุคคล
 * @access  Private (Director and above)
 * @query   year
 */
router.get('/employees/:employeeId', getEmployeeReport);

/**
 * @route   GET /api/reports/balance
 * @desc    รายงานวันลาคงเหลือของพนักงานทั้งหมด
 * @access  Private (Director and above)
 * @query   department, search
 */
router.get('/balance', getLeaveBalanceReport);

export default router;
