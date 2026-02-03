-- ============================================
-- Update user 51417 to central_office_staff role
-- Run this in Supabase SQL Editor
-- ============================================

-- Update 51417 (อานนท์ กรวดแก้ว) to be หัวหน้าฝ่ายบริหารทั่วไป (central_office_staff)
UPDATE users 
SET 
  role_id = (SELECT id FROM roles WHERE role_name = 'central_office_staff'),
  position = 'หัวหน้าฝ่ายบริหารทั่วไป'
WHERE employee_code = '51417';

-- Verify the update
SELECT 
  u.employee_code, 
  u.first_name, 
  u.last_name, 
  u.position, 
  u.department,
  r.role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.employee_code = '51417';

-- Also verify all GOK users
SELECT 
  u.employee_code, 
  u.first_name, 
  u.last_name, 
  u.position, 
  r.role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.department = 'GOK'
ORDER BY r.role_name, u.employee_code;
