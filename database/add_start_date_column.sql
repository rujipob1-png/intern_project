-- เพิ่มคอลัมน์วันเริ่มรับราชการ (hire_date) ในตาราง users
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;

-- ตัวอย่าง: อัปเดตวันเริ่มรับราชการ
-- UPDATE users SET hire_date = '2020-01-15' WHERE employee_code = '51417';
