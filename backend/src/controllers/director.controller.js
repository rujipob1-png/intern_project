import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

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
      .select('department_id')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department_id) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Director department not found'
      );
    }

    // ดึงคำขอลาที่รอการอนุมัติระดับ 1 (pending)
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
          department_id,
          phone,
          departments (
            department_name,
            department_code
          )
        )
      `)
      .eq('status', 'pending')
      .eq('users.department_id', director.department_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves retrieved successfully',
      leaves.map(leave => ({
        id: leave.id,
        leaveNumber: leave.leave_number,
        leaveType: leave.leave_types.type_name,
        leaveTypeCode: leave.leave_types.type_code,
        startDate: leave.start_date,
        endDate: leave.end_date,
        totalDays: leave.total_days,
        reason: leave.reason,
        documentUrl: leave.document_url,
        createdAt: leave.created_at,
        employee: {
          employeeCode: leave.users.employee_code,
          name: `${leave.users.title}${leave.users.first_name} ${leave.users.last_name}`,
          position: leave.users.position,
          department: leave.users.departments?.department_name || 'N/A',
          phone: leave.users.phone
        }
      }))
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
      .select('department_id')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department_id) {
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
          department_id
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
    if (leave.users.department_id !== director.department_id) {
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

    // อัพเดทสถานะเป็น approved_level1 และบันทึกข้อมูลผู้อนุมัติ
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: 'approved_level1',
        director_id: directorId,
        director_approved_at: new Date().toISOString(),
        director_remarks: remarks || 'อนุมัติ',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

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
      .select('department_id')
      .eq('id', directorId)
      .single();

    if (directorError || !director.department_id) {
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
          department_id
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
    if (leave.users.department_id !== director.department_id) {
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
        director_id: directorId,
        director_approved_at: new Date().toISOString(),
        director_remarks: remarks,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
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
    console.error('Reject leave error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};
