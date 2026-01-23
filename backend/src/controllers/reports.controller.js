import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS, LEAVE_STATUS } from '../config/constants.js';

/**
 * รายงานสรุปการลาทั้งหมด
 */
export const getLeavesSummaryReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      department, 
      leaveType,
      status 
    } = req.query;

    // กำหนดช่วงเวลาเริ่มต้น (ถ้าไม่ระบุ ใช้ปีปัจจุบัน)
    const start = startDate || `${new Date().getFullYear()}-01-01`;
    const end = endDate || `${new Date().getFullYear()}-12-31`;

    let query = supabaseAdmin
      .from('leaves')
      .select(`
        id,
        leave_number,
        start_date,
        end_date,
        total_days,
        status,
        created_at,
        leave_types (
          type_name,
          type_code
        ),
        users (
          employee_code,
          title,
          first_name,
          last_name,
          department
        )
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (department) {
      query = query.eq('users.department', department);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (leaveType) {
      query = query.eq('leave_type_id', leaveType);
    }

    const { data: leaves, error } = await query;

    if (error) {
      throw error;
    }

    // คำนวณสถิติ
    const totalLeaves = leaves.length;
    const totalDays = leaves.reduce((sum, leave) => sum + (leave.total_days || 0), 0);
    
    const statusCount = {
      pending: 0,
      approved_level1: 0,
      approved_level2: 0,
      approved_final: 0,
      rejected: 0,
      cancelled: 0
    };

    const typeCount = {};
    const departmentCount = {};
    const monthlyCount = {};

    leaves.forEach(leave => {
      // นับตามสถานะ
      statusCount[leave.status] = (statusCount[leave.status] || 0) + 1;

      // นับตามประเภท
      const typeName = leave.leave_types?.type_name || 'Unknown';
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;

      // นับตามแผนก
      const dept = leave.users?.department || 'Unknown';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;

      // นับตามเดือน
      const month = new Date(leave.created_at).toISOString().substring(0, 7);
      monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Summary report retrieved successfully',
      {
        period: { startDate: start, endDate: end },
        summary: {
          totalLeaves,
          totalDays,
          avgDaysPerLeave: totalLeaves > 0 ? (totalDays / totalLeaves).toFixed(2) : 0
        },
        byStatus: statusCount,
        byType: typeCount,
        byDepartment: departmentCount,
        byMonth: monthlyCount,
        recentLeaves: leaves.slice(0, 10).map(leave => ({
          leaveNumber: leave.leave_number,
          employee: `${leave.users?.title}${leave.users?.first_name} ${leave.users?.last_name}`,
          employeeCode: leave.users?.employee_code,
          department: leave.users?.department,
          leaveType: leave.leave_types?.type_name,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          status: leave.status,
          createdAt: leave.created_at
        }))
      }
    );
  } catch (error) {
    console.error('Get summary report error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve summary report: ' + error.message
    );
  }
};

/**
 * รายงานการลาแยกตามแผนก
 */
export const getDepartmentReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // ดึงรายชื่อแผนกทั้งหมด
    const { data: departments } = await supabaseAdmin
      .from('users')
      .select('department')
      .not('department', 'is', null);

    const uniqueDepartments = [...new Set(departments?.map(d => d.department))];

    // คำนวณสถิติของแต่ละแผนก
    const departmentStats = await Promise.all(
      uniqueDepartments.map(async (dept) => {
        const { count: totalLeaves } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { count: pending } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .eq('status', LEAVE_STATUS.PENDING)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { count: approved } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .eq('status', LEAVE_STATUS.APPROVED_FINAL)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        const { count: rejected } = await supabaseAdmin
          .from('leaves')
          .select('*, users!inner(*)', { count: 'exact', head: true })
          .eq('users.department', dept)
          .eq('status', LEAVE_STATUS.REJECTED)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        // นับจำนวนพนักงาน
        const { count: employeeCount } = await supabaseAdmin
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('department', dept);

        return {
          department: dept,
          employeeCount,
          totalLeaves,
          pending,
          approved,
          rejected,
          avgLeavesPerEmployee: employeeCount > 0 ? (totalLeaves / employeeCount).toFixed(2) : 0
        };
      })
    );

    // เรียงตามจำนวนการลามากไปน้อย
    departmentStats.sort((a, b) => b.totalLeaves - a.totalLeaves);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Department report retrieved successfully',
      {
        year: parseInt(year),
        departments: departmentStats,
        totalDepartments: departmentStats.length
      }
    );
  } catch (error) {
    console.error('Get department report error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve department report: ' + error.message
    );
  }
};

/**
 * รายงานการลาของพนักงานรายบุคคล
 */
export const getEmployeeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // ดึงข้อมูลพนักงาน
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        employee_code,
        title,
        first_name,
        last_name,
        position,
        department,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance
      `)
      .eq('id', employeeId)
      .single();

    if (employeeError || !employee) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Employee not found'
      );
    }

    // ดึงประวัติการลา
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from('leaves')
      .select(`
        id,
        leave_number,
        start_date,
        end_date,
        total_days,
        reason,
        status,
        created_at,
        leave_types (type_name, type_code)
      `)
      .eq('user_id', employeeId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (leavesError) {
      throw leavesError;
    }

    // คำนวณสถิติ
    const totalLeaves = leaves.length;
    const totalDays = leaves.reduce((sum, leave) => sum + leave.total_days, 0);
    const approvedLeaves = leaves.filter(l => l.status === LEAVE_STATUS.APPROVED_FINAL).length;
    const approvedDays = leaves
      .filter(l => l.status === LEAVE_STATUS.APPROVED_FINAL)
      .reduce((sum, l) => sum + l.total_days, 0);

    const byType = {};
    const byStatus = {
      pending: 0,
      approved_final: 0,
      rejected: 0,
      cancelled: 0
    };

    leaves.forEach(leave => {
      const typeName = leave.leave_types?.type_name || 'Unknown';
      byType[typeName] = (byType[typeName] || 0) + 1;
      byStatus[leave.status] = (byStatus[leave.status] || 0) + 1;
    });

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Employee report retrieved successfully',
      {
        employee: {
          id: employee.id,
          employeeCode: employee.employee_code,
          name: `${employee.title}${employee.first_name} ${employee.last_name}`,
          position: employee.position,
          department: employee.department,
          leaveBalance: {
            sick: employee.sick_leave_balance,
            personal: employee.personal_leave_balance,
            vacation: employee.vacation_leave_balance
          }
        },
        year: parseInt(year),
        statistics: {
          totalLeaves,
          totalDays,
          approvedLeaves,
          approvedDays,
          byType,
          byStatus
        },
        leaves: leaves.map(leave => ({
          leaveNumber: leave.leave_number,
          leaveType: leave.leave_types?.type_name,
          startDate: leave.start_date,
          endDate: leave.end_date,
          totalDays: leave.total_days,
          reason: leave.reason,
          status: leave.status,
          createdAt: leave.created_at
        }))
      }
    );
  } catch (error) {
    console.error('Get employee report error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve employee report: ' + error.message
    );
  }
};

/**
 * รายงานวันลาคงเหลือของพนักงานทั้งหมด
 */
export const getLeaveBalanceReport = async (req, res) => {
  try {
    const { department, search } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        employee_code,
        title,
        first_name,
        last_name,
        position,
        department,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance
      `)
      .order('department', { ascending: true })
      .order('employee_code', { ascending: true });

    if (department) {
      query = query.eq('department', department);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_code.ilike.%${search}%`);
    }

    const { data: employees, error } = await query;

    if (error) {
      throw error;
    }

    // คำนวณสถิติรวม
    const totalEmployees = employees.length;
    const avgSick = employees.reduce((sum, emp) => sum + emp.sick_leave_balance, 0) / totalEmployees;
    const avgPersonal = employees.reduce((sum, emp) => sum + emp.personal_leave_balance, 0) / totalEmployees;
    const avgVacation = employees.reduce((sum, emp) => sum + emp.vacation_leave_balance, 0) / totalEmployees;

    // หาคนที่ใช้วันลาเยอะที่สุด (วันคงเหลือน้อย)
    const lowBalanceEmployees = employees
      .filter(emp => emp.sick_leave_balance < 5 || emp.vacation_leave_balance < 2)
      .map(emp => ({
        employeeCode: emp.employee_code,
        name: `${emp.title}${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        sickBalance: emp.sick_leave_balance,
        vacationBalance: emp.vacation_leave_balance
      }));

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Leave balance report retrieved successfully',
      {
        summary: {
          totalEmployees,
          averageBalance: {
            sick: avgSick.toFixed(2),
            personal: avgPersonal.toFixed(2),
            vacation: avgVacation.toFixed(2)
          }
        },
        lowBalanceAlerts: lowBalanceEmployees,
        employees: employees.map(emp => ({
          employeeCode: emp.employee_code,
          name: `${emp.title}${emp.first_name} ${emp.last_name}`,
          position: emp.position,
          department: emp.department,
          balance: {
            sick: emp.sick_leave_balance,
            personal: emp.personal_leave_balance,
            vacation: emp.vacation_leave_balance,
            total: emp.sick_leave_balance + emp.personal_leave_balance + emp.vacation_leave_balance
          }
        }))
      }
    );
  } catch (error) {
    console.error('Get balance report error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve balance report: ' + error.message
    );
  }
};
