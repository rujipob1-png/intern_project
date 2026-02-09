import bcrypt from 'bcrypt';
import { supabaseAdmin } from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';

/**
 * Login ด้วยรหัสตำแหน่ง (employee_code) และรหัสผ่าน
 */
export const login = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    // Validate input
    if (!employeeCode && !password) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'กรุณากรอกรหัสพนักงานและรหัสผ่าน',
        { errorCode: 'MISSING_BOTH' }
      );
    }
    if (!employeeCode) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'กรุณากรอกรหัสพนักงาน',
        { errorCode: 'MISSING_EMPLOYEE_CODE' }
      );
    }
    if (!password) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'กรุณากรอกรหัสผ่าน',
        { errorCode: 'MISSING_PASSWORD' }
      );
    }

    // หา user จาก employee_code
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        employee_code,
        password_hash,
        title,
        first_name,
        last_name,
        position,
        department,
        phone,
        email,
        email_notifications,
        role_id,
        is_active,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        roles (
          id,
          role_name,
          role_level,
          description
        )
      `)
      .eq('employee_code', employeeCode)
      .single();

    if (error || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'ไม่พบรหัสพนักงานนี้ในระบบ กรุณาตรวจสอบรหัสพนักงานอีกครั้ง',
        { errorCode: 'EMPLOYEE_NOT_FOUND' }
      );
    }

    // ตรวจสอบว่า account ถูกปิดใช้งานหรือไม่
    if (!user.is_active) {
      return errorResponse(
        res,
        HTTP_STATUS.FORBIDDEN,
        'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
        { errorCode: 'ACCOUNT_DEACTIVATED' }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง',
        { errorCode: 'INVALID_PASSWORD' }
      );
    }

    // สร้าง JWT token
    const token = generateToken({
      userId: user.id,
      employeeCode: user.employee_code,
      roleId: user.role_id,
      roleName: user.roles.role_name,
      roleLevel: user.roles.role_level
    });

    // ส่งข้อมูล user และ token กลับไป
    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Login successful',
      {
        token,
        user: {
          id: user.id,
          employeeCode: user.employee_code,
          title: user.title || '',
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.title || ''}${user.first_name} ${user.last_name}`.trim(),
          position: user.position,
          department: user.department,
          phone: user.phone,
          email: user.email,
          emailNotifications: user.email_notifications ?? true,
          role_name: user.roles.role_name, // เพิ่ม role_name ตรงๆ
          roleLevel: user.roles.role_level, // เพิ่ม roleLevel ตรงๆ
          role: {
            id: user.roles.id,
            name: user.roles.role_name,
            level: user.roles.role_level,
            description: user.roles.description
          },
          leaveBalance: {
            sick: user.sick_leave_balance,
            personal: user.personal_leave_balance,
            vacation: user.vacation_leave_balance
          }
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Login failed: ' + error.message
    );
  }
};

/**
 * ดูข้อมูลโปรไฟล์ของตัวเอง
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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
        email,
        email_notifications,
        sick_leave_balance,
        personal_leave_balance,
        vacation_leave_balance,
        created_at,
        roles (
          id,
          role_name,
          role_level,
          description
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Profile retrieved successfully',
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
        emailNotifications: user.email_notifications ?? true,
        role: {
          id: user.roles.id,
          name: user.roles.role_name,
          level: user.roles.role_level,
          description: user.roles.description
        },
        leaveBalance: {
          sick: user.sick_leave_balance,
          personal: user.personal_leave_balance,
          vacation: user.vacation_leave_balance
        },
        createdAt: user.created_at
      }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to retrieve profile: ' + error.message
    );
  }
};

/**
 * เปลี่ยนรหัสผ่าน
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Current password and new password are required'
      );
    }

    if (newPassword.length < 6) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'New password must be at least 6 characters'
      );
    }

    // ดึงข้อมูล user
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return errorResponse(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    // ตรวจสอบรหัสผ่านเดิม
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Current password is incorrect'
      );
    }

    // Hash รหัสผ่านใหม่
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // อัพเดทรหัสผ่าน
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Password changed successfully'
    );
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to change password: ' + error.message
    );
  }
};

/**
 * อัพเดทการตั้งค่าการแจ้งเตือน (Email)
 */
export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, emailNotifications } = req.body;

    // Validate email format
    if (email && !email.includes('@')) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'รูปแบบ Email ไม่ถูกต้อง'
      );
    }

    // Build update object
    const updateData = {};
    if (email !== undefined) updateData.email = email || null;
    if (emailNotifications !== undefined) updateData.email_notifications = emailNotifications;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'ไม่มีข้อมูลที่จะอัพเดท'
      );
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) throw error;

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'อัพเดทการตั้งค่าสำเร็จ',
      updateData
    );
  } catch (error) {
    console.error('Update notification settings error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'ไม่สามารถอัพเดทการตั้งค่าได้: ' + error.message
    );
  }
};
