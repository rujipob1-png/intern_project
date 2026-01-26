import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

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
          phone,
          departments (
            department_name,
            department_code
          )
        ),
        director:users!leaves_director_id_fkey (
          title,
          first_name,
          last_name
        )
      `)
      .eq('status', 'approved_level1')
      .order('director_approved_at', { ascending: true });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves for staff review retrieved successfully',
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
        },
        directorApproval: {
          approvedAt: leave.director_approved_at,
          remarks: leave.director_remarks,
          approver: leave.director ? `${leave.director.title}${leave.director.first_name} ${leave.director.last_name}` : null
        }
      }))
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
        central_office_staff_id: staffId,
        central_office_staff_approved_at: new Date().toISOString(),
        central_office_staff_remarks: remarks || 'เอกสารถูกต้อง ครบถ้วน',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
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
        central_office_staff_id: staffId,
        central_office_staff_approved_at: new Date().toISOString(),
        central_office_staff_remarks: remarks,
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
          phone,
          departments (
            department_name,
            department_code
          )
        ),
        director:users!leaves_director_id_fkey (
          title,
          first_name,
          last_name
        ),
        staff:users!leaves_central_office_staff_id_fkey (
          title,
          first_name,
          last_name
        )
      `)
      .eq('status', 'approved_level2')
      .order('central_office_staff_approved_at', { ascending: true });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Pending leaves for head review retrieved successfully',
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
          department: leave.users.departments?.department_name || 'N/A'
        },
        approvalHistory: {
          director: {
            approvedAt: leave.director_approved_at,
            remarks: leave.director_remarks,
            approver: leave.director ? `${leave.director.title}${leave.director.first_name} ${leave.director.last_name}` : null
          },
          staff: {
            approvedAt: leave.central_office_staff_approved_at,
            remarks: leave.central_office_staff_remarks,
            approver: leave.staff ? `${leave.staff.title}${leave.staff.first_name} ${leave.staff.last_name}` : null
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
        central_office_head_id: headId,
        central_office_head_approved_at: new Date().toISOString(),
        central_office_head_remarks: remarks || 'อนุมัติ',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
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
        central_office_head_id: headId,
        central_office_head_approved_at: new Date().toISOString(),
        central_office_head_remarks: remarks,
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
    console.error('Reject leave (level 3) error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave'
    );
  }
};
