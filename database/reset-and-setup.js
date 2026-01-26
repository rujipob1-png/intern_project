-- ============================================
-- Setup ฐานข้อมูลใหม่สะอาด สำหรับ Supabase Project ใหม่
-- รันตามลำดับ 1, 2, 3, 4
-- ============================================

-- ============================================
-- STEP 1: สร้าง roles table และข้อมูล
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_level INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (role_name, role_level, description) VALUES
('user', 1, 'พนักงานทั่วไป'),
('director', 2, 'ผู้อำนวยการ'),
('central_office_staff', 3, 'เจ้าหน้าที่สำนักงานกลาง'),
('central_office_head', 4, 'หัวหน้าสำนักงานกลาง'),
('admin', 5, 'ผู้ดูแลระบบ')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================
-- STEP 2: สร้าง users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  title VARCHAR(50),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  department VARCHAR(50),
  phone VARCHAR(20),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  sick_leave_balance INTEGER DEFAULT 30,
  personal_leave_balance INTEGER DEFAULT 10,
  vacation_leave_balance INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 3: Insert 32 users (2001-6003)
-- Password สำหรับทุกคน: 123456
-- ============================================
INSERT INTO users (employee_code, password_hash, first_name, last_name, department, role_id) VALUES
-- IT Department (9 คน - role: user)
('2001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธรรมทร', 'วัฒนะ', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'กัญญารา', 'ศรีสุข', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พงศกร', 'มาดทอง', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ณัฐวดี', 'คำเสน', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุภชัย', 'แก้วดี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปรียารัตน์', 'ใจดี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรชิต', 'พูลศรี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2008', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธนนท์', 'เทพชัย', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
('2009', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'จุฑามาศ', 'ศรีทอง', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),

-- ADMIN Department (5 คน - 1 director + 4 users)
('3001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'สมชาย', 'พิพัฒน์', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'director')),
('3002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรารัตน์', 'แสงทอง', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
('3003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ชาญชัย', 'มั่นคง', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
('3004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศิริพร', 'ลบใจ', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
('3005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เกรียงไกร', 'ใจเป็น', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),

-- FIN Department (8 คน - role: user)
('4001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'อภิวัฒน์', 'รุ่งเรือง', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธนพร', 'มณีรัตน์', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ภาคภูมิ', 'เจริญศักดิ์', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุภชัย', 'วงศ์คำ', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พิมพ์ชนก', 'สายทอง', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปกรณ์', 'ศีรวดี', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เจรจศักดิพร', 'อินทรี', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
('4008', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธนกุล', 'ชัยพร', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),

-- HR Department (7 คน - role: user)
('5001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรพล', 'แสงดี', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'อรพิม', 'บุญอ่อน', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'กษมา', 'พูลสุข', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เอกชัย', 'มั่นคง', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปรีชา', 'คำดี', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุณเอ', 'ศรีทอง', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
('5007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พีชิต', 'ใจเป็น', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),

-- CENTRAL Department (3 คน - role: central_office_staff)
('6001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธีรวัฒน์', 'วงศ์ใหญ่', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff')),
('6002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ภานุเดช', 'ศรีสลัด', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff')),
('6003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พันธารัตน์', 'แสงทอง', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff'));

-- ============================================
-- STEP 4: ตรวจสอบผลลัพธ์
-- ============================================
SELECT department, COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active
FROM users 
GROUP BY department 
ORDER BY department;

-- ควรได้:
-- ADMIN: 5 คน
-- CENTRAL: 3 คน
-- FIN: 8 คน
-- HR: 7 คน
-- IT: 9 คน
-- รวม: 32 คน
