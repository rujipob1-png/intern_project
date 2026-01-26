-- ตรวจสอบข้อมูลทั้งหมดว่าเป็นข้อมูลใหม่หรือเก่า
-- 1. นับจำนวนคนแต่ละแผนก (ควรได้: IT=13, ADMIN=9, FIN=8, HR=7, CENTRAL=5)
SELECT 
  department,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees
FROM users
WHERE department IS NOT NULL
GROUP BY department
ORDER BY department;

-- 2. ดู employee_code ทั้งหมดที่ active
SELECT employee_code, first_name, last_name, department, is_active
FROM users
WHERE is_active = true
ORDER BY employee_code;

-- 3. ตรวจสอบว่า user ใหม่ 2001-6003 มีครบหรือไม่
SELECT 
  CASE 
    WHEN COUNT(*) = 32 THEN '✅ มีครบ 32 คน (2001-6003)'
    ELSE '❌ ไม่ครบ มีแค่ ' || COUNT(*) || ' คน'
  END as status
FROM users
WHERE employee_code IN (
  '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009',
  '3001', '3002', '3003', '3004', '3005',
  '4001', '4002', '4003', '4004', '4005', '4006', '4007', '4008',
  '5001', '5002', '5003', '5004', '5005', '5006', '5007',
  '6001', '6002', '6003'
);
