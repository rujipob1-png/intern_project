-- ============================================
-- เพิ่ม Column Email ในตาราง users
-- สำหรับระบบแจ้งเตือนทาง Email
-- ============================================

-- เพิ่ม column email
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- เพิ่ม column สำหรับการตั้งค่าการแจ้งเตือน
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- สร้าง index สำหรับค้นหา email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ตัวอย่างการอัพเดท email ของ user
-- UPDATE users SET email = 'example@company.com' WHERE employee_code = '50001';

-- ดู users ทั้งหมดพร้อม email
SELECT employee_code, first_name, last_name, email, email_notifications 
FROM users 
ORDER BY employee_code;
