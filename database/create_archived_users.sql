-- สร้าง Table สำหรับเก็บข้อมูลบุคลากรที่ถูกลบ (Archive)
-- ใช้สำหรับเก็บประวัติการลาแม้ว่าบุคลากรจะออกจากระบบแล้ว

-- สร้าง archived_users table
CREATE TABLE IF NOT EXISTS archived_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_user_id UUID NOT NULL,  -- ID เดิมใน users table
    employee_code VARCHAR(20) NOT NULL,
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    role_name VARCHAR(50),           -- เก็บชื่อ role ตอนที่ลบ
    hire_date DATE,
    -- ข้อมูลวันลาสุดท้าย
    last_sick_leave_balance DECIMAL(5,2) DEFAULT 0,
    last_personal_leave_balance DECIMAL(5,2) DEFAULT 0,
    last_vacation_leave_balance DECIMAL(5,2) DEFAULT 0,
    -- ข้อมูลการลบ
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_by UUID REFERENCES users(id),  -- ใครเป็นคนลบ
    archive_reason TEXT,            -- เหตุผลที่ลบ (ถ้ามี)
    created_at TIMESTAMP WITH TIME ZONE,    -- วันที่สร้าง user เดิม
    UNIQUE(original_user_id)
);

-- เพิ่ม index สำหรับค้นหา
CREATE INDEX IF NOT EXISTS idx_archived_users_employee_code ON archived_users(employee_code);
CREATE INDEX IF NOT EXISTS idx_archived_users_archived_at ON archived_users(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_users_name ON archived_users(first_name, last_name);

-- เพิ่ม column archived_user_id ใน leaves table (ถ้ายังไม่มี)
-- เพื่อเก็บ reference ไปยัง archived user เมื่อ user ถูกลบ
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaves' AND column_name = 'archived_user_id'
    ) THEN
        ALTER TABLE leaves ADD COLUMN archived_user_id UUID REFERENCES archived_users(id);
    END IF;
END $$;

-- Comment สำหรับอธิบาย
COMMENT ON TABLE archived_users IS 'เก็บข้อมูลบุคลากรที่ถูกลบออกจากระบบ เพื่อรักษาประวัติการลา';
COMMENT ON COLUMN archived_users.original_user_id IS 'ID เดิมของ user ก่อนถูกลบ';
COMMENT ON COLUMN leaves.archived_user_id IS 'Reference ไปยัง archived_users เมื่อ user ถูกลบ';

-- ตรวจสอบผลลัพธ์
SELECT 'archived_users table created successfully' as status;

-- แสดง structure ของ table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'archived_users'
ORDER BY ordinal_position;
