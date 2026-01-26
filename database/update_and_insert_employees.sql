-- ============================================
-- Update Existing Users + Insert New Employees
-- Password สำหรับทุกคน: 123456
-- ============================================

-- Password hash สำหรับ "123456"
-- $2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3

-- เพิ่ม column department (text) ถ้ายังไม่มี
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50);

-- ============================================
-- UPDATE user เก่า (2001-2006) ให้มี department
-- ============================================
UPDATE users SET department = 'IT' WHERE employee_code IN ('2001', '2002', '2003', '2004', '2005', '2006');

-- ============================================
-- INSERT คนใหม่ใน IT (2007-2009)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, role_id, is_active) VALUES
('2007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'วรชิต', 'พูลศรี', 'วิศวกรระบบคอมพิวเตอร์และเครือข่าย', 'IT', (SELECT id FROM roles WHERE role_name = 'user'), true),
('2008', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ฐานนท์', 'เทพชัย', 'วิศวกรระบบคอมพิวเตอร์และเครือข่าย', 'IT', (SELECT id FROM roles WHERE role_name = 'user'), true),
('2009', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'จุฑามาศ', 'ศรีทอง', 'เจ้าหน้าที่ศูนเสริมและระบบ', 'IT', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- INSERT ฝ่ายอำนวยการ (ADMIN) - ทั้งหมดใหม่
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, role_id, is_active) VALUES
('3001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'สมชาย', 'พิพัฒน์', 'ผู้อำนวยการ', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'director'), true),
('3002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'วรารัตน์', 'แสงทอง', 'เจ้าหน้าที่บริหารทั่วไป', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('3003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ชาญชัย', 'มั่นคง', 'เจ้าหน้าที่บริหารทั่วไป', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('3004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'ศิริพร', 'ลบใจ', 'เจ้าหน้าที่พัสดุสื่อสาร', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('3005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เกรียงไกร', 'ใจเป็น', 'เจ้าหน้าที่พัสดุสื่อสาร', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- INSERT ฝ่ายการเงิน (FIN) - ทั้งหมดใหม่
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, role_id, is_active) VALUES
('4001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'อภิวัฒน์', 'รุ่งเรือง', 'หัวหน้ากลุ่มงานติดตามและประเมินผล', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'ธนพร', 'มณีรัตน์', 'เจ้าหน้าที่ติดตามและประเมินผล', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ภาคภูมิ', 'เจริญศักดิ์', 'เจ้าหน้าที่ติดตามและประเมินผล', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ศุภชัย', 'วงศ์คำ', 'เจ้าหน้าที่ธุรการ', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'พิมพ์ชนก', 'สายทอง', 'เจ้าหน้าที่ระบบวิทยสื่อสาร', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4006', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ปกรณ์', 'ศีรวดี', 'เจ้าหน้าที่ระบบวิทยสื่อสาร', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เจรจศักดิพร', 'อินทรี', 'เจ้าหน้าที่บริการสื่อสาร', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true),
('4008', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ธนกุล', 'ชัยพร', 'เจ้าหน้าที่ความมั่นคงสารสนเทศ', 'FIN', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- INSERT ฝ่ายทรัพยากรบุคคล (HR) - ทั้งหมดใหม่
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, role_id, is_active) VALUES
('5001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'วรพล', 'แสงดี', 'เจ้าหน้าที่ Help Desk', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'อรพิม', 'บุญอ่อน', 'เจ้าหน้าที่ Help Desk', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'กษมา', 'พูลสุข', 'เจ้าหน้าที่บริหารทั่วไป', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เอกชัย', 'มั่นคง', 'วิศวกรเครือข่าย', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ปรีชา', 'คำดี', 'ผู้ดูแลระบบเครือข่าย', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5006', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ศุณเอ', 'ศรีทอง', 'ผู้ดูแลระบบเครือข่าย', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true),
('5007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8มงก$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'พีชิต', 'ใจเป็น', 'ช่างเทคนิคระบบเครือข่าย', 'HR', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- INSERT สำนักงานกลาง (CENTRAL) - ทั้งหมดใหม่
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, role_id, is_active) VALUES
('6001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ธีรวัฒน์', 'วงศ์ใหญ่', 'หัวหน้าฝ่ายระบบวิทยและความเทียบ', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff'), true),
('6002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ภานุเดช', 'ศรีสลัด', 'วิศวกรระบบดาวเทียบ', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff'), true),
('6003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'พันธารัตน์', 'แสงทอง', 'เจ้าหน้าที่ควบคุมระบบดาวเทียบ', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff'), true);

-- ============================================
-- ตรวจสอบผลลัพธ์
-- ============================================
SELECT department, COUNT(*) as total 
FROM users 
WHERE department IS NOT NULL
GROUP BY department 
ORDER BY department;
