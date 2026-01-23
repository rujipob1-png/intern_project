import express from 'express';
import { login, getProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login ด้วยรหัสตำแหน่งและรหัสผ่าน
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    ดูข้อมูลโปรไฟล์ของตัวเอง
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    เปลี่ยนรหัสผ่าน
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

export default router;
