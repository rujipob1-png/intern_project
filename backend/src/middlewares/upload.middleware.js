import multer from 'multer';
import path from 'path';
import { errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

// กำหนดประเภทไฟล์ที่อนุญาต
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png'
};

// กำหนดขนาดไฟล์สูงสุด (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// ตั้งค่า multer สำหรับเก็บไฟล์ใน memory
const storage = multer.memoryStorage();

// ฟังก์ชันตรวจสอบประเภทไฟล์
const fileFilter = (req, file, cb) => {
  // ตรวจสอบว่าประเภทไฟล์ถูกต้องหรือไม่
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only PDF, JPEG, JPG, and PNG files are allowed. You uploaded: ${file.mimetype}`
      ),
      false
    );
  }
};

// สร้าง multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // อนุญาตไม่เกิน 5 ไฟล์ต่อ request
  },
  fileFilter: fileFilter
});

/**
 * Middleware สำหรับ upload ไฟล์เดียว
 */
export const uploadSingle = upload.single('document');

/**
 * Middleware สำหรับ upload หลายไฟล์
 */
export const uploadMultiple = upload.array('documents', 5);

/**
 * Error handler สำหรับ multer
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Too many files. Maximum is 5 files per upload'
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Unexpected field name. Use "document" for single file or "documents" for multiple files'
      );
    }
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      `Upload error: ${err.message}`
    );
  } else if (err) {
    // Other errors
    return errorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      err.message
    );
  }
  next();
};

/**
 * Validate file extension
 */
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().substring(1);
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (leaveId, originalFilename) => {
  const timestamp = Date.now();
  const extension = getFileExtension(originalFilename);
  const sanitizedName = originalFilename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars
    .substring(0, 50); // Limit length
  
  return `${leaveId}_${timestamp}_${sanitizedName}.${extension}`;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
