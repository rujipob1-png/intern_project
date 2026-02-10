import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';
import { EmailService } from '../utils/emailService.js';
import { getAuditLogs, AuditActions, logLeaveAction } from '../utils/auditLog.js';

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
 * ดูประวัติการอนุมัติ (ใบลาที่ผ่านการอนุมัติขั้นสุดท้ายแล้ว)
 */
export const getApprovalHistory = async (req, res) => {
  try {
    // ดึงใบลาที่มีสถานะ approved, rejected, cancelled
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
          department
        )
      `)
      .in('status', ['approved', 'approved_final', 'rejected', 'cancelled', 'partial_approved'])
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // ดึงข้อมูลการอนุมัติ level 4 (Admin) สำหรับแต่ละ leave
    const leavesWithApprovals = await Promise.all(
      leaves.map(async (leave) => {
        const { data: adminApproval } = await supabaseAdmin
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
          .eq('approval_level', 4)
          .single();

        return {
          ...leave,
          adminApproval
        };
      })
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approval history retrieved successfully',
      leavesWithApprovals.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        leaveTypeCode: leave.leave_types?.type_code || 'N/A',
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        status: leave.status,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at,
        approvedAt: leave.adminApproval?.action_date,
        remarks: leave.adminApproval?.comment,
        employee: {
          id: leave.users?.id,
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A'
        },
        approver: leave.adminApproval?.approver 
          ? `${leave.adminApproval.approver.title}${leave.adminApproval.approver.first_name} ${leave.adminApproval.approver.last_name}` 
          : null
      }))
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

    // อัพเดทสถานะเป็น approved_final (final)
    const { error: updateLeaveError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved_final',
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

    // ส่ง email แจ้งเตือนผู้ขอลา
    EmailService.notifyLeaveApproved(id).catch(err => {
      console.error('Email notification error:', err.message);
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave approved successfully. Leave balance has been deducted.',
      {
        leaveId: id,
        status: 'approved_final',
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

    // ส่ง email แจ้งเตือนผู้ขอลา
    const rejecterName = (req.user.title || '') + req.user.firstName + ' ' + req.user.lastName + (req.user.position ? ' (' + req.user.position + ')' : '');
    EmailService.notifyLeaveRejected(id, remarks, rejecterName).catch(err => {
      console.error('Email notification error:', err.message);
    });

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
        status: 'approved_final',
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
        status: 'approved_final',
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
 * ดูประวัติการยกเลิกการลา
 */
export const getCancelHistory = async (req, res) => {
  try {
    // ดึงใบลาที่ยกเลิกแล้ว หรือปฏิเสธการยกเลิก (approved_final หลังจากผ่านกระบวนการยกเลิก)
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
          department
        )
      `)
      .eq('status', 'cancelled')
      .order('cancelled_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // ดึงข้อมูลการอนุมัติ level 4 (Admin) สำหรับแต่ละ leave
    const leavesWithApprovals = await Promise.all(
      leaves.map(async (leave) => {
        const { data: adminApproval } = await supabaseAdmin
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
          .eq('approval_level', 4)
          .in('action', ['cancel_approved_final', 'cancel_rejected'])
          .single();

        return {
          ...leave,
          adminApproval
        };
      })
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Cancel history retrieved successfully',
      leavesWithApprovals.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types?.type_name || 'N/A',
        leaveTypeCode: leave.leave_types?.type_code || 'N/A',
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        cancelledReason: leave.cancelled_reason,
        status: leave.status,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at,
        cancelledAt: leave.cancelled_at,
        remarks: leave.adminApproval?.comment,
        employee: {
          id: leave.users?.id,
          employeeCode: leave.users?.employee_code,
          name: `${leave.users?.title || ''}${leave.users?.first_name || ''} ${leave.users?.last_name || ''}`,
          position: leave.users?.position,
          department: leave.users?.department || 'N/A'
        },
        approver: leave.adminApproval?.approver 
          ? `${leave.adminApproval.approver.title}${leave.adminApproval.approver.first_name} ${leave.adminApproval.approver.last_name}` 
          : null
      }))
    );
  } catch (error) {
    console.error('Get cancel history error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve cancel history'
    );
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
        email,
        email_notifications,
        profile_image_url,
        is_active,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        hire_date,
        vacation_carryover,
        last_carryover_fiscal_year,
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
      email: user.email,
      email_notifications: user.email_notifications,
      profile_image_url: user.profile_image_url,
      is_active: user.is_active,
      department_code: user.department,
      role_name: user.roles?.role_name,
      role_level: user.roles?.role_level,
      sick_leave_balance: user.sick_leave_balance,
      personal_leave_balance: user.personal_leave_balance,
      vacation_leave_balance: user.vacation_leave_balance,
      hire_date: user.hire_date,
      vacation_carryover: user.vacation_carryover || 0,
      last_carryover_fiscal_year: user.last_carryover_fiscal_year,
      total_vacation_balance: (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0),
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

/**
 * ดึงข้อมูลการลาสำหรับรายงาน
 */
export const getLeaveReports = async (req, res) => {
  try {
    const { startDate, endDate, status, leaveType, department } = req.query;

    // Build query
    let query = supabaseAdmin
      .from('leaves')
      .select(`
        id,
        leave_number,
        start_date,
        end_date,
        total_days,
        status,
        reason,
        created_at,
        leave_types (
          id,
          type_name,
          type_code
        ),
        users!leaves_user_id_fkey (
          id,
          employee_code,
          first_name,
          last_name,
          department
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (leaveType) {
      // Need to filter by leave type code
      const { data: leaveTypeData } = await supabaseAdmin
        .from('leave_types')
        .select('id')
        .eq('type_code', leaveType)
        .single();
      
      if (leaveTypeData) {
        query = query.eq('leave_type_id', leaveTypeData.id);
      }
    }
    if (department) {
      const { data: deptUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('department', department);
      
      const userIds = deptUsers?.map(u => u.id) || [];
      if (userIds.length > 0) {
        query = query.in('user_id', userIds);
      }
    }

    // Limit results
    query = query.limit(1000);

    const { data: leaves, error } = await query;

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave reports retrieved successfully',
      leaves
    );
  } catch (error) {
    console.error('Get leave reports error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get leave reports: ' + error.message
    );
  }
};

/**
 * ดึง departments ทั้งหมด
 */
export const getDepartments = async (req, res) => {
  try {
    const { data: departments, error } = await supabaseAdmin
      .from('users')
      .select('department')
      .not('department', 'is', null);

    if (error) {
      throw error;
    }

    // Get unique departments
    const uniqueDepartments = [...new Set(departments.map(d => d.department))]
      .filter(d => d)
      .map(name => ({ name }));

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Departments retrieved successfully',
      uniqueDepartments
    );
  } catch (error) {
    console.error('Get departments error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get departments'
    );
  }
};

/**
 * ดึง Audit Logs
 */
export const getAuditLogsController = async (req, res) => {
  try {
    const { 
      userId, 
      action, 
      entityType, 
      entityId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (entityType) filters.entityType = entityType;
    if (entityId) filters.entityId = entityId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getAuditLogs(
      filters,
      parseInt(limit),
      parseInt(offset)
    );

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Audit logs retrieved successfully',
      result.data,
      { pagination: result.pagination }
    );
  } catch (error) {
    console.error('Get audit logs error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get audit logs'
    );
  }
};

/**
 * ดึง Roles ทั้งหมด (สำหรับ dropdown)
 */
export const getAllRoles = async (req, res) => {
  try {
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('id, role_name, role_level, description')
      .order('role_level', { ascending: true });

    if (error) {
      throw error;
    }

    return successResponse(res, HTTP_STATUS.OK, 'Roles retrieved successfully', roles);
  } catch (error) {
    console.error('Get all roles error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to get roles');
  }
};

/**
 * สร้างผู้ใช้ใหม่ (Admin only)
 */
export const createUser = async (req, res) => {
  try {
    const {
      employee_code,
      password,
      title,
      first_name,
      last_name,
      position,
      department,
      phone,
      email,
      role_id,
      hire_date,
      sick_leave_balance = 60,
      personal_leave_balance = 15,
      vacation_leave_balance = 10
    } = req.body;

    // Check if employee_code already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('employee_code', employee_code.toUpperCase())
      .single();

    if (existingUser) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        employee_code: employee_code.toUpperCase(),
        password_hash,
        title,
        first_name,
        last_name,
        position,
        department,
        phone,
        email,
        role_id,
        hire_date: hire_date || null,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        vacation_carryover: 0,
        is_active: true
      })
      .select(`
        id,
        employee_code,
        title,
        first_name,
        last_name,
        position,
        department,
        phone,
        email,
        is_active,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        roles (
          id,
          role_name,
          role_level
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return successResponse(
      res, 
      HTTP_STATUS.CREATED, 
      'สร้างบุคลากรใหม่สำเร็จ', 
      {
        ...newUser,
        full_name: `${newUser.title || ''}${newUser.first_name} ${newUser.last_name}`,
        role_name: newUser.roles?.role_name,
        role_level: newUser.roles?.role_level
      }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถสร้างบุคลากรได้: ' + error.message);
  }
};

/**
 * ลบ/ปิดการใช้งานผู้ใช้
 * @param {string} mode - 'deactivate' | 'archive' | 'permanent'
 *   - deactivate: ปิดการใช้งาน (soft delete) - สามารถเปิดใช้งานได้อีก
 *   - archive: เก็บข้อมูลไว้ใน archived_users แล้วลบ user ออก
 *   - permanent: ลบถาวรทั้งหมด รวมถึงประวัติการลา
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode = 'deactivate', reason = '' } = req.body;
    const currentUserId = req.user?.id;

    // ป้องกัน Admin ลบ/ปิดการใช้งานตัวเอง
    if (id === currentUserId) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ไม่สามารถดำเนินการกับบัญชีตัวเองได้');
    }

    // Check if user exists with full data
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        roles (
          id,
          role_name,
          role_level
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }

    // Mode: DEACTIVATE - ปิดการใช้งาน (Soft delete)
    if (mode === 'deactivate') {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return successResponse(res, HTTP_STATUS.OK, 'ปิดการใช้งานบุคลากรสำเร็จ', updatedUser);
    }

    // Mode: ARCHIVE - เก็บข้อมูลไว้ แล้วลบ user
    if (mode === 'archive') {
      // 1. บันทึกข้อมูลลง archived_users
      const archiveData = {
        original_user_id: user.id,
        employee_code: user.employee_code,
        title: user.title,
        first_name: user.first_name,
        last_name: user.last_name,
        position: user.position,
        department: user.department,
        phone: user.phone,
        email: user.email,
        role_name: user.roles?.role_name,
        hire_date: user.hire_date,
        last_sick_leave_balance: user.sick_leave_balance,
        last_personal_leave_balance: user.personal_leave_balance,
        last_vacation_leave_balance: user.vacation_leave_balance,
        archived_by: currentUserId,
        archive_reason: reason,
        created_at: user.created_at
      };

      const { data: archivedUser, error: archiveError } = await supabaseAdmin
        .from('archived_users')
        .insert(archiveData)
        .select()
        .single();

      if (archiveError) {
        console.error('Archive error:', archiveError);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถเก็บข้อมูลได้: ' + archiveError.message);
      }

      // 2. อัพเดต leaves ให้ชี้ไปที่ archived_user_id
      await supabaseAdmin
        .from('leaves')
        .update({ archived_user_id: archivedUser.id })
        .eq('user_id', id);

      // 3. ลบ approvals ที่เกี่ยวข้อง
      const { data: userLeaves } = await supabaseAdmin
        .from('leaves')
        .select('id')
        .eq('user_id', id);

      if (userLeaves && userLeaves.length > 0) {
        const leaveIds = userLeaves.map(l => l.id);
        await supabaseAdmin
          .from('approvals')
          .delete()
          .in('leave_id', leaveIds);
      }

      // 4. ลบ notifications
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', id);

      // 5. Set user_id ใน leaves เป็น null (เก็บ archived_user_id ไว้แล้ว)
      await supabaseAdmin
        .from('leaves')
        .update({ user_id: null })
        .eq('user_id', id);

      // 6. ลบ user
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return successResponse(res, HTTP_STATUS.OK, 'ลบบุคลากรและเก็บข้อมูลสำเร็จ', {
        archived: archivedUser,
        message: 'ข้อมูลถูกเก็บไว้ใน archived_users และประวัติการลายังคงอยู่'
      });
    }

    // Mode: PERMANENT - ลบถาวรทั้งหมด
    if (mode === 'permanent') {
      // 1. ลบ approvals ที่เกี่ยวข้อง
      const { data: userLeaves } = await supabaseAdmin
        .from('leaves')
        .select('id')
        .eq('user_id', id);

      if (userLeaves && userLeaves.length > 0) {
        const leaveIds = userLeaves.map(l => l.id);
        await supabaseAdmin
          .from('approvals')
          .delete()
          .in('leave_id', leaveIds);
      }

      // 2. ลบ leaves
      await supabaseAdmin
        .from('leaves')
        .delete()
        .eq('user_id', id);

      // 3. ลบ notifications
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', id);

      // 4. ลบ user
      const { error: deleteError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return successResponse(res, HTTP_STATUS.OK, 'ลบบุคลากรถาวรสำเร็จ (รวมประวัติการลาทั้งหมด)');
    }

    return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'mode ไม่ถูกต้อง (ต้องเป็น deactivate, archive, หรือ permanent)');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถลบบุคลากรได้: ' + error.message);
  }
};

/**
 * เปิดการใช้งานผู้ใช้ที่ถูกปิดไว้
 */
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(res, HTTP_STATUS.OK, 'เปิดการใช้งานบุคลากรสำเร็จ', user);
  } catch (error) {
    console.error('Activate user error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถเปิดการใช้งานได้');
  }
};

/**
 * Reset รหัสผ่านผู้ใช้ (Admin only)
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, employee_code, first_name, last_name')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return successResponse(
      res, 
      HTTP_STATUS.OK, 
      `รีเซ็ตรหัสผ่านของ ${user.first_name} ${user.last_name} สำเร็จ`
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
  }
};

/**
 * อัพเดตวันลาคงเหลือของผู้ใช้ (Admin only)
 */
export const updateLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { sick_leave_balance, personal_leave_balance, vacation_leave_balance } = req.body;

    // Check if user exists
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, sick_leave_balance, personal_leave_balance, vacation_leave_balance')
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }

    // Build update object
    const updateData = { updated_at: new Date().toISOString() };
    
    if (sick_leave_balance !== undefined) {
      updateData.sick_leave_balance = parseInt(sick_leave_balance);
    }
    if (personal_leave_balance !== undefined) {
      updateData.personal_leave_balance = parseInt(personal_leave_balance);
    }
    if (vacation_leave_balance !== undefined) {
      updateData.vacation_leave_balance = parseInt(vacation_leave_balance);
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return successResponse(
      res, 
      HTTP_STATUS.OK, 
      `อัพเดตวันลาของ ${user.first_name} ${user.last_name} สำเร็จ`,
      updatedUser
    );
  } catch (error) {
    console.error('Update leave balance error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถอัพเดตวันลาได้');
  }
};

/**
 * คำนวณปีงบประมาณไทย
 * ปีงบประมาณเริ่ม 1 ตุลาคม - 30 กันยายน
 * เช่น 1 ต.ค. 2567 - 30 ก.ย. 2568 = ปีงบ 2568
 */
const getCurrentFiscalYear = () => {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  const year = today.getFullYear() + 543; // พ.ศ.
  
  // If month >= October (9), fiscal year = current year + 1
  if (month >= 9) {
    return year + 1;
  }
  return year;
};

/**
 * คำนวณอายุราชการ (ปี)
 */
const calculateServiceYears = (hireDate) => {
  if (!hireDate) return 0;
  
  const hire = new Date(hireDate);
  const today = new Date();
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
};

/**
 * คำนวณเพดานสะสมวันลาพักผ่อน
 * - อายุราชการ < 10 ปี: สูงสุด 20 วัน
 * - อายุราชการ >= 10 ปี: สูงสุด 30 วัน
 */
const getVacationCarryoverLimit = (serviceYears) => {
  return serviceYears >= 10 ? 30 : 20;
};

/**
 * ยกยอดวันลาพักผ่อนข้ามปี สำหรับ user คนเดียว
 */
export const processVacationCarryover = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.body; // force = true เพื่อบังคับยกยอดใหม่
    
    // ดึงข้อมูล user
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError || !user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }
    
    const currentFiscalYear = getCurrentFiscalYear();
    
    // ตรวจสอบว่ายกยอดปีนี้แล้วหรือยัง
    if (!force && user.last_carryover_fiscal_year === currentFiscalYear) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, `ยกยอดวันลาปีงบประมาณ ${currentFiscalYear} ไปแล้ว`);
    }
    
    // คำนวณอายุราชการ
    const serviceYears = calculateServiceYears(user.hire_date);
    const carryoverLimit = getVacationCarryoverLimit(serviceYears);
    
    // วันลาพักผ่อนคงเหลือปีที่แล้ว (รวมยกยอดเก่า)
    const previousRemaining = (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0);
    
    // คำนวณวันที่ยกยอดได้ (ไม่เกินเพดาน - 10 วันใหม่)
    const maxCarryover = Math.max(0, carryoverLimit - 10); // เพดาน - วันลาใหม่
    const newCarryover = Math.min(previousRemaining, maxCarryover);
    
    // อัพเดท database
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        vacation_leave_balance: 10, // Reset เป็น 10 วันใหม่
        vacation_carryover: newCarryover,
        last_carryover_fiscal_year: currentFiscalYear,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      throw updateError;
    }
    
    // บันทึก log
    await supabaseAdmin.from('leave_balance_logs').insert({
      user_id: id,
      leave_type: 'vacation_leave',
      change_amount: newCarryover - (user.vacation_carryover || 0),
      balance_after: 10 + newCarryover,
      reason: `annual_carryover_${currentFiscalYear}`
    });
    
    return successResponse(res, HTTP_STATUS.OK, 'ยกยอดวันลาพักผ่อนสำเร็จ', {
      user_id: id,
      name: `${user.first_name} ${user.last_name}`,
      service_years: serviceYears,
      carryover_limit: carryoverLimit,
      previous_remaining: previousRemaining,
      new_carryover: newCarryover,
      new_balance: 10,
      total_available: 10 + newCarryover,
      fiscal_year: currentFiscalYear
    });
  } catch (error) {
    console.error('Process vacation carryover error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถยกยอดวันลาได้');
  }
};

/**
 * ยกยอดวันลาพักผ่อนข้ามปี สำหรับทุกคนในระบบ (ใช้ตอนเริ่มปีงบประมาณใหม่)
 */
export const processAllVacationCarryover = async (req, res) => {
  try {
    const { force = false } = req.body;
    const currentFiscalYear = getCurrentFiscalYear();
    
    // ดึง users ที่ active ทั้งหมด
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true);
    
    // ถ้าไม่ force ให้ดึงเฉพาะคนที่ยังไม่ได้ยกยอดปีนี้
    if (!force) {
      query = query.or(`last_carryover_fiscal_year.is.null,last_carryover_fiscal_year.neq.${currentFiscalYear}`);
    }
    
    const { data: users, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (users.length === 0) {
      return successResponse(res, HTTP_STATUS.OK, 'ไม่มีรายการที่ต้องยกยอด', { processed: 0 });
    }
    
    const results = [];
    const errors = [];
    
    for (const user of users) {
      try {
        const serviceYears = calculateServiceYears(user.hire_date);
        const carryoverLimit = getVacationCarryoverLimit(serviceYears);
        const previousRemaining = (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0);
        const maxCarryover = Math.max(0, carryoverLimit - 10);
        const newCarryover = Math.min(previousRemaining, maxCarryover);
        
        await supabaseAdmin
          .from('users')
          .update({
            vacation_leave_balance: 10,
            vacation_carryover: newCarryover,
            last_carryover_fiscal_year: currentFiscalYear,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        // บันทึก log
        await supabaseAdmin.from('leave_balance_logs').insert({
          user_id: user.id,
          leave_type: 'vacation_leave',
          change_amount: newCarryover - (user.vacation_carryover || 0),
          balance_after: 10 + newCarryover,
          reason: `annual_carryover_${currentFiscalYear}`
        });
        
        results.push({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          previous_remaining: previousRemaining,
          new_carryover: newCarryover,
          total_available: 10 + newCarryover
        });
      } catch (err) {
        errors.push({
          user_id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          error: err.message
        });
      }
    }
    
    return successResponse(res, HTTP_STATUS.OK, `ยกยอดวันลาสำเร็จ ${results.length} คน`, {
      fiscal_year: currentFiscalYear,
      processed: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Process all vacation carryover error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถยกยอดวันลาได้');
  }
};

/**
 * Reset วันลาประจำปีใหม่ (ลาป่วย, ลากิจ) - ใช้ตอนเริ่มปีงบประมาณ
 */
export const resetAnnualLeaveBalance = async (req, res) => {
  try {
    const currentFiscalYear = getCurrentFiscalYear();
    
    // Reset วันลาป่วย = 60, ลากิจ = 15 สำหรับทุกคน
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        sick_leave_balance: 60,
        personal_leave_balance: 15,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .select();
      
    if (error) {
      throw error;
    }
    
    return successResponse(res, HTTP_STATUS.OK, `Reset วันลาประจำปี ${currentFiscalYear} สำเร็จ`, {
      fiscal_year: currentFiscalYear,
      updated_count: data.length,
      sick_leave_balance: 60,
      personal_leave_balance: 15
    });
  } catch (error) {
    console.error('Reset annual leave balance error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถ reset วันลาได้');
  }
};

/**
 * ดูข้อมูลสรุปวันลาพักผ่อนพร้อมยกยอด
 */
export const getVacationSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !user) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }
    
    const serviceYears = calculateServiceYears(user.hire_date);
    const carryoverLimit = getVacationCarryoverLimit(serviceYears);
    const currentFiscalYear = getCurrentFiscalYear();
    
    return successResponse(res, HTTP_STATUS.OK, 'ดึงข้อมูลสำเร็จ', {
      user_id: user.id,
      name: `${user.title || ''}${user.first_name} ${user.last_name}`,
      hire_date: user.hire_date,
      service_years: serviceYears,
      carryover_limit: carryoverLimit,
      current_balance: user.vacation_leave_balance || 0,
      carryover: user.vacation_carryover || 0,
      total_available: (user.vacation_leave_balance || 0) + (user.vacation_carryover || 0),
      last_carryover_fiscal_year: user.last_carryover_fiscal_year,
      current_fiscal_year: currentFiscalYear,
      needs_carryover: user.last_carryover_fiscal_year !== currentFiscalYear
    });
  } catch (error) {
    console.error('Get vacation summary error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถดึงข้อมูลได้');
  }
};

/**
 * ยกเลิกการยกยอดวันลาพักผ่อน - Reset กลับเป็นค่าเริ่มต้น
 * vacation_leave_balance = 10, vacation_carryover = 0
 */
export const resetVacationCarryover = async (req, res) => {
  try {
    // Reset vacation_carryover = 0, vacation_leave_balance = 10, และ last_carryover_fiscal_year = null
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        vacation_leave_balance: 10,
        vacation_carryover: 0,
        last_carryover_fiscal_year: null,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .select('id, first_name, last_name');
      
    if (error) {
      throw error;
    }
    
    return successResponse(res, HTTP_STATUS.OK, 'ยกเลิกการยกยอดวันลาพักผ่อนสำเร็จ', {
      updated_count: data.length,
      vacation_leave_balance: 10,
      vacation_carryover: 0,
      message: 'Reset วันลาพักผ่อน = 10 วัน, ยกยอด = 0 วัน สำหรับทุกคน'
    });
  } catch (error) {
    console.error('Reset vacation carryover error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถยกเลิกการยกยอดได้');
  }
};

/**
 * ดึงข้อมูลบุคลากรที่ถูกเก็บถาวร (Archived Users)
 */
export const getArchivedUsers = async (req, res) => {
  try {
    const { data: archivedUsers, error } = await supabaseAdmin
      .from('archived_users')
      .select(`
        *,
        archived_by_user:users!archived_users_archived_by_fkey (
          employee_code,
          first_name,
          last_name
        )
      `)
      .order('archived_at', { ascending: false });

    if (error) {
      throw error;
    }

    // จัดรูปแบบข้อมูล
    const formattedUsers = archivedUsers.map(user => ({
      ...user,
      full_name: `${user.title || ''}${user.first_name} ${user.last_name}`,
      archived_by_name: user.archived_by_user 
        ? `${user.archived_by_user.first_name} ${user.archived_by_user.last_name}`
        : 'ไม่ทราบ'
    }));

    return successResponse(res, HTTP_STATUS.OK, 'ดึงข้อมูลบุคลากรที่เก็บถาวรสำเร็จ', formattedUsers);
  } catch (error) {
    console.error('Get archived users error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถดึงข้อมูลได้');
  }
};

/**
 * ลบข้อมูลบุคลากรที่เก็บถาวรออกถาวร
 */
export const deleteArchivedUser = async (req, res) => {
  try {
    const { id } = req.params;

    // ลบ leaves ที่เชื่อมกับ archived user นี้ (set archived_user_id = null)
    await supabaseAdmin
      .from('leaves')
      .update({ archived_user_id: null })
      .eq('archived_user_id', id);

    // ลบข้อมูลจาก archived_users
    const { error } = await supabaseAdmin
      .from('archived_users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return successResponse(res, HTTP_STATUS.OK, 'ลบข้อมูลถาวรสำเร็จ');
  } catch (error) {
    console.error('Delete archived user error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถลบข้อมูลได้');
  }
};

/**
 * ดูประวัติการลาของบุคลากรที่ถูกเก็บถาวร
 */
export const getArchivedUserLeaves = async (req, res) => {
  try {
    const { id } = req.params;

    // ดึงข้อมูล archived user
    const { data: archivedUser, error: userError } = await supabaseAdmin
      .from('archived_users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !archivedUser) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบข้อมูลบุคลากร');
    }

    // ดึงประวัติการลา
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        )
      `)
      .eq('archived_user_id', id)
      .order('created_at', { ascending: false });

    if (leavesError) {
      throw leavesError;
    }

    return successResponse(res, HTTP_STATUS.OK, 'ดึงประวัติการลาสำเร็จ', {
      user: {
        ...archivedUser,
        full_name: `${archivedUser.title || ''}${archivedUser.first_name} ${archivedUser.last_name}`
      },
      leaves: leaves || []
    });
  } catch (error) {
    console.error('Get archived user leaves error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถดึงข้อมูลได้');
  }
};