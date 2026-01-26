-- ตรวจสอบ is_active field
SELECT employee_code, first_name, last_name, department, role_id, is_active
FROM users 
WHERE employee_code IN ('2001', '2002', '2003', 'EMP001')
ORDER BY employee_code;
