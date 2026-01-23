// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ระบบการลาออนไลน์';

// User Roles
export const ROLES = {
  USER: 'user',
  DIRECTOR: 'director',
  CENTRAL_OFFICE_STAFF: 'central_office_staff',
  CENTRAL_OFFICE_HEAD: 'central_office_head',
  ADMIN: 'admin',
};

export const ROLE_NAMES = {
  user: 'พนักงาน',
  director: 'ผู้อำนวยการกอง',
  central_office_staff: 'พนักงานกองกลาง',
  central_office_head: 'หัวหน้ากองกลาง',
  admin: 'ผู้ดูแลระบบ',
};

// Leave Status
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED_LEVEL1: 'approved_level1',
  APPROVED_LEVEL2: 'approved_level2',
  APPROVED_LEVEL3: 'approved_level3',
  APPROVED: 'approved_final',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const LEAVE_STATUS_TEXT = {
  pending: 'รอผู้อำนวยการกอง',
  approved_level1: 'ผ่านหัวหน้ากอง',
  approved_level2: 'ผ่านกองกลาง',
  approved_level3: 'ผ่านหัวหน้ากองกลาง',
  approved_final: 'อนุมัติแล้ว',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิกแล้ว',
};

export const LEAVE_STATUS_COLOR = {
  pending: 'yellow',
  approved_level1: 'blue',
  approved_level2: 'indigo',
  approved_level3: 'purple',
  approved_final: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

// Alias for backwards compatibility
export const LEAVE_STATUS_COLORS = LEAVE_STATUS_COLOR;

// Leave Types
export const LEAVE_TYPES = {
  SICK: 'sick',                    // ป = ลาป่วย
  PERSONAL: 'personal',            // ก = ลากิจส่วนตัว
  VACATION: 'vacation',            // พ = ลาพักผ่อน
  MATERNITY: 'maternity',          // ค = ลาคลอดบุตร
  ORDINATION: 'ordination',        // บ = ลาอุปสมบท
  HAJJ: 'hajj',                    // ฮ = ลาประกอบพิธีฮัจย์
  MILITARY: 'military',            // ต = ลาเข้ารับการตรวจเลือก
  LATE: 'late',                    // ส = มาสาย
  ABSENT: 'absent',                // ข = ขาดราชการ
};

export const LEAVE_TYPE_NAMES = {
  sick: 'ลาป่วย (ป)',
  personal: 'ลากิจส่วนตัว (ก)',
  vacation: 'ลาพักผ่อน (พ)',
  maternity: 'ลาคลอดบุตร (ค)',
  ordination: 'ลาอุปสมบท (บ)',
  hajj: 'ลาประกอบพิธีฮัจย์ (ฮ)',
  military: 'ลาเข้ารับการตรวจเลือก (ต)',
  late: 'มาสาย (ส)',
  absent: 'ขาดราชการ (ข)',
};

export const LEAVE_TYPE_CODES = {
  sick: 'ป',
  personal: 'ก',
  vacation: 'พ',
  maternity: 'ค',
  ordination: 'บ',
  hajj: 'ฮ',
  military: 'ต',
  late: 'ส',
  absent: 'ข',
};

export const LEAVE_TYPE_COLORS = {
  sick: 'blue',
  personal: 'yellow',
  vacation: 'green',
  maternity: 'pink',
  ordination: 'purple',
  hajj: 'indigo',
  military: 'orange',
  late: 'amber',
  absent: 'red',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};
