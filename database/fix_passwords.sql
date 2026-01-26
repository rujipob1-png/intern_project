-- แก้ไข password_hash ให้ตรงกับ EMP001 (password = "123456")
-- Hash นี้คือ bcrypt hash ของ "123456"
UPDATE users 
SET password_hash = '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm'
WHERE employee_code IN (
  '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009',
  '3001', '3002', '3003', '3004', '3005',
  '4001', '4002', '4003', '4004', '4005', '4006', '4007', '4008',
  '5001', '5002', '5003', '5004', '5005', '5006', '5007',
  '6001', '6002', '6003'
);

-- ตรวจสอบ
SELECT employee_code, LEFT(password_hash, 30) as hash
FROM users 
WHERE employee_code IN ('2001', '2002', 'EMP001')
ORDER BY employee_code;
