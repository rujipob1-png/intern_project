import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS, APPROVAL_ACTIONS } from '../config/constants.js';

/**
 * ดูคำขอลาที่ผ่าน Director แล้ว (Central Office Staff Role - Level 2)
 */
export const getApprovedLevel1Leaves = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: leaves, error, count } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        ),
        users!leaves_user_id_fkey (
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
      `, { count: 'exact' })
      .eq('status', LEAVE_STATUS.APPROVED_LEVEL1)
      .eq('current_approval_level', 2) // Level 2 = Central Office Staff
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approved level 1 leaves retrieved successfully',
      {
        leaves: leaves.map(leave => ({
          id: leave.id,
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types.type_name,
          leaveTypeCode: leave.leave_types.type_code,
          startDate: leave.start_date,
          endDate: leave.end_date,
          selectedDates: leave.selected_dates,
          totalDays: leave.total_days,
          reason: leave.reason,
          contactAddress: leave.contact_address,
          contactPhone: leave.contact_phone,
          documentUrl: leave.document_url,
          status: leave.status,
          createdAt: leave.created_at,
          employee: {
            employeeCode: leave.users.employee_code,
            name: `${leave.users.title}${leave.users.first_name} ${leave.users.last_name}`,
            position: leave.users.position,
            department: leave.users.departments?.department_name || 'N/A',
            phone: leave.users.phone
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Get approved level 1 leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leaves: ' + error.message
    );
  }
};

/**
 * อนุมัติคำขอลาระดับ 2 (Central Office Staff Role)
 * ส่งต่อไปยัง Central Office Head
 */
export const approveLeaveLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

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

    if (leave.status !== LEAVE_STATUS.APPROVED_LEVEL1 || leave.current_approval_level !== 2) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for central office staff approval'
      );
    }

    // อัพเดทสถานะเป็น approved_level2 และส่งต่อไป Central Office Head (level 3)
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.APPROVED_LEVEL2,
        current_approval_level: 3 // ส่งไป Central Office Head
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกการอนุมัติ
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: approverId,
        approval_level: 2,
        action: APPROVAL_ACTIONS.APPROVED,
        comment: comment || 'ตรวจสอบเรียบร้อย ส่งต่อหัวหน้ากองกลาง'
      });

    if (approvalError) {
      throw approvalError;
    }

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: leave.user_id,
        leave_id: id,
        action: 'approved_level2',
        action_by: approverId,
        remarks: `พนักงานกองกลางตรวจสอบแล้ว: ${comment || 'ตรวจสอบเรียบร้อย ส่งต่อหัวหน้ากองกลาง'}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request approved by central office staff successfully',
      {
        nextLevel: 'Central Office Head',
        message: 'ส่งเรื่องไปยังหัวหน้ากองกลางแล้ว'
      }
    );
  } catch (error) {
    console.error('Approve leave level 2 error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave request: ' + error.message
    );
  }
};

/**
 * ดูคำขอลาที่ผ่าน Central Office Staff แล้ว (Central Office Head Role - Level 3)
 */
export const getApprovedLevel2Leaves = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: leaves, error, count } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (
          type_name,
          type_code
        ),
        users!leaves_user_id_fkey (
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
      `, { count: 'exact' })
      .eq('status', LEAVE_STATUS.APPROVED_LEVEL2)
      .eq('current_approval_level', 3) // Level 3 = Central Office Head
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approved level 2 leaves retrieved successfully',
      {
        leaves: leaves.map(leave => ({
          id: leave.id,
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types.type_name,
          leaveTypeCode: leave.leave_types.type_code,
          startDate: leave.start_date,
          endDate: leave.end_date,
          selectedDates: leave.selected_dates,
          totalDays: leave.total_days,
          reason: leave.reason,
          contactAddress: leave.contact_address,
          contactPhone: leave.contact_phone,
          documentUrl: leave.document_url,
          status: leave.status,
          createdAt: leave.created_at,
          employee: {
            employeeCode: leave.users.employee_code,
            name: `${leave.users.title}${leave.users.first_name} ${leave.users.last_name}`,
            position: leave.users.position,
            department: leave.users.departments?.department_name || 'N/A',
            phone: leave.users.phone
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Get approved level 2 leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leaves: ' + error.message
    );
  }
};

/**
 * อนุมัติคำขอลาระดับ 3 (Central Office Head Role)
 * ส่งต่อไปยัง Admin
 */
export const approveLeaveLevel3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

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

    if (leave.status !== LEAVE_STATUS.APPROVED_LEVEL2 || leave.current_approval_level !== 3) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for central office head approval'
      );
    }

    // อัพเดทสถานะเป็น approved_level3 และส่งต่อไป Admin (level 4)
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.APPROVED_LEVEL3,
        current_approval_level: 4 // ส่งไป Admin
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // บันทึกการอนุมัติ
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: approverId,
        approval_level: 3,
        action: APPROVAL_ACTIONS.APPROVED,
        comment: comment || 'อนุมัติตามที่เสนอ'
      });

    if (approvalError) {
      throw approvalError;
    }

    // บันทึก history
    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: leave.user_id,
        leave_id: id,
        action: 'approved_level3',
        action_by: approverId,
        remarks: `หัวหน้ากองกลางอนุมัติ: ${comment || 'อนุมัติตามที่เสนอ'}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request approved by central office head successfully',
      {
        nextLevel: 'Admin',
        message: 'ส่งเรื่องไปยังผู้บริหารสูงสุดแล้ว'
      }
    );
  } catch (error) {
    console.error('Approve leave level 3 error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave request: ' + error.message
    );
  }
};

/**
 * ไม่อนุมัติคำขอลาระดับ 2 (Central Office Staff Role)
 */
export const rejectLeaveLevel2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

    if (!comment || comment.trim() === '') {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Comment is required when rejecting a leave request'
      );
    }

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

    if (leave.status !== LEAVE_STATUS.APPROVED_LEVEL1 || leave.current_approval_level !== APPROVAL_LEVELS.CENTRAL_OFFICE) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for central office approval'
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.REJECTED
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: approverId,
        approval_level: APPROVAL_LEVELS.CENTRAL_OFFICE,
        action: APPROVAL_ACTIONS.REJECTED,
        comment: comment
      });

    if (approvalError) {
      throw approvalError;
    }

    await supabaseAdmin
      .from('leave_history')
      .insert({
        user_id: leave.user_id,
        leave_id: id,
        action: 'rejected',
        action_by: approverId,
        remarks: `กองกลางไม่อนุมัติ: ${comment}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request rejected by central office successfully'
    );
  } catch (error) {
    console.error('Reject leave level 2 error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave request: ' + error.message
    );
  }
};

/**
 * ดูสถิติการลาทั้งหมด (Central Office Role)
 */
export const getLeaveStatistics = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;

    // สร้าง date range
    let startDate, endDate;
    if (month) {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    // จำนวนคำขอลาทั้งหมด
    const { count: totalLeaves } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // แยกตามสถานะ
    const { count: pending } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.PENDING)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: approved } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.APPROVED_FINAL)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: rejected } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.REJECTED)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { count: cancelled } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.CANCELLED)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // สถิติตามประเภทการลา
    const { data: leavesByType } = await supabaseAdmin
      .from('leaves')
      .select(`
        leave_type_id,
        leave_types (type_name, type_code)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const typeStats = {};
    leavesByType?.forEach(leave => {
      const typeName = leave.leave_types?.type_name || 'Unknown';
      typeStats[typeName] = (typeStats[typeName] || 0) + 1;
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave statistics retrieved successfully',
      {
        period: month ? `${year}-${String(month).padStart(2, '0')}` : year,
        total: totalLeaves,
        byStatus: {
          pending,
          approved,
          rejected,
          cancelled
        },
        byType: typeStats
      }
    );
  } catch (error) {
    console.error('Get leave statistics error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve statistics: ' + error.message
    );
  }
};

/**
 * ดูรายงานการลาแยกตามแผนก (Central Office Role)
 */
export const getLeavesByDepartment = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // ดึงข้อมูลแผนกทั้งหมด
    const { data: departments } = await supabaseAdmin
      .from('users')
      .select('department')
      .not('department', 'is', null);

    const uniqueDepartments = [...new Set(departments?.map(d => d.department))];

    // นับจำนวนการลาของแต่ละแผนก
    const departmentStats = await Promise.all(
      uniqueDepartments.map(async (dept) => {
        const { count: totalLeaves } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept);

        const { count: pending } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .eq('status', LEAVE_STATUS.PENDING);

        const { count: approved } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .eq('status', LEAVE_STATUS.APPROVED_FINAL);

        return {
          department: dept,
          totalLeaves,
          pending,
          approved
        };
      })
    );

    // Sort by totalLeaves descending
    departmentStats.sort((a, b) => b.totalLeaves - a.totalLeaves);

    const paginatedData = departmentStats.slice(offset, offset + limit);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Department leave report retrieved successfully',
      {
        departments: paginatedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(departmentStats.length / limit),
          totalItems: departmentStats.length,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Get leaves by department error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve department report: ' + error.message
    );
  }
};

/**
 * ดูประวัติการอนุมัติทั้งหมด (Central Office Role)
 */
export const getAllApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, approvalLevel } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('approvals')
      .select(`
        *,
        leaves (
          leave_number,
          start_date,
          end_date,
          leave_types (type_name)
        ),
        users!approvals_approver_id_fkey (
          employee_code,
          title,
          first_name,
          last_name,
          position
        )
      `, { count: 'exact' })
      .order('action_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (approvalLevel) {
      query = query.eq('approval_level', approvalLevel);
    }

    const { data: approvals, error, count } = await query;

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approval history retrieved successfully',
      {
        approvals: approvals.map(approval => ({
          id: approval.id,
          leaveNumber: approval.leaves?.leave_number,
          leaveType: approval.leaves?.leave_types?.type_name,
          startDate: approval.leaves?.start_date,
          endDate: approval.leaves?.end_date,
          approvalLevel: approval.approval_level,
          action: approval.action,
          comment: approval.comment,
          actionDate: approval.action_date,
          approver: {
            employeeCode: approval.users.employee_code,
            name: `${approval.users.title}${approval.users.first_name} ${approval.users.last_name}`,
            position: approval.users.position
          }
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    );
  } catch (error) {
    console.error('Get all approvals error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve approval history: ' + error.message
    );
  }
};
