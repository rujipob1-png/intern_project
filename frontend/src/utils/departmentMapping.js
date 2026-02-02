/**
 * Department Mapping Utility
 * แปลงรหัสกลุ่มภาษาอังกฤษเป็นภาษาไทย
 */

// Mapping รหัสกลุ่มภาษาอังกฤษ → ภาษาไทย
export const DEPARTMENT_MAP = {
  'GOK': 'กอก.',
  'GYS': 'กยส.',
  'GTS': 'กทส.',
  'GTP': 'กตป.',
  'GSS': 'กสส.',
  'GKC': 'กคช.',
};

// Mapping รหัสกลุ่ม → ชื่อเต็มภาษาไทย
export const DEPARTMENT_FULL_NAME = {
  'GOK': 'กลุ่มงานอำนวยการ',
  'GYS': 'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร',
  'GTS': 'กลุ่มงานเทคโนโลยีสารสนเทศ',
  'GTP': 'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร',
  'GSS': 'กลุ่มงานเทคโนโลยีการสื่อสาร',
  'GKC': 'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร',
};

/**
 * แปลงรหัสกลุ่มเป็นตัวย่อภาษาไทย
 * @param {string} code - รหัสกลุ่ม เช่น 'GOK', 'GYS'
 * @returns {string} ตัวย่อภาษาไทย เช่น 'กอก.', 'กยส.'
 */
export const getDepartmentThaiCode = (code) => {
  if (!code) return '-';
  return DEPARTMENT_MAP[code.toUpperCase()] || code;
};

/**
 * แปลงรหัสกลุ่มเป็นชื่อเต็มภาษาไทย
 * @param {string} code - รหัสกลุ่ม เช่น 'GOK', 'GYS'
 * @returns {string} ชื่อเต็ม เช่น 'กลุ่มงานอำนวยการ'
 */
export const getDepartmentFullName = (code) => {
  if (!code) return '-';
  return DEPARTMENT_FULL_NAME[code.toUpperCase()] || code;
};

/**
 * แปลงรหัสกลุ่มเป็นตัวย่อพร้อมชื่อเต็ม
 * @param {string} code - รหัสกลุ่ม
 * @returns {string} เช่น 'กอก. (กลุ่มงานอำนวยการ)'
 */
export const getDepartmentDisplay = (code) => {
  if (!code) return '-';
  const thaiCode = DEPARTMENT_MAP[code.toUpperCase()];
  const fullName = DEPARTMENT_FULL_NAME[code.toUpperCase()];
  if (thaiCode && fullName) {
    return `${thaiCode} (${fullName})`;
  }
  return code;
};
