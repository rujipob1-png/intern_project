-- ============================================================
-- SQL สำหรับอัพเดท hire_date (วันเริ่มรับราชการ) ให้พนักงานทุกคน
-- รันไฟล์นี้ใน Supabase SQL Editor
-- พนักงานทั้งหมด 68 คน - สุ่มอายุราชการแต่ละคน
-- ============================================================

-- ตรวจสอบข้อมูลก่อนอัพเดท
SELECT employee_code, first_name, last_name, hire_date, department
FROM users
ORDER BY employee_code;

-- ============================================================
-- อัพเดท hire_date ให้พนักงานทุกคน (68 คน)
-- สุ่มอายุราชการ 1-20 ปี ให้แต่ละคน
-- ============================================================

-- ===========================================
-- กลุ่มที่ 1: อายุราชการ 15-20 ปี (เริ่มทำงาน 2006-2011)
-- สิทธิ์: สะสมวันลาได้สูงสุด 30 วัน
-- ===========================================
-- Admin + Directors อาวุโส
UPDATE users SET hire_date = '2006-04-15' WHERE employee_code = '50001';  -- ผอ.สำนัก (20 ปี)
UPDATE users SET hire_date = '2007-06-01' WHERE employee_code = '51497';  -- ผอ.กยส. (19 ปี)
UPDATE users SET hire_date = '2008-03-01' WHERE employee_code = '51134';  -- ผอ.กทส. (18 ปี)
UPDATE users SET hire_date = '2009-05-15' WHERE employee_code = '51410';  -- ผอ.กอก. (17 ปี)
UPDATE users SET hire_date = '2010-02-01' WHERE employee_code = '51124';  -- ผอ.กตป. (16 ปี)
UPDATE users SET hire_date = '2011-04-01' WHERE employee_code = '51430';  -- ผอ.กสส. (15 ปี)
UPDATE users SET hire_date = '2011-07-15' WHERE employee_code = '51450';  -- ผอ.กคฐ. (15 ปี)

-- พนักงานอาวุโส
UPDATE users SET hire_date = '2008-01-10' WHERE employee_code = '51101';  -- ปิยนุช (18 ปี)
UPDATE users SET hire_date = '2009-06-01' WHERE employee_code = '51151';  -- อารียะห์ (17 ปี)
UPDATE users SET hire_date = '2010-03-15' WHERE employee_code = '51149';  -- อติสรา (16 ปี)
UPDATE users SET hire_date = '2006-08-01' WHERE employee_code = '50660';  -- กิตติ (20 ปี)
UPDATE users SET hire_date = '2007-11-01' WHERE employee_code = '51417';  -- อานนท์ กรวดแก้ว (19 ปี)
UPDATE users SET hire_date = '2010-09-01' WHERE employee_code = '51480';  -- ทวี (16 ปี)
UPDATE users SET hire_date = '2011-01-15' WHERE employee_code = '50790';  -- พิชิต (15 ปี)

-- ===========================================
-- กลุ่มที่ 2: อายุราชการ 10-14 ปี (เริ่มทำงาน 2012-2016)
-- สิทธิ์: สะสมวันลาได้สูงสุด 30 วัน
-- ===========================================
UPDATE users SET hire_date = '2012-04-01' WHERE employee_code = '51143';  -- อภิญญา (14 ปี)
UPDATE users SET hire_date = '2012-07-15' WHERE employee_code = '51148';  -- วจิราพร (14 ปี)
UPDATE users SET hire_date = '2013-01-10' WHERE employee_code = '51139';  -- สุจิราภรณ์ (13 ปี)
UPDATE users SET hire_date = '2013-06-01' WHERE employee_code = '51141';  -- ทศพล (13 ปี)
UPDATE users SET hire_date = '2013-09-15' WHERE employee_code = '51137';  -- วันวิสาข์ (13 ปี)
UPDATE users SET hire_date = '2014-02-01' WHERE employee_code = '51140';  -- ปิยพงศ์ (12 ปี)
UPDATE users SET hire_date = '2014-05-15' WHERE employee_code = '51166';  -- สาวิตรี (12 ปี)
UPDATE users SET hire_date = '2014-08-01' WHERE employee_code = '51142';  -- บุญยง (12 ปี)
UPDATE users SET hire_date = '2015-01-10' WHERE employee_code = '50161';  -- ธนารักษ์ (11 ปี)
UPDATE users SET hire_date = '2015-04-01' WHERE employee_code = '50838';  -- ณัฐกฤษ (11 ปี)
UPDATE users SET hire_date = '2015-07-15' WHERE employee_code = '51418';  -- สุภาพ (11 ปี)
UPDATE users SET hire_date = '2015-10-01' WHERE employee_code = '51408';  -- บดินทร์ (11 ปี)
UPDATE users SET hire_date = '2016-01-15' WHERE employee_code = '51404';  -- วไลพร (10 ปี)
UPDATE users SET hire_date = '2016-04-01' WHERE employee_code = '51105';  -- วรวุฒิ (10 ปี)
UPDATE users SET hire_date = '2016-07-15' WHERE employee_code = '51152';  -- ปัณทารีย์ (10 ปี)
UPDATE users SET hire_date = '2016-10-01' WHERE employee_code = '51120';  -- ทนงศักดิ์ บูรณเจริญ (10 ปี)

-- ===========================================
-- กลุ่มที่ 3: อายุราชการ 6-9 ปี (เริ่มทำงาน 2017-2020)
-- สิทธิ์: สะสมวันลาได้สูงสุด 20 วัน
-- ===========================================
UPDATE users SET hire_date = '2017-02-01' WHERE employee_code = '51542';  -- สุรศักดิ์ (9 ปี)
UPDATE users SET hire_date = '2017-05-15' WHERE employee_code = '51425';  -- กิตติธัช (9 ปี)
UPDATE users SET hire_date = '2017-08-01' WHERE employee_code = '51125';  -- ประดับเกียรติ (9 ปี)
UPDATE users SET hire_date = '2017-11-15' WHERE employee_code = '51126';  -- เพ็ชร์รุ่ง (9 ปี)
UPDATE users SET hire_date = '2018-02-01' WHERE employee_code = '51122';  -- ปุณยวีร์ (8 ปี)
UPDATE users SET hire_date = '2018-05-15' WHERE employee_code = '51112';  -- มาวิษา (8 ปี)
UPDATE users SET hire_date = '2018-08-01' WHERE employee_code = '51416';  -- พศิกา (8 ปี)
UPDATE users SET hire_date = '2018-11-15' WHERE employee_code = '51409';  -- ชนิดา (8 ปี)
UPDATE users SET hire_date = '2019-02-01' WHERE employee_code = '51412';  -- ณัฐชยา (7 ปี)
UPDATE users SET hire_date = '2019-05-15' WHERE employee_code = '51110';  -- สิริกัลคร (7 ปี)
UPDATE users SET hire_date = '2019-08-01' WHERE employee_code = '51103';  -- กาญจนา (7 ปี)
UPDATE users SET hire_date = '2019-11-15' WHERE employee_code = '51432';  -- รัฐมญญ์ (7 ปี)
UPDATE users SET hire_date = '2020-02-01' WHERE employee_code = '51431';  -- พริษนันท์ (6 ปี)
UPDATE users SET hire_date = '2020-05-15' WHERE employee_code = '51407';  -- พัชนิญา (6 ปี)
UPDATE users SET hire_date = '2020-08-01' WHERE employee_code = '51414';  -- ณณน (6 ปี)
UPDATE users SET hire_date = '2020-11-15' WHERE employee_code = '51440';  -- ธนกร (6 ปี)

-- ===========================================
-- กลุ่มที่ 4: อายุราชการ 3-5 ปี (เริ่มทำงาน 2021-2023)
-- สิทธิ์: สะสมวันลาได้สูงสุด 20 วัน
-- ===========================================
UPDATE users SET hire_date = '2021-01-10' WHERE employee_code = '51486';  -- ณิชนันท์ (5 ปี)
UPDATE users SET hire_date = '2021-04-01' WHERE employee_code = '51546';  -- รุ้งลาวัลย์ (5 ปี)
UPDATE users SET hire_date = '2021-07-15' WHERE employee_code = '51550';  -- ณัฐวุฒิ (5 ปี)
UPDATE users SET hire_date = '2021-10-01' WHERE employee_code = '51428';  -- ภคมน (5 ปี)
UPDATE users SET hire_date = '2022-01-15' WHERE employee_code = '51439';  -- บุชยาลอ (4 ปี)
UPDATE users SET hire_date = '2022-04-01' WHERE employee_code = '51441';  -- กฤติศ (4 ปี)
UPDATE users SET hire_date = '2022-07-15' WHERE employee_code = '51435';  -- ปาริชาติ (4 ปี)
UPDATE users SET hire_date = '2022-10-01' WHERE employee_code = '50170';  -- นิพันธ์ (4 ปี)
UPDATE users SET hire_date = '2023-01-10' WHERE employee_code = '51442';  -- อภิสิทธิ์ (3 ปี)
UPDATE users SET hire_date = '2023-04-01' WHERE employee_code = '51445';  -- ธวัชชัย (3 ปี)
UPDATE users SET hire_date = '2023-07-15' WHERE employee_code = '51444';  -- นันทวัฒน์ (3 ปี)
UPDATE users SET hire_date = '2023-10-01' WHERE employee_code = '51446';  -- อนุชา (3 ปี)

-- ===========================================
-- กลุ่มที่ 5: อายุราชการ 1-2 ปี (เริ่มทำงาน 2024-2025)
-- สิทธิ์: สะสมวันลาได้สูงสุด 20 วัน
-- ===========================================
UPDATE users SET hire_date = '2024-01-15' WHERE employee_code = '51130';  -- ณัฐพล (2 ปี)
UPDATE users SET hire_date = '2024-04-01' WHERE employee_code = '50791';  -- วัชรพล (2 ปี)
UPDATE users SET hire_date = '2024-07-15' WHERE employee_code = '50792';  -- เกียรติพงศ์ (2 ปี)
UPDATE users SET hire_date = '2024-10-01' WHERE employee_code = '51487';  -- อานนท์ อยู่อด (2 ปี)
UPDATE users SET hire_date = '2024-12-01' WHERE employee_code = '51447';  -- ทรงพล (2 ปี)
UPDATE users SET hire_date = '2025-01-10' WHERE employee_code = '51466';  -- ณัฐพงษ์ (1 ปี)
UPDATE users SET hire_date = '2025-02-15' WHERE employee_code = '51467';  -- จิรศักดิ์ (1 ปี)
UPDATE users SET hire_date = '2025-04-01' WHERE employee_code = '51463';  -- สุวัฒน์ (1 ปี)

-- กคฐ. (ชั้น 5)
UPDATE users SET hire_date = '2018-03-01' WHERE employee_code = '51452';  -- ธนวัฒน์ (8 ปี)
UPDATE users SET hire_date = '2019-06-15' WHERE employee_code = '51451';  -- วรพจน์ (7 ปี)
UPDATE users SET hire_date = '2021-09-01' WHERE employee_code = '51453';  -- โชติกา (5 ปี)
UPDATE users SET hire_date = '2017-12-01' WHERE employee_code = '51470';  -- จักรพงษ์ (9 ปี)
UPDATE users SET hire_date = '2020-03-15' WHERE employee_code = '51474';  -- ชัตติยพล (6 ปี)
UPDATE users SET hire_date = '2016-05-01' WHERE employee_code = '51472';  -- ทนงศักดิ์ เอกกัณหา (10 ปี)
UPDATE users SET hire_date = '2013-08-15' WHERE employee_code = '51482';  -- จารึก (13 ปี)
UPDATE users SET hire_date = '2014-11-01' WHERE employee_code = '51484';  -- สมนึก (12 ปี)
UPDATE users SET hire_date = '2022-02-01' WHERE employee_code = '51491';  -- ชัยวาล (4 ปี)
UPDATE users SET hire_date = '2015-05-15' WHERE employee_code = '51490';  -- ธงชัย (11 ปี)
UPDATE users SET hire_date = '2023-08-01' WHERE employee_code = '51492';  -- คุณณัช (3 ปี)
UPDATE users SET hire_date = '2024-06-01' WHERE employee_code = '51496';  -- วีระชัย (2 ปี)
UPDATE users SET hire_date = '2020-09-15' WHERE employee_code = '51494';  -- ปิยพงษ์ (6 ปี)

-- ============================================================
-- ตรวจสอบผลลัพธ์
-- ============================================================
SELECT 
  employee_code,
  first_name,
  last_name,
  department,
  hire_date,
  -- คำนวณอายุราชการ (ปี)
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) as service_years,
  -- แสดงเงื่อนไขสิทธิ์สะสม
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 10 THEN '✅ สะสมได้สูงสุด 30 วัน'
    ELSE '📌 สะสมได้สูงสุด 20 วัน'
  END as carryover_limit,
  vacation_leave_balance,
  vacation_carryover
FROM users
WHERE is_active = true
ORDER BY hire_date ASC;

-- ============================================================
-- สรุปจำนวนพนักงานแต่ละกลุ่ม
-- ============================================================
SELECT 
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 10 THEN '✅ อายุราชการ ≥ 10 ปี (สะสมได้ 30 วัน)'
    ELSE '📌 อายุราชการ < 10 ปี (สะสมได้ 20 วัน)'
  END as employee_group,
  COUNT(*) as total_employees
FROM users
WHERE is_active = true AND hire_date IS NOT NULL
GROUP BY 
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 10 THEN '✅ อายุราชการ ≥ 10 ปี (สะสมได้ 30 วัน)'
    ELSE '📌 อายุราชการ < 10 ปี (สะสมได้ 20 วัน)'
  END
ORDER BY employee_group DESC;

-- ============================================================
-- สรุปตามช่วงอายุราชการ
-- ============================================================
SELECT 
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 15 THEN '15+ ปี (Senior)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 10 THEN '10-14 ปี (Experienced)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 5 THEN '5-9 ปี (Mid-level)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 2 THEN '2-4 ปี (Junior)'
    ELSE '0-1 ปี (New)'
  END as service_group,
  COUNT(*) as total_employees
FROM users
WHERE is_active = true AND hire_date IS NOT NULL
GROUP BY 
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 15 THEN '15+ ปี (Senior)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 10 THEN '10-14 ปี (Experienced)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 5 THEN '5-9 ปี (Mid-level)'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date)) >= 2 THEN '2-4 ปี (Junior)'
    ELSE '0-1 ปี (New)'
  END
ORDER BY service_group DESC;
