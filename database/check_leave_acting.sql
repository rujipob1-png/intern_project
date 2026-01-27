-- ตรวจสอบว่าคำขอลามี acting_person_id หรือไม่
SELECT 
  l.leave_number,
  l.acting_person_id,
  l.acting_approved,
  l.document_url,
  ap.employee_code as acting_employee_code,
  ap.first_name as acting_first_name,
  ap.last_name as acting_last_name
FROM leaves l
LEFT JOIN users ap ON l.acting_person_id = ap.id
ORDER BY l.created_at DESC
LIMIT 5;
