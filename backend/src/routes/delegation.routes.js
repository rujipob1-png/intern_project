import express from 'express';
import {
  createDelegation,
  getMyDelegations,
  getReceivedDelegations,
  cancelDelegation,
  getEligibleDelegates,
  getAllDelegations,
} from '../controllers/delegation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// ดูรายชื่อพนักงานที่โอนสิทธิ์ให้ได้
router.get('/eligible-delegates', getEligibleDelegates);

// delegations ที่ฉันสร้าง
router.get('/my', getMyDelegations);

// delegations ที่ฉันได้รับ
router.get('/received', getReceivedDelegations);

// สร้าง delegation ใหม่ (เฉพาะ role ที่มีอำนาจอนุมัติ)
router.post('/', requireRole(['director', 'central_office_staff', 'central_office_head', 'admin']), createDelegation);

// ยกเลิก delegation
router.delete('/:id', requireRole(['director', 'central_office_staff', 'central_office_head', 'admin']), cancelDelegation);

// Admin: ดู delegations ทั้งหมด
router.get('/all', requireRole(['admin', 'central_office_head']), getAllDelegations);

export default router;
