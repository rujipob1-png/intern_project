import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { loginLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  register,
  getRegistrationRequests,
  approveRegistration,
  rejectRegistration,
  deleteRegistration,
} from '../controllers/registration.controller.js';

const router = express.Router();

// ===== Public Routes =====

// POST /api/registration/register — ลงทะเบียนพนักงานใหม่ (ไม่ต้อง login)
router.post('/register', loginLimiter, register);

// ===== Protected Routes (admin / central_office_head) =====

// GET /api/registration/requests — ดึงรายการคำขอลงทะเบียน
router.get(
  '/requests',
  authenticate,
  requireRole(['admin', 'central_office_head', 'central_office_staff']),
  getRegistrationRequests
);

// PUT /api/registration/requests/:id/approve — อนุมัติ
router.put(
  '/requests/:id/approve',
  authenticate,
  requireRole(['admin', 'central_office_head', 'central_office_staff']),
  approveRegistration
);

// PUT /api/registration/requests/:id/reject — ปฏิเสธ
router.put(
  '/requests/:id/reject',
  authenticate,
  requireRole(['admin', 'central_office_head', 'central_office_staff']),
  rejectRegistration
);

// DELETE /api/registration/requests/:id — ลบ
router.delete(
  '/requests/:id',
  authenticate,
  requireRole(['admin', 'central_office_head', 'central_office_staff']),
  deleteRegistration
);

export default router;
