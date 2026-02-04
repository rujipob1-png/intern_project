import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';

/**
 * ดูรายการคำขอลาที่รออนุมัติ (Central Office Staff - Level 2)
 * ดูคำขอที่ผ่านการอนุมัติจาก Director แล้ว (approved_level1)
 */
export const getPendingLeavesStaff = async (req, res) => {
  try {
    // ดึงคำขอลาที่อยู่ในสถานะ approved_level1
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
      .eq('status', 'approved_level1')
      .order('updated_at', { ascending: true });

    if (error) {
      throw error;
    }

    // ดึงข้อมูลการอนุมัติจาก approvals table สำหรับแต่ละ leave
    const leavesWithApprovals = await Promise.all(
      leaves.map(async (leave) => {
        // ดึงการอนุมัติ level 1 (Director)
        const { data: level1Approval } = await supabaseAdmin
          .from('approvals')
          .select(`
            *,
            approver:users!approvals_approver_id_fkey (
              title,
              first_name,
              last_name
            )
          `)
          .eq('leave_id', leave.id)
          .eq('approval_level', 1)
          .single();

        return {
          ...leave,
          level1Approval
        };
      })
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves for staff review retrieved successfully',
      leavesWithApprovals.map(leave => {
        // ตรวจสอบว่าเป็น user ที่ข้าม Director มาหรือไม่ (กอง GOK/กองอำนวยการ)
        const isGOKDepartment = leave.users?.department === 'GOK' || leave.users?.department === 'กองอำนวยการ';
        const skippedDirector = isGOKDepartment && !leave.level1Approval;

        return {
          id: leave.id,
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types?.type_name || 'N/A',
          leaveTypeCode: leave.leave_types?.type_code || 'N/A',
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          reason: leave.reason,
          documentUrl: leave.document_url,
          contactAddress: leave.contact_address,
          contactPhone: leave.contact_phone,
          selectedDates: leave.selected_dates,
          createdAt: leave.created_at,
          employee: {
            employeeCode: leave.users?.employee_code,
            name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
            position: leave.users?.position,
            department: leave.users?.department || 'N/A',
            phone: leave.users?.phone
          },
          skippedDirector, // flag บอกว่าข้าม Director มา (ชั้น 3)
          directorApproval: skippedDirector ? null : {
            approvedAt: leave.level1Approval?.action_date,
            remarks: leave.level1Approval?.comment,
            approver: leave.level1Approval?.approver 
              ? `${leave.level1Approval.approver.title}${leave.level1Approval.approver.first_name} ${leave.level1Approval.approver.last_name}` 
              : null
          }
        };
      })
    );
  } catch (error) {
    console.error('Get pending leaves (staff) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve pending leaves'
    );
  }
};

/**
 * อนุมัติคำขอลา (Central Office Staff - Level 2)
 */
export const approveLeavLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น approved_level1
    if (leave.status !== 'approved_level1') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for staff approval'
      );
    }

    // อัพเดทสถานะเป็น approved_level2
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved_level2',
        current_approval_level: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกการอนุมัติใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: staffId,
        approval_level: 2,
        action: 'approved',
        comment: remarks || 'เอกสารถูกต้อง ครบถ้วน',
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave approved successfully and forwarded to Central Office Head',
      {
        leaveId: id,
        status: 'approved_level2',
        nextLevel: 'Central Office Head'
      }
    );
  } catch (error) {
    console.error('Approve leave (level 2) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave'
    );
  }
};

/**
 * ปฏิเสธคำขอลา (Central Office Staff - Level 2)
 */
export const rejectLeaveLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;

    if (!remarks) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Rejection remarks are required'
      );
    }

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น approved_level1
    if (leave.status !== 'approved_level1') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for staff review'
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

    // บันทึกการปฏิเสธใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: staffId,
        approval_level: 2,
        action: 'rejected',
        comment: remarks,
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

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
    console.error('Reject leave (level 2) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};

/**
 * ดูรายการคำขอลาที่รออนุมัติ (Central Office Head - Level 3)
 * ดูคำขอที่ผ่านการอนุมัติจาก Staff แล้ว (approved_level2)
 */
export const getPendingLeavesHead = async (req, res) => {
  try {
    // ดึงคำขอลาที่อยู่ในสถานะ approved_level2
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
      .eq('status', 'approved_level2')
      .order('updated_at', { ascending: true });

    if (error) {
      throw error;
    }

    // ดึงข้อมูลการอนุมัติจาก approvals table สำหรับแต่ละ leave
    const leavesWithApprovals = await Promise.all(
      leaves.map(async (leave) => {
        // ดึงการอนุมัติ level 1 (Director)
        const { data: level1Approval } = await supabaseAdmin
          .from('approvals')
          .select(`
            *,
            approver:users!approvals_approver_id_fkey (
              title,
              first_name,
              last_name
            )
          `)
          .eq('leave_id', leave.id)
          .eq('approval_level', 1)
          .single();

        // ดึงการอนุมัติ level 2 (Staff)
        const { data: level2Approval } = await supabaseAdmin
          .from('approvals')
          .select(`
            *,
            approver:users!approvals_approver_id_fkey (
              title,
              first_name,
              last_name
            )
          `)
          .eq('leave_id', leave.id)
          .eq('approval_level', 2)
          .single();

        return {
          ...leave,
          level1Approval,
          level2Approval
        };
      })
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves for head review retrieved successfully',
      leavesWithApprovals.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        leaveTypeCode: leave.leave_types?.type_code || 'N/A',
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        documentUrl: leave.document_url,
        createdAt: leave.created_at,
        employee: {
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A'
        },
        approvalHistory: {
          director: {
            approvedAt: leave.level1Approval?.action_date,
            remarks: leave.level1Approval?.comment,
            approver: leave.level1Approval?.approver 
              ? `${leave.level1Approval.approver.title}${leave.level1Approval.approver.first_name} ${leave.level1Approval.approver.last_name}` 
              : null
          },
          staff: {
            approvedAt: leave.level2Approval?.action_date,
            remarks: leave.level2Approval?.comment,
            approver: leave.level2Approval?.approver 
              ? `${leave.level2Approval.approver.title}${leave.level2Approval.approver.first_name} ${leave.level2Approval.approver.last_name}` 
              : null
          }
        }
      }))
    );
  } catch (error) {
    console.error('Get pending leaves (head) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve pending leaves'
    );
  }
};

/**
 * อนุมัติคำขอลา (Central Office Head - Level 3)
 */
export const approveLeaveLevel3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const headId = req.user.id;

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น approved_level2
    if (leave.status !== 'approved_level2') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for head approval'
      );
    }

    // อัพเดทสถานะเป็น approved_level3
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved_level3',
        current_approval_level: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกการอนุมัติใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: headId,
        approval_level: 3,
        action: 'approved',
        comment: remarks || 'อนุมัติ',
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave approved successfully and forwarded to Admin',
      {
        leaveId: id,
        status: 'approved_level3',
        nextLevel: 'Admin (Final Approval)'
      }
    );
  } catch (error) {
    console.error('Approve leave (level 3) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave'
    );
  }
};

/**
 * ปฏิเสธคำขอลา (Central Office Head - Level 3)
 */
export const rejectLeaveLevel3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const headId = req.user.id;

    if (!remarks) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Rejection remarks are required'
      );
    }

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ต้องเป็น approved_level2
    if (leave.status !== 'approved_level2') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for head review'
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

    // บันทึกการปฏิเสธใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: headId,
        approval_level: 3,
        action: 'rejected',
        comment: remarks,
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

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
    console.error('Reject leave (level 3) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};

// ==================== CANCEL REQUEST FUNCTIONS ====================

/**
 * ดูรายการคำขอยกเลิกที่รออนุมัติ (Staff - Level 2)
 * ดูคำขอที่ผ่านการอนุมัติจาก Director แล้ว (cancel_level1)
 */
export const getPendingCancelRequestsStaff = async (req, res) => {
  try {
    const { data: leaves, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_name, type_code),
        users!leaves_user_id_fkey (
          id, employee_code, title, first_name, last_name, position, department, phone
        )
      `)
      .eq('status', 'cancel_level1')
      .order('updated_at', { ascending: true });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'Pending cancel requests for staff retrieved',
      leaves.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        cancelledReason: leave.cancelled_reason,
        employee: {
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A',
          phone: leave.users?.phone
        }
      }))
    );
  } catch (error) {
    console.error('Get pending cancel requests (staff) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to retrieve cancel requests');
  }
};

/**
 * อนุมัติคำขอยกเลิก (Staff - Level 2)
 */
export const approveCancelLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;

    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('status', 'cancel_level1')
      .single();

    if (fetchError || !leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // อัพเดทสถานะเป็น cancel_level2
    await supabaseAdmin
      .from('leaves')
      .update({ status: 'cancel_level2', updated_at: new Date().toISOString() })
      .eq('id', id);

    // บันทึกการอนุมัติ
    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: staffId,
      approval_level: 2,
      action: 'cancel_approved',
      comment: remarks || 'ตรวจสอบแล้ว ยืนยันการยกเลิกใบลา',
      action_date: new Date().toISOString()
    });

    // แจ้ง central_office_head
    try {
      const { data: heads } = await supabaseAdmin
        .from('users')
        .select('id, roles!inner(role_name)')
        .eq('roles.role_name', 'central_office_head');

      if (heads && heads.length > 0) {
        for (const head of heads) {
          await createNotification(
            head.id,
            'cancel_pending',
            'คำขอยกเลิกการลารอการอนุมัติ',
            `มีคำขอยกเลิกการลา ${leave.leave_number} รอการอนุมัติ`,
            id,
            'leave'
          );
        }
      }
    } catch (notifError) {
      console.log('Head cancel notification skipped:', notifError.message);
    }

    return successResponse(res, HTTP_STATUS.OK, 'Cancel request approved at level 2');
  } catch (error) {
    console.error('Approve cancel (level 2) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to approve cancel');
  }
};

/**
 * ปฏิเสธคำขอยกเลิก (Staff - Level 2)
 */
export const rejectCancelLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const staffId = req.user.id;

    if (!remarks?.trim()) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Rejection reason is required');
    }

    const { data: leave } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('status', 'cancel_level1')
      .single();

    if (!leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // คืนสถานะกลับเป็น approved_final
    await supabaseAdmin
      .from('leaves')
      .update({ status: 'approved_final', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: staffId,
      approval_level: 2,
      action: 'cancel_rejected',
      comment: remarks,
      action_date: new Date().toISOString()
    });

    // แจ้งผู้ขอลาว่าคำขอยกเลิกถูกปฏิเสธ
    await createNotification(
      leave.user_id,
      'cancel_rejected',
      'คำขอยกเลิกการลาถูกปฏิเสธ',
      `คำขอยกเลิก ${leave.leave_number} ถูกปฏิเสธ: ${remarks}`,
      id,
      'leave'
    );

    return successResponse(res, HTTP_STATUS.OK, 'Cancel request rejected');
  } catch (error) {
    console.error('Reject cancel (level 2) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to reject cancel');
  }
};

/**
 * ดูรายการคำขอยกเลิกที่รออนุมัติ (Head - Level 3)
 */
export const getPendingCancelRequestsHead = async (req, res) => {
  try {
    const { data: leaves, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_name, type_code),
        users!leaves_user_id_fkey (
          id, employee_code, title, first_name, last_name, position, department, phone
        )
      `)
      .eq('status', 'cancel_level2')
      .order('updated_at', { ascending: true });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'Pending cancel requests for head retrieved',
      leaves.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        cancelledReason: leave.cancelled_reason,
        employee: {
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A',
          phone: leave.users?.phone
        }
      }))
    );
  } catch (error) {
    console.error('Get pending cancel requests (head) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to retrieve cancel requests');
  }
};

/**
 * อนุมัติคำขอยกเลิก (Head - Level 3)
 */
export const approveCancelLevel3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const headId = req.user.id;

    const { data: leave } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('status', 'cancel_level2')
      .single();

    if (!leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // อัพเดทสถานะเป็น cancel_level3
    await supabaseAdmin
      .from('leaves')
      .update({ status: 'cancel_level3', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: headId,
      approval_level: 3,
      action: 'cancel_approved',
      comment: remarks || 'ยืนยันการยกเลิกใบลา',
      action_date: new Date().toISOString()
    });

    // แจ้ง admin
    try {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id, roles!inner(role_name)')
        .eq('roles.role_name', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await createNotification(
            admin.id,
            'cancel_pending',
            'คำขอยกเลิกการลารออนุมัติขั้นสุดท้าย',
            `มีคำขอยกเลิกการลา ${leave.leave_number} รออนุมัติขั้นสุดท้าย`,
            id,
            'leave'
          );
        }
      }
    } catch (notifError) {
      console.log('Admin cancel notification skipped:', notifError.message);
    }

    return successResponse(res, HTTP_STATUS.OK, 'Cancel request approved at level 3');
  } catch (error) {
    console.error('Approve cancel (level 3) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to approve cancel');
  }
};

/**
 * ปฏิเสธคำขอยกเลิก (Head - Level 3)
 */
export const rejectCancelLevel3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const headId = req.user.id;

    if (!remarks?.trim()) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Rejection reason is required');
    }

    const { data: leave } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('status', 'cancel_level2')
      .single();

    if (!leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // คืนสถานะกลับเป็น approved_final
    await supabaseAdmin
      .from('leaves')
      .update({ status: 'approved_final', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: headId,
      approval_level: 3,
      action: 'cancel_rejected',
      comment: remarks,
      action_date: new Date().toISOString()
    });

    // แจ้งผู้ขอลาว่าคำขอยกเลิกถูกปฏิเสธ
    await createNotification(
      leave.user_id,
      'cancel_rejected',
      'คำขอยกเลิกการลาถูกปฏิเสธ',
      `คำขอยกเลิก ${leave.leave_number} ถูกปฏิเสธ: ${remarks}`,
      id,
      'leave'
    );

    return successResponse(res, HTTP_STATUS.OK, 'Cancel request rejected');
  } catch (error) {
    console.error('Reject cancel (level 3) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to reject cancel');
  }
};
