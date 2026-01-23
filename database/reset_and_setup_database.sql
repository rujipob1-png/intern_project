-- ============================================
-- RESET DATABASE: ลบทุกอย่างและสร้างใหม่
-- ระบบการลาออนไลน์สำหรับข้าราชการ
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ขั้นตอนที่ 1: ลบตารางเก่าทั้งหมด
-- ============================================
DROP TABLE IF EXISTS approval_history CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================
-- ขั้นตอนที่ 2: สร้างตาราง Roles
-- ============================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มข้อมูล roles
INSERT INTO roles (role_name, role_level, description) VALUES
('user', 1, 'พนักงานทั่วไป'),
('director', 2, 'ผู้อำนวยการกลุ่มงาน'),
('central_office_staff', 3, 'เจ้าหน้าที่ตรวจสอบเอกสาร'),
('central_office_head', 4, 'หัวหน้ากลุ่มงานกลาง'),
('admin', 5, 'ผู้อำนวยการสูงสุด');

-- ============================================
-- ขั้นตอนที่ 3: สร้างตาราง Departments
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(20) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มข้อมูล 23 departments ตามโครงสร้างจริง
INSERT INTO departments (department_code, department_name, description) VALUES
-- กลุ่มงานเทคโนโลยีสารสนเทศ (KTS)
('KTS', 'กลุ่มงานเทคโนโลยีสารสนเทศ', 'ชั้น 1'),
('KTS-DEV1', 'ส่วนพัฒนาระบบ 1', 'ชั้น 1 - ภายใต้ KTS'),
('KTS-DEV2', 'ส่วนพัฒนาระบบ 2', 'ชั้น 1 - ภายใต้ KTS'),
('KTS-NET', 'ส่วนเครือข่าย', 'ชั้น 1 - ภายใต้ KTS'),
('KTS-SUPPORT', 'ส่วนสนับสนุนผู้ใช้', 'ชั้น 1 - ภายใต้ KTS'),

-- กลุ่มงานบริหารจัดการ (KBJ)
('KBJ', 'กลุ่มงานบริหารจัดการ', 'ชั้น 2'),
('KBJ-HR', 'ส่วนทรัพยากรบุคคล', 'ชั้น 2 - ภายใต้ KBJ'),
('KBJ-FIN', 'ส่วนการเงิน', 'ชั้น 2 - ภายใต้ KBJ'),
('KBJ-GEN', 'ส่วนธุรการ', 'ชั้น 2 - ภายใต้ KBJ'),
('KBJ-PROC', 'ส่วนจัดซื้อจัดจ้าง', 'ชั้น 2 - ภายใต้ KBJ'),

-- กลุ่มงานติดตามประเมินผล (KTP)
('KTP', 'กลุ่มงานติดตามประเมินผล', 'ชั้น 3'),
('KTP-DEV', 'ส่วนพัฒนาระบบติดตาม', 'ชั้น 3 - ภายใต้ KTP'),
('KTP-REPORT', 'ส่วนรายงาน', 'ชั้น 3 - ภายใต้ KTP'),
('KTP-ANALYSIS', 'ส่วนวิเคราะห์', 'ชั้น 3 - ภายใต้ KTP'),

-- กลุ่มงานโครงสร้างพื้นฐาน (KKS)
('KKS', 'กลุ่มงานโครงสร้างพื้นฐาน', 'ชั้น 4'),
('KKS-INFRA', 'ส่วนโครงสร้างพื้นฐาน', 'ชั้น 4 - ภายใต้ KKS'),
('KKS-SERVER', 'ส่วนเซิร์ฟเวอร์', 'ชั้น 4 - ภายใต้ KKS'),
('KKS-SECURITY', 'ส่วนรักษาความปลอดภัย', 'ชั้น 4 - ภายใต้ KKS'),
('KKS-ADMIN', 'ส่วนธุรการกลาง', 'ชั้น 4 - ภายใต้ KKS'),

-- สำนักงานผู้บริหาร (EXECUTIVE)
('EXECUTIVE', 'สำนักงานผู้บริหาร', 'ชั้น 5'),
('EXEC-DIRECTOR', 'สำนักผู้อำนวยการ', 'ชั้น 5 - ภายใต้ EXECUTIVE'),
('EXEC-SECRETARY', 'ฝ่ายเลขานุการ', 'ชั้น 5 - ภายใต้ EXECUTIVE'),
('EXEC-POLICY', 'ฝ่ายนโยบายและแผน', 'ชั้น 5 - ภายใต้ EXECUTIVE');

-- ============================================
-- ขั้นตอนที่ 4: สร้างตาราง Users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- ข้อมูลส่วนตัว
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(20),
    
    -- Foreign Keys
    department_id UUID REFERENCES departments(id),
    role_id UUID REFERENCES roles(id) NOT NULL,
    
    -- สถานะ
    is_active BOOLEAN DEFAULT true,
    
    -- สิทธิ์การลาประจำปี
    sick_leave_balance INTEGER DEFAULT 30,
    personal_leave_balance INTEGER DEFAULT 0,
    vacation_leave_balance INTEGER DEFAULT 10,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_department_id ON users(department_id);

-- ============================================
-- ขั้นตอนที่ 5: สร้างตาราง Leave Types
-- ============================================
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    requires_document BOOLEAN DEFAULT false,
    max_days_per_year INTEGER,
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่มประเภทการลา
INSERT INTO leave_types (type_code, type_name, description, requires_document, max_days_per_year, is_paid) VALUES
('SICK', 'ลาป่วย', 'ลาป่วยทั่วไป', true, 30, true),
('PERSONAL', 'ลากิจ', 'ลากิจส่วนตัว', false, NULL, true),
('VACATION', 'ลาพักผ่อน', 'ลาพักผ่อนประจำปี', false, 10, true),
('MATERNITY', 'ลาคลอดบุตร', 'ลาคลอดบุตร', true, 90, true),
('ORDINATION', 'ลาบวช', 'ลาบวชพระ', true, 120, true),
('MILITARY', 'ลาเข้ารับการตรวจเลือกทหาร', 'ลาเข้ารับการตรวจเลือกทหาร', true, NULL, true),
('STUDY', 'ลาศึกษาต่อ', 'ลาศึกษาต่อ', true, NULL, false);

-- ============================================
-- ขั้นตอนที่ 6: สร้างตาราง Leaves
-- ============================================
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_number VARCHAR(50) UNIQUE,
    
    -- ข้อมูลผู้ยื่นคำขอ
    user_id UUID REFERENCES users(id) NOT NULL,
    leave_type_id UUID REFERENCES leave_types(id) NOT NULL,
    
    -- ระยะเวลาการลา
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    -- รายละเอียดการลา
    reason TEXT NOT NULL,
    contact_address TEXT,
    contact_phone VARCHAR(20),
    
    -- เอกสารแนบ
    document_url TEXT,
    
    -- สถานะการอนุมัติ (4 ระดับ)
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, approved_level1, approved_level2, approved_level3, approved_final, rejected, cancelled
    
    -- ผู้อนุมัติแต่ละระดับ
    director_id UUID REFERENCES users(id),
    director_approved_at TIMESTAMP WITH TIME ZONE,
    director_remarks TEXT,
    
    central_office_staff_id UUID REFERENCES users(id),
    central_office_staff_approved_at TIMESTAMP WITH TIME ZONE,
    central_office_staff_remarks TEXT,
    
    central_office_head_id UUID REFERENCES users(id),
    central_office_head_approved_at TIMESTAMP WITH TIME ZONE,
    central_office_head_remarks TEXT,
    
    admin_id UUID REFERENCES users(id),
    admin_approved_at TIMESTAMP WITH TIME ZONE,
    admin_remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง index
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_start_date ON leaves(start_date);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับ departments (อ่านได้ทุกคน)
CREATE POLICY "Allow read access to departments" ON departments
    FOR SELECT USING (true);

-- สร้าง policy สำหรับ users (อ่านได้ทุกคน ที่ active)
CREATE POLICY "Allow read access to active users" ON users
    FOR SELECT USING (is_active = true);

-- สร้าง policy สำหรับ leaves (user เห็นเฉพาะของตัวเอง, approver เห็นที่เกี่ยวข้อง)
CREATE POLICY "Users can view own leaves" ON leaves
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- แสดงผลลัพธ์
-- ============================================
SELECT '🎉 Database reset completed successfully!' as status;
SELECT '✅ Tables created: roles, departments, users, leave_types, leaves' as info;
SELECT '' as separator;
SELECT 'Summary:' as section;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_departments FROM departments;
SELECT COUNT(*) as total_leave_types FROM leave_types;
SELECT COUNT(*) as total_users FROM users;
SELECT '' as separator;
SELECT '👉 Next step: Run create_sample_users.sql to create test users' as next_action;
