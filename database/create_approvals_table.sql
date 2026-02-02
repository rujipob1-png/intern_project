-- ============================================
-- สร้างตาราง Approvals (ประวัติการอนุมัติ)
-- ============================================

-- ลบ table เก่าถ้ามี
DROP TABLE IF EXISTS approvals CASCADE;

-- สร้าง table approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_id UUID REFERENCES leaves(id) ON DELETE CASCADE NOT NULL,
    approver_id UUID REFERENCES users(id) NOT NULL, -- ผู้อนุมัติ
    
    -- ข้อมูลการอนุมัติ
    approval_level INTEGER NOT NULL, -- ระดับการอนุมัติ (1=ผอ.กลุ่มงาน, 2=หัวหน้าฝ่ายบริหารทั่วไป, 3=ผอ.กองอำนวยการ, 4=ผอ.ศูนย์)
    action VARCHAR(20) NOT NULL, -- approved, rejected
    comment TEXT, -- ความเห็น/เหตุผล (บังคับถ้า rejected)
    
    -- วันเวลา
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง Index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX idx_approvals_leave_id ON approvals(leave_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_approval_level ON approvals(approval_level);

-- ตรวจสอบว่าสร้างสำเร็จ
SELECT 'Approvals table created successfully!' as result;

-- แสดงโครงสร้าง table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'approvals'
ORDER BY ordinal_position;
