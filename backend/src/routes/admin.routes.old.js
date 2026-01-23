import express from 'express';
import {
  getApprovedLevel3Leaves,
  approveLeaveFinal,
  rejectLeaveFinal,
  getDashboard,
  getAllUsers,
  getUserById,
  getLeaveTypes
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/role.middleware.js';

const router = express.Router();

// ใช้ authenticate และ adminOnly กับทุก route
router.use(authenticate);
router.use(adminOnly);

/**
 * @route   GET /api/admin/leaves/pending
 * @desc    ดูคำขอลาที่ผ่าน Central Office Head แล้ว (approved_level3)
 * @access  Private (Admin only)
 */
router.get('/leaves/pending', getApprovedLevel3Leaves);

/**
 * @route   PUT /api/admin/leaves/:id/approve
 * @desc    อนุมัติคำขอลาขั้นสุดท้าย และหักวันลา
 * @access  Private (Admin only)
 */
router.put('/leaves/:id/approve', approveLeaveFinal);

/**
 * @route   PUT /api/admin/leaves/:id/reject
 * @desc    ไม่อนุมัติคำขอลาขั้นสุดท้าย
 * @access  Private (Admin only)
 */
router.put('/leaves/:id/reject', rejectLeaveFinal);

/**
 * @route   GET /api/admin/dashboard
 * @desc    ดู Dashboard สรุปข้อมูลทั้งหมด
 * @access  Private (Admin only)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/admin/users
 * @desc    ดูรายชื่อ users ทั้งหมด
 * @access  Private (Admin only)
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    ดูข้อมูล user 1 คน
 * @access  Private (Admin only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   GET /api/admin/leave-types
 * @desc    ดูประเภทการลาทั้งหมด
 * @access  Private (Admin only)
 */
router.get('/leave-types', getLeaveTypes);

export default router;
