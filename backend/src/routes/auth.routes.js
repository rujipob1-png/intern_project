import express from 'express';
import { login, getProfile, changePassword, updateNotificationSettings } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { loginValidation } from '../middlewares/validation.middleware.js';
import { loginLimiter, passwordChangeLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง
 *       429:
 *         description: พยายามเข้าสู่ระบบมากเกินไป
 */
router.post('/login', loginLimiter, loginValidation, login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: ดูข้อมูลโปรไฟล์ของตัวเอง
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลโปรไฟล์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: เปลี่ยนรหัสผ่าน
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *       400:
 *         description: รหัสผ่านเดิมไม่ถูกต้อง
 *       429:
 *         description: เปลี่ยนรหัสผ่านมากเกินไป
 */
router.put('/change-password', authenticate, passwordChangeLimiter, changePassword);

/**
 * @swagger
 * /auth/notification-settings:
 *   put:
 *     summary: อัพเดทการตั้งค่าการแจ้งเตือน (Email)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email สำหรับรับการแจ้งเตือน
 *               emailNotifications:
 *                 type: boolean
 *                 description: เปิด/ปิด การแจ้งเตือนทาง Email
 *     responses:
 *       200:
 *         description: อัพเดทสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
router.put('/notification-settings', authenticate, updateNotificationSettings);

export default router;
