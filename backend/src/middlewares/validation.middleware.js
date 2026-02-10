/**
 * ============================================
 * Validation Middleware (Express Validator)
 * สำหรับตรวจสอบข้อมูลที่ส่งเข้ามาใน Request
 * ============================================
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware สำหรับตรวจสอบ validation result
 * ใช้ต่อจาก validation rules
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: errorMessages[0]?.message || 'ข้อมูลไม่ถูกต้อง',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Sanitize string - ป้องกัน XSS
 */
export const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    // ลบ HTML tags
    .replace(/<[^>]*>/g, '')
    // ลบ script patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // ลบ dangerous characters
    .replace(/[<>]/g, '')
    // Trim
    .trim();
};

/**
 * Custom sanitizer สำหรับ express-validator
 */
const customSanitize = (value) => sanitizeString(value);

// ============================================
// Login Validation Rules
// ============================================

export const loginValidation = [
  body('employeeCode')
    .notEmpty().withMessage('กรุณากรอกรหัสพนักงาน')
    .isLength({ max: 20 }).withMessage('รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('รหัสพนักงานต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น')
    .customSanitizer(val => val?.toUpperCase()?.trim()),
    
  body('password')
    .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
    .isLength({ min: 6, max: 100 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
    
  validate
];

// ============================================
// Leave Request Validation Rules
// ============================================

export const createLeaveValidation = [
  body('leaveTypeId')
    .notEmpty().withMessage('กรุณาเลือกประเภทการลา')
    .isString().withMessage('ประเภทการลาไม่ถูกต้อง')
    .customSanitizer((value) => value?.trim()),
    
  body('selectedDates')
    .isArray({ min: 1 }).withMessage('กรุณาเลือกวันที่ลาอย่างน้อย 1 วัน')
    .custom((dates) => {
      // ตรวจสอบรูปแบบวันที่
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const date of dates) {
        if (!dateRegex.test(date)) {
          throw new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)');
        }
      }
      return true;
    }),
    
  body('reason')
    .notEmpty().withMessage('กรุณากรอกเหตุผลการลา')
    .isLength({ min: 5, max: 1000 }).withMessage('เหตุผลต้องมี 5-1000 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('actingPersonId')
    .optional({ nullable: true })
    .custom((value) => {
      // รับ null, empty, undefined หรือ UUID string
      if (value === null || value === '' || value === undefined) return true;
      if (typeof value === 'string' && value.trim().length > 0) return true;
      throw new Error('ผู้ปฏิบัติหน้าที่แทนไม่ถูกต้อง');
    })
    .customSanitizer((value) => {
      if (value === null || value === '' || value === undefined) return null;
      return value?.trim() || null;
    }),
    
  body('contactAddress')
    .optional()
    .isLength({ max: 500 }).withMessage('ที่อยู่ต้องไม่เกิน 500 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('contactPhone')
    .optional()
    .isLength({ max: 20 }).withMessage('เบอร์โทรต้องไม่เกิน 20 ตัวอักษร'),
    
  validate
];

// ============================================
// Update Leave Validation Rules
// ============================================

export const updateLeaveValidation = [
  param('id')
    .isUUID().withMessage('ID ใบลาไม่ถูกต้อง'),
    
  body('selectedDates')
    .optional()
    .isArray({ min: 1 }).withMessage('กรุณาเลือกวันที่ลาอย่างน้อย 1 วัน')
    .custom((dates) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const date of dates) {
        if (!dateRegex.test(date)) {
          throw new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)');
        }
      }
      return true;
    }),
    
  body('reason')
    .optional()
    .isLength({ min: 5, max: 1000 }).withMessage('เหตุผลต้องมี 5-1000 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  validate
];

// ============================================
// Approval Validation Rules
// ============================================

export const approvalValidation = [
  param('id')
    .isUUID().withMessage('ID ใบลาไม่ถูกต้อง'),
    
  body('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('ความเห็นต้องไม่เกิน 1000 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  validate
];

// ============================================
// Partial Approval Validation Rules
// ============================================

export const partialApprovalValidation = [
  param('id')
    .isUUID().withMessage('ID ใบลาไม่ถูกต้อง'),
    
  body('approvedDates')
    .isArray({ min: 1 }).withMessage('กรุณาเลือกวันที่อนุมัติอย่างน้อย 1 วัน')
    .custom((dates) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const date of dates) {
        if (!dateRegex.test(date)) {
          throw new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)');
        }
      }
      return true;
    }),
    
  body('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('ความเห็นต้องไม่เกิน 1000 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  validate
];

// ============================================
// Cancel Leave Validation Rules
// ============================================

export const cancelLeaveValidation = [
  param('id')
    .isUUID().withMessage('ID ใบลาไม่ถูกต้อง'),
    
  body('cancelReason')
    .notEmpty().withMessage('กรุณาระบุเหตุผลในการยกเลิก')
    .isLength({ min: 5, max: 500 }).withMessage('เหตุผลต้องมี 5-500 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  validate
];

// ============================================
// User Management Validation Rules (Admin)
// ============================================

export const createUserValidation = [
  body('employee_code')
    .notEmpty().withMessage('กรุณากรอกรหัสพนักงาน')
    .isLength({ max: 20 }).withMessage('รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('รหัสพนักงานต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น'),
    
  body('first_name')
    .notEmpty().withMessage('กรุณากรอกชื่อ')
    .isLength({ max: 100 }).withMessage('ชื่อต้องไม่เกิน 100 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('last_name')
    .notEmpty().withMessage('กรุณากรอกนามสกุล')
    .isLength({ max: 100 }).withMessage('นามสกุลต้องไม่เกิน 100 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('title')
    .optional()
    .isLength({ max: 20 }).withMessage('คำนำหน้าต้องไม่เกิน 20 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('department')
    .notEmpty().withMessage('กรุณาเลือกแผนก')
    .isLength({ max: 50 }).withMessage('แผนกต้องไม่เกิน 50 ตัวอักษร'),
    
  body('position')
    .optional()
    .isLength({ max: 100 }).withMessage('ตำแหน่งต้องไม่เกิน 100 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('phone')
    .optional()
    .isLength({ max: 20 }).withMessage('เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .matches(/^[0-9\-+]*$/).withMessage('เบอร์โทรต้องเป็นตัวเลขเท่านั้น'),
    
  body('role_id')
    .notEmpty().withMessage('กรุณาเลือก Role')
    .isUUID().withMessage('Role ไม่ถูกต้อง'),
    
  body('password')
    .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
    .isLength({ min: 6, max: 100 }).withMessage('รหัสผ่านต้องมี 6-100 ตัวอักษร'),
    
  validate
];

export const updateUserValidation = [
  param('id')
    .isUUID().withMessage('ID ผู้ใช้ไม่ถูกต้อง'),
    
  body('first_name')
    .optional()
    .isLength({ max: 100 }).withMessage('ชื่อต้องไม่เกิน 100 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('last_name')
    .optional()
    .isLength({ max: 100 }).withMessage('นามสกุลต้องไม่เกิน 100 ตัวอักษร')
    .customSanitizer(customSanitize),
    
  body('phone')
    .optional()
    .isLength({ max: 20 }).withMessage('เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .matches(/^[0-9\-+]*$/).withMessage('เบอร์โทรต้องเป็นตัวเลขเท่านั้น'),
    
  body('password')
    .optional()
    .isLength({ min: 6, max: 100 }).withMessage('รหัสผ่านต้องมี 6-100 ตัวอักษร'),
    
  validate
];

// ============================================
// ID Parameter Validation
// ============================================

export const idParamValidation = [
  param('id')
    .isUUID().withMessage('ID ไม่ถูกต้อง'),
    
  validate
];

// ============================================
// Query Validation สำหรับ Pagination
// ============================================

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('หน้าต้องเป็นตัวเลขที่มากกว่า 0'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('จำนวนต่อหน้าต้องอยู่ระหว่าง 1-100'),
    
  validate
];

export default {
  validate,
  sanitizeString,
  loginValidation,
  createLeaveValidation,
  updateLeaveValidation,
  approvalValidation,
  partialApprovalValidation,
  cancelLeaveValidation,
  createUserValidation,
  updateUserValidation,
  idParamValidation,
  paginationValidation
};
