/**
 * วันหยุดราชการไทย (Thai Government Holidays) — Auto-generate + Manual
 *
 * วิธีการทำงาน:
 * 1. วันหยุดคงที่ (13 วัน/ปี) — generate อัตโนมัติทุกปี พร้อมคำนวณวันชดเชย
 * 2. วันหยุดทางจันทรคติ (4 วัน/ปี) — ต้องเพิ่มใน LUNAR_HOLIDAYS ทุกปี
 *    (มาฆบูชา, วิสาขบูชา, อาสาฬหบูชา, เข้าพรรษา)
 *
 * ✅ เพิ่มปีใหม่: แค่เพิ่ม 4 วันใน LUNAR_HOLIDAYS ก็พอ! (ดูตัวอย่างข้างล่าง)
 */

// ============================================
// Helper
// ============================================
const fmt = (year, month, day) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const formatDateStr = (date) => {
  if (typeof date === 'string') return date.split('T')[0];
  if (date instanceof Date) {
    return fmt(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }
  return '';
};

// ============================================
// 1) วันหยุดคงที่ — เหมือนกันทุกปี (วัน/เดือน fix)
// ============================================
const FIXED_HOLIDAYS = [
  { month: 1, day: 1, name: 'วันขึ้นปีใหม่' },
  { month: 4, day: 6, name: 'วันจักรี' },
  { month: 4, day: 13, name: 'วันสงกรานต์' },
  { month: 4, day: 14, name: 'วันสงกรานต์' },
  { month: 4, day: 15, name: 'วันสงกรานต์' },
  { month: 5, day: 1, name: 'วันแรงงานแห่งชาติ' },
  { month: 5, day: 4, name: 'วันฉัตรมงคล' },
  { month: 6, day: 3, name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี' },
  { month: 7, day: 28, name: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว' },
  { month: 8, day: 12, name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ' },
  { month: 10, day: 13, name: 'วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช' },
  { month: 10, day: 23, name: 'วันปิยมหาราช' },
  { month: 12, day: 5, name: 'วันคล้ายวันพระบรมราชสมภพ รัชกาลที่ 9 / วันพ่อแห่งชาติ' },
  { month: 12, day: 10, name: 'วันรัฐธรรมนูญ' },
  { month: 12, day: 31, name: 'วันสิ้นปี' },
];

// ============================================
// 2) วันหยุดทางจันทรคติ — ต้องเพิ่มเองทุกปี
//    (เปลี่ยนทุกปีตามปฏิทินจันทรคติ)
//
//    📌 วิธีเพิ่มปีใหม่: copy block แล้วแก้วันที่ตามประกาศราชกิจจานุเบกษา
// ============================================
const LUNAR_HOLIDAYS = {
  2025: [
    { month: 2, day: 12, name: 'วันมาฆบูชา' },
    { month: 5, day: 11, name: 'วันวิสาขบูชา' },
    { month: 7, day: 10, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 11, name: 'วันเข้าพรรษา' },
  ],
  2026: [
    { month: 3, day: 1, name: 'วันมาฆบูชา' },
    { month: 5, day: 31, name: 'วันวิสาขบูชา' },
    { month: 7, day: 29, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 30, name: 'วันเข้าพรรษา' },
  ],
  2027: [
    { month: 2, day: 18, name: 'วันมาฆบูชา' },
    { month: 5, day: 19, name: 'วันวิสาขบูชา' },
    { month: 7, day: 18, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 19, name: 'วันเข้าพรรษา' },
  ],
  2028: [
    { month: 2, day: 7, name: 'วันมาฆบูชา' },
    { month: 5, day: 7, name: 'วันวิสาขบูชา' },
    { month: 7, day: 6, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 7, name: 'วันเข้าพรรษา' },
  ],
  2029: [
    { month: 2, day: 25, name: 'วันมาฆบูชา' },
    { month: 5, day: 26, name: 'วันวิสาขบูชา' },
    { month: 7, day: 25, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 26, name: 'วันเข้าพรรษา' },
  ],
  2030: [
    { month: 2, day: 14, name: 'วันมาฆบูชา' },
    { month: 5, day: 14, name: 'วันวิสาขบูชา' },
    { month: 7, day: 14, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 15, name: 'วันเข้าพรรษา' },
  ],
  2031: [
    { month: 2, day: 3, name: 'วันมาฆบูชา' },
    { month: 5, day: 4, name: 'วันวิสาขบูชา' },
    { month: 7, day: 3, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 4, name: 'วันเข้าพรรษา' },
  ],
  2032: [
    { month: 2, day: 22, name: 'วันมาฆบูชา' },
    { month: 5, day: 22, name: 'วันวิสาขบูชา' },
    { month: 7, day: 21, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 22, name: 'วันเข้าพรรษา' },
  ],
  2033: [
    { month: 2, day: 10, name: 'วันมาฆบูชา' },
    { month: 5, day: 12, name: 'วันวิสาขบูชา' },
    { month: 7, day: 10, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 11, name: 'วันเข้าพรรษา' },
  ],
  2034: [
    { month: 3, day: 1, name: 'วันมาฆบูชา' },
    { month: 5, day: 31, name: 'วันวิสาขบูชา' },
    { month: 7, day: 30, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 31, name: 'วันเข้าพรรษา' },
  ],
  2035: [
    { month: 2, day: 19, name: 'วันมาฆบูชา' },
    { month: 5, day: 20, name: 'วันวิสาขบูชา' },
    { month: 7, day: 19, name: 'วันอาสาฬหบูชา' },
    { month: 7, day: 20, name: 'วันเข้าพรรษา' },
  ],
  // 📌 เพิ่มปีถัดไปตามประกาศราชกิจจานุเบกษา
  // (วันพุทธเป็นค่าประมาณจากปฏิทินจันทรคติ ควรตรวจสอบกับประกาศจริงทุกปี)
};

// ============================================
// 3) คำนวณวันชดเชย (Substitute Holidays)
//    ถ้าวันหยุดตรงกับ เสาร์ → ชดเชยวันจันทร์ถัดไป
//    ถ้าวันหยุดตรงกับ อาทิตย์ → ชดเชยวันจันทร์ถัดไป
//    ถ้ามีวันชดเชยซ้อนกัน → เลื่อนไปวันทำการถัดไป
// ============================================
const getNextWorkday = (date, existingDates) => {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6 || existingDates.has(fmt(d.getFullYear(), d.getMonth() + 1, d.getDate()))) {
    d.setDate(d.getDate() + 1);
  }
  return d;
};

/**
 * สร้างรายการวันหยุดทั้งหมดสำหรับปีที่กำหนด (พร้อมวันชดเชยอัตโนมัติ)
 * @param {number} year - ปี ค.ศ.
 * @returns {Array<{ date: string, name: string, isSubstitute?: boolean }>}
 */
const generateHolidaysForYear = (year) => {
  const holidays = [];
  const allDateStrs = new Set();

  // รวมวันหยุดคงที่ + วันหยุดจันทรคติ
  const rawHolidays = [
    ...FIXED_HOLIDAYS.map(h => ({ ...h })),
    ...(LUNAR_HOLIDAYS[year] || []).map(h => ({ ...h })),
  ];

  // เพิ่มวันหยุดตรง
  rawHolidays.forEach(h => {
    const dateStr = fmt(year, h.month, h.day);
    allDateStrs.add(dateStr);
    holidays.push({ date: dateStr, name: h.name });
  });

  // คำนวณวันชดเชย
  rawHolidays.forEach(h => {
    const d = new Date(year, h.month - 1, h.day);
    const dow = d.getDay();
    if (dow === 6 || dow === 0) {
      // หาวันทำการถัดไปที่ไม่ซ้ำกับวันหยุดอื่น
      const sub = getNextWorkday(d, allDateStrs);
      const subDateStr = fmt(sub.getFullYear(), sub.getMonth() + 1, sub.getDate());
      allDateStrs.add(subDateStr);
      holidays.push({
        date: subDateStr,
        name: `ชดเชย${h.name}`,
        isSubstitute: true,
      });
    }
  });

  // เรียงตามวันที่
  holidays.sort((a, b) => a.date.localeCompare(b.date));
  return holidays;
};

// ============================================
// 4) สร้าง Cache — generate ปีปัจจุบัน ± 2 ปี
// ============================================
const holidayCache = new Map(); // year -> holidays[]
const holidayMap = new Map();   // dateStr -> holidayInfo

const ensureYear = (year) => {
  if (holidayCache.has(year)) return;
  const holidays = generateHolidaysForYear(year);
  holidayCache.set(year, holidays);
  holidays.forEach(h => {
    if (!holidayMap.has(h.date)) {
      holidayMap.set(h.date, h);
    }
  });
};

// Pre-generate ปีปัจจุบัน ± 2 ปี
const currentYear = new Date().getFullYear();
for (let y = currentYear - 1; y <= currentYear + 3; y++) {
  ensureYear(y);
}

// ============================================
// 5) Public API
// ============================================

/**
 * ตรวจสอบว่าวันที่ที่กำหนดเป็นวันหยุดราชการหรือไม่
 * @param {string|Date} date - วันที่ (YYYY-MM-DD string หรือ Date object)
 * @returns {boolean}
 */
export const isThaiHoliday = (date) => {
  const dateStr = formatDateStr(date);
  if (!dateStr) return false;
  const year = parseInt(dateStr.substring(0, 4));
  ensureYear(year);
  return holidayMap.has(dateStr);
};

/**
 * ดึงข้อมูลวันหยุดราชการของวันที่กำหนด
 * @param {string|Date} date - วันที่
 * @returns {{ date: string, name: string, isSubstitute?: boolean } | null}
 */
export const getHolidayInfo = (date) => {
  const dateStr = formatDateStr(date);
  if (!dateStr) return null;
  const year = parseInt(dateStr.substring(0, 4));
  ensureYear(year);
  return holidayMap.get(dateStr) || null;
};

/**
 * ดึงรายชื่อวันหยุดราชการทั้งหมดในเดือนที่กำหนด
 * @param {number} year - ปี ค.ศ.
 * @param {number} month - เดือน (0-11)
 * @returns {Array<{ date: string, name: string }>}
 */
export const getHolidaysInMonth = (year, month) => {
  ensureYear(year);
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return (holidayCache.get(year) || []).filter(h => h.date.startsWith(prefix));
};

/**
 * ดึงรายชื่อวันหยุดราชการทั้งหมดในปีที่กำหนด
 * @param {number} year - ปี ค.ศ.
 * @returns {Array<{ date: string, name: string }>}
 */
export const getHolidaysInYear = (year) => {
  ensureYear(year);
  return holidayCache.get(year) || [];
};

/**
 * ตรวจสอบว่าวันที่เป็นวันทำการหรือไม่ (ไม่ใช่เสาร์-อาทิตย์ และไม่ใช่วันหยุดราชการ)
 * @param {string|Date} date - วันที่
 * @returns {boolean}
 */
export const isWorkingDay = (date) => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  return !isThaiHoliday(date);
};
