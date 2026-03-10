/**
 * ดึงตัวอักษรแรกของชื่อ (ไม่รวมคำนำหน้า) สำหรับแสดง Avatar
 * รองรับทั้งชื่อเต็ม (เช่น "น.ส.อภิญญา แจ้งหล่า") และ firstName แยก
 */

// คำนำหน้าที่ต้องตัดออก
const TITLE_PREFIXES = [
  'นางสาว', 'นาง', 'นาย',
  'น.ส.', 'น.ส', 
  'ดร.', 'ดร',
  'ศ.ดร.', 'รศ.ดร.', 'ผศ.ดร.',
  'ศ.', 'รศ.', 'ผศ.',
  'พล.อ.', 'พล.ท.', 'พล.ต.', 'พล.ร.อ.', 'พล.ร.ท.', 'พล.ร.ต.',
  'พ.อ.', 'พ.ท.', 'พ.ต.', 'ร.อ.', 'ร.ท.', 'ร.ต.',
  'จ.ส.อ.', 'จ.ส.ท.', 'จ.ส.ต.',
  'ส.อ.', 'ส.ท.', 'ส.ต.',
  'Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.',
];

/**
 * ดึงตัวอักษรแรกของชื่อจริง (ไม่รวมคำนำหน้า)
 * @param {string} fullName - ชื่อเต็ม เช่น "น.ส.อภิญญา แจ้งหล่า"
 * @param {string} [firstName] - ชื่อจริง (ถ้ามี) เช่น "อภิญญา"
 * @returns {string} ตัวอักษรแรก เช่น "อ"
 */
export function getInitial(fullName, firstName) {
  // ถ้ามี firstName ใช้เลย
  if (firstName) {
    return firstName.charAt(0);
  }

  if (!fullName) return '?';

  // ตัด title ออกจากชื่อเต็ม (เรียงจากยาวสุดก่อน เพื่อ match ได้ถูก)
  let name = fullName.trim();
  for (const prefix of TITLE_PREFIXES) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length).trim();
      break;
    }
  }

  return name.charAt(0) || '?';
}
