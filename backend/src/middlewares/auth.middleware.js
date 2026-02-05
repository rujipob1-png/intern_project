import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Middleware สำหรับตรวจสอบ Authentication
 */
export const authenticate = async (req, res, next) => {
  try {
    // ดึง token จาก header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'No token provided. Please login.'
      );
    }

    const token = authHeader.substring(7); // ตัด "Bearer " ออก

    // Verify token
    const decoded = verifyToken(token);

    // ดึงข้อมูล user จาก database
    const { data: user, error } = await supabaseAdmin
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
        role_id,
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
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'User account no longer exists or has been deleted'
      );
    }
    
    // ตรวจสอบว่า account ถูกปิดใช้งานหรือไม่
    if (!user.is_active) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'Your account has been deactivated'
      );
    }

    // เก็บข้อมูล user ไว้ใน req เพื่อใช้ใน controller
    req.user = {
      id: user.id,
      employeeCode: user.employee_code,
      title: user.title,
      firstName: user.first_name,
      lastName: user.last_name,
      position: user.position,
      department: user.department,
      phone: user.phone,
      roleId: user.role_id,
      roleName: user.roles?.role_name || null,
      roleLevel: user.roles?.role_level || null,
      leaveBalance: {
        sick: user.sick_leave_balance,
        personal: user.personal_leave_balance,
        vacation: user.vacation_leave_balance
      }
    };

    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Token has expired. Please login again.'
      );
    }
    return errorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'Authentication failed: ' + error.message
    );
  }
};
