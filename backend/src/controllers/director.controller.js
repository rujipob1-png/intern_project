import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';

/**
 * ดูรายการคำขอลาที่รออนุมัติ (Director Role - Level 1)
 * Director เห็นเฉพาะคำขอจากพนักงานในกองเดียวกัน
 */
export const getPendingLeaves = async (req, res) => {
  try {
    const directorId = req.user.id;

    // ดึง department ของ Director
    const { data: director, error: directorError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Director department not found'
      );
    }

    // ดึงคำขอลาที่รอการอนุมัติระดับ 1 (pending) จากพนักงานในกองเดียวกัน
    // ใช้ 2 queries เพราะ Supabase ไม่รองรับ filter nested relation
    const { data: usersInDept, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('department', director.department);

    if (usersError) {
      throw usersError;
    }

    const userIds = usersInDept.map(u => u.id);

    const { data: leaves, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        ),
        users!leaves_user_id_fkey (
          id,
          employee_code,
          title,
          first_name,
          last_name,
          position,
          department,
          phone
        )
      `)
      .eq('status', 'pending')
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves retrieved successfully',
      leaves.map(leave => {
        // Parse reason if it's JSON (for backward compatibility)
        let reason = leave.reason;
        let selectedDates = leave.selected_dates;
        
        // If reason is JSON string containing selected_dates, parse it
        if (reason && typeof reason === 'string' && reason.startsWith('{')) {
          try {
            const parsed = JSON.parse(reason);
            reason = parsed.reason || reason;
            selectedDates = parsed.selected_dates || selectedDates;
          } catch (e) {
            // Keep original reason if parsing fails
          }
        }
        
        // Parse selected_dates if it's a string
        if (selectedDates && typeof selectedDates === 'string') {
          try {
            selectedDates = JSON.parse(selectedDates);
          } catch (e) {
            selectedDates = [];
          }
        }
        
        return {
          id: leave.id,
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types?.type_name || 'N/A',
          leaveTypeCode: leave.leave_types?.type_code || 'N/A',
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          reason: reason,
          selectedDates: selectedDates || [],
          documentUrl: leave.document_url,
          createdAt: leave.created_at,
          employee: {
            employeeCode: leave.users?.employee_code,
            name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
            position: leave.users?.position,
            department: leave.users?.department || 'N/A',
            phone: leave.users?.phone
          }
        };
      })
    );
  } catch (error) {
    console.error('Get pending leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve pending leaves'
    );
  }
};

/**
 * อนุมัติคำขอลา (Director - Level 1)
 */
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const directorId = req.user.id;

    // ดึง department ของ Director
    const { data: director, error: directorError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Director department not found'
      );
    }

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่และอยู่ในกองเดียวกันหรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        users!leaves_user_id_fkey (
          employee_code,
          first_name,
          last_name,
          department
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบว่าเป็นพนักงานในกองเดียวกันหรือไม่
    if (leave.users.department !== director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You can only approve leaves from your department'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น pending
    if (leave.status !== 'pending') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for director approval'
      );
    }

    // อัพเดทสถานะเป็น approved_level1
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved_level1',
        current_approval_level: 2,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกประวัติการอนุมัติในตาราง approvals
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: directorId,
        approval_level: 1,
        action: 'approved',
        comment: remarks || 'อนุมัติ'
      });

    if (approvalError) {
      console.error('Approval insert error:', approvalError);
      // ไม่ throw เพราะ update สถานะสำเร็จแล้ว
    }

    // ส่งแจ้งเตือนให้ผู้ขอลา
    await createNotification(
      leave.user_id,
      'leave_approved',
      'คำขอลาได้รับการอนุมัติระดับ 1',
      `คำขอลาเลขที่ ${leave.leave_number} ได้รับการอนุมัติจากผู้อำนวยการกลุ่มงานแล้ว รอการอนุมัติระดับถัดไป`,
      id,
      'leave'
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave approved successfully and forwarded to Central Office Staff',
      {
        leaveId: id,
        status: 'approved_level1',
        nextLevel: 'Central Office Staff'
      }
    );
  } catch (error) {
    console.error('Approve leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave'
    );
  }
};

/**
 * ปฏิเสธคำขอลา (Director - Level 1)
 */
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const directorId = req.user.id;

    if (!remarks) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Rejection remarks are required'
      );
    }

    // ดึง department ของ Director
    const { data: director, error: directorError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Director department not found'
      );
    }

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่และอยู่ในกองเดียวกันหรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        users!leaves_user_id_fkey (
          employee_code,
          first_name,
          last_name,
          department
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบว่าเป็นพนักงานในกองเดียวกันหรือไม่
    if (leave.users.department !== director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You can only reject leaves from your department'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น pending
    if (leave.status !== 'pending') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for director approval'
      );
    }

    // อัพเดทสถานะเป็น rejected
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกประวัติการปฏิเสธในตาราง approvals
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: directorId,
        approval_level: 1,
        action: 'rejected',
        comment: remarks
      });

    if (approvalError) {
      console.error('Approval insert error:', approvalError);
    }

    // ส่งแจ้งเตือนให้ผู้ขอลา
    await createNotification(
      leave.user_id,
      'leave_rejected',
      'คำขอลาถูกปฏิเสธ',
      `คำขอลาเลขที่ ${leave.leave_number} ถูกปฏิเสธจากผู้อำนวยการกลุ่มงาน เหตุผล: ${remarks || 'ไม่ระบุ'}`,
      id,
      'leave'
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave rejected successfully',
      {
        leaveId: id,
        status: 'rejected',
        remarks
      }
    );
  } catch (error) {
    console.error('Reject leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};

/**
 * ดูประวัติการอนุมัติ/ปฏิเสธของ Director
 */
export const getApprovalHistory = async (req, res) => {
  try {
    const directorId = req.user.id;

    // ดึง department ของ Director
    const { data: director, error: directorError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Director department not found'
      );
    }

    // ดึง users ในกองเดียวกัน
    const { data: usersInDept, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('department', director.department);

    if (usersError) {
      throw usersError;
    }

    const userIds = usersInDept.map(u => u.id);

    // ดึงคำขอลาที่ไม่ใช่ pending (หมายถึงอนุมัติหรือปฏิเสธไปแล้ว) จากพนักงานในกองเดียวกัน
    const { data: leaves, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        ),
        users!leaves_user_id_fkey (
          id,
          employee_code,
          title,
          first_name,
          last_name,
          position,
          department,
          phone
        )
      `)
      .neq('status', 'pending')
      .in('user_id', userIds)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approval history retrieved successfully',
      leaves.map(leave => {
        let reason = leave.reason;
        let selectedDates = leave.selected_dates;
        
        if (reason && typeof reason === 'string' && reason.startsWith('{')) {
          try {
            const parsed = JSON.parse(reason);
            reason = parsed.reason || reason;
            selectedDates = parsed.selected_dates || selectedDates;
          } catch (e) {}
        }
        
        if (selectedDates && typeof selectedDates === 'string') {
          try {
            selectedDates = JSON.parse(selectedDates);
          } catch (e) {
            selectedDates = [];
          }
        }
        
        return {
          id: leave.id,
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types?.type_name || 'N/A',
          leaveTypeCode: leave.leave_types?.type_code || 'N/A',
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          reason: reason,
          selectedDates: selectedDates || [],
          documentUrl: leave.document_url,
          status: leave.status,
          createdAt: leave.created_at,
          updatedAt: leave.updated_at,
          employee: {
            employeeCode: leave.users?.employee_code,
            name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
            position: leave.users?.position,
            department: leave.users?.department || 'N/A',
            phone: leave.users?.phone
          }
        };
      })
    );
  } catch (error) {
    console.error('Get approval history error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve approval history'
    );
  }
};