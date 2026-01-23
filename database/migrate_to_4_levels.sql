-- ============================================
-- Migration Script: อัพเกรดระบบเป็น 4 ระดับการอนุมัติ
-- ============================================

-- Step 1: สร้างตาราง departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_code VARCHAR(20) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: เพิ่มข้อมูล departments
INSERT INTO departments (department_code, department_name, description) VALUES
    ('IT', 'กองเทคโนโลยีสารสนเทศ', 'ดูแลระบบคอมพิวเตอร์และเทคโนโลยี'),
    ('HR', 'กองทรัพยากรบุคคล', 'จัดการด้านบุคลากรและสวัสดิการ'),
    ('FIN', 'กองการเงินและบัญชี', 'จัดการด้านการเงินและบัญชี'),
    ('ADMIN', 'กองบริหารทั่วไป', 'งานบริหารและประสานงานทั่วไป'),
    ('CENTRAL', 'กองกลาง', 'กองอำนวยการและประสานงานกลาง')
ON CONFLICT (department_code) DO NOTHING;

-- Step 3: เพิ่มคอลัมน์ department_id ในตาราง users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- Step 4: เพิ่ม role ใหม่ (central_office_head)
INSERT INTO roles (role_name, role_level, description) VALUES
    ('central_office_staff', 3, 'พนักงานกองกลาง - ตรวจสอบเอกสารและส่งต่อ (ระดับ 2)'),
    ('central_office_head', 4, 'หัวหน้ากองกลาง - อนุมัติคำขอลาระดับ 3')
ON CONFLICT (role_name) DO NOTHING;

-- Step 5: อัพเดต role ที่มีอยู่แล้ว
UPDATE roles SET 
    role_level = 2,
    description = 'ผู้อำนวยการกอง - อนุมัติคำขอลาของพนักงานในกองตนเอง (ระดับ 1)'
WHERE role_name = 'director';

UPDATE roles SET 
    role_level = 5,
    description = 'ผู้บริหารสูงสุด - อนุมัติขั้นสุดท้าย (ระดับ 4)'
WHERE role_name = 'admin';

-- Step 6: แปลง central_office เก่า เป็น central_office_staff
-- (ถ้ามีข้อมูลเก่าอยู่)
UPDATE roles SET 
    role_name = 'central_office_staff',
    role_level = 3,
    description = 'พนักงานกองกลาง - ตรวจสอบเอกสารและส่งต่อ (ระดับ 2)'
WHERE role_name = 'central_office';

-- Step 7: อัพเดตข้อมูล users ให้มี department (ตัวอย่าง)
-- กำหนด department เริ่มต้นให้กับ user ที่ยังไม่มี department
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE department_code = 'ADMIN' LIMIT 1)
WHERE department_id IS NULL AND role_id = (SELECT id FROM roles WHERE role_name = 'user' LIMIT 1);

-- Step 8: เพิ่ม index สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_leaves_user_department ON leaves(user_id);

-- Step 9: อัพเดต current_approval_level ให้รองรับ 4 ระดับ
-- (leaves table ใช้ current_approval_level 1-4 แทน 1-3)
COMMENT ON COLUMN leaves.current_approval_level IS 'ระดับการอนุมัติปัจจุบัน (1=Director, 2=CentralStaff, 3=CentralHead, 4=Admin)';

-- Step 10: แสดงผลลัพธ์
SELECT 'Migration completed successfully!' as status;
SELECT 'Total departments:' as info, COUNT(*) as count FROM departments;
SELECT 'Total roles:' as info, COUNT(*) as count FROM roles;
SELECT 'Users with department:' as info, COUNT(*) as count FROM users WHERE department_id IS NOT NULL;
