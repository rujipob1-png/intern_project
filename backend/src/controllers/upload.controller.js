import { supabaseAdmin, supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { generateUniqueFilename, formatFileSize } from '../middlewares/upload.middleware.js';

const BUCKET_NAME = 'leave-documents';

/**
 * อัพโหลดเอกสารแนบสำหรับคำขอลา
 */
export const uploadDocument = async (req, res) => {
  try {
    const { id: leaveId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'No file uploaded. Please attach a document'
      );
    }

    // ตรวจสอบว่าคำขอลานี้เป็นของ user หรือไม่
    const { data: leave, error: leaveError } = await supabaseAdmin
      .from('leaves')
      .select('id, user_id, leave_number, status')
      .eq('id', leaveId)
      .single();

    if (leaveError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    if (leave.user_id !== userId) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You can only upload documents for your own leave requests'
      );
    }

    // ตรวจสอบว่าอัพโหลดได้หรือไม่ (ต้องไม่ใช่สถานะที่อนุมัติหรือถูกปฏิเสธแล้ว)
    if (['approved_final', 'rejected', 'cancelled'].includes(leave.status)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Cannot upload documents for leave requests with status: ${leave.status}`
      );
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const uniqueFilename = generateUniqueFilename(leaveId, file.originalname);
    const filePath = `${userId}/${uniqueFilename}`;

    // อัพโหลดไฟล์ไปยัง Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return errorResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        `Failed to upload file: ${uploadError.message}`
      );
    }

    // ดึง signed URL ของไฟล์ (เพราะ bucket เป็น private)
    // URL จะหมดอายุใน 1 ปี (31536000 วินาที)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000);

    if (signedUrlError || !signedUrlData) {
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
      return errorResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to generate file URL: ' + (signedUrlError?.message || 'Unknown error')
      );
    }

    const documentUrl = signedUrlData.signedUrl;

    // บันทึก URL ลงในตาราง leaves
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        document_url: documentUrl
      })
      .eq('id', leaveId);

    if (updateError) {
      // ถ้าบันทึก URL ไม่สำเร็จ ให้ลบไฟล์ออก
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
      throw updateError;
    }

    // บันทึก history (optional - skip if table doesn't exist)
    try {
      await supabaseAdmin
        .from('leave_history')
        .insert({
          user_id: userId,
          leave_id: leaveId,
          action: 'document_uploaded',
          action_by: userId,
          remarks: `อัพโหลดเอกสาร: ${file.originalname} (${formatFileSize(file.size)})`
        });
    } catch (historyError) {
      // Ignore if leave_history table doesn't exist
      console.log('leave_history insert skipped:', historyError.message);
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Document uploaded successfully',
      {
        filename: uniqueFilename,
        originalName: file.originalname,
        size: formatFileSize(file.size),
        mimeType: file.mimetype,
        url: documentUrl,
        uploadedAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Upload document error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to upload document: ' + error.message
    );
  }
};

/**
 * ดูรายการเอกสารของคำขอลา
 */
export const getLeaveDocuments = async (req, res) => {
  try {
    const { id: leaveId } = req.params;
    const userId = req.user.id;
    const userRoleLevel = req.user.roleLevel || 1; // ใช้ roleLevel แทน role.level

    // ดึงข้อมูลคำขอลา
    const { data: leave, error: leaveError } = await supabaseAdmin
      .from('leaves')
      .select('id, user_id, leave_number, document_url')
      .eq('id', leaveId)
      .single();

    if (leaveError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสิทธิ์ (เจ้าของหรือผู้อนุมัติ)
    if (leave.user_id !== userId && userRoleLevel < 2) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission to view these documents'
      );
    }

    if (!leave.document_url) {
      return successResponse(
        res,
        HTTP_STATUS.OK,
        'No documents uploaded for this leave request',
        {
          documents: [],
          count: 0
        }
      );
    }

    // ดึงรายการไฟล์ในโฟลเดอร์ของ user
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(leave.user_id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      throw listError;
    }

    // กรองเฉพาะไฟล์ที่เกี่ยวข้องกับคำขอลานี้
    const leaveFiles = files.filter(file => file.name.startsWith(leaveId));

    const documents = leaveFiles.map(file => {
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${leave.user_id}/${file.name}`);

      return {
        name: file.name,
        url: urlData.publicUrl,
        size: formatFileSize(file.metadata?.size || 0),
        uploadedAt: file.created_at
      };
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Documents retrieved successfully',
      {
        documents,
        count: documents.length
      }
    );
  } catch (error) {
    console.error('Get documents error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve documents: ' + error.message
    );
  }
};

/**
 * ลบเอกสาร
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id: leaveId, fileId: filename } = req.params;
    const userId = req.user.id;

    // ตรวจสอบว่าคำขอลานี้เป็นของ user หรือไม่
    const { data: leave, error: leaveError } = await supabaseAdmin
      .from('leaves')
      .select('id, user_id, leave_number, status')
      .eq('id', leaveId)
      .single();

    if (leaveError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    if (leave.user_id !== userId) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You can only delete documents from your own leave requests'
      );
    }

    // ตรวจสอบว่าลบได้หรือไม่
    if (['approved_final', 'rejected'].includes(leave.status)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Cannot delete documents for leave requests with status: ${leave.status}`
      );
    }

    const filePath = `${userId}/${filename}`;

    // ลบไฟล์จาก Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      throw deleteError;
    }

    // อัพเดท document_url ใน leaves table (ถ้าจำเป็น)
    await supabaseAdmin
      .from('leaves')
      .update({ document_url: null })
      .eq('id', leaveId);

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: userId,
        leave_id: leaveId,
        action: 'document_deleted',
        action_by: userId,
        remarks: `ลบเอกสาร: ${filename}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Document deleted successfully'
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete document: ' + error.message
    );
  }
};
