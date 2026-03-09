import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';

/**
 * ลงทะเบียนพนักงานใหม่ (Public — ไม่ต้อง login)
 */
export const register = async (req, res) => {
  try {
    const {
      employeeCode,
      password,
      title,
      firstName,
      lastName,
      position,
      departmentCode,
      phone,
      email,
      hireDate,
    } = req.body;

    // Validate required fields
    if (!employeeCode || !password || !firstName || !lastName || !hireDate) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'กรุณากรอกข้อมูลที่จำเป็น (รหัสพนักงาน, รหัสผ่าน, ชื่อ, นามสกุล, วันเข้ารับราชการ)'
      );
    }

    if (password.length < 8) {
      return errorResponse(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
      );
    }

    const code = employeeCode.toUpperCase().trim();

    // Check if employee code already exists in users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('employee_code', code)
      .single();

    if (existingUser) {
      return errorResponse(
        res,
        HTTP_STATUS.CONFLICT,
        'รหัสพนักงานนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ'
      );
    }

    // Check if there's already a pending registration
    const { data: existingRequest } = await supabaseAdmin
      .from('registration_requests')
      .select('id, status')
      .eq('employee_code', code)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return errorResponse(
        res,
        HTTP_STATUS.CONFLICT,
        'มีคำขอลงทะเบียนรหัสพนักงานนี้อยู่แล้ว กรุณารอการอนุมัติ'
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert registration request
    const { data: registration, error: insertError } = await supabaseAdmin
      .from('registration_requests')
      .insert({
        employee_code: code,
        password_hash: passwordHash,
        title: title || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position: position?.trim() || null,
        department_code: departmentCode || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        hire_date: hireDate || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Registration insert error:', insertError);
      return errorResponse(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      );
    }

    // Send notifications to central_office_head and admin
    await notifyAdmins(registration);

    return successResponse(
      res,
      HTTP_STATUS.CREATED,
      'ลงทะเบียนสำเร็จ กรุณารอการอนุมัติจากผู้ดูแลระบบ',
      { id: registration.id, employeeCode: code }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    );
  }
};

/**
 * แจ้งเตือนไปยัง หัวหน้าฝ่ายบริหาร (central_office_head) เท่านั้น
 */
async function notifyAdmins(registration) {
  try {
    // Find users with role central_office_head only
    const { data: adminUsers } = await supabaseAdmin
      .from('users')
      .select('id, employee_code, first_name, last_name, roles!inner(role_name)')
      .in('roles.role_name', ['central_office_head'])
      .eq('is_active', true);

    if (!adminUsers || adminUsers.length === 0) return;

    const fullName = `${registration.title || ''}${registration.first_name} ${registration.last_name}`.trim();

    for (const admin of adminUsers) {
      await createNotification(
        admin.id,
        'new_registration',
        'พนักงานใหม่ลงทะเบียน',
        `${fullName} (${registration.employee_code}) ขอลงทะเบียนเข้าใช้งานระบบ กรุณาตรวจสอบและอนุมัติ`,
        registration.id,
        'registration'
      );
    }
  } catch (error) {
    console.error('Notify admins error:', error);
  }
}

/**
 * ดึงรายการคำขอลงทะเบียน (สำหรับ admin / central_office_head)
 */
export const getRegistrationRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return successResponse(
      res,
      HTTP_STATUS.OK,
      'Registration requests retrieved',
      data || []
    );
  } catch (error) {
    console.error('Get registration requests error:', error);
    return errorResponse(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'ไม่สามารถดึงข้อมูลได้'
    );
  }
};

/**
 * อนุมัติคำขอลงทะเบียน — สร้าง user จากข้อมูลที่ลงทะเบียน
 */
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, note, editedData } = req.body;
    const reviewerId = req.user.id;

    // Get registration request
    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !registration) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบคำขอลงทะเบียนนี้');
    }

    if (registration.status !== 'pending') {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'คำขอนี้ได้รับการพิจารณาแล้ว');
    }

    // ถ้ามีข้อมูลที่แก้ไข ให้อัพเดตใน registration_requests ก่อน
    if (editedData && typeof editedData === 'object') {
      const allowedFields = ['employee_code', 'title', 'first_name', 'last_name', 'position', 'department_code', 'phone', 'email', 'hire_date'];
      const updateData = {};
      for (const key of allowedFields) {
        if (editedData[key] !== undefined) {
          updateData[key] = editedData[key];
        }
      }
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin
          .from('registration_requests')
          .update(updateData)
          .eq('id', id);
        // Merge ข้อมูลที่แก้ไขกลับ
        Object.assign(registration, updateData);
      }
    }

    // Check employee code doesn't already exist
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('employee_code', registration.employee_code)
      .single();

    if (existingUser) {
      // Update registration as rejected since user already exists
      await supabaseAdmin
        .from('registration_requests')
        .update({ status: 'rejected', reviewed_by: reviewerId, review_note: 'รหัสพนักงานมีอยู่ในระบบแล้ว', updated_at: new Date().toISOString() })
        .eq('id', id);

      return errorResponse(res, HTTP_STATUS.CONFLICT, 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว');
    }

    // Find department name from department_code
    let departmentName = null;
    if (registration.department_code) {
      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('department_name')
        .eq('department_code', registration.department_code)
        .single();
      if (dept) departmentName = dept.department_name;
    }

    // Determine role — default to 'user' (role_id = 1) if not specified
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const { data: userRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('role_name', 'user')
        .single();
      finalRoleId = userRole?.id;
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        employee_code: registration.employee_code,
        password_hash: registration.password_hash,
        title: registration.title,
        first_name: registration.first_name,
        last_name: registration.last_name,
        position: registration.position,
        department: departmentName,
        phone: registration.phone,
        email: registration.email,
        role_id: finalRoleId,
        is_active: true,
        hire_date: registration.hire_date || null,
        sick_leave_balance: 60,
        personal_leave_balance: 15,
        vacation_leave_balance: 10,
        vacation_carryover: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'ไม่สามารถสร้างบัญชีผู้ใช้ได้');
    }

    // Update registration status
    await supabaseAdmin
      .from('registration_requests')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        review_note: note || 'อนุมัติ',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      `อนุมัติ ${registration.first_name} ${registration.last_name} เรียบร้อยแล้ว`,
      { userId: newUser.id, employeeCode: registration.employee_code }
    );
  } catch (error) {
    console.error('Approve registration error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * ปฏิเสธคำขอลงทะเบียน
 */
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const reviewerId = req.user.id;

    const { data: registration, error: fetchError } = await supabaseAdmin
      .from('registration_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !registration) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบคำขอลงทะเบียนนี้');
    }

    if (registration.status !== 'pending') {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'คำขอนี้ได้รับการพิจารณาแล้ว');
    }

    await supabaseAdmin
      .from('registration_requests')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        review_note: note || 'ไม่อนุมัติ',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return successResponse(
      res,
      HTTP_STATUS.OK,
      `ปฏิเสธคำขอของ ${registration.first_name} ${registration.last_name} เรียบร้อยแล้ว`
    );
  } catch (error) {
    console.error('Reject registration error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * ลบคำขอลงทะเบียน
 */
export const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('registration_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'ลบคำขอเรียบร้อยแล้ว');
  } catch (error) {
    console.error('Delete registration error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};
