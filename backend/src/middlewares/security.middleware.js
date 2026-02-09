/**
 * ============================================
 * Security Middleware
 * ป้องกัน CSRF, XSS และ Security Headers
 * ============================================
 */

/**
 * ตรวจสอบ Origin header เพื่อป้องกัน CSRF
 * ใช้สำหรับ SPA ที่ไม่ใช้ cookie-based authentication
 */
export const csrfProtection = (req, res, next) => {
  // Methods ที่ต้องตรวจสอบ
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  // ถ้าไม่ใช่ protected method ให้ผ่าน
  if (!protectedMethods.includes(req.method)) {
    return next();
  }
  
  // ข้าม CSRF check สำหรับ development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // ดึง origin จาก request
  const origin = req.get('Origin') || req.get('Referer');
  
  // ถ้าไม่มี origin header (เช่น direct API call) ให้ตรวจสอบ custom header
  if (!origin) {
    const customHeader = req.get('X-Requested-With');
    if (customHeader === 'XMLHttpRequest' || customHeader === 'Fetch') {
      return next(); // มี custom header ถือว่าปลอดภัย
    }
  }
  
  // ตรวจสอบว่า origin ตรงกับ allowed origins หรือไม่
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean);
  
  // ถ้า origin อยู่ใน allowed list
  if (origin) {
    const originUrl = new URL(origin);
    const originBase = `${originUrl.protocol}//${originUrl.host}`;
    
    if (allowedOrigins.some(allowed => originBase.startsWith(allowed.replace(/\/$/, '')))) {
      return next();
    }
  }
  
  // ถ้าไม่ผ่านเงื่อนไขใดๆ ให้ block
  console.log(`⚠️ CSRF protection blocked request from origin: ${origin || 'unknown'}`);
  return res.status(403).json({
    success: false,
    message: 'Forbidden: CSRF validation failed',
    errorCode: 'CSRF_VALIDATION_FAILED'
  });
};

/**
 * เพิ่ม Security Headers เพื่อป้องกัน XSS และ attacks อื่นๆ
 */
export const securityHeaders = (req, res, next) => {
  // ป้องกัน XSS
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // ป้องกัน Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Sanitize request body เพื่อป้องกัน XSS
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[sanitizeString(key)] = sanitizeObject(obj[key]);
    }
    return result;
  }
  return obj;
};

/**
 * Sanitize string - ลบ HTML และ scripts อันตราย
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    // ลบ HTML tags
    .replace(/<[^>]*>/g, '')
    // ลบ javascript: protocol
    .replace(/javascript:/gi, '')
    // ลบ on* event handlers
    .replace(/on\w+\s*=/gi, '')
    // ลบ < และ > ที่เหลือ
    .replace(/[<>]/g, '')
    // Trim whitespace
    .trim();
};

export default {
  csrfProtection,
  securityHeaders,
  sanitizeBody
};
