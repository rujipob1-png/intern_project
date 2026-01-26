/**
 * Acting Person Controller
 * จัดการเรื่องผู้ปฏิบัติหน้าที่แทนและการแจ้งเตือน
 */

import { supabase } from '../config/supabase.js';

/**
 * ดึงรายชื่อพนักงานในชั้นเดียวกัน (Same Department/Level)
 * สำหรับให้เลือกเป็นผู้ปฏิบัติหน้าที่แทน
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

    if (userError) throw userError;

    // ดึงพนักงานที่อยู่ใน department และ role เดียวกัน (ยกเว้นตัวเอง)
    const { data: employees, error: employeesError } = await supabase
      .from('users')
      .select(`
        id,
        employee_code,
        title,
        first_name,
        last_name,
        position,
        department
      `)
      .eq('department', currentUser.department)
      .eq('role_id', currentUser.role_id)
      .eq('is_active', true)
      .neq('id', userId)
      .order('first_name', { ascending: true });

    if (employeesError) throw employeesError;

    // Format ข้อมูลให้พร้อมใช้งาน
    const formattedEmployees = employees.map(emp => ({
      value: emp.id,
      label: `${emp.title || ''}${emp.first_name} ${emp.last_name} (${emp.employee_code})`,
      employeeCode: emp.employee_code,
      fullName: `${emp.title || ''}${emp.first_name} ${emp.last_name}`,
      position: emp.position,
      departmentName: emp.department
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

    // เรียกใช้ function ใน database
    const { data, error } = await supabase.rpc('approve_acting_person', {
      p_leave_id: leaveId,
      p_acting_person_id: actingPersonId,
      p_comment: comment || null
    });

    if (error) throw error;

    if (data.success) {
      res.json({
        success: true,
        message: data.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.message
      });
    }
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
        acting_status,
        created_at,
        users!leaves_user_id_fkey (
          employee_code,
          title,
          first_name,
          last_name,
          position,
          departments (department_name)
        ),
        leave_types (type_name)
      `)
      .eq('acting_person_id', userId)
      .eq('acting_status', 'pending')
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
