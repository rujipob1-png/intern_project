import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS } from '../config/constants.js';

/**
 * ดึงประเภทการลาทั้งหมด
 */
export const getLeaveTypes = async (req, res) => {
  try {
    const { data: leaveTypes, error } = await supabaseAdmin
      .from('leave_types')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Get leave types successfully',
      leaveTypes
    );
  } catch (error) {
    console.error('Get leave types error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get leave types',
      error.message
    );
  }
};

/**
 * สร้างคำขอลา (User Role)
 */
export const createLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      leaveTypeId,
      selectedDates,
      totalDays,
      reason,
      contactAddress,
      contactPhone,
      documentUrl
    } = req.body;

    // Validate input
    if (!leaveTypeId || !selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0 || !totalDays || !reason) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'All required fields must be provided'
      );
    }

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    const dates = selectedDates.sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // ตรวจสอบว่า leave type มีอยู่หรือไม่
    const { data: leaveType, error: leaveTypeError } = await supabaseAdmin
      .from('leave_types')
      .select('*')
      .eq('id', leaveTypeId)
      .single();

    if (leaveTypeError || !leaveType) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave type not found'
      );
    }

    // สร้างคำขอลา (leave_number จะถูกสร้างอัตโนมัติโดย trigger)
    // เก็บ selectedDates ใน reason (JSON format) เพื่อหลีกเลี่ยงปัญหา schema cache
    const reasonWithDates = {
      reason: reason,
      selected_dates: selectedDates
    };

    const { data: leave, error } = await supabaseAdmin
      .from('leaves')
      .insert({
        user_id: userId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason: JSON.stringify(reasonWithDates), // เก็บ reason + dates รวมกัน
        contact_address: contactAddress || null,
        contact_phone: contactPhone || null,
        document_url: documentUrl || null,
        status: LEAVE_STATUS.PENDING,
        current_approval_level: 1
      })
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: userId,
        leave_id: leave.id,
        action: 'created',
        action_by: userId,
        remarks: 'สร้างคำขอลา'
      });

    // แยก reason และ selected_dates
    let actualReason = leave.reason;
    let selectedDatesArray = selectedDates;
    try {
      const parsed = JSON.parse(leave.reason);
      if (parsed.reason && parsed.selected_dates) {
        actualReason = parsed.reason;
        selectedDatesArray = parsed.selected_dates;
      }
    } catch (e) {
      // ถ้า parse ไม่ได้ = เป็น string ธรรมดา
    }

    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      'Leave request created successfully',
      {
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types.type_name,
        startDate: leave.start_date,
        endDate: leave.end_date,
        selectedDates: selectedDatesArray,
        totalDays: leave.total_days,
        status: leave.status,
        createdAt: leave.created_at
      }
    );
  } catch (error) {
    console.error('Create leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create leave request: ' + error.message
    );
  }
};

/**
 * ดูรายการคำขอลาของตัวเอง
 */
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          id,
          type_name,
          type_code,
          description
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: leaves, error, count } = await query;

    if (error) {
      throw error;
    }

    // แยก reason และ selected_dates จาก JSON
    const processedLeaves = leaves.map(leave => {
      let actualReason = leave.reason;
      let selectedDatesArray = [];
      try {
        const parsed = JSON.parse(leave.reason);
        if (parsed.reason && parsed.selected_dates) {
          actualReason = parsed.reason;
          selectedDatesArray = parsed.selected_dates;
        }
      } catch (e) {
        // ถ้า parse ไม่ได้ = เป็น string ธรรมดา
      }

      return {
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types.type_name,
        leaveTypeCode: leave.leave_types.type_code,
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: actualReason,
        selectedDates: selectedDatesArray,
        status: leave.status,
        currentApprovalLevel: leave.current_approval_level,
        createdAt: leave.created_at,
        cancelledAt: leave.cancelled_at,
        cancelledReason: leave.cancelled_reason,
        documentUrl: leave.document_url
      };
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leaves retrieved successfully',
      {
        leaves: processedLeaves,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Get my leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leaves: ' + error.message
    );
  }
};

/**
 * ดูรายละเอียดคำขอลาหนึ่งรายการ
 */
export const getLeaveById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: leave, error } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code,
          description
        ),
        users!leaves_user_id_fkey (
          employee_code,
          title,
          first_name,
          last_name,
          position,
          department
        )
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ดึงประวัติการอนุมัติ
    const { data: approvals } = await supabaseAdmin
      .from('approvals')
      .select(`
        *,
        users!approvals_approver_id_fkey (
          employee_code,
          title,
          first_name,
          last_name,
          position
        )
      `)
      .eq('leave_id', id)
      .order('approval_level', { ascending: true });

    // Parse reason to extract actual text and selected dates
    let actualReason = leave.reason;
    let selectedDatesArray = [];
    try {
      const parsed = JSON.parse(leave.reason);
      if (parsed.reason && parsed.selected_dates) {
        actualReason = parsed.reason;
        selectedDatesArray = parsed.selected_dates;
      }
    } catch (e) {
      // If not JSON, use as-is
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave details retrieved successfully',
      {
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: {
          name: leave.leave_types.type_name,
          code: leave.leave_types.type_code,
          description: leave.leave_types.description
        },
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: actualReason,
        selectedDates: selectedDatesArray,
        contactAddress: leave.contact_address,
        contactPhone: leave.contact_phone,
        status: leave.status,
        currentApprovalLevel: leave.current_approval_level,
        documentUrl: leave.document_url,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at,
        cancelledAt: leave.cancelled_at,
        cancelledReason: leave.cancelled_reason,
        approvals: approvals?.map(approval => ({
          level: approval.approval_level,
          action: approval.action,
          comment: approval.comment,
          actionDate: approval.action_date,
          approver: {
            employeeCode: approval.users.employee_code,
            name: `${approval.users.title}${approval.users.first_name} ${approval.users.last_name}`,
            position: approval.users.position
          }
        })) || []
      }
    );
  } catch (error) {
    console.error('Get leave by id error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leave details: ' + error.message
    );
  }
};

/**
 * ยกเลิกคำขอลา (User สามารถยกเลิกได้เมื่อยังไม่ได้รับการอนุมัติขั้นสุดท้าย)
 */
export const cancelLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ไม่สามารถยกเลิกได้ถ้าอนุมัติแล้วหรือยกเลิกไปแล้ว
    if (leave.status === LEAVE_STATUS.APPROVED_FINAL) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Cannot cancel leave that has been fully approved'
      );
    }

    if (leave.status === LEAVE_STATUS.CANCELLED) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Leave request has already been cancelled'
      );
    }

    if (leave.status === LEAVE_STATUS.REJECTED) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Cannot cancel rejected leave request'
      );
    }

    // อัพเดทสถานะเป็น cancelled
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.CANCELLED,
        cancelled_at: new Date().toISOString(),
        cancelled_reason: reason || 'ยกเลิกโดยผู้ยื่นคำขอ'
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: userId,
        leave_id: id,
        action: 'cancelled',
        action_by: userId,
        remarks: reason || 'ยกเลิกโดยผู้ยื่นคำขอ'
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request cancelled successfully'
    );
  } catch (error) {
    console.error('Cancel leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to cancel leave request: ' + error.message
    );
  }
};

/**
 * ดูยอดวันลาคงเหลือ
 */
export const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูลวันลาคงเหลือจาก users (สำหรับลาพักผ่อนและลากิจ)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('personal_leave_balance, vacation_leave_balance')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    // ดึง leave_type_id ของลาป่วย
    const { data: sickType } = await supabaseAdmin
      .from('leave_types')
      .select('id')
      .eq('type_code', 'sick')
      .single();

    let sickDaysUsed = 0;
    
    if (sickType) {
      // นับวันลาป่วยที่ admin อนุมัติแล้ว
      const { data: sickLeaves } = await supabaseAdmin
        .from('leaves')
        .select('total_days')
        .eq('user_id', userId)
        .eq('leave_type_id', sickType.id)
        .eq('status', 'approved_final');

      if (sickLeaves && sickLeaves.length > 0) {
        sickDaysUsed = sickLeaves.reduce((sum, leave) => sum + (leave.total_days || 0), 0);
      }
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave balance retrieved successfully',
      {
        sick: sickDaysUsed, // แสดงวันที่ลาไปแล้ว
        personal: user.personal_leave_balance,
        vacation: user.vacation_leave_balance
      }
    );
  } catch (error) {
    console.error('Get leave balance error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leave balance: ' + error.message
    );
  }
};
