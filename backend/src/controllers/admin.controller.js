import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * ดูรายการคำขอลาที่รออนุมัติ (Admin - Level 4 / Final)
 * ดูคำขอที่ผ่านการอนุมัติจาก Central Office Head แล้ว (approved_level3)
 */
export const getPendingLeaves = async (req, res) => {
  try {
    // ดึงคำขอลาที่อยู่ในสถานะ approved_level3
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
          phone,
          sick_leave_balance,
          personal_leave_balance,
          vacation_leave_balance
        )
      `)
      .eq('status', 'approved_level3')
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

        // ดึงการอนุมัติ level 3 (Head)
        const { data: level3Approval } = await supabaseAdmin
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
          .eq('approval_level', 3)
          .single();

        return {
          ...leave,
          level1Approval,
          level2Approval,
          level3Approval
        };
      })
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves for admin final approval retrieved successfully',
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
          id: leave.users?.id,
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A',
          leaveBalance: {
            sick: leave.users?.sick_leave_balance,
            personal: leave.users?.personal_leave_balance,
            vacation: leave.users?.vacation_leave_balance
          }
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
          },
          head: {
            approvedAt: leave.level3Approval?.action_date,
            remarks: leave.level3Approval?.comment,
            approver: leave.level3Approval?.approver 
              ? `${leave.level3Approval.approver.title}${leave.level3Approval.approver.first_name} ${leave.level3Approval.approver.last_name}` 
              : null
          }
        }
      }))
    );
  } catch (error) {
    console.error('Get pending leaves (admin) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve pending leaves'
    );
  }
};

/**
 * อนุมัติคำขอลาขั้นสุดท้าย (Admin - Level 4)
 * และหักยอดวันลาจาก leave balance
 */
export const approveLeaveFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_code
        ),
        users!leaves_user_id_fkey (
          id,
          sick_leave_balance,
          personal_leave_balance,
          vacation_leave_balance
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

    // ตรวจสอบสถานะ - ต้องเป็น approved_level3
    if (leave.status !== 'approved_level3') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for final approval'
      );
    }

    // คำนวณว่าต้องหักวันลาจากประเภทใด
    const leaveType = leave.leave_types.type_code;
    const totalDays = leave.total_days;
    const user = leave.users;

    let updateBalance = {};
    let balanceField = '';

    switch (leaveType) {
      case 'SICK':
        if (user.sick_leave_balance < totalDays) {
          return errorResponse(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Insufficient sick leave balance. Available: ${user.sick_leave_balance} days, Required: ${totalDays} days`
          );
        }
        updateBalance.sick_leave_balance = user.sick_leave_balance - totalDays;
        balanceField = 'sick_leave_balance';
        break;

      case 'PERSONAL':
        if (user.personal_leave_balance < totalDays) {
          return errorResponse(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Insufficient personal leave balance. Available: ${user.personal_leave_balance} days, Required: ${totalDays} days`
          );
        }
        updateBalance.personal_leave_balance = user.personal_leave_balance - totalDays;
        balanceField = 'personal_leave_balance';
        break;

      case 'VACATION':
        if (user.vacation_leave_balance < totalDays) {
          return errorResponse(
            res,
            HTTP_STATUS.BAD_REQUEST,
            `Insufficient vacation leave balance. Available: ${user.vacation_leave_balance} days, Required: ${totalDays} days`
          );
        }
        updateBalance.vacation_leave_balance = user.vacation_leave_balance - totalDays;
        balanceField = 'vacation_leave_balance';
        break;

      default:
        // ประเภทการลาอื่นๆ ที่ไม่ต้องหักวัน (เช่น ลาคลอด, ลาบวช)
        updateBalance = null;
    }

    // อัพเดทสถานะเป็น approved (final)
    const { error: updateLeaveError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved',
        current_approval_level: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateLeaveError) {
      throw updateLeaveError;
    }

    // บันทึกการอนุมัติใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: adminId,
        approval_level: 4,
        action: 'approved',
        comment: remarks || 'อนุมัติ',
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

    // หักวันลา (ถ้าต้องหัก)
    if (updateBalance) {
      const { error: updateBalanceError } = await supabaseAdmin
        .from('users')
        .update(updateBalance)
        .eq('id', user.id);

      if (updateBalanceError) {
        throw updateBalanceError;
      }
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave approved successfully. Leave balance has been deducted.',
      {
        leaveId: id,
        status: 'approved',
        deductedDays: updateBalance ? totalDays : 0,
        balanceField: balanceField || 'none',
        newBalance: updateBalance ? updateBalance[balanceField] : null
      }
    );
  } catch (error) {
    console.error('Approve leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave'
    );
  }
};

/**
 * ปฏิเสธคำขอลาขั้นสุดท้าย (Admin - Level 4)
 */
export const rejectLeaveFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

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

    // ตรวจสอบสถานะ - ต้องเป็น approved_level3
    if (leave.status !== 'approved_level3') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not ready for final review'
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
        approver_id: adminId,
        approval_level: 4,
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
    console.error('Reject leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};
