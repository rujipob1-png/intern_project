-- เพิ่ม column selected_dates ให้กับตาราง leaves
-- สำหรับรองรับการเลือกวันลาที่ไม่ต่อเนื่อง

DO $$ 
BEGIN
    -- ตรวจสอบว่ามี column selected_dates หรือยัง
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaves' 
        AND column_name = 'selected_dates'
    ) THEN
        -- เพิ่ม column selected_dates
        ALTER TABLE leaves ADD COLUMN selected_dates DATE[];
        
        -- สร้าง array ของวันที่จาก start_date ถึง end_date สำหรับข้อมูลเก่า
        UPDATE leaves 
        SET selected_dates = ARRAY(
            SELECT generate_series(start_date, end_date, '1 day'::interval)::date
        )
        WHERE selected_dates IS NULL;
        
        RAISE NOTICE 'Column selected_dates added successfully';
    ELSE
        RAISE NOTICE 'Column selected_dates already exists';
    END IF;
END $$;

-- ตรวจสอบผลลัพธ์
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leaves' 
AND column_name = 'selected_dates';

SELECT '✅ Migration completed: selected_dates column added to leaves table' as result;
