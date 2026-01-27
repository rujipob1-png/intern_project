-- แก้ไข leave_types table ให้ตรงกับ backend
-- เปลี่ยน type_name_th, type_name_en เป็น type_name

-- 1. เพิ่ม column type_name
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS type_name VARCHAR(100);

-- 2. Copy ข้อมูลจาก type_name_th มาที่ type_name
UPDATE leave_types SET type_name = type_name_th;

-- 3. Set NOT NULL constraint
ALTER TABLE leave_types ALTER COLUMN type_name SET NOT NULL;

-- 4. ตรวจสอบผลลัพธ์
SELECT id, type_code, type_name, type_name_th, type_name_en 
FROM leave_types 
ORDER BY type_code;
