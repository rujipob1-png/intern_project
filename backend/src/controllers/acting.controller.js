/**
 * Acting Person Controller
 * จัดการเรื่องผู้ปฏิบัติหน้าที่แทนและการแจ้งเตือน
 */

import { supabase } from '../config/supabase.js';

/**
 * ดึงรายชื่อพนักงานในชั้นเดียวกัน (Same Department/Level)
 * สำหรับให้เลือกเป็นผู้ปฏิบัติหน้าที่แทน
 * 
 * Logic:
 * - user: ดึงพนักงานที่มี department และ role เดียวกัน
 * - director: ดึงพนักงานใน department ที่ตัวเองดูแล (user role)
 * - central_office_staff/head: ดึงพนักงานใน central office (role เดียวกัน)
 * - admin: ดึง admin คนอื่น
 */
export const getSameLevelEmployees = async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูลผู้ใช้ปัจจุบัน
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('department, role_id, id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching current user:', userError);
      throw userError;
    }

    // ดึง role name แยก
    const { data: userRoleData } = await supabase
      .from('roles')
      .select('role_name')
      .eq('id', currentUser.role_id)
      .single();

    const roleName = userRoleData?.role_name;
    console.log('Current user role:', roleName, 'Department:', currentUser.department);

    let employees = [];

    // กำหนดเงื่อนไขตาม role
    if (roleName === 'director') {
      // Director: ดึงพนักงาน (user role) ใน department ที่ตัวเองดูแล
      const { data: userRole } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', 'user')
        .single();

      const { data, error } = await supabase
        .from('users')
        .select(`id, employee_code, title, first_name, last_name, position, department`)
        .eq('department', currentUser.department)
        .eq('role_id', userRole?.id || 1)
        .eq('is_active', true)
        .neq('id', userId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      employees = data || [];

    } else if (roleName === 'central_office_staff' || roleName === 'central_office_head') {
      // Central Office: ดึงพนักงาน central office คนอื่น
      const { data: coRoles } = await supabase
        .from('roles')
        .select('id')
        .in('role_name', ['central_office_staff', 'central_office_head']);

      const coRoleIds = coRoles?.map(r => r.id) || [];
      
      const { data, error } = await supabase
        .from('users')
        .select(`id, employee_code, title, first_name, last_name, position, department`)
        .in('role_id', coRoleIds)
        .eq('is_active', true)
        .neq('id', userId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      employees = data || [];

    } else if (roleName === 'admin') {
      // Admin: ดึง admin คนอื่น หรือ central office head
      const { data: adminRoles } = await supabase
        .from('roles')
        .select('id')
        .in('role_name', ['admin', 'central_office_head']);

      const adminRoleIds = adminRoles?.map(r => r.id) || [];
      
      const { data, error } = await supabase
        .from('users')
        .select(`id, employee_code, title, first_name, last_name, position, department`)
        .in('role_id', adminRoleIds)
        .eq('is_active', true)
        .neq('id', userId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      employees = data || [];

    } else {
      // User ทั่วไป: ดึงพนักงานที่ department และ role เดียวกัน
      const { data, error } = await supabase
        .from('users')
        .select(`id, employee_code, title, first_name, last_name, position, department`)
        .eq('department', currentUser.department)
        .eq('role_id', currentUser.role_id)
        .eq('is_active', true)
        .neq('id', userId)
        .order('first_name', { ascending: true });

      if (error) throw error;
      employees = data || [];
    }

    console.log('Found employees:', employees.length);

    // Mapping รหัสแผนก → ตัวย่อภาษาไทย
    const deptThaiMap = {
      'GOK': 'กอก.',
      'GYS': 'กยส.',
      'GTS': 'กทส.',
      'GTP': 'กตป.',
      'GSS': 'กสส.',
      'GKC': 'กคฐ.',
    };

    // Format ข้อมูลให้พร้อมใช้งาน
    const formattedEmployees = employees.map(emp => ({
      value: emp.id,
      label: `${emp.title || ''}${emp.first_name} ${emp.last_name} (${emp.employee_code})`,
      employeeCode: emp.employee_code,
      fullName: `${emp.title || ''}${emp.first_name} ${emp.last_name}`,
      position: emp.position,
      departmentName: deptThaiMap[emp.department] || emp.department
    }));

    res.json({
      success: true,
      data: formattedEmployees
    });
  } catch (error) {
    console.error('Error fetching same level employees:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงรายชื่อพนักงาน'
    });
  }
};

/**
 * อนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 */
export const approveActingRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { comment } = req.body;
    const actingPersonId = req.user.id;

    // ตรวจสอบว่าคำขอนี้เป็นของ user นี้หรือไม่
    const { data: leave, error: findError } = await supabase
      .from('leaves')
      .select('id, user_id, acting_person_id, leave_number')
      .eq('id', leaveId)
      .eq('acting_person_id', actingPersonId)
      .single();

    if (findError || !leave) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอนี้หรือคุณไม่มีสิทธิ์อนุมัติ'
      });
    }

    // อัพเดท acting_approved เป็น true
    const { error: updateError } = await supabase
      .from('leaves')
      .update({
        acting_approved: true,
        acting_approved_at: new Date().toISOString()
      })
      .eq('id', leaveId);

    if (updateError) throw updateError;

    // ดึงข้อมูลผู้ปฏิบัติหน้าที่แทน
    const { data: actingPerson } = await supabase
      .from('users')
      .select('employee_code, title, first_name, last_name')
      .eq('id', actingPersonId)
      .single();

    const actingName = `${actingPerson?.title || ''}${actingPerson?.first_name} ${actingPerson?.last_name}`.trim();

    // สร้าง notification ให้ผู้ยื่นคำขอ
    await supabase
      .from('notifications')
      .insert({
        user_id: leave.user_id,
        type: 'acting_approved',
        title: 'ยินยอมปฏิบัติหน้าที่แทน',
        message: `${actingName} (${actingPerson?.employee_code}) ยินยอมปฏิบัติหน้าที่แทนคุณแล้ว`,
        reference_id: leave.id,
        reference_type: 'leave'
      });

    res.json({
      success: true,
      message: 'ยินยอมปฏิบัติหน้าที่แทนเรียบร้อยแล้ว'
    });
  } catch (error) {
    console.error('Error approving acting request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติ'
    });
  }
};

/**
 * ดึงการแจ้งเตือนทั้งหมดของผู้ใช้
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    let query = supabase
      .from('notifications')
      .select(`
        *,
        users!notifications_user_id_fkey (
          employee_code,
          first_name,
          last_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // นับจำนวนการแจ้งเตือนที่ยังไม่อ่าน
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (countError) throw countError;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: unreadCount || 0,
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน'
    });
  }
};

/**
 * ทำเครื่องหมายว่าอ่านการแจ้งเตือนแล้ว
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'ทำเครื่องหมายว่าอ่านแล้ว'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต'
    });
  }
};

/**
 * ทำเครื่องหมายว่าอ่านทั้งหมด
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({
      success: true,
      message: 'ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต'
    });
  }
};

/**
 * ดึงคำขอที่ต้องอนุมัติการเป็นผู้ปฏิบัติหน้าที่แทน
 */
export const getActingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: requests, error } = await supabase
      .from('leaves')
      .select(`
        id,
        leave_number,
        start_date,
        end_date,
        total_days,
        reason,
        acting_approved,
        created_at,
        users!leaves_user_id_fkey (
          employee_code,
          title,
          first_name,
          last_name,
          position,
          department
        ),
        leave_types (type_name)
      `)
      .eq('acting_person_id', userId)
      .eq('acting_approved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching acting requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};
