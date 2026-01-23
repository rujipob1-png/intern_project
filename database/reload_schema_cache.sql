-- ============================================
-- RELOAD SCHEMA CACHE - แก้ปัญหา "column not found in schema cache"
-- ============================================

-- ขั้นตอนที่ 1: ตรวจสอบว่า column มีอยู่จริงใน database
SELECT 
    table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leaves' 
AND column_name = 'selected_dates';

-- ถ้าผลลัพธ์ด้านบนแสดง 1 แถว = column มีอยู่แล้ว ✅

-- ขั้นตอนที่ 2: บังคับ reload schema cache
NOTIFY pgrst, 'reload schema';

-- ขั้นตอนที่ 3: ตรวจสอบอีกครั้ง
SELECT '✅ Schema cache reload signal sent - Please wait 10 seconds and refresh' as status;

-- ============================================
-- หมายเหตุ: หลังรัน SQL นี้
-- 1. รอ 5-10 วินาที
-- 2. Restart backend: Ctrl+C แล้ว npm run dev
-- 3. Refresh browser: F5
-- 4. ลองส่งคำขอลาใหม่
-- ============================================

-- ถ้ายังไม่ได้ผล (LAST RESORT):
-- ไปที่ Supabase Dashboard → Settings → API → คลิก "Restart API"
-- ============================================
