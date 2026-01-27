-- ============================================
-- อัพเดทประเภทการลาให้ครบถ้วนตามระเบียบราชการ
-- ============================================

-- Insert ประเภทการลาทั้งหมด (9 ประเภท)
-- ใช้ ON CONFLICT เพื่อ update ถ้ามีอยู่แล้ว
INSERT INTO leave_types (type_code, type_name, type_name_th, type_name_en, max_days_per_year, requires_document, description) VALUES
  -- ป = ลาป่วย (ไม่เกิน 15 วัน หากเกินจะไม่ได้รับพิจารณาขึ้นเงินเดือน)
  ('SICK', 'ลาป่วย', 'ลาป่วย', 'Sick Leave', 15, true, 'ลาได้ไม่เกิน 15 วัน หากลาเกิน 15 วัน จะไม่ได้รับการพิจารณาขึ้นเงินเดือน'),
  -- ก = ลากิจส่วนตัว (10 วันต่อปี)
  ('PERSONAL', 'ลากิจส่วนตัว', 'ลากิจส่วนตัว', 'Personal Leave', 10, false, NULL),
  -- พ = ลาพักผ่อน (10 วันต่อปี)
  ('VACATION', 'ลาพักผ่อน', 'ลาพักผ่อน', 'Vacation Leave', 10, false, NULL),
  -- ค = ลาคลอดบุตร (90 วัน)
  ('MATERNITY', 'ลาคลอดบุตร', 'ลาคลอดบุตร', 'Maternity Leave', 90, true, NULL),
  -- บ = ลาอุปสมบท (120 วัน)
  ('ORDINATION', 'ลาอุปสมบท', 'ลาอุปสมบท', 'Ordination Leave', 120, true, NULL),
  -- ฮ = ลาประกอบพิธีฮัจย์
  ('HAJJ', 'ลาประกอบพิธีฮัจย์', 'ลาประกอบพิธีฮัจย์', 'Hajj Pilgrimage Leave', 60, true, NULL),
  -- ต = ลาเข้ารับการตรวจเลือก
  ('MILITARY', 'ลาเข้ารับการตรวจเลือก', 'ลาเข้ารับการตรวจเลือก', 'Military Draft Leave', 60, true, NULL),
  -- ส = มาสาย
  ('LATE', 'มาสาย', 'มาสาย', 'Late', NULL, false, NULL),
  -- ข = ขาดราชการ
  ('ABSENT', 'ขาดราชการ', 'ขาดราชการ', 'Absent', NULL, false, NULL)
ON CONFLICT (type_code) DO UPDATE SET
  type_name = EXCLUDED.type_name,
  type_name_th = EXCLUDED.type_name_th,
  type_name_en = EXCLUDED.type_name_en,
  max_days_per_year = EXCLUDED.max_days_per_year,
  requires_document = EXCLUDED.requires_document,
  description = EXCLUDED.description;

-- ตรวจสอบผลลัพธ์
SELECT type_code, type_name, max_days_per_year, requires_document 
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