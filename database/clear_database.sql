-- ลบข้อมูลเก่าทั้งหมดก่อน
DELETE FROM leaves;
DELETE FROM users;
DELETE FROM leave_types;
DELETE FROM departments;
DELETE FROM roles;

-- จากนั้นรัน NEW_PROJECT_SETUP.sql ใหม่
