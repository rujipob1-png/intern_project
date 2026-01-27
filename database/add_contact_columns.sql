-- เพิ่ม column contact_address และ contact_phone ใน leaves table
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS contact_address TEXT;
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);

-- ตรวจสอบ
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaves' 
AND column_name IN ('contact_address', 'contact_phone');
