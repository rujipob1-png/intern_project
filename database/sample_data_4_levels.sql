-- ============================================
-- Sample Data สำหรับระบบ 4 ระดับการอนุมัติ
-- ============================================

-- ลบข้อมูลเก่า (ถ้ามี)
DELETE FROM leave_history;
DELETE FROM approvals;
DELETE FROM leaves;
DELETE FROM users;

-- ============================================
-- 1. สร้าง Users แยกตาม Departments และ Roles
-- ============================================

-- กอง IT (3 คน: 2 users + 1 director)
INSERT INTO users (
    employee_code, password_hash, title, first_name, last_name, 
    position, phone, role_id, department_id
) VALUES
(
    'EMP001',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm', -- password: 123456
    'นาย',
    'สมชาย',
    'ใจดี',
    'นักวิเคราะห์ระบบ',
    '081-111-1001',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'IT')
),
(
    'EMP002',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นางสาว',
    'สมหญิง',
    'รักงาน',
    'โปรแกรมเมอร์',
    '081-111-1002',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'IT')
),
(
    'DIR001',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาย',
    'วิชัย',
    'เทคโนโลยี',
    'ผู้อำนวยการกองเทคโนโลยีสารสนเทศ',
    '081-111-1000',
    (SELECT id FROM roles WHERE role_name = 'director'),
    (SELECT id FROM departments WHERE department_code = 'IT')
);

-- กอง HR (3 คน: 2 users + 1 director)
INSERT INTO users (
    employee_code, password_hash, title, first_name, last_name, 
    position, phone, role_id, department_id
) VALUES
(
    'EMP003',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาง',
    'จินตนา',
    'ดูแลดี',
    'เจ้าหน้าที่ทรัพยากรบุคคล',
    '081-222-2001',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'HR')
),
(
    'EMP004',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาย',
    'ประเสริฐ',
    'มานะ',
    'นักทรัพยากรบุคคล',
    '081-222-2002',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'HR')
),
(
    'DIR002',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาง',
    'สุภาพร',
    'จัดการดี',
    'ผู้อำนวยการกองทรัพยากรบุคคล',
    '081-222-2000',
    (SELECT id FROM roles WHERE role_name = 'director'),
    (SELECT id FROM departments WHERE department_code = 'HR')
);

-- กอง Finance (3 คน: 2 users + 1 director)
INSERT INTO users (
    employee_code, password_hash, title, first_name, last_name, 
    position, phone, role_id, department_id
) VALUES
(
    'EMP005',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นางสาว',
    'วิมล',
    'คำนวณ',
    'นักบัญชี',
    '081-333-3001',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'FIN')
),
(
    'EMP006',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาย',
    'สมศักดิ์',
    'เงินดี',
    'เจ้าหน้าที่การเงิน',
    '081-333-3002',
    (SELECT id FROM roles WHERE role_name = 'user'),
    (SELECT id FROM departments WHERE department_code = 'FIN')
),
(
    'DIR003',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาย',
    'อนันต์',
    'ละเอียด',
    'ผู้อำนวยการกองการเงินและบัญชี',
    '081-333-3000',
    (SELECT id FROM roles WHERE role_name = 'director'),
    (SELECT id FROM departments WHERE department_code = 'FIN')
);

-- กองกลาง (2 คน: 1 staff + 1 head)
INSERT INTO users (
    employee_code, password_hash, title, first_name, last_name, 
    position, phone, role_id, department_id
) VALUES
(
    'CTR001',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นางสาว',
    'พิมพ์ใจ',
    'ตรวจสอบ',
    'เจ้าหน้าที่กองกลาง',
    '081-444-4001',
    (SELECT id FROM roles WHERE role_name = 'central_office_staff'),
    (SELECT id FROM departments WHERE department_code = 'CENTRAL')
),
(
    'CTR002',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาง',
    'สุดา',
    'รอบคอบ',
    'หัวหน้ากองกลาง',
    '081-444-4000',
    (SELECT id FROM roles WHERE role_name = 'central_office_head'),
    (SELECT id FROM departments WHERE department_code = 'CENTRAL')
);

-- Admin (ผู้บริหารสูงสุด)
INSERT INTO users (
    employee_code, password_hash, title, first_name, last_name, 
    position, phone, role_id, department_id
) VALUES
(
    'ADMIN001',
    '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt31Na/ibfh5htIT4hj.LrqJm',
    'นาย',
    'ประสิทธิ์',
    'ผู้นำองค์กร',
    'ผู้อำนวยการสูงสุด',
    '081-000-0001',
    (SELECT id FROM roles WHERE role_name = 'admin'),
    (SELECT id FROM departments WHERE department_code = 'ADMIN')
);

-- ============================================
-- 2. สร้าง Leave Requests ตัวอย่าง
-- ============================================

-- คำขอลาจาก EMP001 (กอง IT) - ลาพักผ่อน
INSERT INTO leaves (
    user_id,
    leave_type_id,
    start_date,
    end_date,
    total_days,
    selected_dates,
    reason,
    contact_address,
    contact_phone,
    status,
    current_approval_level
) VALUES
(
    (SELECT id FROM users WHERE employee_code = 'EMP001'),
    (SELECT id FROM leave_types WHERE type_code = 'VACATION'),
    '2026-01-20',
    '2026-01-22',
    3,
    ARRAY['2026-01-20'::date, '2026-01-21'::date, '2026-01-22'::date],
    'ลาพักผ่อนตามแผนที่วางไว้',
    '123 ถ.สุขุมวิท กรุงเทพฯ',
    '081-111-1001',
    'pending',
    1
);

-- คำขอลาจาก EMP003 (กอง HR) - ลาป่วย
INSERT INTO leaves (
    user_id,
    leave_type_id,
    start_date,
    end_date,
    total_days,
    selected_dates,
    reason,
    contact_address,
    contact_phone,
    status,
    current_approval_level
) VALUES
(
    (SELECT id FROM users WHERE employee_code = 'EMP003'),
    (SELECT id FROM leave_types WHERE type_code = 'SICK'),
    '2026-01-19',
    '2026-01-19',
    1,
    ARRAY['2026-01-19'::date],
    'ป่วยเป็นไข้หวัด',
    '456 ถ.พระราม 4 กรุงเทพฯ',
    '081-222-2001',
    'pending',
    1
);

-- แสดงสรุปข้อมูล
SELECT 'Sample data created successfully!' as status;
SELECT 'Total users:' as info, COUNT(*) as count FROM users;
SELECT 'Users by role:' as info, r.role_name, COUNT(u.id) as count 
FROM users u 
JOIN roles r ON u.role_id = r.id 
GROUP BY r.role_name;
SELECT 'Users by department:' as info, d.department_name, COUNT(u.id) as count 
FROM users u 
JOIN departments d ON u.department_id = d.id 
GROUP BY d.department_name;
SELECT 'Total leaves:' as info, COUNT(*) as count FROM leaves;
