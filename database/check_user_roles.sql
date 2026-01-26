-- ตรวจสอบ role_id ของ users
SELECT u.employee_code, u.first_name, u.last_name, u.department,
       u.role_id,
       r.role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.employee_code IN ('2001', '2002', '2003', 'EMP001')
ORDER BY u.employee_code;
