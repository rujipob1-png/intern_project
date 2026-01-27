-- ============================================
-- เพิ่มประเภทการลา: ลาช่วยภรรยาคลอดบุตร
-- ============================================

-- ช = ลาช่วยภรรยาคลอดบุตร (15 วันทำการติดต่อกัน)
INSERT INTO leave_types (type_code, type_name, type_name_th, type_name_en, max_days_per_year, requires_document, description) VALUES
  ('PATERNITY', 'ลาช่วยภรรยาคลอดบุตร', 'ลาช่วยภรรยาคลอดบุตร', 'Paternity Leave', 15, true, 'ลาได้ 15 วันทำการติดต่อกัน (ไม่นับเสาร์อาทิตย์)')
ON CONFLICT (type_code) DO UPDATE SET
  type_name = EXCLUDED.type_name,
  type_name_th = EXCLUDED.type_name_th,
  type_name_en = EXCLUDED.type_name_en,
  max_days_per_year = EXCLUDED.max_days_per_year,
  requires_document = EXCLUDED.requires_document,
  description = EXCLUDED.description;

-- ตรวจสอบผลลัพธ์
SELECT type_code, type_name, max_days_per_year, requires_document, description 
FROM leave_types 
WHERE type_code = 'PATERNITY';
