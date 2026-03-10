/**
 * Delegation Controller
 * โอนสิทธิ์การอนุมัติให้ผู้ปฏิบัติหน้าที่แทน
 */

import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createNotification } from './notification.controller.js';

// Role ที่สามารถโอนสิทธิ์ได้
const DELEGATABLE_ROLES = ['director', 'central_office_staff', 'central_office_head', 'admin'];

/**
 * สร้าง delegation ใหม่
 * POST /api/delegations
 */
export const createDelegation = async (req, res) => {
  try {
    const delegatorId = req.user.id;
    const delegatorRole = req.user.roleName;
    const delegatorDept = req.user.department;

    if (!DELEGATABLE_ROLES.includes(delegatorRole)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'บทบาทของคุณไม่สามารถโอนสิทธิ์ได้');
    }

    const { delegateId, startDate, endDate, reason } = req.body;

    if (!delegateId || !startDate || !endDate) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'กรุณาระบุผู้รับมอบ วันเริ่มต้น และวันสิ้นสุด');
    }

    if (delegateId === delegatorId) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ไม่สามารถโอนสิทธิ์ให้ตัวเองได้');
    }

    if (new Date(endDate) < new Date(startDate)) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'วันสิ้นสุดต้องมาหลังวันเริ่มต้น');
    }

    // ตรวจสอบว่า delegate มีอยู่จริงและ active
    const { data: delegate, error: delegateErr } = await supabaseAdmin
      .from('users')
      .select('id, title, first_name, last_name, employee_code, is_active')
      .eq('id', delegateId)
      .maybeSingle();

    if (delegateErr || !delegate) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบผู้ใช้งานที่เลือก');
    }

    if (!delegate.is_active) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'ผู้ใช้งานที่เลือกถูกปิดใช้งานแล้ว');
    }

    // ตรวจสอบว่ามี delegation ที่ active อยู่แล้วหรือไม่ (ป้องกัน overlap)
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabaseAdmin
      .from('approval_delegations')
      .select('id')
      .eq('delegator_id', delegatorId)
      .eq('is_active', true)
      .gte('end_date', today)
      .maybeSingle();

    if (existing) {
      return errorResponse(res, HTTP_STATUS.CONFLICT, 'คุณมีการโอนสิทธิ์ที่ยังใช้งานอยู่ กรุณายกเลิกก่อน');
    }

    // สร้าง delegation
    const { data: delegation, error } = await supabaseAdmin
      .from('approval_delegations')
      .insert({
        delegator_id: delegatorId,
        delegate_id: delegateId,
        delegated_role: delegatorRole,
        delegated_department: delegatorDept,
        start_date: startDate,
        end_date: endDate,
        reason: reason || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // แจ้งเตือนคนที่รับมอบสิทธิ์
    const delegatorName = `${req.user.title || ''}${req.user.firstName} ${req.user.lastName}`;
    await createNotification(
      delegateId,
      'delegation_received',
      'ได้รับมอบสิทธิ์การอนุมัติ',
      `${delegatorName} ได้มอบสิทธิ์การอนุมัติให้คุณ ตั้งแต่ ${startDate} ถึง ${endDate}`,
      delegation.id,
      'delegation'
    );

    return successResponse(res, HTTP_STATUS.CREATED, 'โอนสิทธิ์เรียบร้อยแล้ว', {
      delegation,
      delegateName: `${delegate.title || ''}${delegate.first_name} ${delegate.last_name}`,
    });
  } catch (error) {
    console.error('createDelegation error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาดในการโอนสิทธิ์');
  }
};

/**
 * ดู delegations ที่ฉันสร้าง (ในฐานะ delegator)
 * GET /api/delegations/my
 */
export const getMyDelegations = async (req, res) => {
  try {
    const delegatorId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('approval_delegations')
      .select(`
        *,
        delegate:users!approval_delegations_delegate_id_fkey (
          id, employee_code, title, first_name, last_name, position, department
        )
      `)
      .eq('delegator_id', delegatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'ดึงข้อมูลสำเร็จ', data || []);
  } catch (error) {
    console.error('getMyDelegations error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * ดู delegation ที่ฉันได้รับ (ในฐานะ delegate)
 * GET /api/delegations/received
 */
export const getReceivedDelegations = async (req, res) => {
  try {
    const delegateId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from('approval_delegations')
      .select(`
        *,
        delegator:users!approval_delegations_delegator_id_fkey (
          id, employee_code, title, first_name, last_name, position, department
        )
      `)
      .eq('delegate_id', delegateId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'ดึงข้อมูลสำเร็จ', data || []);
  } catch (error) {
    console.error('getReceivedDelegations error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * ยกเลิก delegation
 * DELETE /api/delegations/:id
 */
export const cancelDelegation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ต้องเป็นคนที่สร้างเท่านั้น
    const { data: delegation, error: findErr } = await supabaseAdmin
      .from('approval_delegations')
      .select('id, delegate_id, delegator_id, is_active')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !delegation) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'ไม่พบการโอนสิทธิ์นี้');
    }

    if (delegation.delegator_id !== userId) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'คุณไม่มีสิทธิ์ยกเลิกการโอนสิทธิ์นี้');
    }

    const { error } = await supabaseAdmin
      .from('approval_delegations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    // แจ้งเตือนคนที่รับมอบว่าถูกยกเลิก
    const delegatorName = `${req.user.title || ''}${req.user.firstName} ${req.user.lastName}`;
    await createNotification(
      delegation.delegate_id,
      'delegation_cancelled',
      'การมอบสิทธิ์ถูกยกเลิก',
      `${delegatorName} ได้ยกเลิกการมอบสิทธิ์การอนุมัติแล้ว`,
      id,
      'delegation'
    );

    return successResponse(res, HTTP_STATUS.OK, 'ยกเลิกการโอนสิทธิ์เรียบร้อยแล้ว');
  } catch (error) {
    console.error('cancelDelegation error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * ดึงรายชื่อพนักงานที่โอนสิทธิ์ให้ได้ (ตาม role ของ delegator)
 * GET /api/delegations/eligible-delegates
 */
export const getEligibleDelegates = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleName = req.user.roleName;
    const dept = req.user.department;

    let query = supabaseAdmin
      .from('users')
      .select('id, employee_code, title, first_name, last_name, position, department, roles(role_name)')
      .eq('is_active', true)
      .neq('id', userId);

    // Director → เลือกได้เฉพาะคนใน dept เดียวกัน (ทุก role)
    if (roleName === 'director') {
      query = query.eq('department', dept);
    }
    // Central office head → เลือกได้ทุกคนใน central office + admin
    // Admin → เลือกได้ทุกคน
    // ไม่เพิ่ม filter พิเศษสำหรับ head/admin

    const { data, error } = await query.order('first_name', { ascending: true });
    if (error) throw error;

    const formatted = (data || []).map(u => ({
      id: u.id,
      employeeCode: u.employee_code,
      fullName: `${u.title || ''}${u.first_name} ${u.last_name}`,
      position: u.position,
      department: u.department,
      roleName: u.roles?.role_name || 'user',
    }));

    return successResponse(res, HTTP_STATUS.OK, 'ดึงรายชื่อสำเร็จ', formatted);
  } catch (error) {
    console.error('getEligibleDelegates error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};

/**
 * Admin: ดู delegations ทั้งหมดในระบบ
 * GET /api/delegations/all
 */
export const getAllDelegations = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('approval_delegations')
      .select(`
        *,
        delegator:users!approval_delegations_delegator_id_fkey (
          id, employee_code, title, first_name, last_name, department
        ),
        delegate:users!approval_delegations_delegate_id_fkey (
          id, employee_code, title, first_name, last_name, department
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return successResponse(res, HTTP_STATUS.OK, 'ดึงข้อมูลสำเร็จ', data || []);
  } catch (error) {
    console.error('getAllDelegations error:', error);
    return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาด');
  }
};
