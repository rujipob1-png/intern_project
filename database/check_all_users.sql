-- ตรวจสอบว่ายังมี EMP001 ในฐานข้อมูลหรือไม่
SELECT employee_code, first_name, last_name, is_active, 
       CASE 
         WHEN employee_code LIKE 'EMP%' OR employee_code LIKE 'DIR%' OR employee_code LIKE 'CTR%' OR employee_code LIKE 'ADMIN%' 
         THEN '❌ USER เก่า - ต้องลบ'
         ELSE '✅ USER ใหม่'
       END as status
FROM users
ORDER BY employee_code;
