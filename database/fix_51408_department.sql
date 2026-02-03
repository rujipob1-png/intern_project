-- ============================================
-- แก้ไข department ของ 51408 ให้เป็น GOK (กอก.)
-- ============================================

-- ตรวจสอบข้อมูลปัจจุบัน
SELECT employee_code, first_name, last_name, department, position
FROM users
WHERE employee_code = '51408';

-- อัพเดท department เป็น GOK
UPDATE users
SET department = 'GOK'
WHERE employee_code = '51408';

-- ยืนยันผลลัพธ์
SELECT employee_code, first_name, last_name, department, position
FROM users
WHERE employee_code = '51408';
