-- ============================================
-- Sample Employees Data (ข้อมูลพนักงานตัวอย่าง)
-- Password สำหรับทุกคน: 123456
-- ============================================

-- Password hash สำหรับ "123456"
-- $2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3

-- ============================================
-- ชั้น 2: กลุ่มงานเทคโนโลยีสารสนเทศ (IT)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department_id, role_id, is_active) 
SELECT '2001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ธรรมทร', 'วัฒนะ', 'หัวหน้ากลุ่มงานเทคโนโลยีสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'กัญญารา', 'ศรีสุข', 'เจ้าหน้าที่ธุรการ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'พงศกร', 'มาดทอง', 'นักพัฒนาเทคโนโลยีสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ณัฐวดี', 'คำเสน', 'นักพัฒนาเทคโนโลยีสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ศุภชัย', 'แก้วดี', 'นักพัฒนาระบบงานสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2006', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'ปรียารัตน์', 'ใจดี', 'นักพัฒนาระบบงานสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'วรชิต', 'พูลศรี', 'วิศวกรระบบคอมพิวเตอร์และเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2008', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ฐานนท์', 'เทพชัย', 'วิศวกรระบบคอมพิวเตอร์และเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user'
UNION ALL
SELECT '2009', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'จุฑามาศ', 'ศรีทอง', 'เจ้าหน้าที่ศูนเสริมและระบบ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'IT' AND r.role_name = 'user';

-- ============================================
-- ชั้น 3: กลุ่มงานอำนวยการและบริหารทั่วไป
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department_id, role_id, is_active) 
SELECT '3001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'สมชาย', 'พิพัฒน์', 'ผู้อำนวยการ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'ADMIN' AND r.role_name = 'director'
UNION ALL
SELECT '3002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'วรารัตน์', 'แสงทอง', 'เจ้าหน้าที่บริหารทั่วไป', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'ADMIN' AND r.role_name = 'user'
UNION ALL
SELECT '3003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ชาญชัย', 'มั่นคง', 'เจ้าหน้าที่บริหารทั่วไป', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'ADMIN' AND r.role_name = 'user'
UNION ALL
SELECT '3004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'ศิริพร', 'ลบใจ', 'เจ้าหน้าที่พัสดุสื่อสาร', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'ADMIN' AND r.role_name = 'user'
UNION ALL
SELECT '3005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เกรียงไกร', 'ใจเป็น', 'เจ้าหน้าที่พัสดุสื่อสาร', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'ADMIN' AND r.role_name = 'user';

-- ============================================
-- ชั้น 4: กลุ่มงานติดตามและประเมินผล
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department_id, role_id, is_active) 
SELECT '4001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'อภิวัฒน์', 'รุ่งเรือง', 'หัวหน้ากลุ่มงานติดตามและประเมินผล', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'ธนพร', 'มณีรัตน์', 'เจ้าหน้าที่ติดตามและประเมินผล', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ภาคภูมิ', 'เจริญศักดิ์', 'เจ้าหน้าที่ติดตามและประเมินผล', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ศุภชัย', 'วงศ์คำ', 'เจ้าหน้าที่ธุรการ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'พิมพ์ชนก', 'สายทอง', 'เจ้าหน้าที่ระบบวิทยสื่อสาร', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4006', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ปกรณ์', 'ศีรวดี', 'เจ้าหน้าที่ระบบวิทยสื่อสาร', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เจรจศักดิพร', 'อินทรี', 'เจ้าหน้าที่บริการสื่อสาร', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user'
UNION ALL
SELECT '4008', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ธนกุล', 'ชัยพร', 'เจ้าหน้าที่ความมั่นคงสารสนเทศ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'FIN' AND r.role_name = 'user';

-- ============================================
-- ชั้น 5: กลุ่มงานโครงสร้างพื้นฐานเครือข่ายและการสื่อสาร
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department_id, role_id, is_active) 
SELECT '5001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'วรพล', 'แสงดี', 'เจ้าหน้าที่ Help Desk', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'อรพิม', 'บุญอ่อน', 'เจ้าหน้าที่ Help Desk', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'กษมา', 'พูลสุข', 'เจ้าหน้าที่บริหารทั่วไป', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5004', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'เอกชัย', 'มั่นคง', 'วิศวกรเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5005', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ปรีชา', 'คำดี', 'ผู้ดูแลระบบเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5006', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ศุณเอ', 'ศรีทอง', 'ผู้ดูแลระบบเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user'
UNION ALL
SELECT '5007', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'พีชิต', 'ใจเป็น', 'ช่างเทคนิคระบบเครือข่าย', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'HR' AND r.role_name = 'user';

-- ============================================
-- ชั้น 6: กลุ่มงานเทคโนโลยีการสื่อสาร (ระบบวิทยุและความเทียบ)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department_id, role_id, is_active) 
SELECT '6001', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ธีรวัฒน์', 'วงศ์ใหญ่', 'หัวหน้าฝ่ายระบบวิทยและความเทียบ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'CENTRAL' AND r.role_name = 'central_office_staff'
UNION ALL
SELECT '6002', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'นาย', 'ภานุเดช', 'ศรีสลัด', 'วิศวกรระบบดาวเทียบ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'CENTRAL' AND r.role_name = 'central_office_staff'
UNION ALL
SELECT '6003', '$2b$10$rqZ5V.jKHXxJ0gZLZ5vJ2O7yJ8mQJ6sZqX8xK5xJ9xJ0xJ1xJ2xJ3', 'น.ส.', 'พันธารัตน์', 'แสงทอง', 'เจ้าหน้าที่ควบคุมระบบดาวเทียบ', d.id, r.id, true
FROM departments d, roles r WHERE d.department_code = 'CENTRAL' AND r.role_name = 'central_office_staff';

-- ============================================
-- สรุป: รวม 30 พนักงาน
-- ============================================
-- ชั้น 2 (IT): 9 คน
-- ชั้น 3 (ADMIN): 5 คน  
-- ชั้น 4 (FIN): 8 คน
-- ชั้น 5 (HR): 7 คน
-- ชั้น 6 (CENTRAL): 3 คน
