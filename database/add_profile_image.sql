-- ============================================
-- เพิ่ม Column สำหรับรูปโปรไฟล์
-- ============================================

-- เพิ่ม column profile_image_url ในตาราง users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Comment สำหรับ column
COMMENT ON COLUMN users.profile_image_url IS 'URL ของรูปโปรไฟล์ที่เก็บใน Supabase Storage';

-- ============================================
-- สร้าง Storage Bucket สำหรับเก็บรูปโปรไฟล์
-- (ต้องรันใน Supabase Dashboard > Storage)
-- ============================================
-- 1. ไปที่ Supabase Dashboard > Storage
-- 2. กด "New bucket"
-- 3. ตั้งชื่อ: profile-images
-- 4. ติ๊ก "Public bucket" เพื่อให้เข้าถึงรูปได้โดยไม่ต้อง auth
-- 5. กด Create

-- RLS Policy สำหรับ Storage (รันใน SQL Editor)
-- อนุญาตให้ทุกคนดูรูปได้
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');

-- อนุญาตให้ authenticated users อัพโหลดรูปได้
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.role() = 'authenticated');

-- อนุญาตให้เจ้าของไฟล์อัพเดท/ลบได้
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);
