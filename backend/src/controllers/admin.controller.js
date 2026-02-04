import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';

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
        selectedDates: leave.selected_dates,
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

    // ส่งแจ้งเตือนไปยังผู้ยื่นใบลา
    await createNotification(
      leave.user_id,
      'leave_approved',
      'คำขอลาได้รับการอนุมัติแล้ว',
      `คำขอลาเลขที่ ${leave.leave_number} ได้รับการอนุมัติขั้นสุดท้ายเรียบร้อยแล้ว`,
      id,
      'leave'
    );

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

    // ส่งแจ้งเตือนไปยังผู้ยื่นใบลา
    await createNotification(
      leave.user_id,
      'leave_rejected',
      'คำขอลาถูกปฏิเสธ',
      `คำขอลาเลขที่ ${leave.leave_number} ถูกปฏิเสธจากผู้บริหาร เหตุผล: ${remarks}`,
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
    console.error('Reject leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};

/**
 * อนุมัติบางวัน (Partial Approval) - Admin Level 4 (Final)
 * สามารถเลือกอนุมัติบางวันและปฏิเสธบางวันได้
 */
export const partialApproveLeaveFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedDates, rejectedDates, rejectReason, remarks } = req.body;
    const adminId = req.user.id;

    if (!approvedDates || approvedDates.length === 0) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ต้องมีอย่างน้อย 1 วันที่อนุมัติ'
      );
    }

    if (rejectedDates && rejectedDates.length > 0 && !rejectReason) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ต้องระบุเหตุผลสำหรับวันที่ไม่อนุมัติ'
      );
    }

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_name, type_code),
        users!leaves_user_id_fkey (
          id, sick_leave_balance, personal_leave_balance, vacation_leave_balance
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

    // คำนวณจำนวนวันที่อนุมัติใหม่
    const newTotalDays = approvedDates.length;
    const newStartDate = approvedDates.sort()[0];
    const newEndDate = approvedDates.sort()[approvedDates.length - 1];

    // หาประเภทการลาและหักวันลา
    const user = leave.users;
    const leaveTypeCode = leave.leave_types?.type_code;
    let updateBalance = null;
    let balanceField = null;

    switch (leaveTypeCode) {
      case 'SICK':
        balanceField = 'sick_leave_balance';
        if (user.sick_leave_balance < newTotalDays) {
          return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ยอดวันลาป่วยไม่เพียงพอ');
        }
        updateBalance = { sick_leave_balance: user.sick_leave_balance - newTotalDays };
        break;
      case 'PERSONAL':
        balanceField = 'personal_leave_balance';
        if (user.personal_leave_balance < newTotalDays) {
          return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ยอดวันลากิจไม่เพียงพอ');
        }
        updateBalance = { personal_leave_balance: user.personal_leave_balance - newTotalDays };
        break;
      case 'VACATION':
        balanceField = 'vacation_leave_balance';
        if (user.vacation_leave_balance < newTotalDays) {
          return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ยอดวันพักร้อนไม่เพียงพอ');
        }
        updateBalance = { vacation_leave_balance: user.vacation_leave_balance - newTotalDays };
        break;
      default:
        updateBalance = null;
    }

    // อัพเดทข้อมูลการลา
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved',
        current_approval_level: 4,
        total_days: newTotalDays,
        start_date: newStartDate,
        end_date: newEndDate,
        selected_dates: approvedDates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // สร้างหมายเหตุรวม - รูปแบบกระชับ
    let fullRemarks = `✓ อนุมัติ: ${approvedDates.join(', ')}`;
    if (rejectedDates && rejectedDates.length > 0) {
      fullRemarks += ` | ✗ ไม่อนุมัติ: ${rejectedDates.join(', ')} (เหตุผล: ${rejectReason})`;
    }
    if (remarks) {
      fullRemarks += ` | หมายเหตุ: ${remarks}`;
    }

    // บันทึกการอนุมัติใน approvals table
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: adminId,
        approval_level: 4,
        action: 'partial_approved',
        comment: fullRemarks,
        action_date: new Date().toISOString()
      });

    if (approvalError) {
      console.error('Error inserting approval record:', approvalError);
    }

    // หักวันลา
    if (updateBalance) {
      const { error: updateBalanceError } = await supabaseAdmin
        .from('users')
        .update(updateBalance)
        .eq('id', user.id);

      if (updateBalanceError) {
        throw updateBalanceError;
      }
    }

    // ส่งแจ้งเตือนให้ผู้ขอลา
    let notificationMessage = `คำขอลาเลขที่ ${leave.leave_number} ได้รับการอนุมัติบางส่วน: ${approvedDates.length} วัน`;
    if (rejectedDates && rejectedDates.length > 0) {
      notificationMessage += ` (ไม่อนุมัติ ${rejectedDates.length} วัน: ${rejectReason})`;
    }

    await createNotification(
      leave.user_id,
      'leave_partial_approved',
      'คำขอลาได้รับการอนุมัติบางส่วน',
      notificationMessage,
      id,
      'leave'
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave partially approved successfully',
      {
        leaveId: id,
        status: 'approved',
        approvedDates,
        rejectedDates,
        newTotalDays,
        deductedDays: updateBalance ? newTotalDays : 0,
        newBalance: updateBalance ? updateBalance[balanceField] : null
      }
    );
  } catch (error) {
    console.error('Partial approve leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to partially approve leave'
    );
  }
};

// ==================== CANCEL REQUEST FUNCTIONS (Final) ====================

/**
 * ดูรายการคำขอยกเลิกที่รออนุมัติขั้นสุดท้าย
 * ดูคำขอที่ผ่านการอนุมัติจาก Head แล้ว (cancel_level3)
 */
export const getPendingCancelRequests = async (req, res) => {
  try {
    const { data: leaves, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_name, type_code),
        users!leaves_user_id_fkey (
          id, employee_code, title, first_name, last_name, position, department, phone,
          sick_leave_balance, personal_leave_balance, vacation_leave_balance
        )
      `)
      .eq('status', 'cancel_level3')
      .order('updated_at', { ascending: true });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'Pending cancel requests for final approval retrieved',
      leaves.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        leaveTypeCode: leave.leave_types?.type_code || 'N/A',
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
          phone: leave.users?.phone,
          sickLeaveBalance: leave.users?.sick_leave_balance,
          personalLeaveBalance: leave.users?.personal_leave_balance,
          vacationLeaveBalance: leave.users?.vacation_leave_balance
        }
      }))
    );
  } catch (error) {
    console.error('Get pending cancel requests (final) error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to retrieve cancel requests');
  }
};

/**
 * อนุมัติคำขอยกเลิกขั้นสุดท้าย - ยกเลิกใบลาและคืนวันลา
 */
export const approveCancelFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

    // ดึงข้อมูลใบลา
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_code),
        users!leaves_user_id_fkey (
          id, sick_leave_balance, personal_leave_balance, vacation_leave_balance
        )
      `)
      .eq('id', id)
      .eq('status', 'cancel_level3')
      .single();

    if (fetchError || !leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // คืนวันลา
    const leaveTypeCode = leave.leave_types?.type_code;
    const totalDays = leave.total_days;
    const user = leave.users;

    let balanceField = null;
    if (leaveTypeCode === 'SICK') balanceField = 'sick_leave_balance';
    else if (leaveTypeCode === 'PERSONAL') balanceField = 'personal_leave_balance';
    else if (leaveTypeCode === 'VACATION') balanceField = 'vacation_leave_balance';

    if (balanceField && user) {
      const currentBalance = user[balanceField] || 0;
      const newBalance = currentBalance + totalDays;

      await supabaseAdmin
        .from('users')
        .update({ [balanceField]: newBalance })
        .eq('id', leave.user_id);
    }

    // อัพเดทสถานะเป็น cancelled
    await supabaseAdmin
      .from('leaves')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // บันทึกการอนุมัติ
    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: adminId,
      approval_level: 4,
      action: 'cancel_approved_final',
      comment: remarks || 'ยืนยันการยกเลิกใบลา - วันลาคืนกลับแล้ว',
      action_date: new Date().toISOString()
    });

    // แจ้งผู้ขอลาว่าคำขอยกเลิกได้รับการอนุมัติ
    await createNotification(
      leave.user_id,
      'cancel_approved',
      'คำขอยกเลิกการลาได้รับอนุมัติ',
      `คำขอยกเลิก ${leave.leave_number} ได้รับอนุมัติแล้ว วันลาได้คืนกลับ ${totalDays} วัน`,
      id,
      'leave'
    );

    return successResponse(res, HTTP_STATUS.OK, 'Leave cancelled successfully', {
      leaveId: id,
      status: 'cancelled',
      refundedDays: totalDays,
      balanceField
    });
  } catch (error) {
    console.error('Approve cancel final error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to cancel leave');
  }
};

/**
 * ปฏิเสธคำขอยกเลิกขั้นสุดท้าย - ใบลายังมีผลอยู่
 */
export const rejectCancelFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.id;

    if (!remarks?.trim()) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Rejection reason is required');
    }

    const { data: leave } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('status', 'cancel_level3')
      .single();

    if (!leave) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Cancel request not found');
    }

    // คืนสถานะกลับเป็น approved_final
    await supabaseAdmin
      .from('leaves')
      .update({ 
        status: 'approved_final',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // บันทึกการปฏิเสธ
    await supabaseAdmin.from('approvals').insert({
      leave_id: id,
      approver_id: adminId,
      approval_level: 4,
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

    return successResponse(res, HTTP_STATUS.OK, 'Cancel request rejected', {
      leaveId: id,
      status: 'approved_final'
    });
  } catch (error) {
    console.error('Reject cancel final error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to reject cancel');
  }
};

/**
 * ดึงข้อมูลผู้ใช้ทั้งหมดในระบบ (สำหรับ Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        employee_code,
        title,
        first_name,
        last_name,
        position,
        department,
        phone,
        is_active,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        created_at,
        roles (
          id,
          role_name,
          role_level
        )
      `)
      .order('employee_code', { ascending: true });

    if (error) {
      throw error;
    }

    // Format data for frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      employee_code: user.employee_code,
      title: user.title,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.title || ''}${user.first_name} ${user.last_name}`,
      position: user.position,
      phone: user.phone,
      is_active: user.is_active,
      department_code: user.department,
      role_name: user.roles?.role_name,
      role_level: user.roles?.role_level,
      sick_leave_balance: user.sick_leave_balance,
      personal_leave_balance: user.personal_leave_balance,
      vacation_leave_balance: user.vacation_leave_balance,
      created_at: user.created_at
    }));

    return successResponse(res, HTTP_STATUS.OK, 'Users retrieved successfully', formattedUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get users');
  }
};

/**
 * อัพเดทข้อมูลผู้ใช้ (สำหรับ Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // ลบ fields ที่ไม่ควรอัพเดทโดยตรง
    delete updateData.id;
    delete updateData.password_hash;
    delete updateData.employee_code;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(res, HTTP_STATUS.OK, 'User updated successfully', user);
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to update user');
  }
};
