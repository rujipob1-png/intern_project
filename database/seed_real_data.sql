-- ============================================
-- SQL Template: ข้อมูลจริงก่อน Deploy
-- ============================================
-- Admin ต้องแก้ไขค่าตรงนี้ให้ตรงกับข้อมูลจริง:
--   1. hire_date = วันเริ่มราชการ (YYYY-MM-DD)
--   2. sick_leave_balance = วันลาป่วยคงเหลือ
--   3. personal_leave_balance = วันลากิจคงเหลือ
--   4. vacation_leave_balance = วันลาพักผ่อนปีนี้คงเหลือ
--   5. vacation_carryover = วันลาพักผ่อนยกยอดจากปีก่อน
-- ============================================


-- === N/A ===
-- นายวิชัย ศรีสุวรรณ (ผู้อำนวยการสำนัก)
UPDATE users SET
  hire_date = '2006-04-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50001';

-- นายธนารักษ์ รัตนทินธ์ (ฝรค.)
UPDATE users SET
  hire_date = '2015-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50161';

-- นายนิพันธ์ จาตุรุณ (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2022-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50170';

-- นายกิตติ ค่ำงามกิจ (ฝพท.)
UPDATE users SET
  hire_date = '2006-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50660';

-- นายพิชิต ธาตาวชร (ฝ่ายบริการสื่อสารทั่วไป)
UPDATE users SET
  hire_date = '2011-01-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50790';

-- นายวัชรพล ภัทติ (ฝ่ายบริการสื่อสารทั่วไป)
UPDATE users SET
  hire_date = '2024-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50791';

-- นายเกียรติพงศ์ เชียงหลิว (ฝ่ายบริการสื่อสารทั่วไป)
UPDATE users SET
  hire_date = '2024-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50792';

-- นายณัฐกฤษ สุวัฒน์ภิกดิวงศ์ (ฝรค.)
UPDATE users SET
  hire_date = '2015-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '50838';

-- นางปิยนุช มงคล (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2008-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51101';

-- น.ส.กาญจนา อนุจันทร์ (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2019-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51103';

-- นายวรวุฒิ หยู่หนูสิง (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2016-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51105';

-- น.ส.สิริกัลคร นมเกษม (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2019-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51110';

-- น.ส.มาวิษา สังขาว (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2018-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51112';

-- นายทนงศักดิ์ บูรณเจริญ (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2016-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51120';

-- น.ส.ปุณยวีร์ เพียรีย์ (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2018-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51122';

-- น.ส.สุขใจ กาญจนทิพลย์ (ผอ.กตป.)
UPDATE users SET
  hire_date = '2010-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51124';

-- ว่าที่ ร.ต.ประดับเกียรติ พลอยงาม (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2017-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51125';

-- นางเพ็ชร์รุ่ง เชียงหลิว (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2017-11-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51126';

-- นายณัฐพล รอดคุณี (ฝ่ายบริการสื่อสารทั่วไป)
UPDATE users SET
  hire_date = '2024-01-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51130';

-- น.ส.อนงค์รัตน์ ลีอนาม (ผอ.กทส.)
UPDATE users SET
  hire_date = '2008-03-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51134';

-- น.ส.วันวิสาข์ อินทร์รอด (ฝรค.)
UPDATE users SET
  hire_date = '2013-09-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51137';

-- น.ส.สุจิราภรณ์ พิมพี (ฝรค.)
UPDATE users SET
  hire_date = '2013-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51139';

-- นายปิยพงศ์ ลักษณะปิยะ (ฝรค.)
UPDATE users SET
  hire_date = '2014-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51140';

-- นายทศพล นิติเณศพล (ฝรค.)
UPDATE users SET
  hire_date = '2013-06-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51141';

-- นายบุญยง เรืองพงษ์ (ฝรค.)
UPDATE users SET
  hire_date = '2014-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51142';

-- น.ส.อภิญญา แจ้งหล่า (งานธุรการ)
UPDATE users SET
  hire_date = '2012-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51143';

-- น.ส.วจิราพร สัตตบงกช (ฝพท.)
UPDATE users SET
  hire_date = '2012-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51148';

-- นางอติสรา จริยารังสิโรจน์ (ฝพท.)
UPDATE users SET
  hire_date = '2010-03-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51149';

-- นางอารียะห์ หัตระเบียบ (ฝพท.)
UPDATE users SET
  hire_date = '2009-06-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51151';

-- น.ส.ปัณทารีย์ โชว์รัมย์ (เจ้าหน้าที่ กตป.)
UPDATE users SET
  hire_date = '2016-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51152';

-- น.ส.สาวิตรี นิธิโชติสกุล (ฝรค.)
UPDATE users SET
  hire_date = '2014-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51166';

-- น.ส.วไลพร มณีวงษ์ (ฝ่ายบริหารทั่วไป)
UPDATE users SET
  hire_date = '2016-01-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51404';

-- น.ส.พัชนิญา ธิทอง (ฝ่ายงบประมาณสื่อสาร)
UPDATE users SET
  hire_date = '2020-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51407';

-- นายบดินทร์ แสงวิรุณ (ฝ่ายบริหารทั่วไป)
UPDATE users SET
  hire_date = '2015-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51408';

-- น.ส.ชนิดา พงศ์สิริพิพัฒน์ (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2018-11-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51409';

-- นายคมกฤช บัวคำ (ผอ.กอก.)
UPDATE users SET
  hire_date = '2009-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51410';

-- น.ส.ณัฐชยา รามบุตร (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2019-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51412';

-- น.ส.ณณน มีพิชย (ฝ่ายงบประมาณสื่อสาร)
UPDATE users SET
  hire_date = '2020-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51414';

-- น.ส.พศิกา สท้านพล (ฝ่ายพัสดุสื่อสาร)
UPDATE users SET
  hire_date = '2018-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51416';

-- นายอานนท์ กรวดแก้ว (หัวหน้าฝ่ายบริหารทั่วไป)
UPDATE users SET
  hire_date = '2007-11-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51417';

-- นายสุภาพ ภูวงศ์ (ฝ่ายบริหารทั่วไป)
UPDATE users SET
  hire_date = '2015-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51418';

-- นายกิตติธัช พรายงาม (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2017-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51425';

-- น.ส.ภคมน กันทปันชัย (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2021-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51428';

-- นายศมิท คงเมือง (ผอ.กสส.)
UPDATE users SET
  hire_date = '2011-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51430';

-- นายพริษนันท์ โลสันเทียะ (ฝ่ายงบประมาณสื่อสาร)
UPDATE users SET
  hire_date = '2020-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51431';

-- น.ส.รัฐมญญ์ พิมล (ฝ่ายงบประมาณสื่อสาร)
UPDATE users SET
  hire_date = '2019-11-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51432';

-- น.ส.ปาริชาติ พินปาน (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2022-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51435';

-- น.ส.บุชยาลอ ชุมกลิ้ง (งานธุรการ)
UPDATE users SET
  hire_date = '2022-01-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51439';

-- นางธนกร คำดีพงศ์ (งานธุรการ)
UPDATE users SET
  hire_date = '2020-11-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51440';

-- นายกฤติศ เกษตรเจริญ (งานธุรการ)
UPDATE users SET
  hire_date = '2022-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51441';

-- นายอภิสิทธิ์ ศรีอินทร (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2023-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51442';

-- นายนันทวัฒน์ พาละหาด (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2023-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51444';

-- นายธวัชชัย สุขะใจ (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2023-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51445';

-- นายอนุชา พัดบุญ (ฝ่ายระบบวีดิทัศน์ฯ)
UPDATE users SET
  hire_date = '2023-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51446';

-- นายทรงพล บุญเครือ (ฝ่ายสื่อสารด้านความมั่นคงฯ)
UPDATE users SET
  hire_date = '2024-12-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51447';

-- นายณฤกิตติ์ ดวงชะลา (ผอ.กคฐ.)
UPDATE users SET
  hire_date = '2011-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51450';

-- นายวรพจน์ ผาประไมย (งานบริหารทั่วไป)
UPDATE users SET
  hire_date = '2019-06-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51451';

-- นายธนวัฒน์ สังกระชาติ (งานบริหารทั่วไป)
UPDATE users SET
  hire_date = '2018-03-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51452';

-- น.ส.โชติกา ทองประเสริฐสุข (งานบริหารทั่วไป)
UPDATE users SET
  hire_date = '2021-09-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51453';

-- นายสุวัฒน์ เต็มวัฒน์ชัยกุล (ฝ่ายระบบวิทยุฯ)
UPDATE users SET
  hire_date = '2025-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51463';

-- นายณัฐพงษ์ นิลชัย (ฝ่ายระบบวิทยุฯ)
UPDATE users SET
  hire_date = '2025-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51466';

-- นายจิรศักดิ์ ลำเดียน (ฝ่ายระบบวิทยุฯ)
UPDATE users SET
  hire_date = '2025-02-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51467';

-- นายจักรพงษ์ อุทัยวรรณพร (ฝ่ายเชื่อมโยงเครือข่ายฯ)
UPDATE users SET
  hire_date = '2017-12-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51470';

-- นายทนงศักดิ์ เอกกัณหา (ฝ่ายเชื่อมโยงเครือข่ายฯ)
UPDATE users SET
  hire_date = '2016-05-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51472';

-- นายชัตติยพล ธรรมมาลี (ฝ่ายเชื่อมโยงเครือข่ายฯ)
UPDATE users SET
  hire_date = '2020-03-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51474';

-- นายทวี งามศิริ (ฝ่ายบริหารจัดการเครือข่ายฯ)
UPDATE users SET
  hire_date = '2010-09-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51480';

-- นายจารึก อุรา (ฝ่ายบริหารจัดการเครือข่ายฯ)
UPDATE users SET
  hire_date = '2013-08-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51482';

-- นายสมนึก โลสันเทียะ (ฝ่ายบริหารจัดการเครือข่ายฯ)
UPDATE users SET
  hire_date = '2014-11-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51484';

-- น.ส.ณิชนันท์ สิทธิพรหม (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2021-01-10',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51486';

-- นายอานนท์ อยู่อด (ฝ่ายสื่อสารด้านความมั่นคงฯ)
UPDATE users SET
  hire_date = '2024-10-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51487';

-- นายธงชัย ไทยพันธ์ุ (ฝ่ายบำรุงรักษาเครือข่ายฯ)
UPDATE users SET
  hire_date = '2015-05-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51490';

-- นายชัยวาล ยอดคำดัน (ฝ่ายบริหารจัดการเครือข่ายฯ)
UPDATE users SET
  hire_date = '2022-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51491';

-- นายคุณณัช คงอ่ำ (ฝ่ายบำรุงรักษาเครือข่ายฯ)
UPDATE users SET
  hire_date = '2023-08-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51492';

-- นายปิยพงษ์ สืบจิตต์ (ฝ่ายบำรุงรักษาเครือข่ายฯ)
UPDATE users SET
  hire_date = '2020-09-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51494';

-- นายวีระชัย ขนะจอก (ฝ่ายบำรุงรักษาเครือข่ายฯ)
UPDATE users SET
  hire_date = '2024-06-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51496';

-- น.ส.ธมนต์รัตน์ แสนสายเนตร (ผอ.กยส.)
UPDATE users SET
  hire_date = '2007-06-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51497';

-- นายสุรศักดิ์ ทองขอดปราสาท (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2017-02-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51542';

-- น.ส.รุ้งลาวัลย์ สุทธิสวัสดิ์ (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2021-04-01',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51546';

-- นายณัฐวุฒิ โลหะวิจารณ์ (เจ้าหน้าที่ กยส.)
UPDATE users SET
  hire_date = '2021-07-15',             -- ← วันเริ่มราชการ
  sick_leave_balance = 60,               -- ← ลาป่วยคงเหลือ
  personal_leave_balance = 15,            -- ← ลากิจคงเหลือ
  vacation_leave_balance = 10,            -- ← ลาพักผ่อนปีนี้คงเหลือ
  vacation_carryover = 0                  -- ← ยกยอดจากปีก่อน
WHERE employee_code = '51550';

