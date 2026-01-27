-- ============================================
-- เพิ่ม columns สำหรับระบบยกเลิกการลาแบบต้องอนุมัติ
-- ============================================

-- เพิ่ม column cancel_requested_at
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ;

-- เพิ่ม column cancelled_by สำหรับเก็บ ID ผู้อนุมัติยกเลิก
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);

-- ตรวจสอบ columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaves' 
AND column_name IN ('cancel_requested_at', 'cancelled_by', 'cancelled_at', 'cancelled_reason');
