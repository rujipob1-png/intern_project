/**
 * ============================================
 * Rate Limiting Middleware
 * ป้องกัน DDoS และ Brute Force attacks
 * ============================================
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter สำหรับ Login endpoint
 * จำกัด 10 ครั้ง/15 นาที ต่อ "รหัสพนักงาน + IP"
 * ทำให้ผู้ใช้คนละคนไม่บล็อกกัน แม้ใช้ IP เดียวกัน (เช่น ใน Office เดียวกัน)
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // จำกัด 10 ครั้ง/window ต่อ key (รหัสพนักงาน+IP)
  keyGenerator: (req) => {
    // แยก rate limit ตามรหัสพนักงาน + IP
    // ถ้าไม่มี employeeCode ให้ใช้ IP อย่างเดียว (ป้องกัน brute force แบบไม่ส่ง code)
    const employeeCode = req.body?.employeeCode || 'unknown';
    const ip = req.ip || req.socket?.remoteAddress || 'no-ip';
    return `login_${ip}_${employeeCode}`;
  },
  validate: { xForwardedForHeader: false, default: false },
  message: {
    success: false,
    message: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่',
    errorCode: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // ไม่นับ requests ที่ login สำเร็จ
  handler: (req, res, next, options) => {
    const employeeCode = req.body?.employeeCode || 'unknown';
    console.log(`⚠️ Rate limit exceeded for IP: ${req.ip}, employeeCode: ${employeeCode}`);
    res.status(429).json(options.message);
  }
});

/**
 * Rate limiter สำหรับ API ทั่วไป
 * จำกัด 500 ครั้ง/นาที (dev) หรือ 100 ครั้ง/นาที (production)
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // dev: 500, prod: 100
  message: {
    success: false,
    message: 'มีการใช้งาน API มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    errorCode: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter สำหรับ sensitive actions
 * เช่น สร้างใบลา, อนุมัติใบลา
 * จำกัด 30 ครั้ง/นาที
 */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 30, // จำกัด 30 ครั้ง/นาที
  message: {
    success: false,
    message: 'มีการดำเนินการมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    errorCode: 'TOO_MANY_ACTIONS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter สำหรับ Password change
 * จำกัด 3 ครั้ง/ชั่วโมง
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ชั่วโมง
  max: 3, // จำกัด 3 ครั้ง/ชั่วโมง
  message: {
    success: false,
    message: 'มีการเปลี่ยนรหัสผ่านมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่',
    errorCode: 'TOO_MANY_PASSWORD_CHANGES'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter สำหรับ File uploads
 * จำกัด 10 ครั้ง/15 นาที
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // จำกัด 10 ครั้ง/15 นาที
  message: {
    success: false,
    message: 'มีการอัพโหลดไฟล์มากเกินไป กรุณารอสักครู่แล้วลองใหม่',
    errorCode: 'TOO_MANY_UPLOADS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  loginLimiter,
  apiLimiter,
  sensitiveActionLimiter,
  passwordChangeLimiter,
  uploadLimiter
};
