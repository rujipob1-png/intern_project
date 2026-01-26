-- Update password hash สำหรับ user ทั้งหมด
-- Password: 123456
-- Hash ที่ถูกต้อง (verified): $2b$10$2.W3J1GDiiT/cJbTIwrJKuQ89oQK218CsDOhbiiQHPBORiLgNV0ya

UPDATE users 
SET password_hash = '$2b$10$2.W3J1GDiiT/cJbTIwrJKuQ89oQK218CsDOhbiiQHPBORiLgNV0ya'
WHERE employee_code IN (
  '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009',
  '3001', '3002', '3003', '3004', '3005',
  '4001', '4002', '4003', '4004', '4005', '4006', '4007', '4008',
  '5001', '5002', '5003', '5004', '5005', '5006', '5007',
  '6001', '6002', '6003'
);

-- Verify
SELECT employee_code, 
       LEFT(password_hash, 20) as hash_preview,
       department
FROM users
ORDER BY employee_code
LIMIT 10;
