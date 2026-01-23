-- ============================================
-- ขั้นตอนที่ 1: ตรวจสอบว่า column มีอยู่จริงหรือไม่
-- ============================================

SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'leaves' 
AND column_name = 'selected_dates';

-- ถ้าผลลัพธ์ว่างเปล่า (0 rows) = ยังไม่มี column
-- ถ้าแสดง 1 row = มี column แล้ว แต่ cache ยังไม่ refresh

-- ============================================
-- ขั้นตอนที่ 2: ถ้ายังไม่มี column ให้เพิ่ม
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'leaves' 
        AND column_name = 'selected_dates'
    ) THEN
        -- เพิ่ม column
        ALTER TABLE public.leaves ADD COLUMN selected_dates DATE[];
        
        -- อัพเดทข้อมูลเก่า
        UPDATE public.leaves 
        SET selected_dates = ARRAY(
            SELECT generate_series(start_date, end_date, '1 day'::interval)::date
        )
        WHERE selected_dates IS NULL;
        
        RAISE NOTICE '✅ Column selected_dates added successfully';
    ELSE
        RAISE NOTICE '✅ Column selected_dates already exists';
    END IF;
END $$;

-- ============================================
-- ขั้นตอนที่ 3: บังคับ reload schema cache (ทำหลายครั้ง)
-- ============================================

-- Reload 1
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- รอ 1 วินาที
SELECT pg_sleep(1);

-- Reload 2
NOTIFY pgrst, 'reload schema';

-- รอ 1 วินาที
SELECT pg_sleep(1);

-- Reload 3
NOTIFY pgrst, 'reload schema';

-- ============================================
-- ขั้นตอนที่ 4: ตรวจสอบอีกครั้งว่า column มีแล้ว
-- ============================================

SELECT 
    '✅ Migration และ Schema reload เสร็จสมบูรณ์' as status,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'leaves' 
AND column_name = 'selected_dates';

-- ============================================
-- หมายเหตุ: หลังรัน SQL นี้
-- ============================================
-- 1. รอ 10-15 วินาที
-- 2. Restart backend server (Ctrl+C แล้ว npm run dev)
-- 3. Hard refresh browser (Ctrl+Shift+R)
-- 4. ลองส่งคำขอลาใหม่
-- ============================================
