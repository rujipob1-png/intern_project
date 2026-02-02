-- ============================================
-- อัพเดทโครงสร้างให้ตรงกับองค์กรจริง
-- 6 กลุ่มงาน + Directors + พนักงาน
-- ============================================

-- ============================================
-- STEP 1: ลบข้อมูลเก่าทั้งหมด (ระวัง!)
-- ============================================
-- ลบ leaves ก่อน เพราะ foreign key
DELETE FROM leaves;
DELETE FROM users;

-- ============================================
-- STEP 2: อัพเดท Departments ใหม่ (6 กลุ่มงาน)
-- ============================================
-- ลบ departments เก่าถ้ามี
DELETE FROM departments WHERE department_code IN ('IT', 'HR', 'FIN', 'ADMIN', 'CENTRAL');

-- เพิ่ม departments ใหม่ตามโครงสร้างจริง
INSERT INTO departments (department_code, department_name) VALUES
  ('GOK', 'กลุ่มงานอำนวยการ (กอก.)'),
  ('GYS', 'กลุ่มงานยุทธศาสตร์สารสนเทศและการสื่อสาร (กยส.)'),
  ('GTS', 'กลุ่มงานเทคโนโลยีสารสนเทศ (กทส.)'),
  ('GTP', 'กลุ่มงานติดตามประเมินผลด้านสารสนเทศและการสื่อสาร (กตป.)'),
  ('GSS', 'กลุ่มงานเทคโนโลยีการสื่อสาร (กสส.)'),
  ('GKC', 'กลุ่มงานโครงสร้างพื้นฐานด้านสารสนเทศและการสื่อสาร (กคช.)')
ON CONFLICT (department_code) DO UPDATE SET
  department_name = EXCLUDED.department_name;

-- ============================================
-- STEP 3: เพิ่ม Directors (ผอ.กลุ่มงาน) 6 คน
-- Password: 123456
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- กยส. (ชั้น 2) - ผอ.กยส.
('51497', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ธมนต์รัตน์', 'แสนสายเนตร', 'ผอ.กยส.', 'GYS', '0949615425', (SELECT id FROM roles WHERE role_name = 'director'), true),

-- กทส. (ชั้น 2) - ผอ.กทส.
('51134', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'อนงค์รัตน์', 'ลีอนาม', 'ผอ.กทส.', 'GTS', '0896905545', (SELECT id FROM roles WHERE role_name = 'director'), true),

-- กอก. (ชั้น 3) - ผอ.กอก.
('51410', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'คมกฤช', 'บัวคำ', 'ผอ.กอก.', 'GOK', '0819236101', (SELECT id FROM roles WHERE role_name = 'director'), true),

-- กตป. (ชั้น 4) - ผอ.กตป.
('51124', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'สุขใจ', 'กาญจนทิพลย์', 'ผอ.กตป.', 'GTP', '0854842049', (SELECT id FROM roles WHERE role_name = 'director'), true),

-- กสส. (ชั้น 4) - ผอ.กสส.
('51430', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ศมิท', 'คงเมือง', 'ผอ.กสส.', 'GSS', '0883313003', (SELECT id FROM roles WHERE role_name = 'director'), true),

-- กคช. (ชั้น 5) - ผอ.กคช.
('51450', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ณฤกิตติ์', 'ดวงชะลา', 'ผอ.กคช.', 'GKC', '0814404972', (SELECT id FROM roles WHERE role_name = 'director'), true);

-- ============================================
-- STEP 4: เพิ่มพนักงาน กยส. (ชั้น 2)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- เจ้าหน้าที่ กยส.
('51101', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาง', 'ปิยนุช', 'มงคล', 'เจ้าหน้าที่ กยส.', 'GYS', '0891341859', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51542', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'สุรศักดิ์', 'ทองขอดปราสาท', 'เจ้าหน้าที่ กยส.', 'GYS', '0853661568', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51425', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'กิตติธัช', 'พรายงาม', 'เจ้าหน้าที่ กยส.', 'GYS', '0893007522', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51486', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ณิชนันท์', 'สิทธิพรหม', 'เจ้าหน้าที่ กยส.', 'GYS', '0613988999', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51546', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'รุ้งลาวัลย์', 'สุทธิสวัสดิ์', 'เจ้าหน้าที่ กยส.', 'GYS', '0922496393', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51550', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ณัฐวุฒิ', 'โลหะวิจารณ์', 'เจ้าหน้าที่ กยส.', 'GYS', '0848607995', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51428', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ภคมน', 'กันทปันชัย', 'เจ้าหน้าที่ กยส.', 'GYS', '0826986221', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 5: เพิ่มพนักงาน กทส. (ชั้น 2)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- งานธุรการ
('51143', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'อภิญญา', 'แจ้งหล่า', 'งานธุรการ', 'GTS', '0819297996', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายพัฒนาเทคโนโลยีสารสนเทศ (ฝพท.)
('51151', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาง', 'อารียะห์', 'หัตระเบียบ', 'ฝพท.', 'GTS', '0894650218', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51149', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาง', 'อติสรา', 'จริยารังสิโรจน์', 'ฝพท.', 'GTS', '0898833329', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50660', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'กิตติ', 'ค่ำงามกิจ', 'ฝพท.', 'GTS', '0865535592', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51148', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'วจิราพร', 'สัตตบงกช', 'ฝพท.', 'GTS', '0971162777', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายพัฒนาระบบงานสารสนเทศ (ฝรค.)
('51139', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'สุจิราภรณ์', 'พิมพี', 'ฝรค.', 'GTS', '0819545649', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51141', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ทศพล', 'นิติเณศพล', 'ฝรค.', 'GTS', '0830130577', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51137', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'วันวิสาข์', 'อินทร์รอด', 'ฝรค.', 'GTS', '0956977527', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51140', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ปิยพงศ์', 'ลักษณะปิยะ', 'ฝรค.', 'GTS', '0852356190', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51166', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'สาวิตรี', 'นิธิโชติสกุล', 'ฝรค.', 'GTS', '0815645226', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายพัฒนาระบบคอมพิวเตอร์และเครือข่าย (ฝรค.)
('51142', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'บุญยง', 'เรืองพงษ์', 'ฝรค.', 'GTS', '0917294747', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50161', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ธนารักษ์', 'รัตนทินธ์', 'ฝรค.', 'GTS', '0804668950', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50838', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ณัฐกฤษ', 'สุวัฒน์ภิกดิวงศ์', 'ฝรค.', 'GTS', '0804552949', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 6: เพิ่มพนักงาน กอก. (ชั้น 3)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- ฝ่ายบริหารทั่วไป
('51417', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'อานนท์', 'กรวดแก้ว', 'ฝ่ายบริหารทั่วไป', 'GOK', '0827934149', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51418', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'สุภาพ', 'ภูวงศ์', 'ฝ่ายบริหารทั่วไป', 'GOK', '0962679067', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51408', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'บดินทร์', 'แสงวิรุณ', 'ฝ่ายบริหารทั่วไป', 'GOK', '0808419718', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51404', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'วไลพร', 'มณีวงษ์', 'ฝ่ายบริหารทั่วไป', 'GOK', '0936181830', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายพัสดุสื่อสาร
('51416', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'พศิกา', 'สท้านพล', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0627877854', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51409', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ชนิดา', 'พงศ์สิริพิพัฒน์', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0876753189', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51105', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'วรวุฒิ', 'หยู่หนูสิง', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0890453999', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51412', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ณัฐชยา', 'รามบุตร', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0905582265', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51110', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'สิริกัลคร', 'นมเกษม', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0929515264', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51103', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'กาญจนา', 'อนุจันทร์', 'ฝ่ายพัสดุสื่อสาร', 'GOK', '0801141496', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายงบประมาณสื่อสาร
('51432', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'รัฐมญญ์', 'พิมล', 'ฝ่ายงบประมาณสื่อสาร', 'GOK', '0890779609', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51431', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'พริษนันท์', 'โลสันเทียะ', 'ฝ่ายงบประมาณสื่อสาร', 'GOK', '0909899708', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51407', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'พัชนิญา', 'ธิทอง', 'ฝ่ายงบประมาณสื่อสาร', 'GOK', '0809257179', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51414', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ณณน', 'มีพิชย', 'ฝ่ายงบประมาณสื่อสาร', 'GOK', '0942621633', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 7: เพิ่มพนักงาน กตป. (ชั้น 4)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
('51152', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ปัณทารีย์', 'โชว์รัมย์', 'เจ้าหน้าที่ กตป.', 'GTP', '0854842448', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51120', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ทนงศักดิ์', 'บูรณเจริญ', 'เจ้าหน้าที่ กตป.', 'GTP', '0610802083', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51125', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'ว่าที่ ร.ต.', 'ประดับเกียรติ', 'พลอยงาม', 'เจ้าหน้าที่ กตป.', 'GTP', '0976914198', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51126', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาง', 'เพ็ชร์รุ่ง', 'เชียงหลิว', 'เจ้าหน้าที่ กตป.', 'GTP', '0982466262', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51122', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ปุณยวีร์', 'เพียรีย์', 'เจ้าหน้าที่ กตป.', 'GTP', '0947803991', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51112', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'มาวิษา', 'สังขาว', 'เจ้าหน้าที่ กตป.', 'GTP', '0969351792', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 8: เพิ่มพนักงาน กสส. (ชั้น 4)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- งานธุรการ
('51440', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาง', 'ธนกร', 'คำดีพงศ์', 'งานธุรการ', 'GSS', '0639326355', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51439', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'บุชยาลอ', 'ชุมกลิ้ง', 'งานธุรการ', 'GSS', '0614981843', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51441', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'กฤติศ', 'เกษตรเจริญ', 'งานธุรการ', 'GSS', '0993572016', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายระบบวิทีศทัศน์ทางไกลและการประชุม
('51435', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'ปาริชาติ', 'พินปาน', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0840046778', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50170', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'นิพันธ์', 'จาตุรุณ', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0661094662', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51442', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'อภิสิทธิ์', 'ศรีอินทร', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0842619109', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51445', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ธวัชชัย', 'สุขะใจ', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0805155015', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51444', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'นันทวัฒน์', 'พาละหาด', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0989147989', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51446', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'อนุชา', 'พัดบุญ', 'ฝ่ายระบบวีดิทัศน์ฯ', 'GSS', '0886097286', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายบริการสื่อสารทั่วไป
('50790', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'พิชิต', 'ธาตาวชร', 'ฝ่ายบริการสื่อสารทั่วไป', 'GSS', '0634198961', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51130', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ณัฐพล', 'รอดคุณี', 'ฝ่ายบริการสื่อสารทั่วไป', 'GSS', '0958959181', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50791', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'วัชรพล', 'ภัทติ', 'ฝ่ายบริการสื่อสารทั่วไป', 'GSS', '0669324907', (SELECT id FROM roles WHERE role_name = 'user'), true),
('50792', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'เกียรติพงศ์', 'เชียงหลิว', 'ฝ่ายบริการสื่อสารทั่วไป', 'GSS', '0638974254', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายสื่อสารด้านความมั่นคงและรักษาความปลอดภัย
('51487', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'อานนท์', 'อยู่อด', 'ฝ่ายสื่อสารด้านความมั่นคงฯ', 'GSS', '0847325788', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51447', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ทรงพล', 'บุญเครือ', 'ฝ่ายสื่อสารด้านความมั่นคงฯ', 'GSS', '0823627874', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายระบบวิทยุและความถี่เพิ่ม
('51466', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ณัฐพงษ์', 'นิลชัย', 'ฝ่ายระบบวิทยุฯ', 'GSS', '0987478623', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51467', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'จิรศักดิ์', 'ลำเดียน', 'ฝ่ายระบบวิทยุฯ', 'GSS', '0942656869', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51463', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'สุวัฒน์', 'เต็มวัฒน์ชัยกุล', 'ฝ่ายระบบวิทยุฯ', 'GSS', '0632131159', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 9: เพิ่มพนักงาน กคช. (ชั้น 5)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
-- งานบริหารทั่วไป
('51452', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ธนวัฒน์', 'สังกระชาติ', 'งานบริหารทั่วไป', 'GKC', '0814954339', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51451', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'วรพจน์', 'ผาประไมย', 'งานบริหารทั่วไป', 'GKC', '0844973137', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51453', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'น.ส.', 'โชติกา', 'ทองประเสริฐสุข', 'งานบริหารทั่วไป', 'GKC', '0972264463', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายเชื่อมโยงเครือข่ายสารสนเทศและการสื่อสาร
('51470', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'จักรพงษ์', 'อุทัยวรรณพร', 'ฝ่ายเชื่อมโยงเครือข่ายฯ', 'GKC', '0922762491', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51474', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ชัตติยพล', 'ธรรมมาลี', 'ฝ่ายเชื่อมโยงเครือข่ายฯ', 'GKC', '0645309278', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51472', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ทนงศักดิ์', 'เอกกัณหา', 'ฝ่ายเชื่อมโยงเครือข่ายฯ', 'GKC', '0828720073', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายบริหารจัดการเครือข่ายสารสนเทศและสารสนเทศ
('51480', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ทวี', 'งามศิริ', 'ฝ่ายบริหารจัดการเครือข่ายฯ', 'GKC', '0814294995', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51482', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'จารึก', 'อุรา', 'ฝ่ายบริหารจัดการเครือข่ายฯ', 'GKC', '0627422999', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51484', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'สมนึก', 'โลสันเทียะ', 'ฝ่ายบริหารจัดการเครือข่ายฯ', 'GKC', '0860138407', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51491', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ชัยวาล', 'ยอดคำดัน', 'ฝ่ายบริหารจัดการเครือข่ายฯ', 'GKC', '0833003313', (SELECT id FROM roles WHERE role_name = 'user'), true),
-- ฝ่ายบำรุงรักษาเครือข่ายสารสนเทศ
('51490', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ธงชัย', 'ไทยพันธ์ุ', 'ฝ่ายบำรุงรักษาเครือข่ายฯ', 'GKC', '0851737318', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51492', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'คุณณัช', 'คงอ่ำ', 'ฝ่ายบำรุงรักษาเครือข่ายฯ', 'GKC', '0878489399', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51496', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'วีระชัย', 'ขนะจอก', 'ฝ่ายบำรุงรักษาเครือข่ายฯ', 'GKC', '0806343800', (SELECT id FROM roles WHERE role_name = 'user'), true),
('51494', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'ปิยพงษ์', 'สืบจิตต์', 'ฝ่ายบำรุงรักษาเครือข่ายฯ', 'GKC', '0838491937', (SELECT id FROM roles WHERE role_name = 'user'), true);

-- ============================================
-- STEP 10: ลบข้อมูลเก่า department='ADMIN'
-- ============================================
DELETE FROM users WHERE department = 'ADMIN';

-- ============================================
-- STEP 11: สร้าง Admin (ผู้อำนวยการสำนัก)
-- ============================================
INSERT INTO users (employee_code, password_hash, title, first_name, last_name, position, department, phone, role_id, is_active) VALUES
('50001', '$2b$10$/4pSD6HlFYNNTEjihi6bE.1ZRDZdczPqrrQSIbWz.GGvc1mTqRzC.', 'นาย', 'วิชัย', 'ศรีสุวรรณ', 'ผู้อำนวยการสำนัก', 'GOK', '0812345678', (SELECT id FROM roles WHERE role_name = 'admin'), true);

-- ============================================
-- STEP 12: เปลี่ยน ผอ.กอก. เป็น central_office_head
-- ============================================
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_name = 'central_office_head')
WHERE employee_code = '51410';

-- ============================================
-- STEP 13: เปลี่ยนพนักงาน กอก. บางคนเป็น central_office_staff
-- 51417 อานนท์, 51418 สุภาพ, 51408 บดินทร์
-- ============================================
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_name = 'central_office_staff')
WHERE employee_code IN ('51417', '51418', '51408');

-- ============================================
-- STEP 14: ตรวจสอบผลลัพธ์
-- ============================================
SELECT department, 
       COUNT(*) as total,
       COUNT(CASE WHEN role_id = (SELECT id FROM roles WHERE role_name = 'director') THEN 1 END) as directors,
       COUNT(CASE WHEN role_id = (SELECT id FROM roles WHERE role_name = 'central_office_head') THEN 1 END) as central_office_head,
       COUNT(CASE WHEN role_id = (SELECT id FROM roles WHERE role_name = 'central_office_staff') THEN 1 END) as central_office_staff,
       COUNT(CASE WHEN role_id = (SELECT id FROM roles WHERE role_name = 'admin') THEN 1 END) as admin,
       COUNT(CASE WHEN role_id = (SELECT id FROM roles WHERE role_name = 'user') THEN 1 END) as users
FROM users 
GROUP BY department 
ORDER BY department;

-- แสดงรายชื่อตาม Role
SELECT u.employee_code, u.title, u.first_name, u.last_name, u.position, u.department, r.role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.role_name IN ('admin', 'central_office_head', 'central_office_staff', 'director')
ORDER BY 
  CASE r.role_name 
    WHEN 'admin' THEN 1
    WHEN 'central_office_head' THEN 2
    WHEN 'central_office_staff' THEN 3
    WHEN 'director' THEN 4
  END;
