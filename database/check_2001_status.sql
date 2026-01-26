-- ตรวจสอบสถานะของ user 2001 ทั้งหมด
SELECT 
  employee_code,
  first_name,
  last_name,
  department,
  role_id,
  is_active,
  password_hash,
  CASE 
    WHEN password_hash = '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm' THEN '✅ CORRECT (123456)'
    ELSE '❌ WRONG'
  END as password_status
FROM users 
WHERE employee_code = '2001';
