-- เปรียบเทียบ password_hash ของ EMP001 กับ 2001
SELECT employee_code, 
       LEFT(password_hash, 30) as hash_preview,
       LENGTH(password_hash) as hash_length,
       password_hash
FROM users 
WHERE employee_code IN ('2001', '2002', 'EMP001')
ORDER BY employee_code;
