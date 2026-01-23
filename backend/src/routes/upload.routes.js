import express from 'express';
import {
  uploadDocument,
  getLeaveDocuments,
  deleteDocument
} from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  uploadSingle,
  handleUploadError
} from '../middlewares/upload.middleware.js';

const router = express.Router();

// ต้อง authenticate ทุก route
router.use(authenticate);

/**
 * @route   POST /api/uploads/leaves/:id/document
 * @desc    อัพโหลดเอกสารแนบสำหรับคำขอลา
 * @access  Private (User - เฉพาะเจ้าของคำขอลา)
 */
router.post(
  '/leaves/:id/document',
  uploadSingle,
  handleUploadError,
  uploadDocument
);

/**
 * @route   GET /api/uploads/leaves/:id/documents
 * @desc    ดูรายการเอกสารของคำขอลา
 * @access  Private (User - เจ้าของ หรือ ผู้อนุมัติ)
 */
router.get('/leaves/:id/documents', getLeaveDocuments);

/**
 * @route   DELETE /api/uploads/leaves/:id/documents/:fileId
 * @desc    ลบเอกสาร
 * @access  Private (User - เฉพาะเจ้าของคำขอลา)
 */
router.delete('/leaves/:id/documents/:fileId', deleteDocument);

export default router;
