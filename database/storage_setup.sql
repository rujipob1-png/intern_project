-- ========================================
-- Supabase Storage Setup for Leave Documents
-- ========================================

-- 1. สร้าง Storage Bucket สำหรับเอกสารการลา
-- ไปที่ Supabase Dashboard > Storage > Create a new bucket
-- Bucket name: leave-documents
-- Public: false (เพื่อความปลอดภัย)
-- File size limit: 5MB
-- Allowed MIME types: 
--   - application/pdf
--   - image/jpeg
--   - image/png
--   - image/jpg

-- 2. Storage Policies (RLS)
-- คัดลอก SQL นี้ไปรันใน Supabase SQL Editor

-- Policy 1: ให้ users สามารถอัพโหลดเอกสารของตัวเองได้
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'leave-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: ให้ users สามารถดูเอกสารของตัวเองได้
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'leave-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: ให้ users ลบเอกสารของตัวเองได้
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'leave-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: ให้ Director, Central Office, Admin ดูเอกสารทุกคนได้
CREATE POLICY "Approvers can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'leave-documents' 
  AND EXISTS (
    SELECT 1 FROM users
    INNER JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid()
    AND roles.role_level >= 2
  )
);

-- ========================================
-- คำแนะนำการใช้งาน
-- ========================================

-- โครงสร้างการเก็บไฟล์:
-- leave-documents/
--   ├── {user_id}/
--   │   ├── {leave_id}_{timestamp}_{filename}
--   │   └── {leave_id}_{timestamp}_{filename}
--   └── ...

-- ตัวอย่าง path:
-- leave-documents/550e8400-e29b-41d4-a716-446655440000/382f093e-f843-482f-b2a5-ad68da65cd3e_1705334400000_medical-cert.pdf

-- ประเภทไฟล์ที่รองรับ:
-- 1. PDF (.pdf) - ใบรับรองแพทย์, เอกสารทางราชการ
-- 2. JPEG/JPG (.jpg, .jpeg) - รูปถ่ายเอกสาร
-- 3. PNG (.png) - รูปภาพ, screenshot

-- ขนาดไฟล์สูงสุด: 5 MB
