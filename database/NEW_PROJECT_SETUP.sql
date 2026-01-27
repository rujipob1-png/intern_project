-- ============================================
-- FULL DATABASE SETUP สำหรับ Supabase Project ใหม่
-- รัน SQL นี้ทั้งหมดใน Supabase SQL Editor ของ project: dyiogforukaqpbhwtggw
-- ============================================

-- 1. สร้าง roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  role_level INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert roles
INSERT INTO roles (role_name, role_level, description) VALUES
  ('user', 1, 'พนักงานทั่วไป'),
  ('director', 2, 'ผู้อำนวยการ'),
  ('central_office_staff', 3, 'เจ้าหน้าที่สำนักงานกลาง'),
  ('central_office_head', 4, 'หัวหน้าสำนักงานกลาง'),
  ('admin', 5, 'ผู้ดูแลระบบ')
ON CONFLICT (role_name) DO NOTHING;

-- 3. สร้าง users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  title VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  department VARCHAR(50),
  phone VARCHAR(20),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  sick_leave_balance INTEGER DEFAULT 30,
  personal_leave_balance INTEGER DEFAULT 10,
  vacation_leave_balance INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. สร้าง leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(10) UNIQUE NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  type_name_th VARCHAR(100) NOT NULL,
  type_name_en VARCHAR(100),
  description TEXT,
  max_days_per_year INTEGER,
  requires_document BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert leave types
INSERT INTO leave_types (type_code, type_name, type_name_th, type_name_en, max_days_per_year, requires_document) VALUES
  ('SICK', 'ลาป่วย', 'ลาป่วย', 'Sick Leave', 30, true),
  ('PERSONAL', 'ลากิจ', 'ลากิจ', 'Personal Leave', 10, false),
  ('VACATION', 'ลาพักผ่อน', 'ลาพักผ่อน', 'Vacation Leave', 10, false)
ON CONFLICT (type_code) DO NOTHING;

-- 6. สร้าง leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  acting_person_id UUID REFERENCES users(id),
  acting_approved BOOLEAN DEFAULT false,
  acting_approved_at TIMESTAMP,
  director_approved BOOLEAN,
  director_approved_at TIMESTAMP,
  director_approved_by UUID REFERENCES users(id),
  central_approved BOOLEAN,
  central_approved_at TIMESTAMP,
  central_approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. สร้าง departments table  
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(20) UNIQUE NOT NULL,
  department_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Insert departments
INSERT INTO departments (department_code, department_name) VALUES
  ('IT', 'ฝ่ายเทคโนโลยีสารสนเทศ'),
  ('ADMIN', 'ฝ่ายบริหารทั่วไป'),
  ('FIN', 'ฝ่ายการเงินและบัญชี'),
  ('HR', 'ฝ่ายทรัพยากรบุคคล'),
  ('CENTRAL', 'สำนักงานกลาง')
ON CONFLICT (department_code) DO NOTHING;

-- 9. Insert 32 employees พร้อม password = "123456"
INSERT INTO users (employee_code, password_hash, first_name, last_name, department, role_id) VALUES
  -- IT Department (9 คน)
  ('2001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธรรมทร', 'วัฒนะ', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'กัญญารา', 'ศรีสุข', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พงศกร', 'มาดทอง', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ณัฐวดี', 'คำเสน', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุภชัย', 'แก้วดี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปรียารัตน์', 'ใจดี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรชิต', 'พูลศรี', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2008', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ฐานนท์', 'เทพชัย', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  ('2009', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'จุฑามาศ', 'ศรีทอง', 'IT', (SELECT id FROM roles WHERE role_name = 'user')),
  
  -- ADMIN Department (5 คน - 1 director + 4 users)
  ('3001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'สมชาย', 'พิพัฒน์', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'director')),
  ('3002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรารัตน์', 'แสงทอง', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('3003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ชาญชัย', 'มั่นคง', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('3004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศิริพร', 'ลบใจ', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('3005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เกรียงไกร', 'ใจเป็น', 'ADMIN', (SELECT id FROM roles WHERE role_name = 'user')),
  
  -- FIN Department (8 คน)
  ('4001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'อภิวัฒน์', 'รุ่งเรือง', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธนพร', 'มณีรัตน์', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ภาคภูมิ', 'เจริญศักดิ์', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุภชัย', 'วงศ์คำ', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พิมพ์ชนก', 'สายทอง', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปกรณ์', 'ศีรวดี', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เจรจศักดิพร', 'อินทรี', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  ('4008', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธนกุล', 'ชัยพร', 'FIN', (SELECT id FROM roles WHERE role_name = 'user')),
  
  -- HR Department (7 คน)
  ('5001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'วรพล', 'แสงดี', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'อรพิม', 'บุญอ่อน', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'กษมา', 'พูลสุข', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5004', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'เอกชัย', 'มั่นคง', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5005', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ปรีชา', 'คำดี', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5006', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ศุณเอ', 'ศรีทอง', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  ('5007', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พีชิต', 'ใจเป็น', 'HR', (SELECT id FROM roles WHERE role_name = 'user')),
  
  -- CENTRAL Department (3 คน - central_office_staff)
  ('6001', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ธีรวัฒน์', 'วงศ์ใหญ่', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff')),
  ('6002', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'ภานุเดช', 'ศรีสลัด', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff')),
  ('6003', '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm', 'พันธารัตน์', 'แสงทอง', 'CENTRAL', (SELECT id FROM roles WHERE role_name = 'central_office_staff'));

-- 10. Verify data
SELECT 'Total users:' as label, COUNT(*) as count FROM users
UNION ALL
SELECT 'IT department:', COUNT(*) FROM users WHERE department = 'IT'
UNION ALL
SELECT 'ADMIN department:', COUNT(*) FROM users WHERE department = 'ADMIN'
UNION ALL
SELECT 'FIN department:', COUNT(*) FROM users WHERE department = 'FIN'
UNION ALL
SELECT 'HR department:', COUNT(*) FROM users WHERE department = 'HR'
UNION ALL
SELECT 'CENTRAL department:', COUNT(*) FROM users WHERE department = 'CENTRAL';
