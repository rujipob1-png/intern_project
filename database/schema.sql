-- ============================================
-- ระบบการลาออนไลน์สำหรับข้าราชการ
-- Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ตาราง Departments (กอง/แผนก)
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(20) UNIQUE NOT NULL, -- รหัสกอง เช่น IT, HR, FIN
    department_name VARCHAR(100) NOT NULL, -- ชื่อกอง
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ตาราง Roles (บทบาทในระบบ)
-- ============================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_level INTEGER NOT NULL, -- 1=User, 2=Director, 3=CentralOfficeStaff, 4=CentralOfficeHead, 5=Admin
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ตาราง Users (ข้อมูลเจ้าพนักงาน)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(20) UNIQUE NOT NULL, -- รหัสตำแหน่ง (ใช้สำหรับ login)
    password_hash TEXT NOT NULL, -- รหัสผ่านที่เข้ารหัสแล้ว
    
    -- ข้อมูลส่วนตัว
    title VARCHAR(20), -- คำนำหน้า (นาย, นาง, นางสาว)
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100), -- ตำแหน่ง
    department_id UUID REFERENCES departments(id), -- เชื่อมกับตาราง departments
    phone VARCHAR(20),
    
    -- Role และสถานะ
    role_id UUID REFERENCES roles(id) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- สิทธิ์การลาประจำปี (จำนวนวันที่เหลือ)
    sick_leave_balance INTEGER DEFAULT 30, -- ลาป่วย 30 วัน/ปี
    personal_leave_balance INTEGER DEFAULT 0, -- ลากิจ (คำนวณตามเกณฑ์)
    vacation_leave_balance INTEGER DEFAULT 10, -- ลาพักผ่อน 10 วัน/ปี
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ตาราง Leave Types (ประเภทการลา)
-- ============================================
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(20) UNIQUE NOT NULL, -- รหัสประเภท
    type_name VARCHAR(100) NOT NULL, -- ชื่อประเภทการลา
    description TEXT,
    requires_document BOOLEAN DEFAULT false, -- ต้องแนบเอกสารหรือไม่
    max_days_per_year INTEGER, -- จำนวนวันสูงสุดต่อปี (null = ไม่จำกัด)
    is_paid BOOLEAN DEFAULT true, -- ลาแบบได้รับเงินเดือนหรือไม่
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ตาราง Leaves (คำขอลา)
-- ============================================
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_number VARCHAR(50) UNIQUE, -- เลขที่เอกสาร (auto generate)
    
    -- ข้อมูลผู้ยื่นคำขอ
    user_id UUID REFERENCES users(id) NOT NULL,
    leave_type_id UUID REFERENCES leave_types(id) NOT NULL,
    
    -- ระยะเวลาการลา
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    selected_dates DATE[], -- อาร์เรย์ของวันที่ที่เลือกลา (รองรับการเลือกวันไม่ต่อเนื่อง)
    
    -- รายละเอียดการลา
    reason TEXT NOT NULL, -- เหตุผลการลา
    contact_address TEXT, -- ที่อยู่ที่สามารถติดต่อได้
    contact_phone VARCHAR(20), -- เบอร์โทรที่สามารถติดต่อได้
    
    -- เอกสารแนบ (optional)
    document_url TEXT, -- URL ของเอกสารที่อัพโหลดไปยัง Supabase Storage
    
    -- สถานะคำขอ
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved_level1, approved_level2, approved_final, rejected, cancelled
    current_approval_level INTEGER DEFAULT 1, -- ระดับการอนุมัติปัจจุบัน (1-4)
    
    -- วันที่สร้างและแก้ไข
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_reason TEXT
);

-- ============================================
-- 5. ตาราง Approvals (ประวัติการอนุมัติ)
-- ============================================
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_id UUID REFERENCES leaves(id) NOT NULL,
    approver_id UUID REFERENCES users(id) NOT NULL, -- ผู้อนุมัติ
    
    -- ข้อมูลการอนุมัติ
    approval_level INTEGER NOT NULL, -- ระดับการอนุมัติ (1=ผอ.กอง, 2=กองกลาง, 3=Admin)
    action VARCHAR(20) NOT NULL, -- approved, rejected
    comment TEXT, -- ความเห็น/เหตุผล (บังคับถ้า rejected)
    
    -- วันเวลา
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. ตาราง Leave History (ประวัติการลาทั้งหมด - สำหรับรายงาน)
-- ============================================
CREATE TABLE leave_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    leave_id UUID REFERENCES leaves(id) NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, approved, rejected, cancelled
    action_by UUID REFERENCES users(id),
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    remarks TEXT
);

-- ============================================
-- 7. ตาราง Leave Balance Logs (บันทึกการเปลี่ยนแปลงวันลา)
-- ============================================
CREATE TABLE leave_balance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) NOT NULL,
    leave_type VARCHAR(50) NOT NULL, -- sick_leave, personal_leave, vacation_leave
    change_amount INTEGER NOT NULL, -- จำนวนวันที่เปลี่ยน (+/-)
    balance_after INTEGER NOT NULL, -- ยอดคงเหลือหลังเปลี่ยน
    reason TEXT NOT NULL, -- เหตุผล (leave_approved, leave_cancelled, annual_reset)
    reference_leave_id UUID REFERENCES leaves(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Insert ข้อมูล Departments เริ่มต้น
-- ============================================
INSERT INTO departments (department_code, department_name, description) VALUES
    ('IT', 'กองเทคโนโลยีสารสนเทศ', 'ดูแลระบบคอมพิวเตอร์และเทคโนโลยี'),
    ('HR', 'กองทรัพยากรบุคคล', 'จัดการด้านบุคลากรและสวัสดิการ'),
    ('FIN', 'กองการเงินและบัญชี', 'จัดการด้านการเงินและบัญชี'),
    ('ADMIN', 'กองบริหารทั่วไป', 'งานบริหารและประสานงานทั่วไป'),
    ('CENTRAL', 'กองกลาง', 'กองอำนวยการและประสานงานกลาง');

-- ============================================
-- Insert ข้อมูล Roles เริ่มต้น
-- ============================================
INSERT INTO roles (role_name, role_level, description) VALUES
    ('user', 1, 'เจ้าพนักงานทั่วไป - สามารถยื่นคำขอลาและยกเลิกการลา'),
    ('director', 2, 'ผู้อำนวยการกอง - อนุมัติคำขอลาของพนักงานในกองตนเอง (ระดับ 1)'),
    ('central_office_staff', 3, 'พนักงานกองกลาง - ตรวจสอบเอกสารและส่งต่อ (ระดับ 2)'),
    ('central_office_head', 4, 'หัวหน้ากองกลาง - อนุมัติคำขอลาระดับ 3'),
    ('admin', 5, 'ผู้บริหารสูงสุด - อนุมัติขั้นสุดท้าย (ระดับ 4)');

-- ============================================
-- Insert ข้อมูล Leave Types เริ่มต้น
-- ============================================
INSERT INTO leave_types (type_code, type_name, description, requires_document, max_days_per_year, is_paid) VALUES
    ('SICK', 'ลาป่วย', 'ลาเนื่องจากเจ็บป่วย', false, 30, true),
    ('PERSONAL', 'ลากิจส่วนตัว', 'ลากิจส่วนตัว/กิจธุระ', false, null, true),
    ('VACATION', 'ลาพักผ่อน', 'ลาพักผ่อนประจำปี', false, 10, true),
    ('MATERNITY', 'ลาคลอดบุตร', 'ลาคลอดบุตรสำหรับพนักงานหญิง', true, 90, true),
    ('PATERNITY', 'คลอดบุตร', 'ลาเพื่อช่วยเหลือภริยาคลอดบุตร', true, 15, true),
    ('HAJJ', 'ลาประกอบพิธีฮัจย์', 'ลาเพื่อประกอบพิธีฮัจย์', true, null, true),
    ('ORDINATION', 'ลาอุปสมบท', 'ลาบวช/อุปสมบท', true, null, true),
    ('MILITARY', 'ลาเพื่อรับราชการทหาร', 'ลาเพื่อเข้ารับราชการทหาร', true, null, false),
    ('OTHER', 'ลาอื่นๆ', 'ลาประเภทอื่นๆ ที่ไม่อยู่ในหมวดข้างต้น', false, null, true);

-- ============================================
-- สร้าง Indexes เพื่อเพิ่มประสิทธิภาพ
-- ============================================
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);
CREATE INDEX idx_approvals_leave_id ON approvals(leave_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_leave_history_user_id ON leave_history(user_id);
CREATE INDEX idx_leave_balance_logs_user_id ON leave_balance_logs(user_id);

-- ============================================
-- สร้าง Functions สำหรับ Auto-update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- สร้าง Function สำหรับ Auto-generate Leave Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_leave_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year VARCHAR(4);
    current_month VARCHAR(2);
    sequence_num INTEGER;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');
    
    -- นับจำนวน leaves ในเดือนปัจจุบัน
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM leaves
    WHERE TO_CHAR(created_at, 'YYYYMM') = current_year || current_month;
    
    -- สร้างเลขที่เอกสาร: LV-YYYYMM-XXXX
    NEW.leave_number := 'LV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_leave_number BEFORE INSERT ON leaves
    FOR EACH ROW EXECUTE FUNCTION generate_leave_number();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_logs ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับ users table
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Directors and above can view employee data" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id::text = auth.uid()::text AND r.role_level >= 2
        )
    );

-- Policies สำหรับ leaves table
CREATE POLICY "Users can view their own leaves" ON leaves
    FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own leaves" ON leaves
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Directors and above can view all leaves" ON leaves
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id::text = auth.uid()::text AND r.role_level >= 2
        )
    );

-- Policies สำหรับ approvals table
CREATE POLICY "Approvers can view and create approvals" ON approvals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id::text = auth.uid()::text AND r.role_level >= 2
        )
    );

-- ============================================
-- สร้าง Views สำหรับการดึงข้อมูลที่ใช้บ่อย
-- ============================================

-- View: รายการลาพร้อมข้อมูลผู้ยื่นและประเภทการลา
CREATE OR REPLACE VIEW leave_details AS
SELECT 
    l.id,
    l.leave_number,
    l.start_date,
    l.end_date,
    l.total_days,
    l.reason,
    l.status,
    l.current_approval_level,
    l.created_at,
    -- ข้อมูลผู้ยื่น
    u.employee_code,
    u.title,
    u.first_name,
    u.last_name,
    u.position,
    u.department,
    -- ประเภทการลา
    lt.type_name,
    lt.type_code,
    -- สถานะการอนุมัติล่าสุด
    (SELECT comment FROM approvals WHERE leave_id = l.id ORDER BY created_at DESC LIMIT 1) as latest_comment
FROM leaves l
JOIN users u ON l.user_id = u.id
JOIN leave_types lt ON l.leave_type_id = lt.id;

COMMENT ON TABLE roles IS 'ตารางเก็บบทบาทในระบบ';
COMMENT ON TABLE users IS 'ตารางเก็บข้อมูลเจ้าพนักงาน';
COMMENT ON TABLE leave_types IS 'ตารางเก็บประเภทการลา';
COMMENT ON TABLE leaves IS 'ตารางเก็บคำขอลา';
COMMENT ON TABLE approvals IS 'ตารางเก็บประวัติการอนุมัติ';
COMMENT ON TABLE leave_history IS 'ตารางเก็บประวัติการเปลี่ยนแปลงทั้งหมด';
COMMENT ON TABLE leave_balance_logs IS 'ตารางเก็บประวัติการเปลี่ยนแปลงวันลาคงเหลือ';
