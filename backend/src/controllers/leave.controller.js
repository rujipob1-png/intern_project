import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';
import emailService from '../utils/emailService.js';

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
      documentUrl,
      actingPersonId
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
        document_url: documentUrl || null,
        acting_person_id: actingPersonId || null,
        contact_address: contactAddress || null,
        contact_phone: contactPhone || null,
        status: LEAVE_STATUS.PENDING
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // ดึงข้อมูลผู้ยื่นคำขอ รวม department
    const { data: requestor } = await supabaseAdmin
      .from('users')
      .select('employee_code, title, first_name, last_name, department')
      .eq('id', userId)
      .single();

    const requestorName = `${requestor?.title || ''}${requestor?.first_name} ${requestor?.last_name}`.trim();
    const isGOKDepartment = requestor?.department === 'GOK';

    // ถ้าเป็น GOK (ชั้น 3) - ข้าม Director ไปที่หัวหน้าฝ่ายบริหารทั่วไปเลย
    if (isGOKDepartment) {
      // อัพเดทสถานะเป็น approved_level1 (ข้าม Director)
      await supabaseAdmin
        .from('leaves')
        .update({
          status: 'approved_level1',
          current_approval_level: 2
        })
        .eq('id', leave.id);

      // ส่งแจ้งเตือนให้หัวหน้าฝ่ายบริหารทั่วไป (central_office_staff)
      const { data: staffUsers } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          roles!inner (role_name)
        `)
        .eq('roles.role_name', 'central_office_staff');

      if (staffUsers && staffUsers.length > 0) {
        for (const staff of staffUsers) {
          await createNotification(
            staff.id,
            'leave_pending',
            'มีคำขอลาใหม่รอตรวจสอบเอกสาร',
            `${requestorName} (${requestor?.employee_code}) ยื่นคำขอลา${leaveType.type_name} จำนวน ${totalDays} วัน (ชั้น 3 - ข้าม ผอ.กลุ่ม)`,
            leave.id,
            'leave'
          );
        }
      }
    }

    // สร้าง notification ให้ผู้ปฏิบัติหน้าที่แทน (ถ้ามี)
    if (actingPersonId) {
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: actingPersonId,
            type: 'acting_request',
            title: 'คำขอปฏิบัติหน้าที่แทน',
            message: `${requestorName} (${requestor?.employee_code}) ขอให้คุณปฏิบัติหน้าที่แทน ในวันที่ ${selectedDates.join(', ')}`,
            reference_id: leave.id,
            reference_type: 'leave'
          });
      } catch (notifError) {
        console.log('Notification insert skipped:', notifError.message);
      }
    }

    // ส่งแจ้งเตือนให้ Director ในกองเดียวกัน (ยกเว้น GOK - เพราะข้าม Director ไปแล้ว)
    if (!isGOKDepartment) {
      try {
        // หา Director ในกองเดียวกัน
        const { data: directors } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            roles!inner (role_name)
          `)
          .eq('department', requestor?.department)
          .eq('roles.role_name', 'director');

        // ส่งแจ้งเตือนให้ Director ทุกคนในกอง
        if (directors && directors.length > 0) {
          for (const director of directors) {
            await createNotification(
              director.id,
              'leave_pending',
              'มีคำขอลาใหม่รอการอนุมัติ',
              `${requestorName} (${requestor?.employee_code}) ยื่นคำขอลา${leaveType.type_name} จำนวน ${totalDays} วัน รอการอนุมัติจากท่าน`,
              leave.id,
              'leave'
            );
          }
        }
      } catch (directorNotifError) {
        console.log('Director notification skipped:', directorNotifError.message);
      }
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

    // ส่ง email แจ้งเตือนผู้อนุมัติ
    try {
      if (isGOKDepartment) {
        // GOK ข้าม Director ไป central_office_staff เลย
        await emailService.notifyApprovers(leave.id, 'central_office_staff');
      } else {
        // แจ้ง Director ในกองเดียวกัน
        await emailService.notifyApprovers(leave.id, 'director', requestor?.department);
      }
    } catch (emailError) {
      console.log('Approver email notification skipped:', emailError.message);
    }

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
        leaveType: leaveType.type_name, // ใช้ leaveType ที่ดึงมาก่อนหน้า
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

    console.log('getMyLeaves - userId:', userId);

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
      let selectedDatesArray = leave.selected_dates || [];
      
      // ถ้า column ว่าง ลองดึงจาก reason JSON
      try {
        const parsed = JSON.parse(leave.reason);
        if (parsed.reason) {
          actualReason = parsed.reason;
        }
        if (parsed.selected_dates && (!selectedDatesArray || selectedDatesArray.length === 0)) {
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
    const userRole = req.user.roleName; // Use roleName from auth middleware
    const { id } = req.params;

    // Check if user has approver role (can view all leaves)
    const approverRoles = ['director', 'central_office_staff', 'central_office_head', 'admin'];
    const isApprover = approverRoles.includes(userRole);

    // Build query - approvers can see all leaves, regular users only their own
    let query = supabaseAdmin
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
        ),
        acting_person:users!leaves_acting_person_id_fkey (
          id,
          employee_code,
          title,
          first_name,
          last_name,
          position,
          department
        )
      `)
      .eq('id', id);

    // If not approver, only allow viewing own leaves
    if (!isApprover) {
      query = query.eq('user_id', userId);
    }

    const { data: leave, error } = await query.single();

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
    let selectedDatesArray = leave.selected_dates || []; // ใช้ selected_dates จาก column ก่อน
    try {
      const parsed = JSON.parse(leave.reason);
      if (parsed.reason && parsed.selected_dates) {
        actualReason = parsed.reason;
        // ถ้า column selected_dates ว่าง ให้ใช้จาก reason JSON
        if (selectedDatesArray.length === 0) {
          selectedDatesArray = parsed.selected_dates;
        }
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
        documentUrl: leave.document_url,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at,
        cancelledAt: leave.cancelled_at,
        cancelledReason: leave.cancelled_reason,
        actingPerson: leave.acting_person ? {
          id: leave.acting_person.id,
          employeeCode: leave.acting_person.employee_code,
          name: `${leave.acting_person.title || ''}${leave.acting_person.first_name} ${leave.acting_person.last_name}`.trim(),
          position: leave.acting_person.position,
          department: leave.acting_person.department
        } : null,
        actingApproved: leave.acting_approved,
        actingApprovedAt: leave.acting_approved_at,
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
 * ขอยกเลิกคำขอลา (User ส่งคำขอยกเลิก - ต้องรอการอนุมัติจากผู้บังคับบัญชา)
 */
export const cancelLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    console.log('Cancel leave request - leaveId:', id, 'userId:', userId);

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    console.log('Leave found:', leave, 'Error:', fetchError);

    if (fetchError || !leave) {
      // ดู leave โดยไม่ filter user_id เพื่อ debug
      const { data: anyLeave } = await supabaseAdmin
        .from('leaves')
        .select('id, user_id, leave_number')
        .eq('id', id)
        .single();
      console.log('Leave without user filter:', anyLeave);
      
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบสถานะ - ไม่สามารถยกเลิกได้ถ้ายกเลิกไปแล้วหรือถูกปฏิเสธ
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

    // ตรวจสอบว่ากำลังรอพิจารณายกเลิกอยู่หรือไม่
    if (leave.status.startsWith('pending_cancel') || leave.status.startsWith('cancel_level')) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Leave cancellation is already pending approval'
      );
    }

    // อัพเดทสถานะเป็น pending_cancel (รอพิจารณาการยกเลิก)
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.PENDING_CANCEL,
        cancel_requested_at: new Date().toISOString(),
        cancelled_reason: reason || 'ขอยกเลิกโดยผู้ยื่นคำขอ'
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
        action: 'cancel_requested',
        action_by: userId,
        remarks: reason || 'ขอยกเลิกโดยผู้ยื่นคำขอ'
      });

    // ส่งแจ้งเตือนให้ Director ในกองเดียวกันว่ามีคำขอยกเลิก
    try {
      // ดึงข้อมูลผู้ขอลา
      const { data: requestor } = await supabaseAdmin
        .from('users')
        .select('first_name, last_name, employee_code, department')
        .eq('id', userId)
        .single();

      const requestorName = `${requestor?.first_name || ''} ${requestor?.last_name || ''}`.trim();
      
      // ดึง leave type
      const { data: leaveType } = await supabaseAdmin
        .from('leave_types')
        .select('type_name')
        .eq('id', leave.leave_type_id)
        .single();

      // หา Director ในกองเดียวกัน
      const { data: directors } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          roles!inner (role_name)
        `)
        .eq('department', requestor?.department)
        .eq('roles.role_name', 'director');

      // ส่งแจ้งเตือนให้ Director
      if (directors && directors.length > 0) {
        for (const director of directors) {
          await createNotification(
            director.id,
            'cancel_pending',
            'มีคำขอยกเลิกการลารอการอนุมัติ',
            `${requestorName} (${requestor?.employee_code}) ยื่นขอยกเลิกคำขอลา${leaveType?.type_name || ''} รอการอนุมัติจากท่าน`,
            id,
            'leave'
          );
        }
      }
    } catch (notifError) {
      console.log('Director cancel notification skipped:', notifError.message);
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave cancellation request submitted successfully. Waiting for approval.',
      { status: LEAVE_STATUS.PENDING_CANCEL }
    );
  } catch (error) {
    console.error('Cancel leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to submit leave cancellation request: ' + error.message
    );
  }
};

/**
 * อนุมัติ/ปฏิเสธการยกเลิกคำขอลา (สำหรับผู้มีอำนาจอนุมัติ)
 */
export const approveCancelLeave = async (req, res) => {
  try {
    const approverId = req.user.id;
    const approverRole = req.user.role_name;
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    // ตรวจสอบว่ามีคำขอลานี้หรือไม่
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select('*, users!leaves_user_id_fkey(first_name, last_name, employee_code)')
      .eq('id', id)
      .single();

    if (fetchError || !leave) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Leave request not found'
      );
    }

    // ตรวจสอบว่าเป็นคำขอยกเลิกหรือไม่
    const cancelStatuses = ['pending_cancel', 'cancel_level1', 'cancel_level2', 'cancel_level3'];
    if (!cancelStatuses.includes(leave.status)) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending cancellation'
      );
    }

    // ตรวจสอบว่า role มีสิทธิ์อนุมัติสถานะปัจจุบันหรือไม่
    const roleToStatusMap = {
      'director': 'pending_cancel',
      'central_office_staff': 'cancel_level1',
      'central_office_head': 'cancel_level2',
      'admin': 'cancel_level3'
    };

    if (roleToStatusMap[approverRole] !== leave.status) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You are not authorized to approve this cancellation at this stage'
      );
    }

    let newStatus;
    if (action === 'reject') {
      // ถ้าปฏิเสธการยกเลิก - คืนสถานะเดิม (ใช้สถานะ approved_final เพราะส่วนใหญ่จะยกเลิกหลังอนุมัติแล้ว)
      newStatus = LEAVE_STATUS.APPROVED_FINAL;
    } else {
      // ถ้าอนุมัติ - ไปสถานะถัดไป
      const nextStatusMap = {
        'pending_cancel': LEAVE_STATUS.CANCEL_LEVEL1,
        'cancel_level1': LEAVE_STATUS.CANCEL_LEVEL2,
        'cancel_level2': LEAVE_STATUS.CANCEL_LEVEL3,
        'cancel_level3': LEAVE_STATUS.CANCELLED // ยกเลิกสำเร็จ
      };
      newStatus = nextStatusMap[leave.status];
    }

    // อัพเดทสถานะ
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // ถ้ายกเลิกสำเร็จ
    if (newStatus === LEAVE_STATUS.CANCELLED) {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = approverId;
    }

    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: leave.user_id,
        leave_id: id,
        action: action === 'approve' ? 'cancel_approved' : 'cancel_rejected',
        action_by: approverId,
        remarks: comment || (action === 'approve' ? 'อนุมัติการยกเลิก' : 'ปฏิเสธการยกเลิก')
      });

    // แจ้งเตือนผู้ยื่นคำขอ
    const statusMessage = newStatus === LEAVE_STATUS.CANCELLED 
      ? 'คำขอยกเลิกการลาของคุณได้รับการอนุมัติแล้ว'
      : action === 'reject' 
        ? 'คำขอยกเลิกการลาของคุณถูกปฏิเสธ'
        : 'คำขอยกเลิกการลาของคุณผ่านการพิจารณาขั้นหนึ่งแล้ว รอการพิจารณาจากผู้บังคับบัญชาขั้นถัดไป';

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: leave.user_id,
        type: 'cancel_leave_update',
        message: statusMessage,
        data: { leave_id: id, status: newStatus }
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      action === 'approve' ? 'Cancellation approved successfully' : 'Cancellation rejected',
      { status: newStatus }
    );
  } catch (error) {
    console.error('Approve cancel leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to process cancellation: ' + error.message
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
      .eq('type_code', 'SICK')
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

      console.log('Sick leaves found:', sickLeaves);

      if (sickLeaves && sickLeaves.length > 0) {
        sickDaysUsed = sickLeaves.reduce((sum, leave) => sum + (leave.total_days || 0), 0);
      }
    } else {
      console.log('Sick leave type not found');
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

/**
 * ดึงข้อมูลการลาสำหรับปฏิทิน
 * - User: ดูการลาของตัวเอง + การลาที่อนุมัติแล้วในแผนกเดียวกัน
 * - Director: ดูการลาของพนักงานในแผนก
 * - Admin/Central: ดูทั้งหมด
 */
export const getCalendarLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, department, startDate, endDate } = req.query;

    // ดึงข้อมูลผู้ใช้
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('department')
      .eq('id', userId)
      .single();

    if (userError) {
      throw userError;
    }

    // สร้าง query พื้นฐาน
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
        selected_dates,
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
      .order('start_date', { ascending: false });

    // Filter by role
    if (userRole === 'user') {
      // User sees their own leaves + approved leaves in same department
      const { data: deptUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('department', currentUser.department);
      
      const deptUserIds = deptUsers?.map(u => u.id) || [userId];
      
      query = query.in('user_id', deptUserIds);
      
      // If not their own leave, only show approved
      if (!status) {
        query = query.or(`user_id.eq.${userId},status.eq.approved_final`);
      }
    } else if (userRole === 'director') {
      // Director sees all leaves in their department
      const { data: deptUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('department', currentUser.department);
      
      const deptUserIds = deptUsers?.map(u => u.id) || [];
      query = query.in('user_id', deptUserIds);
    }
    // Admin and Central Office see all leaves

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by department (for admin/central)
    if (department && (userRole === 'admin' || userRole === 'central_office_staff' || userRole === 'central_office_head')) {
      const { data: deptUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('department', department);
      
      const deptUserIds = deptUsers?.map(u => u.id) || [];
      if (deptUserIds.length > 0) {
        query = query.in('user_id', deptUserIds);
      }
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    // Limit results
    query = query.limit(500);

    const { data: leaves, error } = await query;

    if (error) {
      throw error;
    }

    // Transform data for calendar
    const calendarData = leaves.map(leave => {
      // Parse selected_dates if it's a string
      let selectedDates = leave.selected_dates;
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
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        status: leave.status,
        reason: leave.reason,
        selectedDates: selectedDates,
        leaveType: leave.leave_types?.type_name,
        leaveTypeCode: leave.leave_types?.type_code,
        user: leave.users ? {
          id: leave.users.id,
          employeeCode: leave.users.employee_code,
          first_name: leave.users.first_name,
          last_name: leave.users.last_name,
          department: leave.users.department
        } : null
      };
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Calendar leaves retrieved successfully',
      calendarData
    );
  } catch (error) {
    console.error('Get calendar leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve calendar leaves: ' + error.message
    );
  }
};
