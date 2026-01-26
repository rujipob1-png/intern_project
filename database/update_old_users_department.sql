-- ============================================
-- Update department สำหรับ user เก่าที่ยัง NULL
-- ============================================

-- UPDATE user เก่า EMP001 ให้เป็น IT
UPDATE users SET department = 'IT' 
WHERE employee_code IN ('EMP001', 'EMP002', 'EMP003', 'EMP004');

-- UPDATE director
UPDATE users SET department = 'ADMIN' 
WHERE employee_code IN ('DIR001', 'DIR002', 'DIR003');

-- UPDATE central office
UPDATE users SET department = 'CENTRAL' 
WHERE employee_code IN ('CTR001', 'CTR002');

-- UPDATE admin
UPDATE users SET department = 'ADMIN' 
WHERE employee_code = 'ADMIN001';

-- ตรวจสอบผลลัพธ์
SELECT department, COUNT(*) as total 
FROM users 
WHERE department IS NOT NULL
GROUP BY department 
ORDER BY department;
