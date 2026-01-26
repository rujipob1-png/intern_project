-- ประเภทการลาตามระเบียบราชการ (9 ประเภท)
-- รัน SQL นี้ใน Supabase SQL Editor

-- ลบข้อมูลเก่า (ถ้ามี)
DELETE FROM leave_types;

-- Insert leave types ครบถ้วนตามระเบียบ
INSERT INTO leave_types (type_code, type_name_th, type_name_en, max_days_per_year, requires_document, is_active, description) VALUES
  -- ป = ลาป่วย (30 วันต่อปี - เกิน 15 วันไม่ได้รับเงินเดือน)
  ('SICK', 'ลาป่วย', 'Sick Leave', 30, true, true, 'ลาเนื่องจากเจ็บป่วย (ลาได้ไม่เกิน 15 วัน หากเกินจะไม่ได้รับเงินเดือนส่วนที่เกิน)'),
  
  -- ก = ลากิจส่วนตัว (10 วันต่อปี)
  ('PERSONAL', 'ลากิจส่วนตัว', 'Personal Leave', 10, false, true, 'ลาเพื่อธุระส่วนตัว'),
  
  -- พ = ลาพักผ่อน (10 วันต่อปี)
  ('VACATION', 'ลาพักผ่อน', 'Vacation Leave', 10, false, true, 'ลาพักผ่อนประจำปี'),
  
  -- ค = ลาคลอดบุตร (90 วัน)
  ('MATERNITY', 'ลาคลอดบุตร', 'Maternity Leave', 90, true, true, 'ลาเพื่อคลอดบุตร สำหรับข้าราชการหญิง'),
  
  -- บ = ลาอุปสมบท (120 วัน ตลอดราชการ)
  ('ORDINATION', 'ลาอุปสมบท', 'Ordination Leave', 120, false, true, 'ลาเพื่ออุปสมบทเป็นพระภิกษุในพระพุทธศาสนา'),
  
  -- ฮ = ลาประกอบพิธีฮัจย์ (ครั้งเดียวตลอดราชการ)
  ('HAJJ', 'ลาประกอบพิธีฮัจย์', 'Hajj Leave', NULL, false, true, 'ลาเพื่อประกอบพิธีฮัจย์ ศาสนาอิสลาม'),
  
  -- ต = ลาเข้ารับการตรวจเลือก
  ('MILITARY', 'ลาเข้ารับการตรวจเลือก', 'Military Service Leave', NULL, false, true, 'ลาเพื่อเข้ารับการตรวจเลือกเข้ารับราชการทหาร'),
  
  -- ส = มาสาย
  ('LATE', 'มาสาย', 'Late Arrival', NULL, false, true, 'บันทึกการมาทำงานสาย'),
  
  -- ข = ขาดราชการ
  ('ABSENT', 'ขาดราชการ', 'Absent', NULL, false, true, 'ขาดราชการโดยไม่ได้รับอนุญาต');

-- ตรวจสอบผลลัพธ์
SELECT 
  type_code,
  type_name_th,
  type_name_en,
  max_days_per_year,
  requires_document,
  is_active,
  description
FROM leave_types
ORDER BY 
  CASE type_code
    WHEN 'SICK' THEN 1
    WHEN 'PERSONAL' THEN 2
    WHEN 'VACATION' THEN 3
    WHEN 'MATERNITY' THEN 4
    WHEN 'ORDINATION' THEN 5
    WHEN 'HAJJ' THEN 6
    WHEN 'MILITARY' THEN 7
    WHEN 'LATE' THEN 8
    WHEN 'ABSENT' THEN 9
  END;
