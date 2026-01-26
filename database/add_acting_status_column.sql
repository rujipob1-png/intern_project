-- เพิ่ม acting_status column ในตาราง leaves

ALTER TABLE leaves 
ADD COLUMN IF NOT EXISTS acting_status VARCHAR(20) DEFAULT 'pending';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'leaves' 
  AND column_name = 'acting_status';
