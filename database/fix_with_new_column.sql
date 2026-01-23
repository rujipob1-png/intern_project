-- ============================================
-- แก้ปัญหา selected_dates โดยสร้าง column ใหม่
-- ============================================

-- 1. ลบ column เก่าที่มีปัญหา
ALTER TABLE leaves DROP COLUMN IF EXISTS selected_dates;

-- 2. สร้าง column ใหม่เป็น TEXT (เก็บเป็น JSON string)
ALTER TABLE leaves ADD COLUMN leave_dates TEXT;

-- 3. อัพเดทข้อมูลเก่า (แปลงจาก start_date, end_date เป็น JSON array)
UPDATE leaves 
SET leave_dates = (
    SELECT json_agg(date_series)::text
    FROM (
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date as date_series
    ) dates
)
WHERE leave_dates IS NULL;

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON leaves TO anon, authenticated;

-- 5. บังคับ reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';

-- 6. ตรวจสอบ
SELECT '✅ Column leave_dates created successfully' as status;

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'leaves' 
AND column_name IN ('leave_dates', 'selected_dates')
ORDER BY column_name;
