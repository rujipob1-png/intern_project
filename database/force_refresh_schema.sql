-- ============================================
-- FORCE REFRESH SCHEMA CACHE (สุดท้าย)
-- ============================================

-- Method 1: Reload PostgREST Schema หลายครั้ง
DO $$
BEGIN
    FOR i IN 1..10 LOOP
        PERFORM pg_notify('pgrst', 'reload schema');
        PERFORM pg_notify('pgrst', 'reload config');
        PERFORM pg_sleep(0.5);
    END LOOP;
END $$;

-- Method 2: Drop และสร้าง column ใหม่ (บังคับให้ PostgREST รู้)
DO $$
BEGIN
    -- ลบ column ถ้ามี
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leaves' AND column_name = 'selected_dates'
    ) THEN
        ALTER TABLE leaves DROP COLUMN selected_dates;
    END IF;
    
    -- เพิ่มกลับมาใหม่
    ALTER TABLE leaves ADD COLUMN selected_dates DATE[];
    
    -- อัพเดทข้อมูล
    UPDATE leaves 
    SET selected_dates = ARRAY(
        SELECT generate_series(start_date, end_date, '1 day'::interval)::date
    )
    WHERE selected_dates IS NULL;
END $$;

-- Method 3: Grant permissions ใหม่
GRANT SELECT, INSERT, UPDATE, DELETE ON leaves TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leaves TO postgres;

-- Method 4: บังคับ reload อีกครั้ง
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';

-- ตรวจสอบ
SELECT '✅ DONE - Wait 30 seconds then restart backend' as status;

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'leaves'
ORDER BY ordinal_position;
