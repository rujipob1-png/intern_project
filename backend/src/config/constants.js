// Role Levels
export const ROLES = {
  USER: 'user',
  DIRECTOR: 'director',
  CENTRAL_OFFICE_STAFF: 'central_office_staff',
  CENTRAL_OFFICE_HEAD: 'central_office_head',
  ADMIN: 'admin'
};

export const ROLE_LEVELS = {
  USER: 1,
  DIRECTOR: 2,
  CENTRAL_OFFICE_STAFF: 3,
  CENTRAL_OFFICE_HEAD: 4,
  ADMIN: 5
};

// Leave Status
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED_LEVEL1: 'approved_level1', // Director approved
  APPROVED_LEVEL2: 'approved_level2', // Central Office Staff approved
  APPROVED_LEVEL3: 'approved_level3', // Central Office Head approved
  APPROVED_FINAL: 'approved_final',   // Admin approved (final)
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  // สถานะสำหรับการยกเลิก (ต้องผ่านขั้นตอนอนุมัติ)
  PENDING_CANCEL: 'pending_cancel',           // รอพิจารณาการยกเลิก (ผอ.กลุ่มงาน)
  CANCEL_LEVEL1: 'cancel_level1',             // ผอ.กลุ่มงานอนุมัติยกเลิก - รอหัวหน้าฝ่ายบริหาร
  CANCEL_LEVEL2: 'cancel_level2',             // หัวหน้าฝ่ายบริหารอนุมัติยกเลิก - รอ ผอ.กลุ่มงานอำนวยการ
  CANCEL_LEVEL3: 'cancel_level3',             // ผอ.กลุ่มงานอำนวยการอนุมัติยกเลิก - รอ ผอ.ศูนย์
};

// Leave Status Descriptions
export const LEAVE_STATUS_DESCRIPTIONS = {
  pending: 'รอการอนุมัติ (ผู้อำนวยการกอง)',
  approved_level1: 'ผู้อำนวยการกองอนุมัติแล้ว - รอพนักงานกองกลาง',
  approved_level2: 'กองกลางตรวจสอบแล้ว - รอหัวหน้ากองกลาง',
  approved_level3: 'หัวหน้ากองกลางอนุมัติแล้ว - รอผู้บริหารสูงสุด',
  approved_final: 'อนุมัติทั้งหมดแล้ว',
  rejected: 'ไม่อนุมัติ',
  cancelled: 'ยกเลิกแล้ว',
  pending_cancel: 'รอพิจารณายกเลิก (ผอ.กลุ่มงาน)',
  cancel_level1: 'ผอ.กลุ่มงานอนุมัติยกเลิก - รอหัวหน้าฝ่ายบริหาร',
  cancel_level2: 'หัวหน้าฝ่ายบริหารอนุมัติยกเลิก - รอ ผอ.กลุ่มงานอำนวยการ',
  cancel_level3: 'ผอ.กลุ่มงานอำนวยการอนุมัติยกเลิก - รอ ผอ.ศูนย์',
};

// Approval Actions
export const APPROVAL_ACTIONS = {
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Leave Types
export const LEAVE_TYPES = {
  SICK: 'SICK',
  PERSONAL: 'PERSONAL',
  VACATION: 'VACATION',
  MATERNITY: 'MATERNITY',
  PATERNITY: 'PATERNITY',
  HAJJ: 'HAJJ',
  ORDINATION: 'ORDINATION',
  MILITARY: 'MILITARY',
  OTHER: 'OTHER'
};

// Leave Balance Types
export const LEAVE_BALANCE_TYPES = {
  SICK: 'sick_leave_balance',
  PERSONAL: 'personal_leave_balance',
  VACATION: 'vacation_leave_balance'
};

// Approval Levels
export const APPROVAL_LEVELS = {
  DIRECTOR: 1,
  CENTRAL_OFFICE: 2,
  ADMIN: 3
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};
