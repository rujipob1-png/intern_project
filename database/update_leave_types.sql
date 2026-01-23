-- ============================================
-- อัพเดทประเภทการลาให้ครบถ้วนตามระเบียบราชการ
-- ============================================

-- ลบข้อมูลที่เกี่ยวข้องทั้งหมดตามลำดับ (เพื่อไม่ให้ขัดกับ foreign key)
DELETE FROM leave_balance_logs;
DELETE FROM leave_history;
DELETE FROM approvals;
DELETE FROM leaves;
DELETE FROM leave_types;

-- เพิ่มประเภทการลาตามระเบียบข้าราชการ (9 ประเภท)
INSERT INTO leave_types (type_code, type_name, description, requires_document, max_days_per_year, is_paid) VALUES
-- ป = ลาป่วย (30 วันต่อปี)
('sick', 'ลาป่วย', 'ลาเนื่องจากเจ็บป่วย ไม่สบาย', true, 30, true),

-- ก = ลากิจส่วนตัว (3 วันต่อปี)
('personal', 'ลากิจส่วนตัว', 'ลาเพื่อธุระส่วนตัว', false, 3, true),

-- พ = ลาพักผ่อน (10 วันต่อปี)
('vacation', 'ลาพักผ่อน', 'ลาพักผ่อนประจำปี', false, 10, true),

-- ค = ลาคลอดบุตร (90 วัน)
('maternity', 'ลาคลอดบุตร', 'ลาเพื่อคลอดบุตร สำหรับข้าราชการหญิง', true, 90, true),

-- บ = ลาอุปสมบท (120 วัน ตลอดราชการ)
('ordination', 'ลาอุปสมบท', 'ลาเพื่ออุปสมบทเป็นพระภิกษุในพระพุทธศาสนา', false, 120, true),

-- ฮ = ลาประกอบพิธีฮัจย์ (ครั้งเดียวตลอดราชการ)
('hajj', 'ลาประกอบพิธีฮัจย์', 'ลาเพื่อประกอบพิธีฮัจย์ ศาสนาอิสลาม', false, null, true),

-- ต = ลาเข้ารับการตรวจเลือก
('military', 'ลาเข้ารับการตรวจเลือก', 'ลาเพื่อเข้ารับการตรวจเลือกเข้ารับราชการทหาร', false, null, true),

-- ส = มาสาย
('late', 'มาสาย', 'บันทึกการมาทำงานสาย', false, null, true),

-- ข = ขาดราชการ
('absent', 'ขาดราชการ', 'ขาดราชการโดยไม่ได้รับอนุญาต', false, null, false);

-- อัพเดทวันลาคงเหลือของ users ให้ตรงตามระเบียบ
UPDATE users SET 
  sick_leave_balance = 30,
  personal_leave_balance = 3,
  vacation_leave_balance = 10
WHERE TRUE;
