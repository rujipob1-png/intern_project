/**
 * ============================================
 * Validation Schemas (Zod)
 * สำหรับตรวจสอบข้อมูลก่อนส่งไป Backend
 * ============================================
 */

import { z } from 'zod';

// ============================================
// ฟังก์ชัน Sanitize ป้องกัน XSS
// ============================================

/**
 * ลบ HTML tags และ script ออกจาก string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    // ลบ HTML tags
    .replace(/<[^>]*>/g, '')
    // ลบ script patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // ลบ dangerous characters
    .replace(/[<>]/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = sanitizeObject(obj[key]);
    }
    return result;
  }
  return obj;
};

// ============================================
// Custom Zod Refinements
// ============================================

const noXSSRefinement = z.string().transform(sanitizeString);

// String ที่ปลอดภัย (ไม่มี XSS)
export const safeString = z.string()
  .transform(sanitizeString);

// ============================================
// Login Schema
// ============================================

export const loginSchema = z.object({
  employeeCode: z.string()
    .min(1, 'กรุณากรอกรหัสพนักงาน')
    .max(20, 'รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[a-zA-Z0-9]+$/, 'รหัสพนักงานต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น')
    .transform(val => val.toUpperCase().trim()),
  
  password: z.string()
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    .max(100, 'รหัสผ่านยาวเกินไป'),
});

// ============================================
// Leave Request Schema
// ============================================

export const leaveRequestSchema = z.object({
  leaveTypeId: z.number({
    required_error: 'กรุณาเลือกประเภทการลา',
    invalid_type_error: 'กรุณาเลือกประเภทการลา',
  }).positive('กรุณาเลือกประเภทการลา'),
  
  startDate: z.string()
    .min(1, 'กรุณาเลือกวันที่เริ่มลา')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)'),
  
  endDate: z.string()
    .min(1, 'กรุณาเลือกวันที่สิ้นสุดการลา')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)'),
  
  reason: z.string()
    .min(5, 'เหตุผลการลาต้องมีอย่างน้อย 5 ตัวอักษร')
    .max(1000, 'เหตุผลการลาต้องไม่เกิน 1000 ตัวอักษร')
    .transform(sanitizeString),
  
  selectedDates: z.array(z.string())
    .min(1, 'กรุณาเลือกวันที่ลาอย่างน้อย 1 วัน'),
  
  actingPersonId: z.number().optional().nullable(),
  
  contactAddress: z.string()
    .max(500, 'ที่อยู่ติดต่อต้องไม่เกิน 500 ตัวอักษร')
    .transform(sanitizeString)
    .optional(),
  
  contactPhone: z.string()
    .max(20, 'เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[0-9\-+]*$/, 'เบอร์โทรต้องเป็นตัวเลขเท่านั้น')
    .optional()
    .or(z.literal('')),
}).refine(data => {
  // ตรวจสอบว่า endDate >= startDate
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น',
  path: ['endDate'],
});

// ============================================
// Approval Schema
// ============================================

export const approvalSchema = z.object({
  leaveId: z.number({
    required_error: 'ไม่พบ ID ใบลา',
  }).positive(),
  
  action: z.enum(['approve', 'reject', 'partial_approve'], {
    required_error: 'กรุณาเลือกการดำเนินการ',
  }),
  
  comment: z.string()
    .max(1000, 'ความเห็นต้องไม่เกิน 1000 ตัวอักษร')
    .transform(sanitizeString)
    .optional(),
    
  approvedDates: z.array(z.string()).optional(),
});

// ============================================
// User Management Schema (Admin)
// ============================================

export const userSchema = z.object({
  employeeCode: z.string()
    .min(1, 'กรุณากรอกรหัสพนักงาน')
    .max(20, 'รหัสพนักงานต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[a-zA-Z0-9]+$/, 'รหัสพนักงานต้องเป็นตัวเลขหรือตัวอักษรเท่านั้น'),
  
  firstName: z.string()
    .min(1, 'กรุณากรอกชื่อ')
    .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร')
    .transform(sanitizeString),
  
  lastName: z.string()
    .min(1, 'กรุณากรอกนามสกุล')
    .max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร')
    .transform(sanitizeString),
  
  title: z.string()
    .max(20, 'คำนำหน้าต้องไม่เกิน 20 ตัวอักษร')
    .transform(sanitizeString)
    .optional(),
  
  department: z.string()
    .min(1, 'กรุณาเลือกแผนก')
    .max(50, 'แผนกต้องไม่เกิน 50 ตัวอักษร'),
  
  position: z.string()
    .max(100, 'ตำแหน่งต้องไม่เกิน 100 ตัวอักษร')
    .transform(sanitizeString)
    .optional(),
  
  phone: z.string()
    .max(20, 'เบอร์โทรต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[0-9\-+]*$/, 'เบอร์โทรต้องเป็นตัวเลขเท่านั้น')
    .optional()
    .or(z.literal('')),
  
  roleId: z.number().positive('กรุณาเลือก Role'),
  
  isActive: z.boolean().optional(),
  
  password: z.string()
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    .max(100, 'รหัสผ่านยาวเกินไป')
    .optional()
    .or(z.literal('')),
});

// ============================================
// Cancel Leave Request Schema
// ============================================

export const cancelLeaveSchema = z.object({
  leaveId: z.number({
    required_error: 'ไม่พบ ID ใบลา',
  }).positive(),
  
  cancelReason: z.string()
    .min(5, 'กรุณาระบุเหตุผลในการยกเลิก (อย่างน้อย 5 ตัว)')
    .max(500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร')
    .transform(sanitizeString),
});

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate data ด้วย Zod schema
 * @returns {{ success: boolean, data?: any, errors?: object }}
 */
export const validateData = (schema, data) => {
  try {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    // แปลง Zod errors เป็น object แบบง่าย
    const errors = {};
    result.error.errors.forEach(err => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
    
    return { success: false, errors };
  } catch (error) {
    return { 
      success: false, 
      errors: { _form: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' } 
    };
  }
};

/**
 * แสดง Toast error สำหรับ validation errors
 */
export const showValidationErrors = (errors, toast) => {
  const firstError = Object.values(errors)[0];
  if (firstError) {
    toast.error(firstError);
  }
};

// ============================================
// Form Field Validators (สำหรับ inline validation)
// ============================================

export const validators = {
  required: (value, message = 'กรุณากรอกข้อมูล') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },
  
  minLength: (min) => (value, message) => {
    if (value && value.length < min) {
      return message || `ต้องมีอย่างน้อย ${min} ตัวอักษร`;
    }
    return null;
  },
  
  maxLength: (max) => (value, message) => {
    if (value && value.length > max) {
      return message || `ต้องไม่เกิน ${max} ตัวอักษร`;
    }
    return null;
  },
  
  pattern: (regex, message = 'รูปแบบไม่ถูกต้อง') => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },
  
  phone: (value) => {
    if (value && !/^[0-9\-+]+$/.test(value)) {
      return 'เบอร์โทรต้องเป็นตัวเลขเท่านั้น';
    }
    return null;
  },
  
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    return null;
  },
};

export default {
  loginSchema,
  leaveRequestSchema,
  approvalSchema,
  userSchema,
  cancelLeaveSchema,
  validateData,
  showValidationErrors,
  sanitizeString,
  sanitizeObject,
  validators,
};
