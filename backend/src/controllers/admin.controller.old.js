import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS, APPROVAL_ACTIONS } from '../config/constants.js';

/**
 * ดูคำขอลาที่ผ่าน Central Office Head แล้ว (Admin Role - Level 4)
 */
export const getApprovedLevel3Leaves = async (req, res) => {
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
      .eq('status', LEAVE_STATUS.APPROVED_LEVEL3)
      .eq('current_approval_level', 4) // Level 4 = Admin
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Approved level 3 leaves retrieved successfully',
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
    console.error('Get approved level 3 leaves error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leaves: ' + error.message
    );
  }
};

/**
 * อนุมัติคำขอลาขั้นสุดท้าย และหักวันลา (Admin Role - Level 4)
 */
export const approveLeaveFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

    // ดึงข้อมูลการลา
    const { data: leave, error: fetchError } = await supabaseAdmin
      .from('leaves')
      .select(`
        *,
        leave_types (type_code)
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

    if (leave.status !== LEAVE_STATUS.APPROVED_LEVEL3 || leave.current_approval_level !== 4) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for admin final approval'
      );
    }

    // ดึงข้อมูลวันลาคงเหลือของ user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('sick_leave_balance, personal_leave_balance, vacation_leave_balance')
      .eq('id', leave.user_id)
      .single();

    if (userError || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    // ตรวจสอบวันลาคงเหลือ
    const leaveTypeCode = leave.leave_types.type_code;
    let balanceField;
    let currentBalance;

    if (leaveTypeCode === 'SICK') {
      balanceField = 'sick_leave_balance';
      currentBalance = user.sick_leave_balance;
    } else if (leaveTypeCode === 'PERSONAL') {
      balanceField = 'personal_leave_balance';
      currentBalance = user.personal_leave_balance;
    } else if (leaveTypeCode === 'VACATION') {
      balanceField = 'vacation_leave_balance';
      currentBalance = user.vacation_leave_balance;
    } else {
      // สำหรับประเภทอื่นๆ เช่น ลาคลอด ไม่ต้องหักวันลา
      balanceField = null;
    }

    // ตรวจสอบว่าวันลาพอหรือไม่ (ถ้ามีการหัก)
    if (balanceField && currentBalance < leave.total_days) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        `Insufficient leave balance. Current: ${currentBalance} days, Required: ${leave.total_days} days`
      );
    }

    // อัพเดทสถานะเป็น approved_final
    const { error: updateError } = await supabaseAdmin
      .from('leaves')
      .update({
        status: LEAVE_STATUS.APPROVED_FINAL
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // หักวันลา (ถ้ามี)
    if (balanceField) {
      const newBalance = currentBalance - leave.total_days;
      
      const { error: balanceError } = await supabaseAdmin
        .from('users')
        .update({
          [balanceField]: newBalance
        })
        .eq('id', leave.user_id);

      if (balanceError) {
        throw balanceError;
      }

      // บันทึก log การเปลี่ยนแปลงวันลา
      await supabaseAdmin
        .from('leave_balance_logs')
        .insert({
          user_id: leave.user_id,
          leave_id: id,
          leave_type: leaveTypeCode.toLowerCase(),
          change_amount: -leave.total_days,
          balance_after: newBalance,
          reason: `หักวันลาจากการอนุมัติคำขอลาเลขที่ ${leave.leave_number}`
        });
    }

    // บันทึกการอนุมัติ
    const { error: approvalError } = await supabaseAdmin
      .from('approvals')
      .insert({
        leave_id: id,
        approver_id: approverId,
        approval_level: 4, // Admin = Level 4
        action: APPROVAL_ACTIONS.APPROVED,
        comment: comment || 'อนุมัติขั้นสุดท้าย'
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
        action: 'approved_final',
        action_by: approverId,
        remarks: `Admin อนุมัติขั้นสุดท้าย${balanceField ? ` และหักวันลา ${leave.total_days} วัน` : ''}: ${comment || 'อนุมัติขั้นสุดท้าย'}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request approved successfully and leave balance updated',
      {
        leaveDeducted: balanceField ? leave.total_days : 0,
        newBalance: balanceField ? currentBalance - leave.total_days : null,
        message: 'อนุมัติสมบูรณ์ ระบบได้หักวันลาเรียบร้อยแล้ว'
      }
    );
  } catch (error) {
    console.error('Approve leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to approve leave request: ' + error.message
    );
  }
};

/**
 * ไม่อนุมัติคำขอลาขั้นสุดท้าย (Admin Role)
 */
export const rejectLeaveFinal = async (req, res) => {
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

    if (leave.status !== LEAVE_STATUS.APPROVED_LEVEL2 || leave.current_approval_level !== APPROVAL_LEVELS.ADMIN) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'This leave request is not pending for admin approval'
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
        approval_level: APPROVAL_LEVELS.ADMIN,
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
        remarks: `Admin ไม่อนุมัติ: ${comment}`
      });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave request rejected by admin successfully'
    );
  } catch (error) {
    console.error('Reject leave final error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to reject leave request: ' + error.message
    );
  }
};

/**
 * ดู Dashboard สำหรับ Admin
 */
export const getDashboard = async (req, res) => {
  try {
    // จำนวน users ทั้งหมด
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // จำนวนคำขอลาทั้งหมด
    const { count: totalLeaves } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true });

    // คำขอลาที่รออนุมัติแต่ละระดับ
    const { count: pendingLevel1 } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.PENDING);

    const { count: pendingLevel2 } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.APPROVED_LEVEL1);

    const { count: pendingLevel3 } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.APPROVED_LEVEL2);

    const { count: approved } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.APPROVED_FINAL);

    const { count: rejected } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.REJECTED);

    const { count: cancelled } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('status', LEAVE_STATUS.CANCELLED);

    // คำขอลา 10 รายการล่าสุด
    const { data: recentLeaves } = await supabaseAdmin
      .from('leaves')
      .select(`
        id,
        leave_number,
        start_date,
        end_date,
        total_days,
        status,
        created_at,
        leave_types (type_name),
        users (employee_code, title, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // สถิติตาม leave type
    const { data: leavesByType } = await supabaseAdmin
      .from('leaves')
      .select(`
        leave_type_id,
        leave_types (type_name)
      `);

    const typeStats = {};
    leavesByType?.forEach(leave => {
      const typeName = leave.leave_types?.type_name || 'Unknown';
      typeStats[typeName] = (typeStats[typeName] || 0) + 1;
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Dashboard data retrieved successfully',
      {
        users: {
          total: totalUsers
        },
        leaves: {
          total: totalLeaves,
          pending: {
            level1: pendingLevel1,
            level2: pendingLevel2,
            level3: pendingLevel3
          },
          approved: approved,
          rejected: rejected,
          cancelled: cancelled
        },
        recentLeaves: recentLeaves?.map(leave => ({
          id: leave.id,
          leaveNumber: leave.leave_number,
          employee: `${leave.users.title}${leave.users.first_name} ${leave.users.last_name} (${leave.users.employee_code})`,
          leaveType: leave.leave_types.type_name,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          status: leave.status,
          createdAt: leave.created_at
        })),
        leavesByType: typeStats
      }
    );
  } catch (error) {
    console.error('Get dashboard error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve dashboard data: ' + error.message
    );
  }
};

/**
 * ดูรายชื่อ users ทั้งหมด (Admin Role)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, roleLevel } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        roles (
          role_name,
          role_level
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_code.ilike.%${search}%`);
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (roleLevel) {
      query = query.eq('roles.role_level', roleLevel);
    }

    const { data: users, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Users retrieved successfully',
      {
        users: users.map(user => ({
          id: user.id,
          employeeCode: user.employee_code,
          fullName: `${user.title}${user.first_name} ${user.last_name}`,
          position: user.position,
          department: user.department,
          phone: user.phone,
          email: user.email,
          role: {
            name: user.roles.role_name,
            level: user.roles.role_level
          },
          leaveBalance: {
            sick: user.sick_leave_balance,
            personal: user.personal_leave_balance,
            vacation: user.vacation_leave_balance
          },
          isActive: user.is_active,
          createdAt: user.created_at
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
    console.error('Get all users error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve users: ' + error.message
    );
  }
};

/**
 * ดูข้อมูล user 1 คน (Admin Role)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        roles (
          role_name,
          role_level
        )
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    // ดึงสถิติการลาของ user
    const { count: totalLeaves } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    const { count: approvedLeaves } = await supabaseAdmin
      .from('leaves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', LEAVE_STATUS.APPROVED_FINAL);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'User retrieved successfully',
      {
        id: user.id,
        employeeCode: user.employee_code,
        title: user.title,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.title}${user.first_name} ${user.last_name}`,
        position: user.position,
        department: user.department,
        phone: user.phone,
        email: user.email,
        role: {
          name: user.roles.role_name,
          level: user.roles.role_level
        },
        leaveBalance: {
          sick: user.sick_leave_balance,
          personal: user.personal_leave_balance,
          vacation: user.vacation_leave_balance
        },
        statistics: {
          totalLeaves: totalLeaves,
          approvedLeaves: approvedLeaves
        },
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    );
  } catch (error) {
    console.error('Get user by id error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve user: ' + error.message
    );
  }
};

/**
 * ดึงข้อมูล leave types ทั้งหมด
 */
export const getLeaveTypes = async (req, res) => {
  try {
    const { data: leaveTypes, error } = await supabaseAdmin
      .from('leave_types')
      .select('*')
      .order('type_code', { ascending: true });

    if (error) {
      throw error;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave types retrieved successfully',
      { leaveTypes }
    );
  } catch (error) {
    console.error('Get leave types error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve leave types: ' + error.message
    );
  }
};
