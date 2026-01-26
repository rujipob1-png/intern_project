-- ============================================
-- FIX ALL SCHEMA ISSUES - รันทุกส่วนนี้ใน Supabase SQL Editor
-- ============================================

-- ส่วนที่ 1: ตรวจสอบ columns ที่มีอยู่ใน leaves table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaves'
ORDER BY ordinal_position;

-- ส่วนที่ 2: เพิ่ม columns ที่หายไป (ถ้ายังไม่มี)

-- เพิ่ม contact_address (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'contact_address') THEN
    ALTER TABLE leaves ADD COLUMN contact_address TEXT;
  END IF;
END $$;

-- เพิ่ม contact_phone (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'contact_phone') THEN
    ALTER TABLE leaves ADD COLUMN contact_phone VARCHAR(20);
  END IF;
END $$;

-- เพิ่ม current_approval_level (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'current_approval_level') THEN
    ALTER TABLE leaves ADD COLUMN current_approval_level INTEGER DEFAULT 1;
  END IF;
END $$;

-- เพิ่ม leave_number (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'leave_number') THEN
    ALTER TABLE leaves ADD COLUMN leave_number VARCHAR(50) UNIQUE;
  END IF;
END $$;

-- เพิ่ม selected_dates (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'selected_dates') THEN
    ALTER TABLE leaves ADD COLUMN selected_dates DATE[];
  END IF;
END $$;

-- เพิ่ม cancelled_at (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'cancelled_at') THEN
    ALTER TABLE leaves ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- เพิ่ม cancelled_reason (ถ้ายังไม่มี)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaves' AND column_name = 'cancelled_reason') THEN
    ALTER TABLE leaves ADD COLUMN cancelled_reason TEXT;
  END IF;
END $$;

-- ส่วนที่ 3: ตรวจสอบ leave_types table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_types'
ORDER BY ordinal_position;

-- ส่วนที่ 4: สร้าง Function สำหรับ Auto-generate Leave Number (ถ้ายังไม่มี)
CREATE OR REPLACE FUNCTION generate_leave_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year VARCHAR(4);
    current_month VARCHAR(2);
    sequence_num INTEGER;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');
    
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM leaves
    WHERE TO_CHAR(created_at, 'YYYYMM') = current_year || current_month;
    
    NEW.leave_number := 'LV-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง Trigger (drop ก่อนถ้ามี)
DROP TRIGGER IF EXISTS set_leave_number ON leaves;
CREATE TRIGGER set_leave_number BEFORE INSERT ON leaves
    FOR EACH ROW EXECUTE FUNCTION generate_leave_number();

-- ส่วนที่ 5: Reload Schema Cache
NOTIFY pgrst, 'reload schema';

-- ส่วนที่ 6: ตรวจสอบผลลัพธ์
SELECT 
  '✅ All columns added and schema cache reloaded!' as status,
  'Please wait 10 seconds, then restart backend and refresh browser' as next_steps;

-- ============================================
-- หลังรัน SQL นี้:
-- 1. รอ 10 วินาที
-- 2. Restart backend: กด Ctrl+C ใน terminal แล้วรัน npm run dev ใหม่
-- 3. Refresh browser: กด F5
-- 4. ลองสร้างคำขอลาใหม่
-- ============================================
